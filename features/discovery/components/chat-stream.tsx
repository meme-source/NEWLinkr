"use client";

import { useEffect, useRef } from "react";
import type { ChatChips, ChatMessage, CreatorCardData } from "../chat-types";
import { FOLLOWER_LABEL, PLATFORM_LABEL, geoLabel, viewsLabel } from "../data/chat-chips";
import { AnalysisCard } from "./analysis-card";
import { ResultGroup } from "./result-group";
import { T } from "../data/tokens";

interface ChatStreamProps {
  messages: ChatMessage[];
  statuses: Record<string, "pending" | "saved" | "skipped">;
  onSave: (creator: CreatorCardData) => void;
  onSkip: (creator: CreatorCardData) => void;
}

function chipSummary(chips: ChatChips): string {
  const parts = [PLATFORM_LABEL[chips.platform], geoLabel(chips.country, chips.language)];
  if (chips.follower !== "any") {
    parts.push(FOLLOWER_LABEL[chips.follower].replace(/\s·.*$/, ""));
  }
  if (chips.viewsStep !== 0) {
    parts.push(`播放 ${viewsLabel(chips.viewsStep)}`);
  }
  return parts.join(" · ");
}

function UserBubble({ text, chips }: { text: string; chips: ChatChips }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[78%]">
        <div
          className="rounded-[18px] rounded-tr-[6px] px-4 py-3 text-[14px] leading-[1.6] whitespace-pre-line"
          style={{
            backgroundColor: T.terracotta,
            color: "white",
          }}
        >
          {text}
        </div>
        <p className="mt-1 text-right text-[11px]" style={{ color: T.stone }}>
          {chipSummary(chips)}
        </p>
      </div>
    </div>
  );
}

export function ChatStream({ messages, statuses, onSave, onSkip }: ChatStreamProps) {
  const tailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    tailRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  return (
    <div className="mx-auto w-full max-w-[820px] space-y-5 px-4 pt-8 pb-[280px]">
      {messages.map((msg) => {
        if (msg.role === "user") {
          return <UserBubble key={msg.id} text={msg.text} chips={msg.chips} />;
        }
        return (
          <div key={msg.id} className="space-y-4">
            <AnalysisCard basis={msg.basis} steps={msg.steps} streaming={msg.streaming} />
            {!msg.streaming && msg.groups.length > 0 ? (
              <div className="space-y-3">
                {msg.groups.map((group) => (
                  <ResultGroup
                    key={group.key}
                    group={group}
                    statuses={statuses}
                    onSave={onSave}
                    onSkip={onSkip}
                    onOpenProfile={onOpenProfile}
                  />
                ))}
              </div>
            ) : null}
            {!msg.streaming && msg.hint ? (
              <p
                className="rounded-[14px] px-4 py-3 text-[12.5px] leading-[1.6]"
                style={{
                  backgroundColor: T.ivory,
                  color: T.charcoal,
                  border: `1px solid ${T.borderLight}`,
                }}
              >
                💬 {msg.hint}
              </p>
            ) : null}
          </div>
        );
      })}
      <div ref={tailRef} />
    </div>
  );
}
