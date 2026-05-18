"use client";

import { ChevronRight, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  deriveBudgetUsage,
  type ProjectSummary,
  type ProjectUpcoming,
} from "@/features/outreach/lib/project-summary";
import {
  formatProjectDeadline,
  getProjectStatusLabel,
  getProjectStatusPillClass,
  type WorkspaceProject,
} from "@/features/project/components/project-context";
import { cn } from "@/lib/utils";

// §3.1.B 项目方块卡 —— 工作台概览「项目列表」的卡片形态（列数由
// board-overview 的 auto-fill 网格决定）。承载与原紧凑表格行相同的信息：
// 项目名 / 状态 / 建联进度 / 预算 / 本周待办 / 截止。整卡可点 → openEditProject。

type ProgressTone = "brand" | "success" | "warn" | "danger";

function ProgressBar({ pct, tone }: { pct: number; tone: ProgressTone }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const fillClass =
    tone === "success"
      ? "bg-[#2EA343]"
      : tone === "warn"
        ? "bg-[#F59E0B]"
        : tone === "danger"
          ? "bg-[#DC2626]"
          : "bg-[#FF4F00]";
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-[#ECE9DF]">
      <div className={cn("h-full rounded-full", fillClass)} style={{ width: `${clamped}%` }} />
    </div>
  );
}

function cardSubLabel(project: WorkspaceProject): string {
  const parts: string[] = [];
  if (project.productName?.trim()) parts.push(project.productName.trim());
  if (project.brand?.trim()) parts.push(project.brand.trim());
  if (parts.length === 0) return "未填写产品 · 待补充基础信息";
  return parts.join(" · ");
}

export function ProjectOverviewCard({
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
  const target = project.outreachTarget ?? null;
  const denominator = target && target > 0 ? target : summary.outreachTotal;
  const sendPct =
    denominator > 0 ? Math.min(999, Math.round((summary.outreachSent / denominator) * 100)) : 0;
  const sendLabel = `${summary.outreachSent}/${denominator || summary.outreachTotal}`;

  const budget = deriveBudgetUsage(project.budgetAmount, summary.placementSpendUsd);

  return (
    <Button
      unstyled
      type="button"
      onClick={onOpen}
      aria-label={`查看项目 ${project.name} 详情`}
      className="group flex h-full w-full flex-col rounded-lg border border-[#ECE9DF] bg-[#FFFDF9] p-6 text-left transition-colors hover:border-[#D8D3C4] hover:bg-[#FBF9F3] focus-visible:ring-2 focus-visible:ring-[#ff4f00]/30 focus-visible:-outline-offset-2 focus-visible:outline-none"
    >
      {/* 头部：项目名 + 状态徽标（状态已由右侧徽标表达，不再用左侧色点） */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-[#201515] group-hover:text-[#FF4F00]">
            {project.name}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-[#88827E]">{cardSubLabel(project)}</p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium tracking-[0.04em] uppercase",
            getProjectStatusPillClass(project.status),
          )}
        >
          {getProjectStatusLabel(project.status)}
        </span>
      </div>

      {/* 进度区：建联 + 预算 */}
      <div className="mt-5 space-y-3.5">
        <div>
          <div className="mb-1.5 flex items-baseline justify-between text-[11px]">
            <span className="text-[#88827E]">建联进度</span>
            <span className="tabular-nums">
              <span className="font-semibold text-[#201515]">{sendLabel}</span>
              <span
                className={cn(
                  "ml-1.5 font-medium",
                  sendPct >= 100 ? "text-[#2EA343]" : "text-[#88827E]",
                )}
              >
                {sendPct}%
              </span>
            </span>
          </div>
          <ProgressBar pct={sendPct} tone={sendPct >= 100 ? "success" : "brand"} />
        </div>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between text-[11px]">
            <span className="text-[#88827E]">预算</span>
            {budget.valid ? (
              <span className="tabular-nums">
                <span className="font-semibold text-[#201515]">
                  ${Math.round(budget.spentUsd).toLocaleString()} / $
                  {Math.round(budget.budgetUsd).toLocaleString()}
                </span>
                <span
                  className={cn(
                    "ml-1.5 font-medium",
                    budget.tone === "over"
                      ? "text-[#DC2626]"
                      : budget.tone === "warn"
                        ? "text-[#F59E0B]"
                        : "text-[#88827E]",
                  )}
                >
                  {budget.ratioPct}%
                </span>
              </span>
            ) : (
              <span className="text-[#B5B0A8] tabular-nums">未设置</span>
            )}
          </div>
          {budget.valid ? (
            <ProgressBar
              pct={budget.ratioPct}
              tone={budget.tone === "over" ? "danger" : budget.tone === "warn" ? "warn" : "brand"}
            />
          ) : (
            <div className="h-1 w-full rounded-full bg-[#ECE9DF]" />
          )}
        </div>
      </div>

      {/* 底部：本周待办 + 截止 + 箭头 */}
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#ECE9DF] pt-4">
        <div className="flex min-w-0 items-center gap-2">
          {upcoming.totalCount > 0 ? (
            <span className="inline-flex shrink-0 items-center rounded-full bg-[#FFEEE5] px-2.5 py-0.5 text-[11px] font-bold text-[#FF4F00] tabular-nums">
              本周 {upcoming.totalCount} 项
            </span>
          ) : (
            <span className="inline-flex shrink-0 items-center rounded-full bg-[#ECE9DF] px-2.5 py-0.5 text-[11px] font-medium text-[#B5B0A8]">
              本周无待办
            </span>
          )}
          <span
            className={cn(
              "truncate text-[11px] tabular-nums",
              project.endDate ? "text-[#88827E]" : "text-[#B5B0A8]",
            )}
          >
            {formatProjectDeadline(project)}
          </span>
        </div>
        <ChevronRight
          size={14}
          aria-hidden
          className="shrink-0 text-[#B5B0A8] transition-colors group-hover:text-[#201515]"
        />
      </div>
    </Button>
  );
}

// 「新建项目」卡 —— 永远排在项目网格第一位（见 board-overview 的 ProjectTable）。
// 虚线边框 + 居中 CTA，与项目卡同高（h-full），视觉上区分于实体项目卡。
export function NewProjectCard({ onCreate }: { onCreate: () => void }) {
  return (
    <Button
      unstyled
      type="button"
      onClick={onCreate}
      aria-label="新建项目"
      className="group flex h-full min-h-[200px] w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[#D8D3C4] bg-[#FBF9F3] p-6 text-center transition-colors hover:border-[#FF4F00] hover:bg-[#FFF4EE] focus-visible:ring-2 focus-visible:ring-[#ff4f00]/30 focus-visible:-outline-offset-2 focus-visible:outline-none"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#ECE9DF] bg-[#FFFDF9] text-[#88827E] transition-colors group-hover:border-[#FF4F00] group-hover:bg-[#FF4F00] group-hover:text-white">
        <Plus size={20} aria-hidden />
      </span>
      <span className="text-[15px] font-semibold text-[#201515] group-hover:text-[#FF4F00]">
        新建项目
      </span>
      <span className="max-w-[210px] text-[11px] text-[#88827E]">
        填写产品 / 时间 / 预算，开始建联与投放跟进
      </span>
    </Button>
  );
}
