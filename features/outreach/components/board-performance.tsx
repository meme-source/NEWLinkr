"use client";

import { AlertTriangle, ArrowDownRight, ArrowUpRight, Plus, RefreshCw } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { AddPlacementDialog } from "@/features/outreach/components/add-placement-dialog";
import { BoardFunnel } from "@/features/outreach/components/board-funnel";
import { PlacementCard } from "@/features/outreach/components/board-performance-card";
import {
  CategoryBreakdownCard,
  TierBreakdownCard,
} from "@/features/outreach/components/board-performance-mix";
import { BoardPerformanceScatter } from "@/features/outreach/components/board-performance-scatter";
import {
  engOf,
  fmtCount,
  fmtMoney,
  fmtRefreshedAt,
} from "@/features/outreach/components/board-performance-shared";
import { useOutreachState } from "@/features/outreach/components/outreach-state-context";
import { PLACEMENTS, type Placement } from "@/features/outreach/data/board-placements";
import { OUTREACH_CREATORS } from "@/features/outreach/data/outreach-creators";
import { useWorkspaceProject } from "@/features/project/components/project-context";
import { cn } from "@/lib/utils";

// §3.3 投放表现。Per the 2026-05 redesign, the lens is "投放后的内容效果"：
//   - KPI 行：投放条数 / 总曝光 / 平均 CPM / 平均 CPE
//   - 类别分布 + 投放漏斗：同一行看"投了谁"与"投放后路径"
//   - 量级统计 + 散点图：同一行看达人量级与 CPE × 曝光质量
//   - 结构拆分：当前 TikTok-only，平台对比已下线，改看
//     "投放达人长什么样" —— 主类拆分 + 粉丝量分桶（头部 / 腰部 / 尾部）
//   - 投放卡片网格：单条投放的快照
export function BoardPerformance() {
  const { currentProject, isAllProjects, projects } = useWorkspaceProject();
  const { addedPlacements } = useOutreachState();
  // 用户在 添加追踪 弹窗里录入的 placement 排在 mock 前面 —— 新加的卡片应该优先看到。
  const placements = useMemo(() => {
    const all = [...addedPlacements, ...PLACEMENTS];
    return isAllProjects ? all : all.filter((p) => p.projectId === currentProject.id);
  }, [addedPlacements, isAllProjects, currentProject.id]);
  // 全部项目模式下，单条投放需要标注归属项目；按 id 查名比循环更稳。
  const projectNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const project of projects) map.set(project.id, project.name);
    return map;
  }, [projects]);
  const outreachCreators = useMemo(
    () =>
      isAllProjects
        ? OUTREACH_CREATORS
        : OUTREACH_CREATORS.filter((c) => c.projectId === currentProject.id),
    [isAllProjects, currentProject.id],
  );
  // 累计达到合作 = 进入合作或之后阶段（合作中 / 已完成 / 暂停中）—— 投放漏斗的入口。
  const successCount = outreachCreators.filter(
    (c) => c.status === "collaborating" || c.status === "completed" || c.status === "paused",
  ).length;
  const totalExposureViews = placements.reduce((s, p) => s + p.views, 0);

  return (
    <div className="space-y-5">
      <KpiRow placements={placements} />
      <div className="grid items-stretch gap-5 lg:grid-cols-2">
        <CategoryBreakdownCard placements={placements} />
        <BoardFunnel
          successCount={successCount}
          placedCount={placements.length}
          totalExposureViews={totalExposureViews}
        />
      </div>
      <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(280px,0.95fr)_minmax(0,1.25fr)]">
        <TierBreakdownCard placements={placements} />
        <BoardPerformanceScatter placements={placements} />
      </div>
      <PlacementGrid
        placements={placements}
        projectNameById={isAllProjects ? projectNameById : undefined}
      />
    </div>
  );
}

function KpiRow({ placements }: { placements: Placement[] }) {
  const total = placements.length;
  const totalEng = placements.reduce((s, p) => s + engOf(p), 0);
  const totalSpend = placements.reduce((s, p) => s + p.spendUsd, 0);
  const totalViews = placements.reduce((s, p) => s + p.views, 0);
  const avgCpe = totalEng > 0 ? totalSpend / totalEng : 0;
  const avgCpm = totalViews > 0 ? (totalSpend / totalViews) * 1000 : 0;

  const kpis = [
    { label: "投放条数", value: String(total), trend: "本周 +4", up: true },
    {
      label: "总曝光",
      value: fmtCount(totalViews),
      trend: "本周 +180K",
      up: true,
      good: true,
    },
    {
      label: "平均 CPM",
      value: fmtMoney(avgCpm, 2),
      trend: "本周 -$0.18",
      up: false,
      good: true,
    },
    {
      label: "平均 CPE",
      value: fmtMoney(avgCpe, 3),
      trend: "本周 -$0.02",
      up: false,
      good: true,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-[#c5c0b1] bg-[#fffefb] p-4">
            <div className="text-[11px] text-[#939084]">{k.label}</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight text-[#201515] tabular-nums">
              {k.value}
            </div>
            <div
              className={cn(
                "mt-1 flex items-center gap-1 text-[10px]",
                k.good ? "text-[#36342e]" : "text-[#939084]",
              )}
            >
              {k.up !== undefined ? (
                k.up ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )
              ) : (
                <AlertTriangle className="h-3 w-3" />
              )}
              <span>{k.trend}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlacementGrid({
  placements,
  projectNameById,
}: {
  placements: Placement[];
  projectNameById?: Map<string, string>;
}) {
  const { isPlacementDeleted, lastRefreshedAt, refreshPlacements } = useOutreachState();
  const visible = useMemo(
    () => placements.filter((p) => !isPlacementDeleted(p.id)),
    [placements, isPlacementDeleted],
  );
  const sorted = useMemo(
    () => [...visible].sort((a, b) => (a.postedAt < b.postedAt ? 1 : -1)),
    [visible],
  );
  const [refreshing, setRefreshing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const onRefresh = useCallback(() => {
    if (refreshing) return;
    setRefreshing(true);
    // Phase 0：mock 阶段没有真实抓取，仅给出"轮询动效 + 时间戳"。
    // Phase 1+ 接入真实平台抓取后，把 timeout 替换为 service 调用 + invalidate。
    refreshPlacements();
    window.setTimeout(() => setRefreshing(false), 900);
  }, [refreshing, refreshPlacements]);

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div className="text-xs font-medium tracking-wider text-[#939084] uppercase">投放卡片</div>
        <div className="flex items-center gap-3 text-[11px] text-[#939084]">
          {lastRefreshedAt ? (
            <span className="tabular-nums">{fmtRefreshedAt(lastRefreshedAt)} 更新</span>
          ) : null}
          <span>{visible.length} 条</span>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            aria-label="添加追踪"
            title="添加追踪"
            className="inline-flex items-center gap-1 rounded-full border border-[#c5c0b1] bg-[#fffefb] px-2 py-0.5 text-[11px] font-medium text-[#36342e] transition-colors hover:border-[#ff4f00] hover:text-[#ff4f00]"
          >
            <Plus className="h-3 w-3" aria-hidden /> 添加追踪
          </button>
          <button
            type="button"
            onClick={onRefresh}
            aria-label="刷新所有投放卡片"
            title="刷新所有投放卡片"
            className={cn(
              "inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#c5c0b1] bg-[#fffefb] text-[#36342e] transition-colors hover:border-[#ff4f00] hover:text-[#ff4f00]",
              refreshing && "border-[#ff4f00] text-[#ff4f00]",
            )}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          </button>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map((p) => (
          <PlacementCard key={p.id} placement={p} projectName={projectNameById?.get(p.projectId)} />
        ))}
      </div>
      <AddPlacementDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
