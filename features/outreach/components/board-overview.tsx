"use client";

import { BoardSchedule } from "@/features/outreach/components/board-schedule";
import {
  NewProjectCard,
  ProjectOverviewCard,
} from "@/features/outreach/components/project-overview-card";
import {
  EMPTY_PROJECT_SUMMARY,
  fmtViews,
  getProjectUpcoming,
  type ProjectSummary,
  type ProjectUpcoming,
  summarizeProject,
} from "@/features/outreach/lib/project-summary";
import {
  type WorkspaceProject,
  useWorkspaceProject,
} from "@/features/project/components/project-context";
import { cn } from "@/lib/utils";

// §3.1 工作台概览 — Zapier 设计语言下的"密集工作台"形态。
// 三段式（不再套外层卡片，cream bg 自然分段）：
//   ① Hero + 5 列 stat row（PORTFOLIO 战略带）
//   ② BoardSchedule（projectId=null，全局视图，自带 card shell）
//   ③ PROJECTS 项目方块卡网格（首张卡 = 新建项目；点击项目卡 → openEditProject 抽屉）
// 视觉换皮，handler / 路由 / 数据源不动。

// TODO(zaiper-overview): stat 趋势对比需要后端补 monthly diff。
// 目前 trend 一律传 null，UI 在 null 分支下只渲染主数 + meta，不显示趋势行。
// 等 summarizeProject 接月对比能力后，再传 { value, label, tone }。
type TrendTone = "up" | "down" | "flat";

interface TrendDelta {
  label: string;
  tone: TrendTone;
}

interface StatItem {
  label: string;
  value: string;
  unit?: string;
  meta: string;
  delta: TrendDelta | null;
}

export function BoardOverview() {
  const { projects, openEditProject, openCreateProject } = useWorkspaceProject();

  const summaries = projects.map((p) => ({
    project: p,
    summary: summarizeProject(p.id),
    upcoming: getProjectUpcoming(p.id),
  }));

  // 跨项目累加：仅 sum 加合，平均互动率（avgEr）按项目数加权后在消费侧自己重算。
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
  const draftCount = projects.filter((p) => p.status === "draft").length;

  const successRate =
    portfolio.outreachSent > 0
      ? Math.round((portfolio.outreachSuccess / portfolio.outreachSent) * 100)
      : 0;

  const stats: StatItem[] = [
    {
      label: "累计建联",
      value: portfolio.outreachTotal.toLocaleString(),
      meta: `已发送 ${portfolio.outreachSent} · 待回复 ${Math.max(
        0,
        portfolio.outreachTotal - portfolio.outreachSent,
      )}`,
      delta: null,
    },
    {
      label: "已投放",
      value: portfolio.placementCount.toLocaleString(),
      meta: `总花费 $${portfolio.placementSpendUsd.toLocaleString()}`,
      delta: null,
    },
    {
      label: "进入合作",
      value: portfolio.outreachSuccess.toLocaleString(),
      meta: `转化率 ${successRate}%`,
      delta: null,
    },
    {
      label: "累计曝光",
      value: fmtViews(portfolio.placementExposureViews),
      meta: "跨平台累计",
      delta: null,
    },
    {
      label: "项目",
      value: projects.length.toLocaleString(),
      meta: `${runningCount} 进行中 · ${completedCount} 结束`,
      delta: null,
    },
  ];

  return (
    <div className="space-y-10">
      <PortfolioHero stats={stats} />

      <BoardSchedule projectId={null} />

      <ProjectTable
        summaries={summaries}
        runningCount={runningCount}
        draftCount={draftCount}
        onOpenProject={openEditProject}
        onCreateProject={openCreateProject}
      />
    </div>
  );
}

// §3.1.A Hero + 5-column stat row.
// 不套卡片：靠 #FFFDF9 页面 bg + 上下两道 #ECE9DF 横线分段。
function PortfolioHero({ stats }: { stats: StatItem[] }) {
  return (
    <section>
      <div className="mb-9 flex items-end justify-between">
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium tracking-[0.12em] text-[#88827E] uppercase">
            Portfolio
          </p>
          <h1 className="text-3xl font-bold tracking-[-0.025em] text-[#201515]">工作台概览</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* TODO(zaiper-overview): "对比 上月" 切换需接 monthly diff，目前是静态展示。 */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ECE9DF] bg-[#F5F3EB] px-3 py-1 text-[11px] font-medium tracking-[0.04em] text-[#201515]">
            对比 上月
          </span>
          <span className="text-xs text-[#88827E]">实时数据</span>
        </div>
      </div>

      <ul className="grid grid-cols-2 border-y border-[#c5c0b1] sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat, index) => (
          <li
            key={stat.label}
            className={cn(
              "px-7 py-[22px]",
              index < stats.length - 1 && "lg:border-r lg:border-[#c5c0b1]",
            )}
          >
            <div className="text-[12px] text-[#939084]">{stat.label}</div>
            <div className="mt-3.5 flex items-baseline gap-1.5">
              <span className="text-[40px] leading-none font-semibold tracking-tight text-[#201515] tabular-nums">
                {stat.value}
              </span>
              {stat.unit ? (
                <span className="text-[16px] font-medium text-[#939084]">{stat.unit}</span>
              ) : null}
            </div>
            <div className="mt-3.5 text-[12px] text-[#939084]">
              {stat.delta ? (
                <span className="mr-2 inline-flex items-center gap-1">
                  <span
                    className={cn("font-semibold tabular-nums", trendToneClass(stat.delta.tone))}
                  >
                    {stat.delta.label}
                  </span>
                  <span>vs 上月</span>
                </span>
              ) : null}
              <span>{stat.meta}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function trendToneClass(tone: TrendTone): string {
  if (tone === "up") return "text-[#2EA343]";
  if (tone === "down") return "text-[#DC2626]";
  return "text-[#88827E]";
}

// §3.1.B 项目方块卡网格 —— auto-fill 自适应列数。卡片本体见 project-overview-card.tsx。
function ProjectTable({
  summaries,
  runningCount,
  draftCount,
  onOpenProject,
  onCreateProject,
}: {
  summaries: {
    project: WorkspaceProject;
    summary: ProjectSummary;
    upcoming: ProjectUpcoming;
  }[];
  runningCount: number;
  draftCount: number;
  onOpenProject: (projectId: string) => void;
  onCreateProject: () => void;
}) {
  const total = summaries.length;

  return (
    <section className="space-y-5">
      <div className="space-y-1.5">
        <p className="text-[11px] font-medium tracking-[0.12em] text-[#88827E] uppercase">
          Projects
        </p>
        <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#201515]">项目列表</h2>
        <p className="text-xs text-[#88827E]">
          {total} 个 · {runningCount} 进行中 · {draftCount} 草稿
        </p>
      </div>

      {/* 「新建项目」永远是网格第一张卡；其后才是实体项目卡。
          auto-fill + 固定 minmax：卡片宽度 / 间距恒定，列数随视口宽度自适应。 */}
      <ul role="list" className="grid grid-cols-[repeat(auto-fill,minmax(420px,1fr))] gap-4">
        <li>
          <NewProjectCard onCreate={onCreateProject} />
        </li>
        {summaries.map(({ project, summary, upcoming }) => (
          <li key={project.id}>
            <ProjectOverviewCard
              project={project}
              summary={summary}
              upcoming={upcoming}
              onOpen={() => onOpenProject(project.id)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
