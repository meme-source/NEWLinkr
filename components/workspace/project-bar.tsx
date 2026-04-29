"use client";

import { CalendarRange, ChevronDown, Coins, Pencil, Plus, Target } from "lucide-react";

import {
  formatProjectBudget,
  formatProjectTimeline,
  useWorkspaceProject,
} from "@/components/workspace/project-context";

function getRouteGuidance(pathname: string) {
  if (pathname.startsWith("/workspace-demo/library")) {
    return "当前项目决定你在博主库里看到的名单、导入归属、移入项目和批量建联范围。";
  }
  if (pathname.startsWith("/workspace-demo/outreach")) {
    return "当前项目决定邮件任务、收件箱线索、发送进度和建联统计的查看范围。";
  }
  if (pathname.startsWith("/workspace-demo/settings")) {
    return "在这里补全项目资料后，博主发现、博主库和建联中心都会共用这一套项目配置。";
  }
  return "当前项目会承接搜索、收藏、No 标记、相似达人查找和后续建联动作，确保每一步都有明确归属。";
}

export function WorkspaceProjectBar({ pathname }: { pathname: string }) {
  const {
    projects,
    currentProject,
    currentProjectId,
    selectProject,
    openCreateProject,
    openEditProject,
  } = useWorkspaceProject();

  const guidance = getRouteGuidance(pathname);

  return (
    <div className="mb-5 rounded-[22px] border border-[#e8e6dc] bg-[linear-gradient(135deg,#ffffff_0%,#faf9f5_58%,#f5f1e8_100%)] px-4 py-3.5 shadow-[0_8px_28px_-20px_rgba(20,20,19,0.18)]">
      {/* Top row: left actions + right key facts */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {/* Icon trigger with tooltip */}
          <div className="group/tip relative inline-flex shrink-0 items-center text-[#c96442] cursor-default select-none">
            <Target className="h-3.5 w-3.5 animate-[pulse_2s_ease-in-out_infinite]" />
            <span
              role="tooltip"
              className="pointer-events-none absolute left-0 top-full z-50 mt-2 w-64 rounded-[12px] border border-[#e8e6dc] bg-white px-3 py-2 text-[12px] leading-[1.6] text-[#4d4c48] opacity-0 shadow-[0_12px_30px_-18px_rgba(77,76,72,0.3)] transition-opacity duration-150 group-hover/tip:opacity-100"
            >
              {guidance}
            </span>
          </div>

          <div className="flex min-w-0 items-center">
            <div className="flex min-w-0 items-center rounded-full border border-[#e8e6dc] bg-white px-2.5 py-1.5 shadow-[0_8px_20px_-18px_rgba(20,20,19,0.32)]">
              <span className="min-w-0 truncate text-[13px] font-semibold leading-tight tracking-[-0.01em] text-[#141413] sm:text-[14px]">
                {currentProject.name}
              </span>

              <div className="relative ml-1.5 shrink-0 pl-1.5 before:absolute before:left-0 before:top-1/2 before:h-4 before:w-px before:-translate-y-1/2 before:bg-[#ece8de]">
                <div className="pointer-events-none flex h-6 w-6 items-center justify-center rounded-full text-[#87867f] transition-colors">
                  <ChevronDown className="h-3.5 w-3.5" />
                </div>
                <select
                  value={currentProjectId}
                  onChange={(event) => selectProject(event.target.value)}
                  aria-label="切换项目"
                  className="absolute inset-0 cursor-pointer appearance-none rounded-full opacity-0 outline-none"
                >
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Edit current project */}
          <div className="group/edit relative shrink-0">
            <button
              type="button"
              onClick={() => openEditProject(currentProject.id)}
              aria-label="编辑当前项目"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-[#e8e6dc] bg-white text-[#87867f] transition-colors hover:border-[#d1cfc5] hover:text-[#4d4c48]"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#141413] px-2 py-0.5 text-[11px] text-white opacity-0 transition-opacity group-hover/edit:opacity-100">
              编辑项目
            </span>
          </div>

          {/* New project */}
          <div className="group/new relative shrink-0">
            <button
              type="button"
              onClick={() => openCreateProject("quick")}
              aria-label="新建项目"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-[#e8e6dc] bg-white text-[#87867f] transition-colors hover:border-[#d1cfc5] hover:text-[#4d4c48]"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#141413] px-2 py-0.5 text-[11px] text-white opacity-0 transition-opacity group-hover/new:opacity-100">
              新建项目
            </span>
          </div>
        </div>

        <div className="shrink-0 space-y-1">
          <span className="inline-flex items-center gap-1 rounded-full border border-[#e8e6dc] bg-white px-2.5 py-0.5 text-[12px] text-[#87867f]">
            <CalendarRange className="h-3 w-3 shrink-0" />
            {formatProjectTimeline(currentProject)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-[#e8e6dc] bg-white px-2.5 py-0.5 text-[12px] text-[#87867f]">
            <Coins className="h-3 w-3 shrink-0" />
            {formatProjectBudget(currentProject)}
          </span>
        </div>
      </div>

      {/* Bottom row: meta tags */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {currentProject.productName ? (
          <span className="rounded-full border border-[#e8e6dc] bg-white px-2.5 py-0.5 text-[12px] font-medium text-[#4d4c48]">
            {currentProject.productName}
          </span>
        ) : null}
        {currentProject.category ? (
          <span className="rounded-full border border-[#e8e6dc] bg-white px-2.5 py-0.5 text-[12px] text-[#87867f]">
            {currentProject.category}
          </span>
        ) : null}
        {currentProject.brand ? (
          <span className="rounded-full border border-[#e8e6dc] bg-white px-2.5 py-0.5 text-[12px] text-[#87867f]">
            {currentProject.brand}
          </span>
        ) : null}
      </div>
    </div>
  );
}
