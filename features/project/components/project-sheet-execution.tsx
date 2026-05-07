"use client";

import { Target } from "lucide-react";

import { fmtViews, summarizeProject } from "@/features/outreach/lib/project-summary";

// §3.1 产出概况 — 抽屉里的派生只读层。
// 目标建联人数已迁到"基础信息"卡片（参数层），这里专注展示真实产出：
// 已建联 / 进入合作 / 已投放 / 总花费。如果用户在基础信息里设了目标建联人数，
// 标题旁出现"完成 X%"小药丸来呼应。
// 此卡仅在编辑模式渲染——创建模式还没有 projectId，没有派生数据可看。

export function ProjectSheetExecutionSection({
  projectId,
  outreachTarget,
}: {
  projectId: string;
  outreachTarget: number | null;
}) {
  const summary = summarizeProject(projectId);
  const targetReached =
    outreachTarget != null && outreachTarget > 0
      ? Math.min(100, Math.round((summary.outreachSent / outreachTarget) * 100))
      : null;

  return (
    <section className="rounded-3xl border border-[#c5c0b1] bg-[#fffefb] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#201515]">
          <Target className="h-4 w-4 text-[#ff4f00]" />
          产出概况
        </div>
        {targetReached != null ? (
          <div className="inline-flex items-baseline gap-1.5 rounded-full border border-[#fff7f4] bg-[#fffdf9] px-2.5 py-0.5">
            <span className="text-[10px] tracking-wide text-[#939084]">完成</span>
            <span className="text-xs font-semibold text-[#ff4f00] tabular-nums">
              {targetReached}%
            </span>
          </div>
        ) : null}
      </div>
      <p className="mt-1 text-[11px] text-[#939084]">实时由建联和投放数据汇总，无法手动编辑。</p>

      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <SnapshotCell
          label="已建联"
          value={String(summary.outreachSent)}
          sub={`总名单 ${summary.outreachTotal}`}
        />
        <SnapshotCell
          label="进入合作"
          value={String(summary.outreachSuccess)}
          sub={
            summary.outreachSent > 0
              ? `成功率 ${Math.round((summary.outreachSuccess / summary.outreachSent) * 100)}%`
              : "—"
          }
        />
        <SnapshotCell
          label="已投放"
          value={String(summary.placementCount)}
          sub={`曝光 ${fmtViews(summary.placementExposureViews)}`}
        />
        <SnapshotCell
          label="总花费"
          value={`$${summary.placementSpendUsd.toLocaleString()}`}
          sub="跨平台累计"
        />
      </div>
    </section>
  );
}

function SnapshotCell({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl bg-[#fffdf9] p-3">
      <div className="text-[10px] tracking-wide text-[#939084] uppercase">{label}</div>
      <div className="mt-1 text-base font-semibold tracking-tight text-[#201515] tabular-nums">
        {value}
      </div>
      <div className="mt-0.5 text-[10px] text-[#939084]">{sub}</div>
    </div>
  );
}
