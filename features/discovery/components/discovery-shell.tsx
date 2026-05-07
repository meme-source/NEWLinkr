"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import type { ChatChips, ChatIntent, ChatProductMemory, CreatorCardData } from "../chat-types";
import {
  TEMPLATE_PLACEHOLDER,
  buildTemplate,
  extractProductSlot,
  isUnmodifiedTemplate,
} from "../data/intent-hero";
import { T } from "../data/tokens";
import { ChatStream } from "./chat-stream";
import { InputArea } from "./input-area";
import { IntentHero } from "./intent-hero";
import { ProductMemoryProvider, getProductHint, useProductMemory } from "./product-memory";
import { useChatFlow } from "./use-chat-flow";

const DEFAULT_CHIPS: ChatChips = {
  platform: "tiktok",
  country: "global",
  language: "any",
  follower: "any",
  viewsStep: 0,
};

function tryParseProduct(text: string): ChatProductMemory | null {
  const productLine = extractProductSlot(text);
  if (!productLine || productLine === TEMPLATE_PLACEHOLDER) return null;
  const urlMatch = productLine.match(/https?:\/\/[^\s)（）]+/);
  return {
    url: urlMatch ? urlMatch[0] : null,
    rawText: urlMatch ? null : productLine,
    parsedName: urlMatch ? "敏感肌修复面霜" : null,
    parsedCategory: "美妆个护 · 护肤",
  };
}

function DiscoveryShellInner() {
  const { product, setProduct } = useProductMemory();
  const { messages, isStreaming, startSearch, resetSession } = useChatFlow();

  const [intent, setIntent] = useState<ChatIntent>("competitor");
  const [inputValue, setInputValue] = useState<string>(() => buildTemplate("competitor", ""));
  const [chips, setChips] = useState<ChatChips>(DEFAULT_CHIPS);
  const [statuses, setStatuses] = useState<Record<string, "pending" | "saved" | "skipped">>({});

  const handleIntentChange = useCallback(
    (next: ChatIntent) => {
      if (next === intent) return;
      setIntent(next);
      const hint = getProductHint(product);
      // Refill template only when the user hasn't typed anything custom yet —
      // otherwise we'd clobber their work on a tab tap.
      if (isUnmodifiedTemplate(inputValue)) {
        setInputValue(buildTemplate(next, hint));
      }
    },
    [intent, inputValue, product],
  );

  const handleSubmit = useCallback(() => {
    const text = inputValue.trim();
    if (!text) return;
    // Block submit if user hasn't replaced the placeholder yet.
    if (text.includes(TEMPLATE_PLACEHOLDER)) return;
    const parsed = tryParseProduct(text);
    if (parsed) setProduct(parsed);
    const productLine = extractProductSlot(text) || "—";
    startSearch({ intent, text, chips, productLine });
    setInputValue(buildTemplate(intent, getProductHint(parsed ?? product)));
  }, [chips, intent, inputValue, product, setProduct, startSearch]);

  const handleSave = useCallback((creator: CreatorCardData) => {
    setStatuses((prev) => ({
      ...prev,
      [creator.id]: prev[creator.id] === "saved" ? "pending" : "saved",
    }));
  }, []);

  const handleSkip = useCallback((creator: CreatorCardData) => {
    setStatuses((prev) => ({
      ...prev,
      [creator.id]: prev[creator.id] === "skipped" ? "pending" : "skipped",
    }));
  }, []);

  // 发现页不弹博主信息卡：搜索结果在用户点收藏入库前不属于"博主库"，按
  // "未入库 → 没有信息卡"规则不开放抽屉入口。卡片自身的信息已足够支持收藏 /
  // 跳过决策，决策入库后才能在博主库点开完整档案。

  const handleReset = useCallback(() => {
    resetSession();
    setInputValue(buildTemplate(intent, getProductHint(product)));
    setStatuses({});
  }, [intent, product, resetSession]);

  const placeholder = "粘贴产品链接，或写一句话描述…";
  const hasMessages = messages.length > 0;

  return (
    <div
      className={cn("relative flex h-full min-h-0 flex-col overflow-hidden")}
      style={{ backgroundColor: T.ivory }}
    >
      {hasMessages ? (
        <>
          <div className="flex-1 overflow-y-auto">
            <header className="sticky top-0 z-[100] flex items-center justify-between gap-3 border-b border-black/5 bg-[#fffdf9]/85 px-6 py-3 backdrop-blur-xl">
              <span
                className="text-[12.5px] font-medium tracking-[0.06em] uppercase"
                style={{ color: T.stone }}
              >
                Discovery
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-full px-3 py-1 text-[12px] font-medium"
                style={{ color: T.stone }}
              >
                重新开始
              </button>
            </header>
            <ChatStream
              messages={messages}
              statuses={statuses}
              onSave={handleSave}
              onSkip={handleSkip}
              onOpenProfile={handleOpenProfile}
            />
          </div>
          <div className="absolute right-0 bottom-0 left-0 z-[100] border-t border-black/5 bg-[#fffdf9]/85 px-4 pt-4 pb-5 backdrop-blur-xl">
            <div className="mx-auto w-full max-w-[820px]">
              <InputArea
                intent={intent}
                onIntentChange={handleIntentChange}
                value={inputValue}
                onChange={setInputValue}
                chips={chips}
                onChipsChange={setChips}
                onSubmit={handleSubmit}
                disabled={isStreaming}
                placeholder={placeholder}
                showInfoTooltip
              />
            </div>
          </div>
        </>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex min-h-full w-full max-w-[820px] flex-col items-center justify-center px-4 py-16">
            <IntentHero intent={intent} />
            <div className="mt-10 w-full">
              <InputArea
                intent={intent}
                onIntentChange={handleIntentChange}
                value={inputValue}
                onChange={setInputValue}
                chips={chips}
                onChipsChange={setChips}
                onSubmit={handleSubmit}
                disabled={isStreaming}
                placeholder={placeholder}
                showInfoTooltip={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function DiscoveryShell() {
  return (
    <ProductMemoryProvider>
      <DiscoveryShellInner />
    </ProductMemoryProvider>
  );
}
