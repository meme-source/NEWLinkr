"use client";

import type { ChatIntent } from "../../chat-types";
import { T } from "../../data/tokens";
import { BrandChip } from "./brand-chip";
import { ProductInput } from "./product-input";
import { TimeChip } from "./time-chip";
import { DEFAULT_TIME_DAYS, type StructuredEditorState } from "./types";

interface StructuredEditorProps {
  intent: ChatIntent;
  state: StructuredEditorState;
  onChange: (next: StructuredEditorState) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

const LABEL_PREFIX = "我的产品：";

/**
 * Replaces the legacy multi-line textarea with a structured per-mode editor.
 * v3 §4.3 把尾句统一收束到"可直接建联 / 立刻触达"的输出层语义；时间 / 品牌
 * 仍用 chip 让用户改，但不再说"找投过 X 的达人"这种锚定式问句。
 *  - mode1 (competitor): 我的产品 [chip] / 对标投过 [brand] 的合作款，[time] 内
 *                         可直接建联的同品类达人
 *  - mode2 (scenario):   我的产品 [chip] / 系统会从产品反推内容场景，直接给出
 *                         可建联的达人池
 *  - mode3 (trending):   我的产品 [chip] / 与 [time] 内品类爆款组合相似、可立刻
 *                         触达的同类达人
 */
export function StructuredEditor({
  intent,
  state,
  onChange,
  onSubmit,
  disabled,
}: StructuredEditorProps) {
  const updateProduct = (next: { chip: StructuredEditorState["productChip"]; note: string }) => {
    onChange({ ...state, productChip: next.chip, productNote: next.note });
  };

  const updateBrand = (next: {
    brandMode: StructuredEditorState["brandMode"];
    brands: string[];
  }) => {
    onChange({ ...state, ...next });
  };

  const updateTimeDays = (days: number) => {
    onChange({
      ...state,
      timeDays: { ...state.timeDays, [intent]: days },
    });
  };

  const productLine = (
    <div className="flex flex-wrap items-baseline gap-y-1">
      <span className="text-[14.5px] leading-[1.5] font-medium" style={{ color: T.charcoal }}>
        {LABEL_PREFIX}
      </span>
      <ProductInput
        chip={state.productChip}
        note={state.productNote}
        onChange={updateProduct}
        onSubmit={onSubmit}
        disabled={disabled}
      />
    </div>
  );

  return (
    <div data-editor-bounds className="space-y-1">
      {productLine}

      {intent === "competitor" ? (
        <SentenceLine>
          <span style={{ color: T.charcoal }}>对标投过</span>
          <BrandChip brandMode={state.brandMode} brands={state.brands} onChange={updateBrand} />
          <span style={{ color: T.charcoal }}>的合作款，</span>
          <TimeChip
            value={state.timeDays.competitor ?? 90}
            defaultDays={DEFAULT_TIME_DAYS.competitor ?? 90}
            onChange={updateTimeDays}
          />
          <span style={{ color: T.charcoal }}>内可直接建联的同品类达人</span>
        </SentenceLine>
      ) : null}

      {intent === "scenario" ? (
        <div className="px-1 text-[13.5px] leading-[1.6]" style={{ color: T.stone }}>
          系统会从产品反推内容场景，直接给出可建联的达人池
        </div>
      ) : null}

      {intent === "trending" || intent === "lowFollower" ? (
        <SentenceLine>
          <span style={{ color: T.charcoal }}>与</span>
          <TimeChip
            value={state.timeDays.trending ?? 14}
            defaultDays={DEFAULT_TIME_DAYS.trending ?? 14}
            onChange={updateTimeDays}
          />
          <span style={{ color: T.charcoal }}>
            内品类爆款组合相似、可立刻触达的{intent === "lowFollower" ? "低粉" : "同类"}达人
          </span>
        </SentenceLine>
      ) : null}
    </div>
  );
}

function SentenceLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline gap-y-1 text-[14.5px] leading-[1.7]">
      {children}
    </div>
  );
}

/**
 * Submit-time serialization — collapses the structured state into the single
 * string the agent flow already understands. Mirrors mock §3.4 「提交时合并」.
 */
export function serializeEditorState(intent: ChatIntent, state: StructuredEditorState): string {
  const productUrl = state.productChip ? `https://${state.productChip.url}` : "";
  const productNote = state.productNote.trim();
  const product = [productUrl, productNote].filter(Boolean).join(" ").trim();
  const productLine = product ? `${LABEL_PREFIX}${product}` : "";

  // v3 §4.3：序列化语句必须落到 brief-parser 能解析的形态。沿用 v2 关键词
  //（投过 / brand / 起量 / 时间窗）让下游 parser 拿到结构化要素，但首句改写为
  // v3 的"可建联输出"承诺，确保未来直接读到 prompt 的 LLM/审计也能拿到一致语义。
  if (intent === "competitor") {
    const brand =
      state.brandMode === "manual" && state.brands.length > 0
        ? state.brands.join(" / ")
        : "同品类品牌";
    const days = state.timeDays.competitor ?? 90;
    const time = days === 0 ? "不限时间" : `近 ${days} 天`;
    return [productLine, `对标投过 ${brand} 的合作款，${time}内可直接建联的同品类达人`]
      .filter(Boolean)
      .join("\n");
  }

  if (intent === "scenario") {
    return productLine;
  }

  // trending / lowFollower —— 共用爆款锚点的序列化（lowFollower 仅在入口
  // 卡片层差异化展示，下游 agent / brief-parser 都按 trending 处理）。
  const days = state.timeDays.trending ?? 14;
  const time = days === 0 ? "不限时间" : `近 ${days} 天`;
  const audience = intent === "lowFollower" ? "低粉" : "同类";
  return [productLine, `与${time}内品类爆款组合相似、可立刻触达的${audience}达人`]
    .filter(Boolean)
    .join("\n");
}

export function isEditorEmpty(state: StructuredEditorState): boolean {
  return state.productChip === null && state.productNote.trim().length === 0;
}
