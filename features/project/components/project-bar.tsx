"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, MoreHorizontal, Pencil } from "lucide-react";

import {
  formatProjectBudget,
  getProjectStatusDotClass,
  getProjectStatusLabel,
  getProjectStatusPillClass,
  useWorkspaceProject,
  type WorkspaceProject,
} from "@/features/project/components/project-context";

// §2.3.1 visibility rules. Returns null when the bar must hide entirely.
function shouldShowProjectBar(pathname: string, searchParams: URLSearchParams) {
  if (pathname === "/workspace") return false;
  if (pathname === "/workspace/discovery") return false;
  if (pathname.startsWith("/workspace/library")) return true;
  if (pathname.startsWith("/workspace/settings")) return false;
  if (pathname.startsWith("/workspace/outreach")) {
    const tab = searchParams.get("tab") ?? "board";
    if (tab === "inbox" || tab === "templates") return false;
    return true;
  }
  return true;
}

// 状态 pill 样式来自 project-context 的全局 STATUS_STYLE（getProjectStatusPillClass /
// getProjectStatusDotClass）。本地不再维护映射，避免和概览卡片 / 抽屉头部漂移。

// 把 endDate 拆成"截止 YYYY-MM-DD"和"剩 N 天"两段，方便用 · 分隔。
function describeDeadline(project: WorkspaceProject) {
  if (!project.endDate) {
    return { dateLabel: "未设置截止日期", daysLabel: null as string | null };
  }
  const end = new Date(project.endDate);
  if (Number.isNaN(end.getTime())) {
    return { dateLabel: `截止 ${project.endDate}`, daysLabel: null as string | null };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = end.getTime() - today.getTime();
  const days = Math.ceil(diffMs / 86_400_000);
  const dateLabel = `截止 ${project.endDate}`;
  let daysLabel: string | null = null;
  if (days > 0) daysLabel = `剩 ${days} 天`;
  else if (days === 0) daysLabel = "今日到期";
  else daysLabel = `已逾期 ${Math.abs(days)} 天`;
  return { dateLabel, daysLabel };
}

export function WorkspaceProjectBar({ pathname }: { pathname: string }) {
  const searchParams = useSearchParams();
  const {
    projects,
    currentProject,
    currentProjectId,
    isAllProjects,
    selectProject,
    selectAllProjects,
    openCreateProject,
    openEditProject,
  } = useWorkspaceProject();

  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    function handleClick(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [pickerOpen]);

  if (!shouldShowProjectBar(pathname, searchParams)) {
    return null;
  }

  const statusPill = getProjectStatusPillClass(currentProject.status);
  const statusDot = getProjectStatusDotClass(currentProject.status);
  const statusLabel = getProjectStatusLabel(currentProject.status);
  const { dateLabel, daysLabel } = describeDeadline(currentProject);
  const budgetLabel = formatProjectBudget(currentProject);

  return (
    <div className="mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative" ref={pickerRef}>
              <button
                type="button"
                onClick={() => setPickerOpen((prev) => !prev)}
                className="flex min-w-0 items-center gap-1.5 rounded-md text-left transition-colors hover:opacity-80"
              >
                <span className="min-w-0 truncate text-[26px] leading-[1.15] font-semibold tracking-[-0.02em] text-[#201515] sm:text-[28px]">
                  {isAllProjects ? "全部项目" : currentProject.name}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-[#939084]" />
              </button>

              {pickerOpen ? (
                <div className="absolute top-full left-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-[#c5c0b1] bg-[#fffefb]">
                  <div className="max-h-80 overflow-y-auto py-1">
                    <button
                      type="button"
                      onClick={() => {
                        selectAllProjects();
                        setPickerOpen(false);
                      }}
                      className={`flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors ${
                        isAllProjects ? "bg-[#fffdf9]" : "hover:bg-[#eceae3]"
                      }`}
                    >
                      <span
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#c5c0b1]"
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-[#201515]">
                          全部项目
                        </span>
                        <span className="block truncate text-[11px] text-[#939084]">
                          跨项目总览
                        </span>
                      </span>
                    </button>
                    <div className="mx-3 my-1 border-t border-[#eceae3]" aria-hidden />
                    {projects.map((project) => {
                      const dot = getProjectStatusDotClass(project.status);
                      const isCurrent = !isAllProjects && project.id === currentProjectId;
                      const deadline = project.endDate ? `截止 ${project.endDate}` : "未设截止";
                      const budget = formatProjectBudget(project);
                      return (
                        <button
                          type="button"
                          key={project.id}
                          onClick={() => {
                            selectProject(project.id);
                            setPickerOpen(false);
                          }}
                          className={`flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors ${
                            isCurrent ? "bg-[#fffdf9]" : "hover:bg-[#eceae3]"
                          }`}
                        >
                          <span
                            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`}
                            aria-hidden
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-semibold text-[#201515]">
                              {project.name}
                            </span>
                            <span className="block truncate text-[11px] text-[#939084]">
                              {deadline} · {budget}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPickerOpen(false);
                      openCreateProject();
                    }}
                    className="flex w-full items-center gap-1.5 border-t border-[#eceae3] px-3 py-2.5 text-[12px] font-medium text-[#ff4f00] hover:bg-[#fffdf9]"
                  >
                    + 新建项目
                  </button>
                </div>
              ) : null}
            </div>

            {!isAllProjects ? (
              <span
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium ${statusPill}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${statusDot}`} aria-hidden />
                {statusLabel}
              </span>
            ) : null}
          </div>

          {!isAllProjects ? (
            <div className="flex flex-wrap items-center gap-x-1.5 text-[13px] text-[#939084]">
              <span>{dateLabel}</span>
              {daysLabel ? (
                <>
                  <span aria-hidden>·</span>
                  <span>{daysLabel}</span>
                </>
              ) : null}
              <span aria-hidden>·</span>
              <span>预算 {budgetLabel}</span>
            </div>
          ) : null}
        </div>

        {!isAllProjects ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => openEditProject(currentProject.id)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#c5c0b1] bg-[#fffefb] px-3 py-1.5 text-[13px] font-medium text-[#201515] transition-colors hover:bg-[#fffdf9]"
            >
              <Pencil className="h-3.5 w-3.5" />
              编辑
            </button>
            <button
              type="button"
              aria-label="更多操作"
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[#c5c0b1] bg-[#fffefb] text-[#36342e] transition-colors hover:bg-[#fffdf9]"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
