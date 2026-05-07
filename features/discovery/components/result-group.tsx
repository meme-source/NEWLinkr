"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { CreatorCardData, ResultGroupData } from "../chat-types";
import { DiscoveryCreatorCard } from "./discovery-creator-card";
import { T } from "../data/tokens";

interface ResultGroupProps {
  group: ResultGroupData;
  statuses: Record<string, "pending" | "saved" | "skipped">;
  onSave: (creator: CreatorCardData) => void;
  onSkip: (creator: CreatorCardData) => void;
}

export function ResultGroup({ group, statuses, onSave, onSkip }: ResultGroupProps) {
  const [open, setOpen] = useState(group.defaultExpanded);
  const visibleCount = group.creators.length;
  const remainder = group.count - visibleCount;

  return (
    <section
      className="rounded-[18px] border bg-[#fffefb]"
      style={{
        borderColor: T.border,
        boxShadow: "0 1px 0 rgba(20,20,19,0.02)",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 pt-4 pb-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3
              className="text-[15px] font-semibold tracking-[-0.005em]"
              style={{ color: T.nearBlack }}
            >
              {group.label}
            </h3>
            <span
              className="rounded-full px-2 py-0.5 text-[11.5px] font-semibold"
              style={{
                backgroundColor: T.parchment,
                color: T.terracotta,
              }}
            >
              {group.count} 位
            </span>
          </div>
          {group.hint ? (
            <p className="mt-1 text-[12.5px]" style={{ color: T.stone }}>
              {group.hint}
            </p>
          ) : null}
        </div>
        <ChevronDown
          size={16}
          style={{
            color: T.stone,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 200ms",
          }}
        />
      </button>

      {open ? (
        <div className="border-t px-5 pt-4 pb-5" style={{ borderColor: T.borderLight }}>
          {group.creators.length === 0 ? (
            <p
              className="rounded-[12px] px-3 py-6 text-center text-[12.5px]"
              style={{
                backgroundColor: T.ivory,
                color: T.stone,
                border: `1px dashed ${T.border}`,
              }}
            >
              这一组共 {group.count} 位 · 演示数据未列出，可在右上方调整筛选展开
            </p>
          ) : (
            <ul className="space-y-3">
              {group.creators.map((creator) => (
                <li key={creator.id}>
                  <DiscoveryCreatorCard
                    creator={creator}
                    status={statuses[creator.id] ?? "pending"}
                    onSave={onSave}
                    onSkip={onSkip}
                  />
                </li>
              ))}
            </ul>
          )}

          {remainder > 0 && group.creators.length > 0 ? (
            <p className="mt-3 text-center text-[12px]" style={{ color: T.stone }}>
              还有 {remainder} 位匹配同一组别 · 追问可继续聚焦
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
