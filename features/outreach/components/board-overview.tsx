"use client";

import { Plus } from "lucide-react";

import { BoardSchedule } from "@/features/outreach/components/board-schedule";
import {
  deriveBudgetUsage,
  EMPTY_PROJECT_SUMMARY,
  fmtViews,
  getProjectUpcoming,
  type ProjectSummary,
  type ProjectUpcoming,
  summarizeProject,
} from "@/features/outreach/lib/project-summary";
import {
  formatProjectDeadline,
  getProjectStatusLabel,
  getProjectStatusPillClass,
  type WorkspaceProject,
  useWorkspaceProject,
} from "@/features/project/components/project-context";
import { cn } from "@/lib/utils";

// §3.1 项目概览 — 跨项目鸟瞰视图。
// 这一视图刻意不复述别处已有的指标：
//   - 已建联博主数 / 建联成功率   → 见"建联进度"
//   - 总曝光 / 平均 CPM           → 见"投放表现"
//   - 转化漏斗                    → 见"投放表现"
// 这里保留的只有"全项目总揽"逻辑：
//   ① Portfolio 战略带（项目数 + 跨项目累计建联 / 投放 / 曝光）
//   ② 档期日历（左：日历，右：当日详情）
//   ③ 每项目卡片（基本盘 + 建联 / 投放总数 + 点击展开抽屉）
// 概览页本身不挂 Project Bar（见 outreach/page.tsx），所以这一层没有"当前项目"
// 概念：日历恒为全局视图，项目卡片也不再做"聚焦高亮"。
// 项目卡片整张可点击 → 调 openEditProject 触发已有的项目抽屉，
// 让"概览看大盘 / 抽屉看单项目"形成一条自然的下钻路径。

export function BoardOverview() {
  const { projects, openEditProject, openCreateProject } = useWorkspaceProject();

  const summaries = projects.map((p) => ({
    project: p,
    summary: summarizeProject(p.id),
    upcoming: getProjectUpcoming(p.id),
  }));

  // 跨项目累加：仅 sum 加合，平均互动率（avgEr）按项目数加权后在 PortfolioStrap 自己重算。
  const portfolio = summaries.reduce<ProjectSummary>(
    (acc, { summary }) => ({
      outreachTotal: acc.outreachTotal + summary.outreachTotal,
      outreachSent: acc.outreachSent + summary.outreachSent,
      outreachSuccess: acc.outreachSuccess + summary.outreachSuccess,
      outreachRejected: acc.outreachRejected + summary.outreachRejected,
      placementCount: acc.placementCount + summary.placementCount,
      placementExposureViews: acc.placementExposureViews + summary.placementExposureViews,
      placementSpendUsd: acc.placementSpendUsd + summary.placementSpendUsd,
      placementAvgEr: 0,
      placementGrowthCount: acc.placementGrowthCount + summary.placementGrowthCount,
      placementStableCount: acc.placementStableCount + summary.placementStableCount,
      placementDeclineCount: acc.placementDeclineCount + summary.placementDeclineCount,
    }),
    EMPTY_PROJECT_SUMMARY,
  );

  const runningCount = projects.filter((p) => p.status === "running").length;
  const completedCount = projects.filter((p) => p.status === "completed").length;

  return (
    <div className="space-y-5">
      <PortfolioStrap
        projectsCount={projects.length}
        runningCount={runningCount}
        completedCount={completedCount}
        portfolio={portfolio}
      />

      <BoardSchedule projectId={null} />

      <ProjectGrid
        summaries={summaries}
        onOpenProject={openEditProject}
        onCreateProject={openCreateProject}
      />
    </div>
  );
}

function PortfolioStrap({
  projectsCount,
  runningCount,
  completedCount,
  portfolio,
}: {
  projectsCount: number;
  runningCount: number;
  completedCount: number;
  portfolio: ProjectSummary;
}) {
  const successRate =
    portfolio.outreachSent > 0
      ? Math.round((portfolio.outreachSuccess / portfolio.outreachSent) * 100)
      : 0;
  return (
    <div className="grid gap-4 rounded-2xl border border-[#c5c0b1] bg-[#fffefb] p-5 lg:grid-cols-[1.1fr_3fr] lg:gap-6">
      <div>
        <div className="text-xs font-medium tracking-wider text-[#939084] uppercase">Portfolio</div>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-[#201515] tabular-nums">
          {projectsCount} <span className="text-sm font-medium text-[#939084]">个项目</span>
        </p>
        <p className="mt-1 text-[11px] text-[#939084]">
          {runningCount} 进行中 · {completedCount} 已结束
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StrapCell
          label="累计建联"
          value={String(portfolio.outreachTotal)}
          sub={`已发送 ${portfolio.outreachSent}`}
        />
        <StrapCell
          label="进入合作"
          value={String(portfolio.outreachSuccess)}
          sub={`整体成功率 ${successRate}%`}
        />
        <StrapCell
          label="已投放"
          value={String(portfolio.placementCount)}
          sub={`总花费 $${portfolio.placementSpendUsd.toLocaleString()}`}
        />
        <StrapCell
          label="累计曝光"
          value={fmtViews(portfolio.placementExposureViews)}
          sub="跨平台累计"
        />
      </div>
    </div>
  );
}

function StrapCell({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl bg-[#fffdf9] p-3">
      <div className="text-[10px] tracking-wide text-[#939084] uppercase">{label}</div>
      <div className="mt-1 text-xl font-semibold tracking-tight text-[#201515] tabular-nums">
        {value}
      </div>
      <div className="mt-0.5 text-[10px] text-[#939084]">{sub}</div>
    </div>
  );
}

function ProjectGrid({
  summaries,
  onOpenProject,
  onCreateProject,
}: {
  summaries: {
    project: WorkspaceProject;
    summary: ProjectSummary;
    upcoming: ProjectUpcoming;
  }[];
  onOpenProject: (projectId: string) => void;
  onCreateProject: () => void;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between">
        <div className="text-xs font-medium tracking-wider text-[#939084] uppercase">项目列表</div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <NewProjectCard onCreate={onCreateProject} />
        {summaries.map(({ project, summary, upcoming }) => (
          <ProjectCard
            key={project.id}
            project={project}
            summary={summary}
            upcoming={upcoming}
            onOpen={() => onOpenProject(project.id)}
          />
        ))}
      </div>
    </div>
  );
}

// §3.1 项目列表里固定排在第一格的"新建项目"入口，与侧边栏 ProjectBar 的
// "+ 新建项目" 共享同一条 openCreateProject 通道，弹同一个 ProjectSheet。
function NewProjectCard({ onCreate }: { onCreate: () => void }) {
  return (
    <button
      type="button"
      onClick={onCreate}
      aria-label="新建项目"
      className="group flex min-h-[176px] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#c5c0b1] bg-[#fffdf9] p-4 text-[#939084] transition-colors hover:border-[#ff4f00] hover:bg-[#fff7f4] hover:text-[#ff4f00] focus-visible:ring-2 focus-visible:ring-[#ff4f00]/30 focus-visible:outline-none"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#c5c0b1] bg-[#fffefb] text-[#939084] transition-colors group-hover:border-[#ff4f00] group-hover:text-[#ff4f00]">
        <Plus size={18} aria-hidden />
      </span>
      <span className="text-sm font-semibold text-[#36342e] group-hover:text-[#ff4f00]">
        新建项目
      </span>
      <span className="text-[11px] text-[#939084]">填写产品 / 时间 / 预算 → 一步开建</span>
    </button>
  );
}

function ProjectCard({
  project,
  summary,
  upcoming,
  onOpen,
}: {
  project: WorkspaceProject;
  summary: ProjectSummary;
  upcoming: ProjectUpcoming;
  onOpen: () => void;
}) {
  const successRate =
    summary.outreachSent > 0
      ? Math.round((summary.outreachSuccess / summary.outreachSent) * 100)
      : 0;
  // 若设了目标建联人数，进度条按 已建联 / 目标 计算；否则回落到 已建联 / 总名单。
  const target = project.outreachTarget ?? null;
  const denominator = target && target > 0 ? target : summary.outreachTotal;
  const sendProgress =
    denominator > 0 ? Math.min(100, Math.round((summary.outreachSent / denominator) * 100)) : 0;
  const progressLabel =
    target && target > 0
      ? `${summary.outreachSent}/${target}`
      : `${summary.outreachSent}/${summary.outreachTotal}`;
  const progressHint =
    target && target > 0 ? `目标 ${target} 位 · 已成功 ${summary.outreachSuccess}` : "目标未设置";

  const budget = deriveBudgetUsage(project.budgetAmount, summary.placementSpendUsd);

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`查看项目 ${project.name} 详情`}
      className="group block w-full rounded-2xl border border-[#c5c0b1] bg-[#fffefb] p-4 text-left transition-colors hover:border-[#ff4f00]/45 focus-visible:ring-2 focus-visible:ring-[#ff4f00]/30 focus-visible:outline-none"
    >
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate font-semibold text-[#201515] group-hover:text-[#ff4f00]">
          {project.name}
        </span>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
            getProjectStatusPillClass(project.status),
          )}
        >
          {getProjectStatusLabel(project.status)}
        </span>
      </div>
      <p className="mt-1 text-[11px] text-[#939084]">{formatProjectDeadline(project)}</p>

      <div className="mt-3 space-y-2.5">
        <div>
          <div className="flex items-baseline justify-between text-[11px]">
            <span className="text-[#939084]">建联</span>
            <span className="font-medium text-[#201515] tabular-nums">{progressLabel}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#eceae3]">
            <div
              className="h-full rounded-full bg-[#ff4f00]"
              style={{ width: `${sendProgress}%` }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-[#939084]">
            <span>{progressHint}</span>
            {summary.outreachSent > 0 ? <span>成功率 {successRate}%</span> : null}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-[11px]">
          <BudgetCell budget={budget} />
          <MetricCell
            label="进入合作"
            value={String(summary.outreachSuccess)}
            sub={summary.outreachSent > 0 ? `转化 ${successRate}%` : "—"}
          />
          <UpcomingCell upcoming={upcoming} />
        </div>
      </div>
    </button>
  );
}

// 三格统一骨架：label（顶部，左对齐）/ value（主数，左对齐）/ sub（脚注，左对齐 + truncate + tabular）。
// 不挂背景 / 内边距 —— 直接 transparent 列。这样首格 "预算" 的左边缘与卡片上方
// 的 "建联" / "截止 ..." 文字共用同一条左对齐基线，不会因为内嵌 cell padding
// 视觉上向右缩进。tabular-nums 同时落在 value 和 sub 上，让 `42%` 与
// `$2,120 / $5,000` 的数字宽度对齐，避免 `$` 字形带来的视觉偏移。
function MetricCell({
  label,
  value,
  sub,
  valueClass,
}: {
  label: string;
  value: string;
  sub: string;
  valueClass?: string;
}) {
  return (
    <div className="min-w-0 text-left">
      <div className="text-[10px] text-[#939084]">{label}</div>
      <div
        className={cn(
          "mt-0.5 text-sm leading-tight font-semibold tabular-nums",
          valueClass ?? "text-[#201515]",
        )}
      >
        {value}
      </div>
      <div className="mt-0.5 truncate text-[10px] text-[#939084] tabular-nums">{sub}</div>
    </div>
  );
}

// 预算消耗格 —— 与 MetricCell 共用骨架，去掉了原本独占的进度条。
// 主数用利用率（%），副标签写绝对金额；超 80% 文字转琥珀，超 100% 转橙，给业务"该收手了"信号。
function BudgetCell({ budget }: { budget: ReturnType<typeof deriveBudgetUsage> }) {
  if (!budget.valid) {
    return (
      <MetricCell label="预算" value="未设置" sub="去基础信息填" valueClass="text-[#939084]" />
    );
  }
  const tone = budget.tone;
  const valueClass =
    tone === "over" ? "text-[#ff4f00]" : tone === "warn" ? "text-[#a76b1f]" : "text-[#201515]";
  return (
    <MetricCell
      label="预算"
      value={`${budget.ratioPct}%`}
      sub={`$${Math.round(budget.spentUsd).toLocaleString()} / $${Math.round(
        budget.budgetUsd,
      ).toLocaleString()}`}
      valueClass={valueClass}
    />
  );
}

// 本周待办格 —— 待发布 + 待跟进 + "其他" 事件合计。
// 主数字是合计，副标签拆分给运营快速读懂"今天/本周要做什么"。
function UpcomingCell({ upcoming }: { upcoming: ProjectUpcoming }) {
  if (upcoming.totalCount === 0) {
    return <MetricCell label="本周待办" value="0" sub="无安排" valueClass="text-[#939084]" />;
  }
  const parts: string[] = [];
  if (upcoming.publishCount > 0) parts.push(`${upcoming.publishCount} 发布`);
  if (upcoming.followupCount > 0) parts.push(`${upcoming.followupCount} 跟进`);
  if (upcoming.eventCount > 0) parts.push(`${upcoming.eventCount} 其他`);
  return (
    <MetricCell
      label="本周待办"
      value={String(upcoming.totalCount)}
      sub={parts.join(" · ")}
      valueClass="text-[#ff4f00]"
    />
  );
}
