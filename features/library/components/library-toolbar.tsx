"use client";

import { useState } from "react";
import { Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  COLUMN_LABEL,
  TOGGLEABLE_COLUMNS,
  type FilterDimensionId,
  type ToggleableColumnId,
} from "@/features/library/hooks/use-library-columns";
import type { LibraryFilterState } from "@/features/library/types";
import type { CollaborationTimeOption } from "@/features/library/data/collaboration-time-filter";
import { LibraryFilterBar } from "./library-filter-bar";

interface Props {
  search: string;
  filter: LibraryFilterState;
  availableTopics: string[];
  availableUserTags: string[];
  availableCollaborationYears: CollaborationTimeOption[];
  visibleColumns: Set<ToggleableColumnId>;
  onSearch: (s: string) => void;
  onToggleDimension: (dimension: FilterDimensionId, value: string) => void;
  onToggleColumn: (column: ToggleableColumnId) => void;
  onReset: () => void;
  onAddCreator: () => void;
  hasAny: boolean;
  // 工具栏中部插槽：选中博主时由外层把 LibraryBulkBar 注入到这里，
  // 占据「左侧按钮组」与「右侧搜索框」之间的水平空白。
  middleSlot?: React.ReactNode;
}

// 工具栏：CTA 实心 8px 圆角；次级操作（字段配置 / 筛选）改成无边框透明按钮，
// hover 时浅灰底；搜索框靠右、融入卡片底色（cream）。
export function LibraryToolbar(props: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button
        unstyled
        type="button"
        onClick={props.onAddCreator}
        className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#ff4f00] px-3 text-[13px] font-medium text-[#fffefb] transition-colors hover:bg-[#ff4f00]"
      >
        <Plus className="h-3.5 w-3.5" />
        添加网红
      </Button>

      <ColumnConfig visibleColumns={props.visibleColumns} onToggleColumn={props.onToggleColumn} />

      <LibraryFilterBar
        visibleColumns={props.visibleColumns}
        filter={props.filter}
        availableTopics={props.availableTopics}
        availableUserTags={props.availableUserTags}
        availableCollaborationYears={props.availableCollaborationYears}
        onToggleDimension={props.onToggleDimension}
        onReset={props.onReset}
      />

      {props.middleSlot && <div className="mx-3 min-w-0 flex-1">{props.middleSlot}</div>}

      <div className={cn("relative w-[220px]", !props.middleSlot && "ml-auto")}>
        <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[#939084]" />
        <input
          value={props.search}
          onChange={(event) => props.onSearch(event.target.value)}
          placeholder="搜索博主名 / 标签..."
          className="h-8 w-full rounded-lg border border-[#eceae3] bg-[#fffdf9] pr-3 pl-9 text-[13px] text-[#201515] outline-none placeholder:text-[#939084] focus:border-[#ff4f00]"
        />
      </div>

      {props.hasAny && (
        <Button
          unstyled
          type="button"
          onClick={props.onReset}
          className="inline-flex items-center gap-1 text-[12px] text-[#939084] hover:text-[#36342e]"
        >
          <X className="h-3 w-3" /> 重置筛选
        </Button>
      )}
    </div>
  );
}

function ColumnConfig({
  visibleColumns,
  onToggleColumn,
}: {
  visibleColumns: Set<ToggleableColumnId>;
  onToggleColumn: (column: ToggleableColumnId) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button
        unstyled
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-8 items-center gap-1 rounded-lg bg-transparent px-2.5 text-[13px] text-[#36342e] transition-colors hover:bg-[#fffdf9]"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        字段配置
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute z-20 mt-1.5 min-w-[200px] overflow-hidden rounded-lg border border-[#c5c0b1] bg-[#fffefb] py-1.5">
            <div className="px-3 pt-1 pb-1 text-[10px] tracking-wide text-[#939084] uppercase">
              选择要显示的列
            </div>
            {TOGGLEABLE_COLUMNS.map((column) => {
              const checked = visibleColumns.has(column);
              return (
                <Button
                  unstyled
                  key={column}
                  type="button"
                  onClick={() => onToggleColumn(column)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-3 py-1.5 text-[12px]",
                    checked ? "bg-[#fff7f4] text-[#ff4f00]" : "text-[#36342e] hover:bg-[#fffdf9]",
                  )}
                >
                  <span>{COLUMN_LABEL[column]}</span>
                  {checked && <span aria-hidden="true">✓</span>}
                </Button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
