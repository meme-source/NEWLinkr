"use client";

import { Button } from "@/components/ui/button";

import { T } from "../../data/tokens";
import { InlineChip } from "./inline-chip";
import { DEFAULT_FOLLOWER_CAP, FOLLOWER_CAP_OPTIONS } from "./types";

interface FollowerCapChipProps {
  /** 粉丝量上限。null = 用 DEFAULT_FOLLOWER_CAP。 */
  value: number | null;
  onChange: (next: number) => void;
}

function capLabel(cap: number): string {
  const found = FOLLOWER_CAP_OPTIONS.find((o) => o.value === cap);
  return found ? found.label : `${Math.round(cap / 10_000)} 万以下`;
}

// 粉丝量上限 —— lowFollower 维度专属。「低粉」的定义性输入,所以单列成 chip,
// 不混进底部的通用粉丝量筛选。
export function FollowerCapChip({ value, onChange }: FollowerCapChipProps) {
  const effective = value ?? DEFAULT_FOLLOWER_CAP;

  return (
    <InlineChip
      label={capLabel(effective)}
      active={value !== null && value !== DEFAULT_FOLLOWER_CAP}
      popoverWidth={240}
      renderPopover={(close) => (
        <div className="p-3">
          <div className="px-1 pb-2 text-[12px] font-semibold" style={{ color: T.charcoal }}>
            粉丝量上限
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {FOLLOWER_CAP_OPTIONS.map((opt) => {
              const selected = opt.value === effective;
              return (
                <Button
                  unstyled
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
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
