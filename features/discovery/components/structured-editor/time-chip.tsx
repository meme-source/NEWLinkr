"use client";

import { Button } from "@/components/ui/button";

import { T } from "../../data/tokens";
import { InlineChip } from "./inline-chip";

interface TimeChipProps {
  /** Currently selected days. 0 = 不限时间. */
  value: number;
  /** Mode default — used to decide the "已自定义" highlight. */
  defaultDays: number;
  onChange: (next: number) => void;
}

const TIME_OPTIONS: { days: number; label: string }[] = [
  { days: 7, label: "近 7 天" },
  { days: 14, label: "近 14 天" },
  { days: 30, label: "近 30 天" },
  { days: 60, label: "近 60 天" },
  { days: 90, label: "近 90 天" },
  { days: 0, label: "不限时间" },
];

function timeChipText(days: number): string {
  return days === 0 ? "不限时间" : `近 ${days} 天`;
}

export function TimeChip({ value, defaultDays, onChange }: TimeChipProps) {
  return (
    <InlineChip
      label={timeChipText(value)}
      active={value !== defaultDays}
      popoverWidth={260}
      renderPopover={(close) => (
        <div className="p-3">
          <div className="px-1 pb-2 text-[12px] font-semibold" style={{ color: T.charcoal }}>
            时间范围
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {TIME_OPTIONS.map((opt) => {
              const selected = opt.days === value;
              return (
                <Button
                  unstyled
                  key={opt.days}
                  type="button"
                  onClick={() => {
                    onChange(opt.days);
                    close();
                  }}
                  className="rounded-lg border px-3 py-2 text-[12.5px] transition-colors hover:bg-[--hover-bg]"
                  style={{
                    ["--hover-bg" as string]: T.ivory,
                    backgroundColor: selected ? "rgba(255,79,0,0.08)" : "white",
                    borderColor: selected ? T.terracotta : T.borderLight,
                    color: selected ? T.terracotta : T.nearBlack,
                    fontWeight: selected ? 600 : 400,
                  }}
                >
                  {opt.label}
                </Button>
              );
            })}
          </div>
        </div>
      )}
    />
  );
}
