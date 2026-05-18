"use client";

import { CalendarDays, Check, Filter, Flag, List, Plus, Rows3 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { CATEGORY_VISUAL } from "@/features/outreach/data/calendar-events";
import { cn } from "@/lib/utils";

// §3.7.5 Calendar toolbar — view switcher + 分类 filter dropdown + new-event
// button. Lives at the orchestrator level so all three views share it. The
// four event categories collapse into a single multi-select dropdown so the
// row stays calm; the trigger surfaces the active count when not all-on.

export type ScheduleView = "month" | "week" | "list";

// Filter facets cover all five item kinds in the calendar; we collapse the
// two milestone variants into a single "项目节点" toggle so the user only
// sees four chips.
export type FilterFacet = "publish" | "followup" | "other" | "milestone";

const VIEW_OPTIONS: { id: ScheduleView; label: string; Icon: typeof CalendarDays }[] = [
  { id: "month", label: "月", Icon: CalendarDays },
  { id: "week", label: "周", Icon: Rows3 },
  { id: "list", label: "列表", Icon: List },
];

const FACET_OPTIONS: { id: FilterFacet; label: string }[] = [
  { id: "publish", label: "达人档期" },
  { id: "followup", label: "跟进提醒" },
  { id: "other", label: "其他" },
  { id: "milestone", label: "项目节点" },
];

interface ScheduleToolbarProps {
  view: ScheduleView;
  onViewChange: (next: ScheduleView) => void;
  enabledFacets: ReadonlySet<FilterFacet>;
  onToggleFacet: (facet: FilterFacet) => void;
  onResetFacets: () => void;
  onCreate: () => void;
  cursor: { year: number; month: number };
  totalScheduledThisMonth: number;
}

export function ScheduleToolbar({
  view,
  onViewChange,
  enabledFacets,
  onToggleFacet,
  onResetFacets,
  onCreate,
  cursor,
  totalScheduledThisMonth,
}: ScheduleToolbarProps) {
  const activeCount = enabledFacets.size;
  const allOn = activeCount === FACET_OPTIONS.length;

  // Local state for the 分类 dropdown. Closed by default; closes on outside
  // click or Escape so the toolbar doesn't trap focus.
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!filterOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFilterOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [filterOpen]);

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-[#c5c0b1] bg-[#fffefb] px-4 py-3">
      <div className="text-base font-semibold text-[#201515] tabular-nums">
        {cursor.year} 年 {cursor.month + 1} 月
      </div>
      <div className="text-[11px] text-[#939084] tabular-nums">
        本月 {totalScheduledThisMonth} 项
      </div>

      <div className="relative" ref={filterRef}>
        <Button
          unstyled
          type="button"
          onClick={() => setFilterOpen((prev) => !prev)}
          aria-haspopup="menu"
          aria-expanded={filterOpen}
          aria-label="分类筛选"
          className={cn(
            "inline-flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-medium transition-colors",
            !allOn
              ? "border-[#ff4f00]/35 bg-[#fff7f4] text-[#ff4f00] hover:bg-[#ffeee5]"
              : "border-[#c5c0b1] bg-[#fffefb] text-[#36342e] hover:bg-[#eceae3]",
          )}
        >
          <Filter size={13} aria-hidden />
          {!allOn ? (
            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff4f00] px-1 text-[10px] font-semibold text-[#fffefb] tabular-nums">
              {activeCount}
            </span>
          ) : null}
        </Button>

        {filterOpen ? (
          <div
            role="menu"
            aria-label="分类筛选"
            className="absolute top-full left-0 z-30 mt-1.5 w-56 overflow-hidden rounded-lg border border-[#c5c0b1] bg-[#fffefb] shadow-[0_12px_32px_-16px_rgba(32,21,21,0.25)]"
          >
            <div className="flex items-baseline justify-between border-b border-[#eceae3] px-3 pt-2.5 pb-2">
              <span className="text-[10px] font-medium tracking-wider text-[#939084] uppercase">
                显示分类
              </span>
              <span className="text-[10px] text-[#c5c0b1]">多选</span>
            </div>

            <div className="p-1">
              {FACET_OPTIONS.map((opt) => {
                const isOn = enabledFacets.has(opt.id);
                const visual = CATEGORY_VISUAL[opt.id];
                return (
                  <Button
                    unstyled
                    key={opt.id}
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={isOn}
                    onClick={() => onToggleFacet(opt.id)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors hover:bg-[#fffdf9]"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border transition-colors",
                        isOn
                          ? "border-[#ff4f00] bg-[#ff4f00] text-[#fffefb]"
                          : "border-[#c5c0b1] bg-[#fffefb]",
                      )}
                    >
                      {isOn ? <Check size={11} strokeWidth={3} /> : null}
                    </span>
                    {opt.id === "milestone" ? (
                      <Flag size={11} aria-hidden className="shrink-0 text-[#939084]" />
                    ) : (
                      <span
                        aria-hidden
                        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", visual.dot)}
                      />
                    )}
                    <span
                      className={cn(
                        "flex-1 font-medium",
                        isOn ? "text-[#201515]" : "text-[#939084]",
                      )}
                    >
                      {opt.label}
                    </span>
                  </Button>
                );
              })}
            </div>

            {!allOn ? (
              <Button
                unstyled
                type="button"
                onClick={() => {
                  onResetFacets();
                  setFilterOpen(false);
                }}
                className="block w-full border-t border-[#eceae3] px-3 py-2 text-left text-[11px] font-medium text-[#939084] transition-colors hover:bg-[#fffdf9] hover:text-[#ff4f00]"
              >
                重置全部
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="flex h-7 items-center gap-1 rounded-lg bg-[#eceae3] p-0.5">
          {VIEW_OPTIONS.map((opt) => {
            const isActive = view === opt.id;
            const Icon = opt.Icon;
            return (
              <Button
                unstyled
                key={opt.id}
                type="button"
                onClick={() => onViewChange(opt.id)}
                className={cn(
                  "inline-flex h-6 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
                  isActive ? "bg-[#fffefb] text-[#201515]" : "text-[#939084] hover:text-[#36342e]",
                )}
              >
                <Icon size={13} />
                {opt.label}
              </Button>
            );
          })}
        </div>
        <Button
          unstyled
          type="button"
          onClick={onCreate}
          className="inline-flex h-7 items-center gap-1 rounded-lg bg-[#ff4f00] px-2.5 text-[11px] font-medium text-[#fffefb] hover:bg-[#ff4f00]"
        >
          <Plus size={13} />
          新建事件
        </Button>
      </div>
    </div>
  );
}
