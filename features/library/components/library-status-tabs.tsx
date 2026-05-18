"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { COLLABORATION_STATUS_LABEL, COLLABORATION_STATUS_ORDER } from "@/lib/creator";
import type { StatusTab } from "@/features/library/types";

interface Props {
  active: StatusTab;
  counts: Record<StatusTab, number>;
  onChange: (next: StatusTab) => void;
}

const TABS: { id: StatusTab; label: string }[] = [
  { id: "all", label: "全部" },
  ...COLLABORATION_STATUS_ORDER.map((status) => ({
    id: status,
    label: COLLABORATION_STATUS_LABEL[status],
  })),
];

// 设计规范（docs/DESIGN.md）：激活态仅保留橙色短下划线，不再贯穿全宽 1px 横线。
// 数字标签去掉 chip 背景，改用同色系 muted 文字与 tab 名隔 2px。
export function LibraryStatusTabs({ active, counts, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-[22px]">
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Button
            unstyled
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative inline-flex items-center gap-0.5 py-1 text-[13px] transition-colors",
              isActive
                ? "font-medium text-[#201515]"
                : "font-normal text-[#939084] hover:text-[#36342e]",
            )}
          >
            <span>{tab.label}</span>
            <span
              className={cn(
                "ml-0.5 text-[12px] font-normal tabular-nums",
                isActive ? "text-[#36342e]" : "text-[#bdb9ac]",
              )}
            >
              {counts[tab.id]}
            </span>
            {isActive && (
              <span
                aria-hidden
                className="absolute right-0 -bottom-0.5 left-0 h-0.5 rounded-[1px] bg-[#ff4f00]"
              />
            )}
          </Button>
        );
      })}
    </div>
  );
}
