"use client";

import type { OutreachLifecycleStatus } from "@/features/outreach/data/outreach-types";
import { COLLABORATION_STATUS_LABEL } from "@/lib/creator";
import { cn } from "@/lib/utils";

// §3.2 建联进度漏斗 ——
// 与"投放表现"页的漏斗刻意分离：这里画"待建联 → 已发送 → 合作中 → 已完成"
// 这条主路径，旁路显示已拒绝 / 暂停中。
//
// 数值口径：每段显示"累计达到该阶段"，宽度也按累计值递减；这样视觉上才是
// 真正的漏斗，而不是当前状态的随机柱状。
//
// 关键指标（建联成功率等聚合数）由左侧的 ProgressKeyMetrics 卡承担，本组件
// 不重复展示数字 —— 只负责"形态 + 转化率 + 流失"。
//
// 颜色与 lib/creator.ts 中各状态的 dot 一致 —— 这样和表格里的状态徽章
// 在视觉上一一对应：amber / blue / red / purple。

interface ProgressFunnelStageCounts {
  // cumulative reach for each main-path stage.
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
  bg: string;
  fg: string;
}

// dot 颜色直接复用 COLLABORATION_STATUS_STYLE.dot（去掉 "bg-[" 包装）。
const STAGES: StageDef[] = [
  { key: "queued", status: "queued", bg: "#ca8a04", fg: "#fffdf9" },
  { key: "sent", status: "sent", bg: "#3b82f6", fg: "#fffdf9" },
  { key: "collaborating", status: "collaborating", bg: "#ef4444", fg: "#fffdf9" },
  { key: "completed", status: "completed", bg: "#8b5cf6", fg: "#fffdf9" },
];

function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

export function ProgressFunnel({
  cumulative,
  loss,
  selection,
  onToggleStage,
}: ProgressFunnelProps) {
  const max = Math.max(cumulative.queued, 1);
  const transitions: { caption: string; value: string; lossLabel?: string; lossValue?: number }[] =
    [
      { caption: "发送率", value: `${pct(cumulative.sent, cumulative.queued)}%` },
      {
        caption: "建联成功率",
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
    <div className="flex h-full flex-col rounded-2xl border border-[#c5c0b1] bg-[#fffefb] p-5">
      <div className="mb-4 text-xs font-medium tracking-wider text-[#939084] uppercase">
        建联漏斗
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        {STAGES.map((stage, idx) => {
          const value = cumulative[stage.key];
          const widthPct = Math.max(20, Math.round((value / max) * 100));
          const isActive = selection === stage.status;
          const isFiltered = selection !== null && !isActive;
          const isLast = idx === STAGES.length - 1;
          const t = transitions[idx];
          return (
            <div key={stage.key}>
              <button
                type="button"
                onClick={() => onToggleStage(stage.status)}
                aria-pressed={isActive}
                className={cn(
                  "mx-auto flex items-center justify-between gap-4 rounded-xl px-4 py-2.5 transition-all",
                  "ring-1 ring-transparent",
                  isActive && "ring-[#201515] ring-offset-2 ring-offset-[#fffefb]",
                  isFiltered && "opacity-50 hover:opacity-80",
                )}
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: stage.bg,
                  color: stage.fg,
                }}
              >
                <span className="text-[11px] font-medium tracking-wide opacity-90">
                  {COLLABORATION_STATUS_LABEL[stage.status]}
                </span>
                <span className="text-base font-semibold tabular-nums">{value}</span>
              </button>
              {!isLast && t ? (
                <div className="mx-auto flex w-full max-w-md items-center gap-2 px-1 py-1.5">
                  <div className="h-px flex-1 bg-[#c5c0b1]" />
                  <span className="text-[10px] tracking-wide text-[#939084]">{t.caption}</span>
                  <span className="text-[11px] font-semibold text-[#36342e] tabular-nums">
                    {t.value}
                  </span>
                  {t.lossValue !== undefined && t.lossValue > 0 ? (
                    <>
                      <span className="text-[#c5c0b1]">·</span>
                      <span className="text-[10px] text-[#939084]">{t.lossLabel}</span>
                      <span className="text-[11px] font-semibold text-[#ff4f00] tabular-nums">
                        {t.lossValue}
                      </span>
                    </>
                  ) : null}
                  <div className="h-px flex-1 bg-[#c5c0b1]" />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
