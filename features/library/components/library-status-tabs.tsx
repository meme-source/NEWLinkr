"use client";

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

export function LibraryStatusTabs({ active, counts, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 border-b border-[#c5c0b1]">
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative inline-flex items-center gap-1.5 px-3 pt-1 pb-2.5 text-[13px] transition-colors",
              isActive
                ? "font-semibold text-[#ff4f00]"
                : "font-medium text-[#939084] hover:text-[#36342e]",
            )}
          >
            <span>{tab.label}</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                isActive ? "bg-[#fff7f4] text-[#ff4f00]" : "bg-[#eceae3] text-[#939084]",
              )}
            >
              {counts[tab.id]}
            </span>
            {isActive && (
              <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-t bg-[#ff4f00]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
