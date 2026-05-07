"use client";

import { useMemo, useState } from "react";

import { BoardProgressTable } from "@/features/outreach/components/board-progress-table";
import { useOutreachState } from "@/features/outreach/components/outreach-state-context";
import { ProgressFunnel } from "@/features/outreach/components/progress-funnel";
import { OUTREACH_CREATORS } from "@/features/outreach/data/outreach-creators";
import type { OutreachLifecycleStatus } from "@/features/outreach/data/outreach-types";
import { useWorkspaceProject } from "@/features/project/components/project-context";
import type { CollaborationStatus } from "@/types/api";

// §3.2 建联进度 board ——
// 范围：从「待建联」到「已完成」的整条主路径。投放后的指标（曝光 / CPM / CPE）
// 归"投放表现"页，本页不重复。
//
// 模块顺序（自上而下）：
//   ① 关键指标 + 建联漏斗   一行两列对齐（左数据、右形态）
//   ② 建联明细表            状态视角 tab + 可下拉改状态、与漏斗联动筛选

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
  // 已合作数量 = 累计达到合作阶段（合作中 / 已完成 / 暂停中）。
  const cooperatedCount = cumulative.collaborating;
  // 建联成功率 = 累计合作 / 累计已发送，与漏斗中 sent → collab 段的转化率口径一致。
  const successRate =
    cumulative.sent > 0 ? Math.round((cumulative.collaborating / cumulative.sent) * 100) : 0;

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

  return (
    <div className="space-y-5">
      <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <ProgressKeyMetrics
          target={outreachTarget}
          sentCount={cumulative.sent}
          cooperatedCount={cooperatedCount}
          successRate={successRate}
        />
        <ProgressFunnel
          cumulative={cumulative}
          loss={{ rejected: counts.rejected, paused: counts.paused }}
          selection={selection.kind === "stage" ? selection.status : null}
          onToggleStage={onToggleStage}
        />
      </div>

      <BoardProgressTable
        creators={filtered}
        totalCount={creators.length}
        statusCounts={counts}
        selectedStatus={selection.kind === "stage" ? selection.status : null}
        onSelectStatus={onSelectStatus}
        onChangeStatus={(creatorId: string, next: CollaborationStatus) =>
          setStatusOverride(creatorId, next)
        }
        onChangePublishAt={(creatorId, next) => setPublishOverride(creatorId, next)}
      />
    </div>
  );
}

interface ProgressKeyMetricsProps {
  target: number;
  sentCount: number;
  cooperatedCount: number;
  successRate: number;
}

function ProgressKeyMetrics({
  target,
  sentCount,
  cooperatedCount,
  successRate,
}: ProgressKeyMetricsProps) {
  // 目标建联进度条：当 target 为 0 / 未设置时不显示进度条，文案降级为"未设置"。
  const hasTarget = target > 0;
  const targetProgressPct = hasTarget ? Math.min(100, Math.round((sentCount / target) * 100)) : 0;
  return (
    <div className="flex h-full flex-col rounded-2xl border border-[#c5c0b1] bg-[#fffefb] p-5">
      <div className="mb-4 text-xs font-medium tracking-wider text-[#939084] uppercase">
        关键指标
      </div>
      <div className="flex flex-1 flex-col justify-center gap-3">
        <MetricRow
          label="目标建联数量"
          value={hasTarget ? `${target}` : "未设置"}
          unit={hasTarget ? "位" : undefined}
          sub={
            hasTarget ? `已建联 ${sentCount} 位 · ${targetProgressPct}%` : "在项目设置里填写目标"
          }
          progress={hasTarget ? targetProgressPct : undefined}
        />
        <MetricRow
          label="已合作数量"
          value={`${cooperatedCount}`}
          unit="位"
          sub="累计达到合作阶段"
        />
        <MetricRow
          label="建联成功率"
          value={`${successRate}`}
          unit="%"
          sub="累计合作 / 累计已发送"
          accent
        />
      </div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  unit,
  sub,
  progress,
  accent,
}: {
  label: string;
  value: string;
  unit?: string;
  sub: string;
  progress?: number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl bg-[#fffdf9] p-3">
      <div className="text-[10px] tracking-wide text-[#939084] uppercase">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span
          className={
            accent
              ? "text-2xl font-semibold tracking-tight text-[#ff4f00] tabular-nums"
              : "text-2xl font-semibold tracking-tight text-[#201515] tabular-nums"
          }
        >
          {value}
        </span>
        {unit ? <span className="text-xs text-[#939084]">{unit}</span> : null}
      </div>
      {progress !== undefined ? (
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#eceae3]">
          <div className="h-full rounded-full bg-[#ff4f00]" style={{ width: `${progress}%` }} />
        </div>
      ) : null}
      <div className="mt-1 text-[10px] text-[#939084]">{sub}</div>
    </div>
  );
}
