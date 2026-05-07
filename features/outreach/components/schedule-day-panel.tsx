"use client";

import { Calendar, X } from "lucide-react";

import { CollaborationStatusCell } from "@/features/creator/components/collaboration-status-cell";
import { useCreatorProfile } from "@/features/creator/components/creator-profile-context";
import { DayItemRow } from "@/features/outreach/components/schedule-day-item-row";
import type { CalendarEventCategory } from "@/features/outreach/data/calendar-events";
import {
  OUTREACH_ALLOWED_STATUSES,
  type OutreachCreator,
} from "@/features/outreach/data/outreach-types";
import type { WorkspaceProject } from "@/features/project/components/project-context";
import type { CollaborationStatus } from "@/types/api";

// §3.7.4 Day-detail panel — bottom-right slot of the schedule region.
// Lists every event landing on the selected date (publish / followup /
// other / milestone) and lets the user edit dates, clear / delete, change
// project (其他 only), or assign unscheduled cooperated creators to today.

export type DayItemKind = CalendarEventCategory | "milestone-start" | "milestone-end";

export interface DayItem {
  id: string;
  kind: DayItemKind;
  title: string;
  date: string;
  // Inclusive end of a multi-day "其他" event. Renders a 持续 N 天 hint and
  // shows a second date input for editing.
  endDate?: string;
  // optional metadata for display
  subtitle?: string;
  badge?: { label: string; cls: { badge: string; dot: string } };
  notes?: string;
  // editing rules
  canEditDate: boolean;
  canDelete: boolean; // milestone -> false; others -> true
  // routing identifiers (the parent uses whichever applies)
  creatorId?: string;
  projectId?: string;
}

interface ScheduleDayPanelProps {
  selectedDate: string | null;
  items: DayItem[];
  unscheduledCreators: OutreachCreator[];
  // 用 creatorId → OutreachCreator 的映射换详情抽屉所需的最小字段，
  // 避免 day-panel 自己再去 import 全量的 OUTREACH_CREATORS 列表。
  creatorsById: Record<string, OutreachCreator>;
  // 项目相关：projects 给"其他"事件的项目下拉框；projectsById 用于在卡片
  // 上展示项目名（包括 publish/followup/milestone 这类不可编辑的事件）。
  projects: WorkspaceProject[];
  projectsById: Record<string, WorkspaceProject>;
  onUpdateItemDate: (item: DayItem, newDate: string) => void;
  // Multi-day "其他" events can also have their end date moved independently
  // from the start date. Single-day items ignore this callback.
  onUpdateItemEndDate: (item: DayItem, newEndDate: string | null) => void;
  // §3.7.4 备注 — 用户为任意事件卡片自由记录的小段文本（≤ 280 字）。
  onUpdateItemNotes: (item: DayItem, newNotes: string) => void;
  // §3.7.4 项目归属 — 仅"其他"事件支持改项目；其他事件由父组件忽略此回调。
  onUpdateItemProjectId: (item: DayItem, newProjectId: string | null) => void;
  onDeleteItem: (item: DayItem) => void;
  onAssignPublish: (creatorId: string, date: string) => void;
  // §3.7.4 状态修改 — "未排期"列表的状态徽章是下拉，变更通过这条通道写到 outreach
  // context，建联进度看板会立刻同步更新。
  onChangeCreatorStatus: (creatorId: string, next: CollaborationStatus) => void;
  onClose: () => void;
}

export function ScheduleDayPanel({
  selectedDate,
  items,
  unscheduledCreators,
  creatorsById,
  projects,
  projectsById,
  onUpdateItemDate,
  onUpdateItemEndDate,
  onUpdateItemNotes,
  onUpdateItemProjectId,
  onDeleteItem,
  onAssignPublish,
  onChangeCreatorStatus,
  onClose,
}: ScheduleDayPanelProps) {
  if (!selectedDate) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[#fffdf9] px-6 py-16 text-center">
        <Calendar size={20} className="text-[#c5c0b1]" aria-hidden />
        <p className="mt-3 text-sm font-medium text-[#36342e]">选择日历上的任意一天</p>
        <p className="mt-1 text-xs text-[#939084]">查看 / 编辑当天事件，或为未排期博主指派日期</p>
      </div>
    );
  }

  const heading = formatHeading(selectedDate);
  const weekday = formatWeekday(selectedDate);
  const sortedItems = sortItems(items);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#fffefb]">
      <div className="flex items-start justify-between border-b border-[#c5c0b1] px-5 py-4">
        <div>
          <div className="text-xs tracking-wider text-[#939084] uppercase">{weekday}</div>
          <div className="mt-1 text-base font-semibold text-[#201515] tabular-nums">{heading}</div>
          <div className="mt-1 text-[11px] text-[#939084]">
            {sortedItems.length === 0 ? "今日暂无事件" : `共 ${sortedItems.length} 项`}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭"
          className="rounded-lg p-1 text-[#939084] hover:bg-[#eceae3] hover:text-[#36342e]"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
        <DayItemsSection
          items={sortedItems}
          creatorsById={creatorsById}
          projects={projects}
          projectsById={projectsById}
          onUpdateItemDate={onUpdateItemDate}
          onUpdateItemEndDate={onUpdateItemEndDate}
          onUpdateItemNotes={onUpdateItemNotes}
          onUpdateItemProjectId={onUpdateItemProjectId}
          onDeleteItem={onDeleteItem}
        />
        <UnscheduledAssign
          selectedDate={selectedDate}
          unscheduled={unscheduledCreators}
          projectsById={projectsById}
          onAssign={onAssignPublish}
          onChangeCreatorStatus={onChangeCreatorStatus}
        />
      </div>
    </div>
  );
}

function DayItemsSection({
  items,
  creatorsById,
  projects,
  projectsById,
  onUpdateItemDate,
  onUpdateItemEndDate,
  onUpdateItemNotes,
  onUpdateItemProjectId,
  onDeleteItem,
}: {
  items: DayItem[];
  creatorsById: Record<string, OutreachCreator>;
  projects: WorkspaceProject[];
  projectsById: Record<string, WorkspaceProject>;
  onUpdateItemDate: (item: DayItem, newDate: string) => void;
  onUpdateItemEndDate: (item: DayItem, newEndDate: string | null) => void;
  onUpdateItemNotes: (item: DayItem, newNotes: string) => void;
  onUpdateItemProjectId: (item: DayItem, newProjectId: string | null) => void;
  onDeleteItem: (item: DayItem) => void;
}) {
  if (items.length === 0) return null;

  return (
    <section>
      <h3 className="text-xs font-medium tracking-wider text-[#939084] uppercase">当日事件</h3>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <DayItemRow
            key={item.id}
            item={item}
            creator={item.creatorId ? creatorsById[item.creatorId] : undefined}
            projects={projects}
            projectsById={projectsById}
            onUpdateDate={(d) => onUpdateItemDate(item, d)}
            onUpdateEndDate={(d) => onUpdateItemEndDate(item, d)}
            onUpdateNotes={(n) => onUpdateItemNotes(item, n)}
            onUpdateProjectId={(p) => onUpdateItemProjectId(item, p)}
            onDelete={() => onDeleteItem(item)}
          />
        ))}
      </ul>
    </section>
  );
}

function UnscheduledAssign({
  selectedDate,
  unscheduled,
  projectsById,
  onAssign,
  onChangeCreatorStatus,
}: {
  selectedDate: string;
  unscheduled: OutreachCreator[];
  projectsById: Record<string, WorkspaceProject>;
  onAssign: (creatorId: string, date: string) => void;
  onChangeCreatorStatus: (creatorId: string, next: CollaborationStatus) => void;
}) {
  const { openCreatorProfile } = useCreatorProfile();
  if (unscheduled.length === 0) return null;
  const handleOpen = (c: OutreachCreator) => {
    openCreatorProfile({ handle: c.handle });
  };
  return (
    <section>
      <h3 className="text-xs font-medium tracking-wider text-[#939084] uppercase">
        未排期 · 可指派至本日
      </h3>
      <p className="mt-1 text-[11px] text-[#939084]">以下博主已进入合作但还没有约定发文日期</p>
      <ul className="mt-2 space-y-1.5">
        {unscheduled.map((c) => {
          const projectName = projectsById[c.projectId]?.name ?? null;
          return (
            <li
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-[#c5c0b1] bg-[#fffdf9] px-3 py-2"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpen(c)}
                    aria-label={`查看 ${c.handle} 详情`}
                    className="truncate text-left text-sm font-medium text-[#36342e] underline-offset-2 hover:text-[#ff4f00] hover:underline focus-visible:text-[#ff4f00] focus-visible:underline focus-visible:outline-none"
                  >
                    {c.handle}
                  </button>
                  <CollaborationStatusCell
                    value={c.status}
                    onChange={(next) => onChangeCreatorStatus(c.id, next)}
                    allowedStatuses={OUTREACH_ALLOWED_STATUSES}
                    compact
                  />
                  {projectName ? (
                    <span
                      title={`所属项目：${projectName}`}
                      className="inline-flex max-w-[120px] items-center gap-1 truncate rounded-full border border-[#eceae3] bg-[#fffefb] px-1.5 py-0.5 text-[10px] font-medium text-[#36342e]"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#c5c0b1]" />
                      <span className="truncate">{projectName}</span>
                    </span>
                  ) : null}
                </div>
                <div className="text-[10px] text-[#939084]">
                  {c.platform} · {(c.followers / 1000).toFixed(0)}K
                </div>
              </div>
              <button
                type="button"
                onClick={() => onAssign(c.id, selectedDate)}
                className="shrink-0 rounded-lg border border-[#ff4f00] bg-[#fff7f4] px-2.5 py-1 text-[11px] font-medium text-[#ff4f00] hover:bg-[#fff7f4]"
              >
                指派到本日
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function sortItems(items: DayItem[]): DayItem[] {
  const order: Record<DayItemKind, number> = {
    "milestone-start": 0,
    "milestone-end": 1,
    publish: 2,
    followup: 3,
    other: 4,
  };
  return [...items].sort((a, b) => order[a.kind] - order[b.kind]);
}

function formatHeading(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${y} 年 ${Number(m)} 月 ${Number(d)} 日`;
}

function formatWeekday(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][date.getDay()];
}
