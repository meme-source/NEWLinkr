"use client";

import { useMemo, useState } from "react";

import { BoardProgressTable } from "@/features/outreach/components/board-progress-table";
import { useOutreachState } from "@/features/outreach/components/outreach-state-context";
import { ProgressFunnel } from "@/features/outreach/components/progress-funnel";
import { OUTREACH_CREATORS } from "@/features/outreach/data/outreach-creators";
import type { OutreachLifecycleStatus } from "@/features/outreach/data/outreach-types";
import { useWorkspaceProject } from "@/features/project/components/project-context";
import { cn } from "@/lib/utils";
import type { CollaborationStatus } from "@/types/api";

// §3.2 建联进度 board ——
// 范围：从「待建联」到「已完成」的整条主路径。投放后的指标（曝光 / CPM / CPE）
// 归"投放表现"页，本页不重复。
//
// 2026-05-11 重构与 §3.1 项目概览 / §3.3 投放表现 视觉对齐：
//   ① KPI 横条（5 列，无外框，上下横线）—— 与 BoardPerformance KpiRow 同形
//   ② 建联漏斗 —— 无卡壳压缩版（详见 progress-funnel.tsx），居中氛围分块
//   ③ 建联明细表 —— 表外加 section toolbar（带「逾期 / 今日跟进」行动信号）；
//      表格本体保持原结构，仅卡壳 rounded-lg → rounded-lg

// TODO(progress-today): 与 board-progress-table.tsx 共用同一份硬编码 mock 当日。
// 真实后端接入后两处统一改为 new Date()。这里只用来算「逾期跟进 / 今日跟进」
// 两个聚合数。
const TODAY_ISO = "2026-05-06";

type SelectionKey = { kind: "all" } | { kind: "stage"; status: OutreachLifecycleStatus };

export function BoardProgress() {
  const { currentProjectId, isAllProjects, projects, currentProject } = useWorkspaceProject();
  const { resolveStatus, setStatusOverride, resolvePublishAt, setPublishOverride } =
    useOutreachState();
  const [selection, setSelection] = useState<SelectionKey>({ kind: "all" });

  // 用 context 的 resolveStatus / resolvePublishAt 覆盖 mock 数据里的原始字段 ——
  // 改完表格里的状态下拉或发文时间，关键指标 / 漏斗会立刻重算。
  const creators = useMemo(() => {
    const scoped = isAllProjects
      ? OUTREACH_CREATORS
      : OUTREACH_CREATORS.filter((c) => c.projectId === currentProjectId);
    return scoped.map((c) => ({
      ...c,
      status: resolveStatus(c),
      scheduledPublishAt: resolvePublishAt(c),
    }));
  }, [isAllProjects, currentProjectId, resolveStatus, resolvePublishAt]);

  // 当前状态计数 —— 供漏斗 / 状态 tab 共享。
  const counts: Record<OutreachLifecycleStatus, number> = {
    queued: 0,
    sent: 0,
    collaborating: 0,
    completed: 0,
    paused: 0,
    rejected: 0,
  };
  for (const c of creators) {
    if (c.status === "pending") continue;
    counts[c.status] += 1;
  }

  // 累计达到每个主路径阶段 —— 用于漏斗宽度与转化率。
  const totalCount = creators.length;
  const cumulative = {
    queued: totalCount,
    sent: totalCount - counts.queued,
    collaborating: counts.collaborating + counts.completed + counts.paused,
    completed: counts.completed,
  };

  // 目标建联数量：单项目取本项目；全部项目模式下汇总（null 视作 0，跳过）。
  const outreachTarget = isAllProjects
    ? projects.reduce((sum, p) => sum + (p.outreachTarget ?? 0), 0)
    : (currentProject.outreachTarget ?? 0);
  // 建联成功率 = 累计合作 / 累计已发送，与漏斗中 sent → collab 段的转化率口径一致。
  const successRate =
    cumulative.sent > 0 ? Math.round((cumulative.collaborating / cumulative.sent) * 100) : 0;

  // 「逾期跟进 / 今日跟进」—— 跨整个 scoped creators 聚合，与表格行内 followup 视图同源。
  const { overdueCount, dueTodayCount } = useMemo(() => {
    const todayMs = new Date(`${TODAY_ISO}T00:00:00`).getTime();
    let overdue = 0;
    let dueToday = 0;
    for (const c of creators) {
      if (!c.nextFollowUpAt) continue;
      const targetMs = new Date(`${c.nextFollowUpAt}T00:00:00`).getTime();
      const diffDays = Math.round((targetMs - todayMs) / 86_400_000);
      if (diffDays < 0) overdue += 1;
      else if (diffDays === 0) dueToday += 1;
    }
    return { overdueCount: overdue, dueTodayCount: dueToday };
  }, [creators]);

  const filtered = useMemo(() => {
    if (selection.kind === "all") return creators;
    return creators.filter((c) => c.status === selection.status);
  }, [creators, selection]);

  const onToggleStage = (s: OutreachLifecycleStatus) =>
    setSelection((prev) =>
      prev.kind === "stage" && prev.status === s ? { kind: "all" } : { kind: "stage", status: s },
    );

  const onSelectStatus = (s: OutreachLifecycleStatus | null) =>
    setSelection(s ? { kind: "stage", status: s } : { kind: "all" });

  const currentStage = selection.kind === "stage" ? selection.status : null;

  return (
    <div className="space-y-[18px]">
      <ProgressKpiStrip
        target={outreachTarget}
        sentCount={cumulative.sent}
        totalCount={totalCount}
        pendingReply={counts.sent}
        collaboratingNow={counts.collaborating}
        cumulativeCollab={cumulative.collaborating}
        successRate={successRate}
      />

      <ProgressFunnel
        cumulative={cumulative}
        loss={{ rejected: counts.rejected, paused: counts.paused }}
        selection={currentStage}
        onToggleStage={onToggleStage}
      />

      <ProgressTableSection
        totalCount={totalCount}
        overdueCount={overdueCount}
        dueTodayCount={dueTodayCount}
      >
        <BoardProgressTable
          creators={filtered}
          totalCount={totalCount}
          statusCounts={counts}
          selectedStatus={currentStage}
          onSelectStatus={onSelectStatus}
          onChangeStatus={(creatorId: string, next: CollaborationStatus) =>
            setStatusOverride(creatorId, next)
          }
          onChangePublishAt={(creatorId, next) => setPublishOverride(creatorId, next)}
        />
      </ProgressTableSection>
    </div>
  );
}

// §3.2.A KPI 横条 —— 与 BoardPerformance KpiRow 同形：
//   grid 5 列、上下边线 + 列间右边线、40px 数字、12px label，无独立卡片圆角。
interface ProgressKpiStripProps {
  target: number;
  sentCount: number;
  totalCount: number;
  pendingReply: number;
  collaboratingNow: number;
  cumulativeCollab: number;
  successRate: number;
}

function ProgressKpiStrip({
  target,
  sentCount,
  totalCount,
  pendingReply,
  collaboratingNow,
  cumulativeCollab,
  successRate,
}: ProgressKpiStripProps) {
  const hasTarget = target > 0;
  const targetProgressPct = hasTarget ? Math.min(100, Math.round((sentCount / target) * 100)) : 0;

  interface Kpi {
    label: string;
    value: string;
    unit?: string;
    sub: string;
    accent?: boolean;
  }
  const kpis: Kpi[] = [
    {
      label: "目标建联",
      value: hasTarget ? String(target) : "未设置",
      unit: hasTarget ? "位" : undefined,
      sub: hasTarget ? `已发送 ${sentCount} · ${targetProgressPct}%` : "在项目设置里填写目标",
    },
    {
      label: "累计建联",
      value: String(totalCount),
      unit: "位",
      sub: "进入流程",
    },
    {
      label: "已发送",
      value: String(sentCount),
      unit: "位",
      sub: `待回复 ${pendingReply}`,
    },
    {
      label: "合作中",
      value: String(collaboratingNow),
      unit: "位",
      sub: `累计合作 ${cumulativeCollab}`,
    },
    {
      label: "建联成功率",
      value: `${successRate}%`,
      sub: "累计合作 / 已发送",
      accent: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 border-y border-[#c5c0b1] lg:grid-cols-5">
      {kpis.map((k, idx) => (
        <div
          key={k.label}
          className={cn(
            "px-7 py-[22px]",
            idx < kpis.length - 1 && "lg:border-r lg:border-[#c5c0b1]",
          )}
        >
          <div className="text-[12px] text-[#939084]">{k.label}</div>
          <div className="mt-3.5 flex items-baseline gap-1.5">
            <span
              className={cn(
                "text-[40px] leading-none font-semibold tracking-tight tabular-nums",
                k.accent ? "text-[#ff4f00]" : "text-[#201515]",
              )}
            >
              {k.value}
            </span>
            {k.unit ? (
              <span className="text-[16px] font-medium text-[#939084]">{k.unit}</span>
            ) : null}
          </div>
          <div className="mt-3.5 text-[12px] text-[#939084]">{k.sub}</div>
        </div>
      ))}
    </div>
  );
}

// §3.2.B 表格 section toolbar —— 表外 header（label + 行动信号 + 总数）。
// 「逾期 / 今日跟进」紧贴表格作为行动信号；逾期>0 时橙色提示，今日>0 时黑色加粗。
interface ProgressTableSectionProps {
  totalCount: number;
  overdueCount: number;
  dueTodayCount: number;
  children: React.ReactNode;
}

function ProgressTableSection({
  totalCount,
  overdueCount,
  dueTodayCount,
  children,
}: ProgressTableSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div className="text-xs font-medium tracking-wider text-[#939084] uppercase">建联明细</div>
        <div className="flex items-center gap-3 text-[11px] text-[#939084] tabular-nums">
          <span className="inline-flex items-center gap-1.5">
            <span>逾期</span>
            <span
              className={cn(
                "text-[12px] font-semibold",
                overdueCount > 0 ? "text-[#ff4f00]" : "text-[#c5c0b1]",
              )}
            >
              {overdueCount}
            </span>
          </span>
          <span className="text-[#c5c0b1]">·</span>
          <span className="inline-flex items-center gap-1.5">
            <span>今日</span>
            <span
              className={cn(
                "text-[12px] font-semibold",
                dueTodayCount > 0 ? "text-[#201515]" : "text-[#c5c0b1]",
              )}
            >
              {dueTodayCount}
            </span>
          </span>
          <span className="text-[#c5c0b1]">·</span>
          <span>共 {totalCount} 位</span>
        </div>
      </div>
      {children}
    </div>
  );
}
