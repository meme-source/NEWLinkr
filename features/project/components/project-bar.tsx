"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Archive, ChevronDown, Copy, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  formatProjectBudget,
  getProjectDeadlineParts,
  getProjectStatusBadge,
  useWorkspaceProject,
} from "@/features/project/components/project-context";
import { resolveWorkspaceBreadcrumb } from "@/features/workspace-shell/lib/breadcrumb";
import { cn } from "@/lib/utils";

// §2.3.1 visibility rules. Returns null when the bar must hide entirely.
function shouldShowProjectBar(pathname: string, searchParams: URLSearchParams) {
  if (pathname === "/workspace/discovery") return false;
  if (pathname.startsWith("/workspace/library")) return true;
  if (pathname.startsWith("/workspace/settings")) return false;
  if (pathname.startsWith("/workspace/outreach")) {
    const tab = searchParams.get("tab") ?? "board";
    if (tab === "inbox" || tab === "templates") return false;
    if (tab === "board") {
      const view = searchParams.get("view") ?? "overview";
      const scope = searchParams.get("scope") ?? "current";
      // 全部项目视图: hide bar; the view itself renders an inline notice instead.
      if (view === "overview" && scope === "all") return false;
      return true;
    }
  }
  return true;
}

// Time progress is derived from project dates when available; budget burn
// is still a static placeholder until the spend signal is wired up.
function getTimeProgress(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) return null;
  const now = Date.now();
  if (now <= startMs) return 0;
  if (now >= endMs) return 100;
  return Math.round(((now - startMs) / (endMs - startMs)) * 100);
}

export function WorkspaceProjectBar({ pathname }: { pathname: string }) {
  const searchParams = useSearchParams();
  const {
    projects,
    currentProject,
    currentProjectId,
    selectProject,
    openCreateProject,
    openEditProject,
  } = useWorkspaceProject();

  const segments = useMemo(
    () => resolveWorkspaceBreadcrumb(pathname, searchParams),
    [pathname, searchParams],
  );

  if (!shouldShowProjectBar(pathname, searchParams)) {
    return null;
  }

  const badge = getProjectStatusBadge(currentProject.status);
  const { endDate, daysRemaining } = getProjectDeadlineParts(currentProject);
  const budget = formatProjectBudget(currentProject);
  const hasBudget = budget !== "未设置预算";
  const timeProgress = getTimeProgress(currentProject.startDate, currentProject.endDate);
  // Budget burn placeholder — surfaces a real signal once spend is tracked.
  const budgetBurn = hasBudget ? 51 : null;

  return (
    <header className="mb-4 space-y-3">
      {segments.length > 0 ? (
        <Breadcrumb>
          <BreadcrumbList className="text-warm-gray text-xs">
            {segments.map((seg, idx) => {
              const isLast = idx === segments.length - 1;
              return (
                <span key={`${seg.label}-${idx}`} className="contents">
                  <BreadcrumbItem>
                    {isLast || !seg.href ? (
                      <BreadcrumbPage className="text-warm-gray">{seg.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={seg.href} className="hover:text-foreground">
                        {seg.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast ? <BreadcrumbSeparator /> : null}
                </span>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      ) : null}

      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {/* §3 H1 + dropdown trigger combined — clicking the project name
              opens the picker. Pencil icon removed; edit lives on the right. */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="group focus-visible:ring-ring/40 flex min-w-0 items-center gap-2 rounded-md text-left outline-none focus-visible:ring-2"
              >
                <h1 className="font-display text-foreground min-w-0 truncate text-2xl leading-tight font-semibold tracking-[-0.02em] sm:text-3xl">
                  {currentProject.name}
                </h1>
                <ChevronDown
                  className="text-warm-gray h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-180"
                  aria-hidden
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
              {projects.map((project) => {
                const projBadge = getProjectStatusBadge(project.status);
                const isCurrent = project.id === currentProjectId;
                const deadline = project.endDate ? `截止 ${project.endDate}` : "未设截止";
                const projBudget = formatProjectBudget(project);
                return (
                  <DropdownMenuItem
                    key={project.id}
                    onSelect={() => selectProject(project.id)}
                    className={cn(
                      "items-start gap-2.5",
                      isCurrent && "bg-sand-light/60 focus:bg-sand-light",
                    )}
                  >
                    <span
                      className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", projBadge.dot)}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="text-foreground block truncate text-sm font-medium">
                        {project.name}
                      </span>
                      <span className="text-warm-gray block truncate text-xs">
                        {deadline} · {projBudget}
                      </span>
                    </span>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => openCreateProject("quick")}
                className="text-primary focus:text-primary font-medium"
              >
                + 新建项目
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Badge
            variant="outline"
            className={cn(
              "text-dark-charcoal h-6 shrink-0 gap-1.5 border-transparent px-2 py-0 text-xs font-medium",
              badge.background,
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", badge.dot)} aria-hidden />
            {badge.label}
          </Badge>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => openEditProject(currentProject.id)}
            className="gap-1.5"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden sm:inline">编辑</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="更多操作"
                className="h-8 w-8"
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem disabled className="gap-2">
                <Archive className="h-4 w-4" aria-hidden />
                归档
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="gap-2">
                <Copy className="h-4 w-4" aria-hidden />
                复制
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled className="text-destructive focus:text-destructive gap-2">
                <Trash2 className="h-4 w-4" aria-hidden />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <p className="text-dark-charcoal flex flex-wrap items-baseline gap-x-1.5 text-sm">
        {endDate ? (
          <>
            <span className="text-warm-gray">截止</span>
            <span className="text-foreground font-medium">{endDate}</span>
          </>
        ) : (
          <span className="text-warm-gray">未设置截止日期</span>
        )}
        {typeof daysRemaining === "number" ? (
          <>
            <span className="text-warm-gray">·</span>
            <span className="text-warm-gray">{daysRemaining < 0 ? "已逾期" : "剩"}</span>
            <span className="text-foreground font-medium">
              {Math.abs(daysRemaining).toLocaleString()}
            </span>
            <span className="text-warm-gray">天</span>
          </>
        ) : null}
        {hasBudget ? (
          <>
            <span className="text-warm-gray">·</span>
            <span className="text-warm-gray">预算</span>
            <span className="text-foreground font-medium">{budget}</span>
          </>
        ) : null}
      </p>

      {timeProgress !== null || budgetBurn !== null ? (
        <div className="grid grid-cols-2 gap-4 text-xs">
          {timeProgress !== null ? (
            <ProgressLine
              label="时间进度"
              value={timeProgress}
              indicatorClassName="bg-status-running"
            />
          ) : null}
          {budgetBurn !== null ? (
            <ProgressLine label="预算燃烧" value={budgetBurn} indicatorClassName="bg-primary/70" />
          ) : null}
        </div>
      ) : null}

      <Separator className="bg-border-tertiary" />
    </header>
  );
}

function ProgressLine({
  label,
  value,
  indicatorClassName,
}: {
  label: string;
  value: number;
  indicatorClassName: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="text-warm-gray mb-1 flex items-center justify-between">
        <span>{label}</span>
        <span className="text-dark-charcoal font-medium">{clamped}%</span>
      </div>
      <div className="bg-sand-light h-1.5 overflow-hidden rounded-full">
        <div
          className={cn("h-full rounded-full", indicatorClassName)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
