import type {
  CalendarItem,
  CalendarItemKind,
} from "@/features/outreach/components/schedule-calendar-grid";
import type { DayItem } from "@/features/outreach/components/schedule-day-panel";
import type { FilterFacet } from "@/features/outreach/components/schedule-toolbar";
import type { StandaloneCalendarEvent } from "@/features/outreach/data/calendar-events";
import {
  COLLABORATION_STATUS_CFG,
  type OutreachCreator,
} from "@/features/outreach/data/outreach-types";
import type { WorkspaceProject } from "@/features/project/components/project-context";
import { COLLABORATION_STATUS_LABEL } from "@/lib/creator";

// §3.7.x Pure helpers shared across the calendar surface — date math, item
// ID parsing, calendar item construction, and DayItem mapping. Keeping
// them out of board-schedule.tsx keeps the orchestrator focused on state.

export type DateOverrides = Record<string, string | null>;

export function effective(base: string | undefined, overrides: DateOverrides, key: string) {
  return key in overrides ? (overrides[key] ?? undefined) : base;
}

export function splitItemId(itemId: string): [string, string] {
  const idx = itemId.indexOf(":");
  return [itemId.slice(0, idx), itemId.slice(idx + 1)];
}

export function facetOf(kind: CalendarItemKind): FilterFacet {
  if (kind === "milestone-start" || kind === "milestone-end") return "milestone";
  return kind;
}

export function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toIso(d);
}

export function dayDiff(fromIso: string, toIsoStr: string): number {
  const ms = new Date(`${toIsoStr}T00:00:00`).getTime() - new Date(`${fromIso}T00:00:00`).getTime();
  return Math.round(ms / 86_400_000);
}

export function shiftMonth(iso: string, delta: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(y, m - 1 + delta, Math.min(d, 28));
  return toIso(target);
}

interface BuildItemsInput {
  scopedCreators: OutreachCreator[];
  scopedEvents: StandaloneCalendarEvent[];
  scopedProjects: WorkspaceProject[];
  publishOverrides: DateOverrides;
  followupOverrides: DateOverrides;
}

// "建联成功"段：合作中 / 已完成 / 暂停中 —— 这三种都属于"已经谈成"的合作博主，
// 才有资格在日历上排发文。
const PUBLISHABLE_STATUSES = new Set<OutreachCreator["status"]>([
  "collaborating",
  "completed",
  "paused",
]);

export function buildCalendarItems(input: BuildItemsInput): CalendarItem[] {
  const items: CalendarItem[] = [];
  for (const c of input.scopedCreators) {
    const publishDate = effective(c.scheduledPublishAt, input.publishOverrides, c.id);
    if (publishDate && PUBLISHABLE_STATUSES.has(c.status)) {
      items.push({
        id: `publish:${c.id}`,
        kind: "publish",
        date: publishDate,
        title: c.handle,
        draggable: true,
        creatorId: c.id,
        projectId: c.projectId,
      });
    }
    const followupDate = effective(c.nextFollowUpAt, input.followupOverrides, c.id);
    if (followupDate) {
      items.push({
        id: `followup:${c.id}`,
        kind: "followup",
        date: followupDate,
        title: c.handle,
        draggable: true,
        creatorId: c.id,
        projectId: c.projectId,
      });
    }
  }
  for (const e of input.scopedEvents) {
    items.push({
      id: `other:${e.id}`,
      kind: "other",
      date: e.date,
      endDate: e.endDate,
      title: e.title,
      draggable: true,
      projectId: e.projectId,
      creatorId: e.creatorId,
    });
  }
  for (const p of input.scopedProjects) {
    if (p.startDate) {
      items.push({
        id: `milestone-start:${p.id}`,
        kind: "milestone-start",
        date: p.startDate,
        title: `${p.name} 开始`,
        draggable: true,
        projectId: p.id,
      });
    }
    if (p.endDate) {
      items.push({
        id: `milestone-end:${p.id}`,
        kind: "milestone-end",
        date: p.endDate,
        title: `${p.name} 结束`,
        draggable: true,
        projectId: p.id,
      });
    }
  }
  return items;
}

export function buildDayItem(
  item: CalendarItem,
  creators: OutreachCreator[],
  customEvents: StandaloneCalendarEvent[],
  projects: WorkspaceProject[],
): DayItem {
  if (item.kind === "publish" || item.kind === "followup") {
    const creator = item.creatorId ? creators.find((c) => c.id === item.creatorId) : undefined;
    // 仅在 publish 卡片上展示博主当前状态徽章；followup 卡片不需要重复信息。
    const showBadge =
      item.kind === "publish" && creator && PUBLISHABLE_STATUSES.has(creator.status);
    return {
      id: item.id,
      kind: item.kind,
      title: item.title,
      date: item.date,
      subtitle: creator
        ? `${creator.platform} · ${(creator.followers / 1000).toFixed(0)}K`
        : undefined,
      badge:
        showBadge && creator
          ? {
              label: COLLABORATION_STATUS_LABEL[creator.status],
              cls: COLLABORATION_STATUS_CFG[creator.status],
            }
          : undefined,
      canEditDate: true,
      canDelete: true,
      creatorId: item.creatorId,
      projectId: item.projectId,
    };
  }
  if (item.kind === "other") {
    const eventId = item.id.split(":")[1];
    const event = customEvents.find((e) => e.id === eventId);
    return {
      id: item.id,
      kind: "other",
      title: item.title,
      date: item.date,
      endDate: event?.endDate,
      notes: event?.notes,
      canEditDate: true,
      canDelete: true,
      creatorId: item.creatorId,
      projectId: item.projectId,
    };
  }
  const project = item.projectId ? projects.find((p) => p.id === item.projectId) : undefined;
  return {
    id: item.id,
    kind: item.kind,
    title: project?.name ?? item.title,
    date: item.date,
    subtitle: item.kind === "milestone-start" ? "项目开始日" : "项目结束日",
    canEditDate: true,
    canDelete: false,
    projectId: item.projectId,
  };
}
