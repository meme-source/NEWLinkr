"use client";

import { CalendarRange } from "lucide-react";

import { deriveProjectTimeHealth, summarizeProject } from "@/features/outreach/lib/project-summary";
import type { WorkspaceProject } from "@/features/project/components/project-context";
import { cn } from "@/lib/utils";

// §3.1 时间健康度 —— 抽屉里的"项目跑得动不动"对比层。
// 双进度条：上为时间已过百分比，下为建联完成百分比。差值给出口播判断（领先 / 同步 / 落后），
// 业务人员可以一眼判断要不要加人手。
//   - 时间未设置：仅显示文案兜底，不渲染进度条。
//   - 已结束 / 未开始：进度条到边界，pace 视情况降级为"暂无对比"。

const PACE_TONE: Record<"ahead" | "ontrack" | "behind" | "unknown", { tag: string; bar: string }> =
  {
    ahead: { tag: "bg-[#fff7f4] text-[#ff4f00] ring-[#fff7f4]", bar: "bg-[#ff4f00]" },
    ontrack: { tag: "bg-[#eceae3] text-[#201515] ring-[#c5c0b1]/60", bar: "bg-[#36342e]" },
    behind: { tag: "bg-[#fbf3df] text-[#8a6f1f] ring-[#f0e2bc]", bar: "bg-[#c89e4f]" },
    unknown: { tag: "bg-[#eceae3] text-[#939084] ring-[#c5c0b1]/60", bar: "bg-[#c5c0b1]" },
  };

export function ProjectSheetTimeHealthSection({ project }: { project: WorkspaceProject }) {
  const summary = summarizeProject(project.id);
  const health = deriveProjectTimeHealth({
    startDate: project.startDate,
    endDate: project.endDate,
    outreachSent: summary.outreachSent,
    outreachTarget: project.outreachTarget,
    outreachTotal: summary.outreachTotal,
  });

  const tone = PACE_TONE[health.pace];

  return (
    <section className="rounded-3xl border border-[#c5c0b1] bg-[#fffefb] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#201515]">
          <CalendarRange className="h-4 w-4 text-[#ff4f00]" />
          时间健康度
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium ring-1",
            tone.tag,
          )}
        >
          {health.paceLabel}
        </span>
      </div>

      {health.hasRange ? (
        <p className="mt-1 text-[11px] text-[#939084]">
          已进行 {health.elapsedDays} / {health.totalDays} 天 · 剩余 {health.remainDays} 天
        </p>
      ) : (
        <p className="mt-1 text-[11px] text-[#939084]">
          请在基础信息里设置开始 / 结束时间，才能比对时间进度。
        </p>
      )}

      {health.hasRange ? (
        <div className="mt-3 space-y-2.5">
          <ProgressRow
            label="时间进度"
            ratioPct={health.timeRatioPct}
            barClass="bg-[#36342e]"
            value={`${health.timeRatioPct}%`}
          />
          <ProgressRow
            label="建联进度"
            ratioPct={health.outreachRatioPct}
            barClass={tone.bar}
            value={`${health.outreachRatioPct}%`}
          />
        </div>
      ) : null}
    </section>
  );
}

function ProgressRow({
  label,
  ratioPct,
  barClass,
  value,
}: {
  label: string;
  ratioPct: number;
  barClass: string;
  value: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-[11px]">
        <span className="text-[#939084]">{label}</span>
        <span className="font-medium text-[#201515] tabular-nums">{value}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#eceae3]">
        <div className={cn("h-full rounded-full", barClass)} style={{ width: `${ratioPct}%` }} />
      </div>
    </div>
  );
}
