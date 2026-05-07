"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { CollaborationStatus } from "@/types/api";
import {
  COLLABORATION_STATUS_LABEL,
  COLLABORATION_STATUS_ORDER,
  COLLABORATION_STATUS_STYLE,
} from "@/lib/creator";
import { cn } from "@/lib/utils";

// 全站通用的"状态徽章 + 下拉编辑"单元。
// 不传 onChange 即只读（多项目场景的 dominantStatus 不可直接改）。
// 配色 / 顺序 / 文案完全由 lib/creator.ts 集中决定，不要在这里再发明。
interface Props {
  value: CollaborationStatus | null;
  onChange?: (next: CollaborationStatus) => void;
  // 可选：限制下拉里能选的状态子集（例如建联看板不允许选 pending）。
  // 不传等同于全部 7 个状态。
  allowedStatuses?: readonly CollaborationStatus[];
  // 可选：紧凑模式，徽章字号 / padding 略小，适合用在小空间。
  compact?: boolean;
}

export function CollaborationStatusCell({ value, onChange, allowedStatuses, compact }: Props) {
  const [open, setOpen] = useState(false);
  const readonly = !onChange;

  if (!value) {
    return <span className="text-[11px] text-[#939084]">—</span>;
  }

  const style = COLLABORATION_STATUS_STYLE[value];
  const badgeClass = cn(
    "inline-flex items-center gap-1 rounded-full border font-medium",
    compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]",
    style.badge,
  );

  const options = allowedStatuses ?? COLLABORATION_STATUS_ORDER;

  if (readonly) {
    return <span className={badgeClass}>{COLLABORATION_STATUS_LABEL[value]}</span>;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className={cn(badgeClass, "cursor-pointer transition-shadow hover:shadow-sm")}
      >
        <span>{COLLABORATION_STATUS_LABEL[value]}</span>
        <ChevronDown className="h-3 w-3 opacity-70" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute top-full left-0 z-20 mt-1 min-w-[120px] overflow-hidden rounded-xl border border-[#c5c0b1] bg-[#fffefb] py-1">
            {options.map((status) => {
              const active = status === value;
              const optionStyle = COLLABORATION_STATUS_STYLE[status];
              return (
                <button
                  key={status}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpen(false);
                    if (status !== value) onChange(status);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[11px]",
                    active ? "bg-[#fff7f4] text-[#ff4f00]" : "text-[#36342e] hover:bg-[#fffdf9]",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px]",
                      optionStyle.badge,
                    )}
                  >
                    {COLLABORATION_STATUS_LABEL[status]}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
