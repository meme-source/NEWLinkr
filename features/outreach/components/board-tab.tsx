"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LayoutDashboard, Send, TrendingUp } from "lucide-react";
import { useMemo, type ComponentType, type SVGProps } from "react";

import { BoardOverview } from "@/features/outreach/components/board-overview";
import { BoardPerformance } from "@/features/outreach/components/board-performance";
import { BoardProgress } from "@/features/outreach/components/board-progress";
import { summarizeProject } from "@/features/outreach/lib/project-summary";
import { useWorkspaceProject } from "@/features/project/components/project-context";
import { cn } from "@/lib/utils";

// §3.1 / §3.2 / §3.3 — board has three views, switched via ?view=.
export type BoardView = "overview" | "progress" | "performance";

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>;

const VIEWS: { view: BoardView; label: string; icon: IconComponent }[] = [
  { view: "overview", label: "项目概览", icon: LayoutDashboard },
  { view: "progress", label: "建联进度", icon: Send },
  { view: "performance", label: "投放表现", icon: TrendingUp },
];

// 计数徽章数据：直接复用 summarizeProject 逐项目聚合，不引入新接口。
function useBoardCounts(): Record<BoardView, number> {
  const { projects } = useWorkspaceProject();
  return useMemo(() => {
    const summaries = projects.map((p) => summarizeProject(p.id));
    return {
      overview: projects.length,
      progress: summaries.reduce((s, p) => s + p.outreachTotal, 0),
      performance: summaries.reduce((s, p) => s + p.placementCount, 0),
    };
  }, [projects]);
}

export function BoardViewSwitcher({ current }: { current: BoardView }) {
  const counts = useBoardCounts();

  return (
    // sticky 外壳：layout 已让 outreach 路径下 main 不带 padding，所以这里
    // top-0 直接贴 main 视口顶端，无缝。
    // 关键点：
    //   ① top-0 + main 无 padding → 真正贴 viewport 顶
    //   ② isolate 强制 stacking context，z-50 高于任何兄弟节点
    //   ③ bg-[#FFFDF9] 与 main 的 var(--ws-bg) 同色，无色差
    //   ④ px-6 让底边线 + 内容左右对齐 main 其他内容；底边作 Zaiper underline tab 通线
    //   ⑤ py-2 给 nav 上下呼吸（避免 Tab 文字紧贴底边线）
    <div
      className={cn(
        "sticky top-0 isolate z-50 mb-8",
        "border-b border-[#ECE9DF] bg-[#FFFDF9] px-6 py-2",
      )}
    >
      <nav
        role="tablist"
        aria-label="项目看板视图切换"
        className="flex items-center justify-center gap-2"
      >
        {VIEWS.map((it) => {
          const isActive = current === it.view;
          const Icon = it.icon;
          const count = counts[it.view];

          return (
            <Link
              key={it.view}
              href={`/workspace/outreach?tab=board&view=${it.view}`}
              role="tab"
              aria-selected={isActive}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                // -my-2 让 Link 撑满 sticky 容器内部（容器 py-2），这样底端 border
                // 就能直接被 Link 内的 absolute underline 覆盖。
                "group relative -my-2 inline-flex items-center gap-2.5 px-5 py-4 text-[14px] transition-colors duration-150",
                "rounded-md focus-visible:ring-2 focus-visible:ring-[#FF4F00]/30 focus-visible:outline-none",
                isActive
                  ? "font-semibold text-[#201515]"
                  : "font-medium text-[#88827E] hover:text-[#201515]",
              )}
            >
              <Icon
                size={16}
                strokeWidth={1.8}
                aria-hidden
                className={cn(
                  "transition-colors duration-150",
                  isActive ? "text-[#201515]" : "text-[#88827E] group-hover:text-[#201515]",
                )}
              />
              <span>{it.label}</span>
              <span
                className={cn(
                  "inline-flex min-w-[22px] items-center justify-center rounded-full px-1.5 py-[1px]",
                  "text-[11px] font-semibold tabular-nums transition-colors duration-150",
                  isActive
                    ? "bg-[#FFEEE5] text-[#FF4F00]"
                    : "bg-[#F5F3EB] text-[#88827E] group-hover:bg-[#ECE9DF]",
                )}
              >
                {count}
              </span>

              {/* 激活下划线 / hover 预览下划线 —— 绝对定位贴在 Link 底端（也就是
                  sticky 容器的底端，刚好覆盖 1px border-b 的位置），inset-x-0
                  保证下划线覆盖整条 Link 宽度，与文字水平居中对齐 */}
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-x-0 bottom-0 h-[3px] rounded-t-full transition-all duration-200",
                  isActive
                    ? "bg-[#FF4F00] opacity-100"
                    : "bg-[#88827E] opacity-0 group-hover:opacity-30",
                )}
              />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function BoardTab() {
  const searchParams = useSearchParams();
  const view = (searchParams.get("view") as BoardView) ?? "overview";
  return (
    <div>
      {view === "overview" ? <BoardOverview /> : null}
      {view === "progress" ? <BoardProgress /> : null}
      {view === "performance" ? <BoardPerformance /> : null}
    </div>
  );
}
