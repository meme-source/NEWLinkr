"use client";

import { Flag } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { CalendarItem } from "@/features/outreach/components/schedule-calendar-grid";
import { CATEGORY_VISUAL } from "@/features/outreach/data/calendar-events";
import { cn } from "@/lib/utils";

// §3.7.6 Week view — 7-day strip. Same chip language as the month grid but
// each day card is taller (more chip rows, more breathing room) so a single
// week reads as a focused timeline.

interface ScheduleWeekViewProps {
  // Any ISO date inside the week to render. The view computes the week range
  // from this anchor (Mon-first).
  anchor: string;
  todayIso: string;
  selectedDate: string | null;
  items: CalendarItem[];
  onSelectDate: (iso: string) => void;
  onMoveItem: (itemId: string, originDate: string, newDate: string) => void;
}

export function ScheduleWeekView({
  anchor,
  todayIso,
  selectedDate,
  items,
  onSelectDate,
  onMoveItem,
}: ScheduleWeekViewProps) {
  const [dropOverDate, setDropOverDate] = useState<string | null>(null);

  const weekStart = mondayOfWeek(anchor);
  const days: string[] = [];
  for (let i = 0; i < 7; i += 1) days.push(addDays(weekStart, i));
  const weekRangeLabel = `${formatShort(days[0])} - ${formatShort(days[6])}`;

  const itemsByDate = new Map<string, CalendarItem[]>();
  for (const item of items) {
    const start = item.date;
    const end = item.endDate ?? item.date;
    for (const d of days) {
      if (d >= start && d <= end) {
        const list = itemsByDate.get(d) ?? [];
        list.push(item);
        itemsByDate.set(d, list);
      }
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#fffefb]">
      <div className="border-b border-[#c5c0b1] px-5 py-4">
        <div className="text-base font-semibold text-[#201515] tabular-nums">{weekRangeLabel}</div>
      </div>

      <div className="grid grid-cols-7 lg:min-h-0 lg:flex-1">
        {days.map((iso) => {
          const dayItems = itemsByDate.get(iso) ?? [];
          const milestones = dayItems.filter(
            (it) => it.kind === "milestone-start" || it.kind === "milestone-end",
          );
          const chips = dayItems.filter(
            (it) => it.kind !== "milestone-start" && it.kind !== "milestone-end",
          );
          const isSelected = iso === selectedDate;
          const isToday = iso === todayIso;
          const isDropOver = iso === dropOverDate;

          return (
            <Button
              unstyled
              key={iso}
              type="button"
              onClick={() => onSelectDate(iso)}
              onDragOver={(e) => {
                e.preventDefault();
                if (dropOverDate !== iso) setDropOverDate(iso);
              }}
              onDragLeave={() => {
                if (dropOverDate === iso) setDropOverDate(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const payload = e.dataTransfer.getData("text/calendar-item");
                if (payload) {
                  const [itemId, originDate] = payload.split("|");
                  if (itemId && originDate) {
                    onMoveItem(itemId, originDate, iso);
                  }
                }
                setDropOverDate(null);
              }}
              className={cn(
                "relative flex min-h-[260px] flex-col overflow-hidden border-r border-[#eceae3] p-3 text-left transition-colors last:border-r-0 lg:min-h-0",
                isSelected ? "bg-[#fff7f4] hover:bg-[#fff7f4]" : "bg-[#fffefb] hover:bg-[#fffdf9]",
                isDropOver && "ring-2 ring-[#ff4f00]/40 ring-inset",
              )}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] tracking-wider text-[#939084] uppercase">
                  {weekdayLabel(iso)}
                </span>
                <span
                  className={cn(
                    "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-semibold tabular-nums",
                    isToday ? "bg-[#ff4f00] text-[#fffefb]" : "text-[#201515]",
                  )}
                >
                  {Number(iso.split("-")[2])}
                </span>
              </div>

              {milestones.length > 0 ? (
                <div className="mb-2 flex flex-wrap gap-1">
                  {milestones.map((m) => (
                    <MilestoneStripe key={m.id} item={m} />
                  ))}
                </div>
              ) : null}

              <div className="flex flex-1 flex-col gap-1.5 overflow-hidden">
                {chips.map((it) => (
                  <ChipBlock key={`${it.id}@${iso}`} item={it} originDate={iso} />
                ))}
                {chips.length === 0 ? (
                  <span className="text-[11px] text-[#c5c0b1]">— 无事件 —</span>
                ) : null}
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function ChipBlock({ item, originDate }: { item: CalendarItem; originDate: string }) {
  const visual =
    CATEGORY_VISUAL[
      item.kind === "publish" ? "publish" : item.kind === "followup" ? "followup" : "other"
    ];
  const dayCount =
    item.endDate && item.endDate !== item.date
      ? Math.round(
          (new Date(`${item.endDate}T00:00:00`).getTime() -
            new Date(`${item.date}T00:00:00`).getTime()) /
            86_400_000,
        ) + 1
      : 1;
  return (
    <div
      draggable={item.draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/calendar-item", `${item.id}|${originDate}`);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "rounded-md border px-2 py-1 text-[11px]",
        visual.badge,
        item.draggable && "cursor-grab active:cursor-grabbing",
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", visual.dot)} />
        <span className="truncate font-medium">{item.title}</span>
      </div>
      {dayCount > 1 ? (
        <div className="mt-0.5 text-[10px] opacity-70">持续 {dayCount} 天</div>
      ) : null}
    </div>
  );
}

function MilestoneStripe({ item }: { item: CalendarItem }) {
  return (
    <div
      draggable={item.draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/calendar-item", `${item.id}|${item.date}`);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase",
        CATEGORY_VISUAL.milestone.badge,
        item.draggable && "cursor-grab active:cursor-grabbing",
      )}
    >
      <Flag size={10} aria-hidden />
      {item.kind === "milestone-start" ? "项目开始" : "项目结束"}
    </div>
  );
}

function mondayOfWeek(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return toIso(d);
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
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
