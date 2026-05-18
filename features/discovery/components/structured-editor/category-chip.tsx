"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { T } from "../../data/tokens";
import { InlineChip } from "./inline-chip";

interface CategoryChipProps {
  value: string;
  /** 产品已填时 —— 空品类显示「按产品自动判断」而非「指定品类」。 */
  hasProductFallback: boolean;
  onChange: (next: string) => void;
}

// 品类锚点 —— trending / lowFollower 用。常见品类做快捷选项,也支持自由输入。
const SUGGESTED_CATEGORIES = [
  "美妆护肤",
  "AI 工具 / 生产力",
  "3C 数码",
  "家居好物",
  "健身运动",
  "母婴",
  "美食",
  "时尚穿搭",
];

export function categoryChipText(value: string, hasProductFallback: boolean): string {
  const v = value.trim();
  if (v) return v;
  return hasProductFallback ? "按产品自动判断" : "指定品类";
}

export function CategoryChip({ value, hasProductFallback, onChange }: CategoryChipProps) {
  return (
    <InlineChip
      label={categoryChipText(value, hasProductFallback)}
      active={value.trim().length > 0}
      popoverWidth={300}
      renderPopover={(close) => (
        <CategoryPopover
          value={value}
          onCommit={(next) => {
            onChange(next);
            close();
          }}
        />
      )}
    />
  );
}

function CategoryPopover({ value, onCommit }: { value: string; onCommit: (next: string) => void }) {
  const [query, setQuery] = useState(value);

  return (
    <div className="p-3">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onCommit(query.trim());
          }
        }}
        placeholder="输入品类，如「美妆护肤」「AI 工具」"
        className="w-full rounded-lg border px-3 py-2 text-[12.5px] outline-none focus:border-[color:var(--brand)] focus:bg-white"
        style={{
          ["--brand" as string]: T.terracotta,
          backgroundColor: T.ivory,
          borderColor: T.borderLight,
          color: T.nearBlack,
        }}
      />

      <div
        className="mt-3 text-[10.5px] font-semibold tracking-[0.06em] uppercase"
        style={{ color: T.stone }}
      >
        常见品类
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {SUGGESTED_CATEGORIES.map((c) => {
          const selected = c === query.trim();
          return (
            <Button
              unstyled
              key={c}
              type="button"
              onClick={() => onCommit(c)}
              className="rounded-full border px-2.5 py-[3px] text-[12px] transition-colors"
              style={{
                backgroundColor: selected ? "rgba(255,79,0,0.1)" : "white",
                borderColor: selected ? T.terracotta : T.borderLight,
                color: selected ? T.terracotta : T.charcoal,
              }}
            >
              {c}
            </Button>
          );
        })}
      </div>

      <div
        className="mt-3 flex items-center justify-between border-t pt-2.5"
        style={{ borderColor: T.borderLight }}
      >
        <Button
          unstyled
          type="button"
          onClick={() => onCommit("")}
          className="text-[12px] transition-colors hover:text-[color:var(--brand)]"
          style={{ ["--brand" as string]: T.terracotta, color: T.stone }}
        >
          不指定 · 按产品判断
        </Button>
        <Button
          unstyled
          type="button"
          onClick={() => onCommit(query.trim())}
          className="rounded-full px-3.5 py-1 text-[12px] font-medium text-white transition-[filter] hover:brightness-110 active:scale-[0.98]"
          style={{ backgroundColor: T.terracotta }}
        >
          确定
        </Button>
      </div>
    </div>
  );
}
