"use client";

import { Flag } from "lucide-react";
import { useEffect, useState } from "react";

import { CATEGORY_VISUAL } from "@/features/outreach/data/calendar-events";
import { cn } from "@/lib/utils";

// §3.7.2 Month grid view. Adds pointer-driven range selection: pressing on
// a day cell and dragging across days emits onCreateRange(start, end);
// releasing without movement falls through to onSelectDate. Chips for
// multi-day events render on every day in their [date, endDate] range so
// the user can grab the chip from any day to reschedule the entire range.

export type CalendarItemKind =
  | "publish"
  | "followup"
  | "other"
  | "milestone-start"
  | "milestone-end";

export interface CalendarItem {
  id: string;
  kind: CalendarItemKind;
  date: string;
  // Inclusive end of a multi-day span. Only "other" events use this.
  endDate?: string;
  title: string;
  draggable: boolean;
  creatorId?: string;
  projectId?: string;
}

interface ScheduleMonthViewProps {
  cursor: { year: number; month: number };
  todayIso: string;
  selectedDate: string | null;
  items: CalendarItem[];
  onSelectDate: (iso: string) => void;
  onMoveItem: (itemId: string, originDate: string, newDate: string) => void;
  onCreateRange: (startDate: string, endDate: string) => void;
}

interface DragState {
  anchor: string;
  current: string;
  isDragging: boolean;
}

export function ScheduleMonthView({
  cursor,
  todayIso,
  selectedDate,
  items,
  onSelectDate,
  onMoveItem,
  onCreateRange,
}: ScheduleMonthViewProps) {
  const [dropOverDate, setDropOverDate] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);

  // Commit / cancel range selection on global pointerup so the gesture
  // completes even if the user releases outside the grid. Side effects must
  // run outside the state updater so React doesn't invoke them during render.
  useEffect(() => {
    if (!dragState) return;
    const { anchor, current, isDragging } = dragState;
    const handleUp = () => {
      if (isDragging && anchor !== current) {
        const [start, end] = orderDates(anchor, current);
        onCreateRange(start, end);
      } else {
        onSelectDate(anchor);
      }
      setDragState(null);
    };
    document.addEventListener("pointerup", handleUp);
    return () => document.removeEventListener("pointerup", handleUp);
  }, [dragState, onCreateRange, onSelectDate]);

  const cells = buildMonthCells(cursor.year, cursor.month);
  const itemsByDate = expandItemsByDate(items);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#fffefb]">
      <div className="grid grid-cols-7 border-b border-[#c5c0b1] bg-[#fffdf9] text-[10px] tracking-wider text-[#939084] uppercase">
        {["周一", "周二", "周三", "周四", "周五", "周六", "周日"].map((d) => (
          <div key={d} className="px-3 py-2 text-left font-medium">
            {d}
          </div>
        ))}
      </div>

      {/* grid-rows-6 + min-h-0 lets the 6-week grid distribute the remaining
          card height evenly when the parent column is height-locked. The
          per-cell min-h-[110px] is preserved as a small-screen floor; on lg+
          the grid fills the available space. */}
      <div className="grid grid-cols-7 grid-rows-6 select-none lg:min-h-0 lg:flex-1">
        {cells.map((cell) => {
          const dayItems = itemsByDate.get(cell.iso) ?? [];
          const milestones = dayItems.filter(
            (it) => it.item.kind === "milestone-start" || it.item.kind === "milestone-end",
          );
          const chips = dayItems.filter(
            (it) => it.item.kind !== "milestone-start" && it.item.kind !== "milestone-end",
          );
          const isSelected = cell.iso === selectedDate;
          const isToday = cell.iso === todayIso;
          const isDropOver = cell.iso === dropOverDate;
          const inRange = dragState
            ? isWithinRange(cell.iso, dragState.anchor, dragState.current)
            : false;

          return (
            <div
              key={cell.iso}
              role="button"
              tabIndex={0}
              className={cn(
                "relative flex min-h-[110px] cursor-pointer flex-col overflow-hidden border-r border-b border-[#eceae3] p-2 text-left transition-colors last:border-r-0 lg:min-h-0",
                cell.inMonth ? "bg-[#fffefb] hover:bg-[#fffdf9]" : "bg-[#fffdf9]",
                isSelected && cell.inMonth && !inRange && "bg-[#fff7f4] hover:bg-[#fff7f4]",
                inRange && "bg-[#fff7f4] hover:bg-[#fff7f4]",
                isDropOver && "ring-2 ring-[#ff4f00]/40 ring-inset",
              )}
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                setDragState({ anchor: cell.iso, current: cell.iso, isDragging: false });
              }}
              onPointerEnter={() => {
                setDragState((prev) =>
                  prev && prev.current !== cell.iso
                    ? { anchor: prev.anchor, current: cell.iso, isDragging: true }
                    : prev,
                );
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectDate(cell.iso);
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (dropOverDate !== cell.iso) setDropOverDate(cell.iso);
              }}
              onDragLeave={() => {
                if (dropOverDate === cell.iso) setDropOverDate(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const payload = e.dataTransfer.getData("text/calendar-item");
                if (payload) {
                  const [itemId, originDate] = payload.split("|");
                  if (itemId && originDate) {
                    onMoveItem(itemId, originDate, cell.iso);
                  }
                }
                setDropOverDate(null);
              }}
            >
              {milestones.length > 0 ? (
                <div className="mb-1 flex flex-wrap gap-1">
                  {milestones.map((m) => (
                    <MilestoneStripe key={`${m.item.id}@${cell.iso}`} item={m.item} />
                  ))}
                </div>
              ) : null}

              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] tabular-nums",
                    cell.inMonth ? "text-[#36342e]" : "text-[#c5c0b1]",
                    isToday && "bg-[#ff4f00] font-semibold text-[#fffefb]",
                  )}
                >
                  {cell.day}
                </span>
                {chips.length > 0 ? (
                  <span className="rounded-full bg-[#ff4f00] px-1.5 text-[10px] font-medium text-[#fffefb] tabular-nums">
                    {chips.length}
                  </span>
                ) : null}
              </div>

              <div className="mt-1.5 space-y-1">
                {chips.slice(0, 3).map((c) => (
                  <Chip
                    key={`${c.item.id}@${cell.iso}`}
                    item={c.item}
                    originDate={cell.iso}
                    spanInfo={c.spanInfo}
                  />
                ))}
                {chips.length > 3 ? (
                  <div className="text-[10px] text-[#939084]">+{chips.length - 3}</div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ExpandedItem {
  item: CalendarItem;
  spanInfo?: "single" | "start" | "middle" | "end";
}

function expandItemsByDate(items: CalendarItem[]): Map<string, ExpandedItem[]> {
  const map = new Map<string, ExpandedItem[]>();
  const push = (date: string, entry: ExpandedItem) => {
    const list = map.get(date) ?? [];
    list.push(entry);
    map.set(date, list);
  };
  for (const item of items) {
    if (!item.endDate || item.endDate === item.date) {
      push(item.date, { item });
      continue;
    }
    const days = enumerateDates(item.date, item.endDate);
    days.forEach((d, idx) => {
      const span = idx === 0 ? "start" : idx === days.length - 1 ? "end" : "middle";
      push(d, { item, spanInfo: span });
    });
  }
  return map;
}

function Chip({
  item,
  originDate,
  spanInfo,
}: {
  item: CalendarItem;
  originDate: string;
  spanInfo?: "single" | "start" | "middle" | "end";
}) {
  const visual = chipVisual(item.kind);
  return (
    <div
      draggable={item.draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/calendar-item", `${item.id}|${originDate}`);
        e.dataTransfer.effectAllowed = "move";
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "flex items-center gap-1 truncate border px-1.5 py-0.5 text-[10px]",
        visual.badge,
        item.draggable && "cursor-grab active:cursor-grabbing",
        spanInfo === "start" && "rounded-l-md rounded-r-none border-r-0",
        spanInfo === "middle" && "rounded-none border-x-0",
        spanInfo === "end" && "rounded-l-none rounded-r-md border-l-0",
        (!spanInfo || spanInfo === "single") && "rounded-md",
      )}
    >
      {!spanInfo || spanInfo === "start" || spanInfo === "single" ? (
        <>
          <span className={cn("h-1 w-1 shrink-0 rounded-full", visual.dot)} />
          <span className="truncate">{item.title}</span>
        </>
      ) : (
        <span className="invisible truncate">{item.title}</span>
      )}
    </div>
  );
}

function MilestoneStripe({ item }: { item: CalendarItem }) {
  const isStart = item.kind === "milestone-start";
  return (
    <div
      draggable={item.draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/calendar-item", `${item.id}|${item.date}`);
        e.dataTransfer.effectAllowed = "move";
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "inline-flex max-w-full items-center gap-1 truncate rounded-sm border px-1.5 py-0.5 text-[9px] font-medium tracking-wide uppercase",
        CATEGORY_VISUAL.milestone.badge,
        item.draggable && "cursor-grab active:cursor-grabbing",
      )}
      title={item.title}
    >
      <Flag size={9} aria-hidden />
      <span className="truncate">{isStart ? "项目开始" : "项目结束"}</span>
    </div>
  );
}

function chipVisual(kind: CalendarItemKind) {
  if (kind === "publish") return CATEGORY_VISUAL.publish;
  if (kind === "followup") return CATEGORY_VISUAL.followup;
  return CATEGORY_VISUAL.other;
}

interface MonthCell {
  iso: string;
  day: number;
  inMonth: boolean;
}

function buildMonthCells(year: number, month: number): MonthCell[] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - startOffset);
  const cells: MonthCell[] = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    cells.push({ iso: toIso(d), day: d.getDate(), inMonth: d.getMonth() === month });
  }
  return cells;
}

function orderDates(a: string, b: string): [string, string] {
  return a <= b ? [a, b] : [b, a];
}

function isWithinRange(target: string, anchor: string, current: string): boolean {
  const [start, end] = orderDates(anchor, current);
  return target >= start && target <= end;
}

function enumerateDates(startIso: string, endIso: string): string[] {
  const out: string[] = [];
  const start = new Date(`${startIso}T00:00:00`);
  const end = new Date(`${endIso}T00:00:00`);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    out.push(toIso(d));
  }
  return out;
}

function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
