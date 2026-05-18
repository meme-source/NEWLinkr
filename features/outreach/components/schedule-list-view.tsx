"use client";

import { Flag } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CalendarItem } from "@/features/outreach/components/schedule-calendar-grid";
import { CATEGORY_LABEL, CATEGORY_VISUAL } from "@/features/outreach/data/calendar-events";
import { cn } from "@/lib/utils";

// §3.7.7 List view — chronological flat list grouped by date. Range
// selection / drag-drop don't apply here; clicking a row routes to that
// item's date in the day panel.

interface ScheduleListViewProps {
  cursor: { year: number; month: number };
  todayIso: string;
  selectedDate: string | null;
  items: CalendarItem[];
  onSelectDate: (iso: string) => void;
}

export function ScheduleListView({
  cursor,
  todayIso,
  selectedDate,
  items,
  onSelectDate,
}: ScheduleListViewProps) {
  const monthStart = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}-01`;
  const monthEnd = lastDayOfMonth(cursor.year, cursor.month);

  // Items whose [date, endDate] overlaps the displayed month.
  const inMonth = items.filter((it) => {
    const start = it.date;
    const end = it.endDate ?? it.date;
    return end >= monthStart && start <= monthEnd;
  });

  // Group by start date for compact rendering — use the item's start date
  // even if it spans into earlier months, so each event shows up exactly once.
  const groups = new Map<string, CalendarItem[]>();
  for (const it of inMonth) {
    const list = groups.get(it.date) ?? [];
    list.push(it);
    groups.set(it.date, list);
  }
  const orderedDates = [...groups.keys()].sort();

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#fffefb]">
      <div className="border-b border-[#c5c0b1] px-5 py-4">
        <div className="text-base font-semibold text-[#201515] tabular-nums">
          {cursor.year} 年 {cursor.month + 1} 月 · {inMonth.length} 项
        </div>
      </div>

      {orderedDates.length === 0 ? (
        <div className="flex-1 px-5 py-12 text-center text-sm text-[#939084]">
          本月暂无事件。试试在月视图按住一段日期来快速新建。
        </div>
      ) : (
        // overflow-y-auto + min-h-0 lets the list scroll inside the
        // height-locked card when the month has more entries than fit.
        <ul className="divide-y divide-[#eceae3] lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          {orderedDates.map((iso) => {
            const dayItems = groups.get(iso) ?? [];
            const isToday = iso === todayIso;
            const isSelected = iso === selectedDate;
            return (
              <li key={iso} className={cn(isSelected && "bg-[#fff7f4]")}>
                <div className="flex gap-4 px-5 py-3">
                  <div className="w-20 shrink-0">
                    <div className="text-[10px] tracking-wider text-[#939084] uppercase">
                      {weekdayLabel(iso)}
                    </div>
                    <div
                      className={cn(
                        "mt-0.5 text-base font-semibold tabular-nums",
                        isToday ? "text-[#ff4f00]" : "text-[#201515]",
                      )}
                    >
                      {formatShort(iso)}
                    </div>
                  </div>
                  <ul className="flex-1 space-y-1.5">
                    {dayItems.map((it) => (
                      <ListRow key={it.id} item={it} onClick={() => onSelectDate(iso)} />
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ListRow({ item, onClick }: { item: CalendarItem; onClick: () => void }) {
  const visual =
    item.kind === "milestone-start" || item.kind === "milestone-end"
      ? CATEGORY_VISUAL.milestone
      : CATEGORY_VISUAL[item.kind];
  const kindLabel =
    item.kind === "milestone-start"
      ? "项目开始"
      : item.kind === "milestone-end"
        ? "项目结束"
        : CATEGORY_LABEL[item.kind];
  const dayCount =
    item.endDate && item.endDate !== item.date
      ? Math.round(
          (new Date(`${item.endDate}T00:00:00`).getTime() -
            new Date(`${item.date}T00:00:00`).getTime()) /
            86_400_000,
        ) + 1
      : 1;
  return (
    <li>
      <Button
        unstyled
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-[#fffdf9]"
      >
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
            visual.badge,
          )}
        >
          {item.kind === "milestone-start" || item.kind === "milestone-end" ? (
            <Flag size={9} aria-hidden />
          ) : (
            <span className={cn("h-1.5 w-1.5 rounded-full", visual.dot)} />
          )}
          {kindLabel}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#201515]">
          {item.title}
        </span>
        {dayCount > 1 ? (
          <span className="shrink-0 text-[11px] text-[#939084]">持续 {dayCount} 天</span>
        ) : null}
      </Button>
    </li>
  );
}

function lastDayOfMonth(year: number, month: number): string {
  const d = new Date(year, month + 1, 0);
  return toIso(d);
}

function weekdayLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][d.getDay()];
}

function formatShort(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${Number(m)}月${Number(d)}日`;
}

function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
