"use client";

import { useCallback, useMemo, useState } from "react";

import {
  CalendarEventDialog,
  type CalendarEventDraft,
} from "@/features/outreach/components/calendar-event-dialog";
import {
  ScheduleMonthView,
  type CalendarItem,
} from "@/features/outreach/components/schedule-calendar-grid";
import { ScheduleDayPanel, type DayItem } from "@/features/outreach/components/schedule-day-panel";
import { ScheduleListView } from "@/features/outreach/components/schedule-list-view";
import {
  ScheduleToolbar,
  type FilterFacet,
  type ScheduleView,
} from "@/features/outreach/components/schedule-toolbar";
import { ScheduleWeekView } from "@/features/outreach/components/schedule-week-view";
import {
  CALENDAR_EVENTS,
  type StandaloneCalendarEvent,
} from "@/features/outreach/data/calendar-events";
import { OUTREACH_CREATORS } from "@/features/outreach/data/outreach-creators";
import { useOutreachState } from "@/features/outreach/components/outreach-state-context";
import type { OutreachCreator } from "@/features/outreach/data/outreach-types";
import type { WorkspaceProject } from "@/features/project/components/project-context";
import {
  addDays,
  buildCalendarItems,
  buildDayItem,
  dayDiff,
  effective,
  facetOf,
  splitItemId,
  toIso,
  type DateOverrides,
} from "@/features/outreach/lib/calendar-utils";
import { useWorkspaceProject } from "@/features/project/components/project-context";

// §3.7 Schedule region — composes the toolbar (view + filter), the active
// view (month / week / list), and the right column (anomalies + day panel).
// All mutable state lives here; presentational pieces stay dumb.

interface DialogState {
  key: number;
  defaultDate: string;
  defaultEndDate?: string;
}

interface BoardScheduleProps {
  // Pinned to a single project, or null = all-projects.
  projectId: string | null;
}

export function BoardSchedule({ projectId }: BoardScheduleProps) {
  const { projects, updateProjectDates } = useWorkspaceProject();
  const { resolveStatus, setStatusOverride } = useOutreachState();
  const today = useMemo(() => new Date(), []);
  const todayIso = useMemo(() => toIso(today), [today]);

  // Cursor anchors whichever view is active. Navigation controls are hidden in
  // the compact overview calendar, so this stays pinned to today.
  const cursor = todayIso;
  const [view, setView] = useState<ScheduleView>("month");
  const [selectedDate, setSelectedDate] = useState<string | null>(todayIso);
  const [publishOverrides, setPublishOverrides] = useState<DateOverrides>({});
  const [followupOverrides, setFollowupOverrides] = useState<DateOverrides>({});
  const [customEvents, setCustomEvents] = useState<StandaloneCalendarEvent[]>(CALENDAR_EVENTS);
  // §3.7.4 备注 — itemId → notes 映射，适用于 publish / followup / milestone-*
  // 这种没有自带 notes 字段的事件类型；"其他"事件 fallback 到 customEvents.notes。
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  const [enabledFacets, setEnabledFacets] = useState<ReadonlySet<FilterFacet>>(
    () => new Set<FilterFacet>(["publish", "followup", "other", "milestone"]),
  );
  const [dialogState, setDialogState] = useState<DialogState | null>(null);

  // Scope creators / events / projects to the current project (or all).
  // 用 outreach context 的 resolveStatus 应用用户在表格里改过的状态，让看板和
  // 档期共享同一份"当前真实状态"。
  const scopedCreators = useMemo(() => {
    const base =
      projectId === null
        ? OUTREACH_CREATORS
        : OUTREACH_CREATORS.filter((c) => c.projectId === projectId);
    return base.map((c) => ({ ...c, status: resolveStatus(c) }));
  }, [projectId, resolveStatus]);
  const scopedEvents = useMemo(
    () =>
      projectId === null
        ? customEvents
        : customEvents.filter((e) => !e.projectId || e.projectId === projectId),
    [customEvents, projectId],
  );
  const scopedProjects = useMemo(
    () => (projectId === null ? projects : projects.filter((p) => p.id === projectId)),
    [projects, projectId],
  );

  // Build all calendar items, then run them through the facet filter.
  const allItems = useMemo<CalendarItem[]>(
    () =>
      buildCalendarItems({
        scopedCreators,
        scopedEvents,
        scopedProjects,
        publishOverrides,
        followupOverrides,
      }),
    [scopedCreators, scopedEvents, scopedProjects, publishOverrides, followupOverrides],
  );

  const filteredItems = useMemo(
    () => allItems.filter((it) => enabledFacets.has(facetOf(it.kind))),
    [allItems, enabledFacets],
  );

  // Single date-change writer. Origin date supports preserving duration when
  // dragging a multi-day "其他" event from the middle of its range.
  const moveItem = useCallback(
    (itemId: string, originDate: string | null, newDate: string | null) => {
      const [kind, key] = splitItemId(itemId);
      if (kind === "publish") {
        setPublishOverrides((prev) => ({ ...prev, [key]: newDate }));
      } else if (kind === "followup") {
        setFollowupOverrides((prev) => ({ ...prev, [key]: newDate }));
      } else if (kind === "other") {
        if (newDate === null) {
          setCustomEvents((prev) => prev.filter((e) => e.id !== key));
        } else {
          setCustomEvents((prev) =>
            prev.map((e) => {
              if (e.id !== key) return e;
              if (!e.endDate || e.endDate === e.date || originDate === null) {
                return { ...e, date: newDate, endDate: undefined };
              }
              const delta = dayDiff(originDate, newDate);
              return {
                ...e,
                date: addDays(e.date, delta),
                endDate: addDays(e.endDate, delta),
              };
            }),
          );
        }
      } else if (kind === "milestone-start") {
        if (newDate !== null) updateProjectDates(key, { startDate: newDate });
      } else if (kind === "milestone-end") {
        if (newDate !== null) updateProjectDates(key, { endDate: newDate });
      }
    },
    [updateProjectDates],
  );

  // Direct end-date editor for multi-day "其他" events. Other kinds ignore.
  const updateItemEndDate = useCallback((itemId: string, newEndDate: string | null) => {
    const [kind, key] = splitItemId(itemId);
    if (kind !== "other") return;
    setCustomEvents((prev) =>
      prev.map((e) => (e.id === key ? { ...e, endDate: newEndDate ?? undefined } : e)),
    );
  }, []);

  // §3.7.4 备注写入器 — "其他"事件直接写回原始 customEvent，
  // 让备注随事件被拖动 / 删除时一同搬动；其他类型统一存进 itemNotes。
  const updateItemNotes = useCallback((itemId: string, newNotes: string) => {
    const [kind, key] = splitItemId(itemId);
    if (kind === "other") {
      setCustomEvents((prev) => prev.map((e) => (e.id === key ? { ...e, notes: newNotes } : e)));
      return;
    }
    setItemNotes((prev) => ({ ...prev, [itemId]: newNotes }));
  }, []);

  // §3.7.4 项目归属写入器 —— 仅"其他"事件支持改项目。publish/followup 的项目
  // 跟随博主自身的 projectId，里程碑事件就是项目本身，二者都不在这里处理。
  const updateItemProjectId = useCallback((itemId: string, newProjectId: string | null) => {
    const [kind, key] = splitItemId(itemId);
    if (kind !== "other") return;
    setCustomEvents((prev) =>
      prev.map((e) => (e.id === key ? { ...e, projectId: newProjectId ?? undefined } : e)),
    );
  }, []);

  const openDialog = useCallback((defaultDate: string, defaultEndDate?: string) => {
    setDialogState({ key: Date.now(), defaultDate, defaultEndDate });
  }, []);

  const handleCreateRange = useCallback(
    (start: string, end: string) => {
      setSelectedDate(start);
      openDialog(start, start === end ? undefined : end);
    },
    [openDialog],
  );

  const handleSubmitDraft = useCallback((draft: CalendarEventDraft) => {
    if (draft.category === "publish") {
      setPublishOverrides((prev) => ({ ...prev, [draft.creatorId]: draft.date }));
    } else if (draft.category === "followup") {
      setFollowupOverrides((prev) => ({ ...prev, [draft.creatorId]: draft.date }));
    } else {
      // "其他"事件：以 dialog 选中的 projectId 为准（可能是 null = 未指定项目），
      // 不再回退到当前作用域项目，让用户的明确选择生效。creatorId 也是可选 ——
      // 选了博主则在日历卡片上展示可点击的博主名。
      setCustomEvents((prev) => [
        {
          id: `evt-${Date.now()}`,
          type: "other",
          date: draft.date,
          endDate: draft.endDate,
          title: draft.title,
          notes: draft.notes,
          projectId: draft.projectId ?? undefined,
          creatorId: draft.creatorId ?? undefined,
        },
        ...prev,
      ]);
    }
    setDialogState(null);
    setSelectedDate(draft.date);
  }, []);

  // Counters for the views' summary lines.
  const cursorYear = Number(cursor.split("-")[0]);
  const cursorMonth = Number(cursor.split("-")[1]) - 1;
  const totalThisMonth = useMemo(
    () =>
      filteredItems.filter((it) => {
        const d = new Date(`${it.date}T00:00:00`);
        return d.getFullYear() === cursorYear && d.getMonth() === cursorMonth;
      }).length,
    [filteredItems, cursorYear, cursorMonth],
  );
  // §3.7 未排期 = 已经"建联成功"（进入合作或之后阶段）但还没指定发文日期。
  const unscheduledPublish = useMemo(
    () =>
      scopedCreators.filter(
        (c) =>
          (c.status === "collaborating" || c.status === "completed" || c.status === "paused") &&
          !effective(c.scheduledPublishAt, publishOverrides, c.id),
      ),
    [scopedCreators, publishOverrides],
  );

  // creatorId → OutreachCreator 反查。day-panel 用来给"点名字弹抽屉"换取最小展示字段，
  // 比让 day-panel 自己 import 全量 OUTREACH_CREATORS 更干净。
  const creatorsById = useMemo<Record<string, OutreachCreator>>(() => {
    return scopedCreators.reduce<Record<string, OutreachCreator>>((acc, creator) => {
      acc[creator.id] = creator;
      return acc;
    }, {});
  }, [scopedCreators]);

  // projectId → WorkspaceProject 反查 —— day-panel / item-row 拿来回显项目名。
  // 即使在单项目作用域下也用全量 projects，因为 publish/followup 事件可能指向
  // 与当前作用域不同的项目（理论上不会出现，但保留兜底）。
  const projectsById = useMemo<Record<string, WorkspaceProject>>(() => {
    return projects.reduce<Record<string, WorkspaceProject>>((acc, project) => {
      acc[project.id] = project;
      return acc;
    }, {});
  }, [projects]);

  // Day-panel items (always pulled from the unfiltered list so users still
  // see hidden categories when they open a specific day).
  // notes 优先取 itemNotes（publish / followup / milestone-* 的统一来源），
  // 没有时再 fallback 到 buildDayItem 给"其他"事件填好的 customEvent.notes。
  const dayPanelItems = useMemo<DayItem[]>(() => {
    if (!selectedDate) return [];
    const onDay = allItems.filter((it) => {
      const start = it.date;
      const end = it.endDate ?? it.date;
      return selectedDate >= start && selectedDate <= end;
    });
    return onDay.map((it) => {
      const built = buildDayItem(it, scopedCreators, scopedEvents, projects);
      const override = itemNotes[built.id];
      return override !== undefined ? { ...built, notes: override } : built;
    });
  }, [selectedDate, allItems, scopedCreators, scopedEvents, projects, itemNotes]);

  // Dialog creator pools —— "建联成功"语义合并到 collaborating / completed / paused。
  const publishableCreators = useMemo(
    () =>
      scopedCreators.filter(
        (c) => c.status === "collaborating" || c.status === "completed" || c.status === "paused",
      ),
    [scopedCreators],
  );
  const followupCreators = useMemo(
    () =>
      scopedCreators.filter(
        (c) =>
          c.status === "sent" ||
          c.status === "collaborating" ||
          c.status === "completed" ||
          c.status === "paused",
      ),
    [scopedCreators],
  );

  const toggleFacet = (facet: FilterFacet) =>
    setEnabledFacets((prev) => {
      const next = new Set(prev);
      if (next.has(facet)) next.delete(facet);
      else next.add(facet);
      return next;
    });

  return (
    <>
      {/* §3.7 Schedule shell — toolbar + (calendar | day panel) live in a single
          card so they read as one surface. The calendar row is height-locked at
          lg+ via lg:h-[720px]; list view scrolls internally when it overflows. */}
      <div className="overflow-hidden rounded-2xl border border-[#c5c0b1] bg-[#fffefb]">
        <ScheduleToolbar
          view={view}
          onViewChange={setView}
          enabledFacets={enabledFacets}
          onToggleFacet={toggleFacet}
          onResetFacets={() =>
            setEnabledFacets(new Set<FilterFacet>(["publish", "followup", "other", "milestone"]))
          }
          onCreate={() => openDialog(selectedDate ?? todayIso)}
          cursor={{ year: cursorYear, month: cursorMonth }}
          totalScheduledThisMonth={totalThisMonth}
        />

        <div className="grid lg:h-[720px] lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex min-w-0 flex-col border-b border-[#c5c0b1] lg:border-r lg:border-b-0">
            {view === "month" ? (
              <ScheduleMonthView
                cursor={{ year: cursorYear, month: cursorMonth }}
                todayIso={todayIso}
                selectedDate={selectedDate}
                items={filteredItems}
                onSelectDate={setSelectedDate}
                onMoveItem={(itemId, originDate, newDate) => moveItem(itemId, originDate, newDate)}
                onCreateRange={handleCreateRange}
              />
            ) : view === "week" ? (
              <ScheduleWeekView
                anchor={cursor}
                todayIso={todayIso}
                selectedDate={selectedDate}
                items={filteredItems}
                onSelectDate={setSelectedDate}
                onMoveItem={(itemId, originDate, newDate) => moveItem(itemId, originDate, newDate)}
              />
            ) : (
              <ScheduleListView
                cursor={{ year: cursorYear, month: cursorMonth }}
                todayIso={todayIso}
                selectedDate={selectedDate}
                items={filteredItems}
                onSelectDate={setSelectedDate}
              />
            )}
          </div>

          <ScheduleDayPanel
            selectedDate={selectedDate}
            items={dayPanelItems}
            unscheduledCreators={unscheduledPublish}
            creatorsById={creatorsById}
            projects={projects}
            projectsById={projectsById}
            onUpdateItemDate={(item, newDate) => moveItem(item.id, item.date, newDate)}
            onUpdateItemEndDate={(item, newEndDate) => updateItemEndDate(item.id, newEndDate)}
            onUpdateItemNotes={(item, newNotes) => updateItemNotes(item.id, newNotes)}
            onUpdateItemProjectId={(item, newProjectId) =>
              updateItemProjectId(item.id, newProjectId)
            }
            onDeleteItem={(item) => moveItem(item.id, null, null)}
            onAssignPublish={(creatorId, date) =>
              setPublishOverrides((prev) => ({ ...prev, [creatorId]: date }))
            }
            onChangeCreatorStatus={setStatusOverride}
            onClose={() => setSelectedDate(null)}
          />
        </div>
      </div>

      {dialogState !== null ? (
        <CalendarEventDialog
          key={dialogState.key}
          defaultDate={dialogState.defaultDate}
          defaultEndDate={dialogState.defaultEndDate}
          publishableCreators={publishableCreators}
          followupCreators={followupCreators}
          allCreators={scopedCreators}
          projects={projects}
          defaultProjectId={projectId}
          onSubmit={handleSubmitDraft}
          onClose={() => setDialogState(null)}
        />
      ) : null}
    </>
  );
}
