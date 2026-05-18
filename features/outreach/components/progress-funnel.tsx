"use client";

import { Button } from "@/components/ui/button";
import type { OutreachLifecycleStatus } from "@/features/outreach/data/outreach-types";
import { cn } from "@/lib/utils";

// §3.2 建联漏斗 ——
// 2026-05-11 重构：去掉卡壳，居中氛围分块；coral 家族 4 stage 单色渐变（与
// 投放表现 BoardFunnel 同源调色板）；上下留白让背景透出，让 pill 自己承担视觉重量。
//
// 数值口径：每个 stage 显示「累计达到该阶段」，宽度按累计值递减。第一段标签命名为
// 「进入流程」而非「待建联」，与下方状态 tab 里 current-state 口径的「待建联」彻底
// 区分，避免「漏斗写 11、tab 写 2」让人误以为是 bug。
//
// transition caption 不再使用「建联成功率」字样（KPI 横条已有同名指标），改为
// 「建联转化」。

interface ProgressFunnelStageCounts {
  queued: number;
  sent: number;
  collaborating: number;
  completed: number;
}

interface ProgressFunnelLossCounts {
  rejected: number;
  paused: number;
}

interface ProgressFunnelProps {
  cumulative: ProgressFunnelStageCounts;
  loss: ProgressFunnelLossCounts;
  selection: OutreachLifecycleStatus | null;
  onToggleStage: (s: OutreachLifecycleStatus) => void;
}

interface StageDef {
  key: keyof ProgressFunnelStageCounts;
  status: OutreachLifecycleStatus;
  label: string;
  bg: string;
  fg: string;
}

// coral 家族 4 段渐变，与 board-performance-shared TIER 调色板 + BoardFunnel 同源。
// 自上而下加深；第一段最浅，需要深色文字保证对比。
const STAGES: StageDef[] = [
  { key: "queued", status: "queued", label: "进入流程", bg: "#F5C9B3", fg: "#7C4632" },
  { key: "sent", status: "sent", label: "已发送", bg: "#E8A892", fg: "#fffefb" },
  { key: "collaborating", status: "collaborating", label: "合作中", bg: "#D88A74", fg: "#fffefb" },
  { key: "completed", status: "completed", label: "已完成", bg: "#8C543F", fg: "#fffefb" },
];

function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

interface Transition {
  caption: string;
  value: string;
  lossLabel?: string;
  lossValue?: number;
}

export function ProgressFunnel({
  cumulative,
  loss,
  selection,
  onToggleStage,
}: ProgressFunnelProps) {
  const max = Math.max(cumulative.queued, 1);
  const transitions: Transition[] = [
    { caption: "发送率", value: `${pct(cumulative.sent, cumulative.queued)}%` },
    {
      caption: "建联转化",
      value: `${pct(cumulative.collaborating, cumulative.sent)}%`,
      lossLabel: "已拒绝",
      lossValue: loss.rejected,
    },
    {
      caption: "完成率",
      value: `${pct(cumulative.completed, cumulative.collaborating)}%`,
      lossLabel: "暂停中",
      lossValue: loss.paused,
    },
  ];

  return (
    <section className="flex flex-col items-center pt-5 pb-6">
      <div className="mb-3.5 text-center">
        <div className="text-[11px] font-medium tracking-[0.12em] text-[#939084] uppercase">
          PROGRESS
        </div>
        <h3 className="mt-1 text-[15px] font-semibold tracking-tight text-[#201515]">建联漏斗</h3>
      </div>

      <div className="flex w-full max-w-[560px] flex-col items-center gap-2">
        {STAGES.map((stage, idx) => {
          const value = cumulative[stage.key];
          const widthPct = Math.max(20, Math.round((value / max) * 100));
          const isActive = selection === stage.status;
          const isFiltered = selection !== null && !isActive;
          const t = transitions[idx];
          return (
            <div key={stage.key} className="contents">
              <Button
                unstyled
                type="button"
                onClick={() => onToggleStage(stage.status)}
                aria-pressed={isActive}
                className={cn(
                  "flex items-center justify-between gap-2.5 rounded-lg px-[18px] py-2.5 transition-all",
                  "ring-1 ring-transparent",
                  isActive && "ring-[#201515] ring-offset-2 ring-offset-[#fffdf9]",
                  isFiltered && "opacity-50 hover:opacity-80",
                )}
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: stage.bg,
                  color: stage.fg,
                }}
              >
                <span className="text-[12px] font-semibold tracking-wide whitespace-nowrap">
                  {stage.label}
                </span>
                <span className="text-[14px] font-bold tracking-tight tabular-nums">{value}</span>
              </Button>
              {t ? (
                <div className="flex flex-wrap items-center justify-center gap-[5px] text-[10px] leading-tight">
                  <span className="font-semibold text-[#939084]">↓</span>
                  <span className="text-[#36342e]">{t.caption}</span>
                  <span className="text-[11px] font-bold text-[#201515] tabular-nums">
                    {t.value}
                  </span>
                  {t.lossValue !== undefined && t.lossValue > 0 ? (
                    <>
                      <span className="text-[#939084]">·</span>
                      <span className="text-[#36342e]">{t.lossLabel}</span>
                      <span className="text-[11px] font-bold text-[#ff4f00] tabular-nums">
                        {t.lossValue}
                      </span>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
