"use client";

import { Calendar, X } from "lucide-react";

import { Button } from "@/components/ui/button";
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
//
// Visual: Zaiper Design — eyebrow + 大号日期 + 副标题三层 header；body 用
// cream `#FFFDF9` + surface-1 `#F5F3EB` 自然分层，不堆 shadow。

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
      <div className="flex h-full flex-col items-center justify-center bg-[#FFFDF9] px-6 py-16 text-center">
        <Calendar size={20} className="text-[#B5B0A8]" aria-hidden />
        <p className="mt-3 text-sm font-semibold text-[#201515]">选择日历上的任意一天</p>
        <p className="mt-1 text-xs text-[#88827E]">查看 / 编辑当天事件，或为未排期博主指派日期</p>
      </div>
    );
  }

  const heading = formatHeading(selectedDate);
  const weekday = formatWeekday(selectedDate);
  const sortedItems = sortItems(items);

  const isToday = selectedDate === todayIso();
  const eyebrow = isToday ? `TODAY · ${weekday}` : weekday;
  const subtitleParts: string[] = [];
  if (sortedItems.length === 0) {
    subtitleParts.push("今日暂无事件");
  } else {
    subtitleParts.push(`${sortedItems.length} 项事件`);
  }
  if (unscheduledCreators.length > 0) {
    subtitleParts.push(`${unscheduledCreators.length} 待指派`);
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#FFFDF9]">
      <header className="flex items-start justify-between gap-3 border-b border-[#ECE9DF] bg-[#F5F3EB] px-5 py-5">
        <div className="min-w-0">
          <div className="text-[11px] font-medium tracking-[0.12em] text-[#88827E] uppercase">
            {eyebrow}
          </div>
          <div className="mt-2 text-[22px] leading-tight font-bold tracking-[-0.015em] text-[#201515] tabular-nums">
            {heading}
          </div>
          <div className="mt-1 text-xs text-[#88827E]">{subtitleParts.join(" · ")}</div>
        </div>
        <Button
          unstyled
          type="button"
          onClick={onClose}
          aria-label="关闭"
          className="rounded-lg p-1.5 text-[#88827E] transition-colors hover:bg-[#ECE9DF] hover:text-[#201515] focus-visible:ring-2 focus-visible:ring-[#FF4F00]/30 focus-visible:outline-none"
        >
          <X size={16} />
        </Button>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
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
      <h3 className="text-[11px] font-medium tracking-[0.12em] text-[#88827E] uppercase">
        当日事件
      </h3>
      <ul className="mt-3 space-y-2.5">
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
      <h3 className="text-[11px] font-medium tracking-[0.12em] text-[#88827E] uppercase">
        未排期 · 可指派至本日
      </h3>
      <p className="mt-1 text-[11px] text-[#88827E]">以下博主已进入合作但还没有约定发文日期</p>
      <ul className="mt-3 space-y-2">
        {unscheduled.map((c) => {
          const projectName = projectsById[c.projectId]?.name ?? null;
          return (
            <li
              key={c.id}
              className="flex items-center gap-3 rounded-lg border border-dashed border-[#D9D5C7] bg-[#F5F3EB] px-3 py-3 transition-colors hover:border-solid hover:border-[#FF4F00] hover:bg-[#FFFDF9]"
            >
              <CreatorAvatar handle={c.handle} seed={c.id} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    unstyled
                    type="button"
                    onClick={() => handleOpen(c)}
                    aria-label={`查看 ${c.handle} 详情`}
                    className="truncate text-left text-[13px] font-bold tracking-[-0.005em] text-[#201515] underline-offset-2 hover:text-[#FF4F00] hover:underline focus-visible:rounded-sm focus-visible:text-[#FF4F00] focus-visible:underline focus-visible:ring-2 focus-visible:ring-[#FF4F00]/30 focus-visible:outline-none"
                  >
                    {c.handle}
                  </Button>
                  <CollaborationStatusCell
                    value={c.status}
                    onChange={(next) => onChangeCreatorStatus(c.id, next)}
                    allowedStatuses={OUTREACH_ALLOWED_STATUSES}
                    compact
                  />
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-[#88827E]">
                  <span>{c.platform}</span>
                  <span aria-hidden>·</span>
                  <span>{(c.followers / 1000).toFixed(0)}K</span>
                  {projectName ? (
                    <>
                      <span aria-hidden>·</span>
                      <span
                        title={`所属项目：${projectName}`}
                        className="inline-flex max-w-[140px] items-center gap-1 truncate rounded-full bg-[#F5F3EB] px-2 py-0.5 text-[10px] font-medium text-[#201515] ring-1 ring-[#ECE9DF]"
                      >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF4F00]" />
                        <span className="truncate">{projectName}</span>
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
              <Button
                unstyled
                type="button"
                onClick={() => onAssign(c.id, selectedDate)}
                className="shrink-0 rounded-lg bg-[#FF4F00] px-3 py-1.5 text-[11px] font-semibold text-[#FFFDF9] transition-colors hover:bg-[#E64700] focus-visible:ring-2 focus-visible:ring-[#FF4F00]/30 focus-visible:outline-none"
              >
                指派到本日
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// 头像首字母 + 简单 hash 配色（espresso / plum / orange）。
const AVATAR_COLORS = [
  { bg: "#201515", fg: "#FFFDF9" },
  { bg: "#503EBD", fg: "#FFFDF9" },
  { bg: "#FF4F00", fg: "#FFFDF9" },
];

function CreatorAvatar({ handle, seed }: { handle: string; seed: string }) {
  const initials = handle.replace(/^@/, "").slice(0, 2).toUpperCase() || "··";
  const idx = hashString(seed) % AVATAR_COLORS.length;
  const { bg, fg } = AVATAR_COLORS[idx];
  return (
    <div
      aria-hidden
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold tracking-tight"
      style={{ backgroundColor: bg, color: fg }}
    >
      {initials}
    </div>
  );
}

function hashString(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (h * 31 + value.charCodeAt(i)) >>> 0;
  }
  return h;
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

function todayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
