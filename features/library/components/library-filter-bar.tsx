"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Filter, X } from "lucide-react";
import type { Creator, CreatorCategory, Rating } from "@/types/api";
import { CREATOR_CATEGORY_LABEL, CREATOR_SOURCE_LABEL } from "@/lib/creator";
import { cn } from "@/lib/utils";
import {
  COLUMN_BY_FILTER_DIMENSION,
  type FilterDimensionId,
  type ToggleableColumnId,
} from "@/features/library/hooks/use-library-columns";
import { BUCKET_REGISTRY } from "@/features/library/data/filter-buckets";
import {
  COLLABORATION_MONTH_OPTIONS,
  type CollaborationTimeOption,
} from "@/features/library/data/collaboration-time-filter";
import type { LibraryFilterState } from "@/features/library/types";
import { RATING_LABELS, RatingStars } from "./rating-stars";

const ALL_RATINGS: Rating[] = [3, 2, 1];
const ALL_SOURCES: Creator["source"][] = ["plugin", "search", "manual", "referral"];
const ALL_CATEGORIES: CreatorCategory[] = [
  "beauty",
  "skincare",
  "fashion",
  "food",
  "travel",
  "vlog",
  "fitness",
  "parenting",
  "tech",
  "home",
  "review",
  "education",
  "comedy",
  "other",
];

interface Props {
  visibleColumns: Set<ToggleableColumnId>;
  filter: LibraryFilterState;
  // 系统话题词 + 用户标签是两个独立维度，候选项也分两个列表传进来。
  availableTopics: string[];
  availableUserTags: string[];
  availableCollaborationYears: CollaborationTimeOption[];
  onToggleDimension: (dimension: FilterDimensionId, value: string) => void;
  onReset: () => void;
}

interface DimensionOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface DimensionConfig {
  id: FilterDimensionId;
  label: string;
  options: DimensionOption[];
  sections?: { label: string; options: DimensionOption[] }[];
  selected: string[];
}

export function LibraryFilterBar(props: Props) {
  const [open, setOpen] = useState(false);
  const [activeDimension, setActiveDimension] = useState<FilterDimensionId>("categories");

  // 完整维度定义。下方 useMemo 会按 visibleColumns 过滤出真正可用的维度。
  // 每个维度的顺序和字段配置面板里的列顺序保持一致，方便用户对齐。
  const allDimensions: DimensionConfig[] = useMemo(() => {
    const f = props.filter;
    const collaborationSections = [
      { label: "年份", options: props.availableCollaborationYears },
      { label: "月份", options: COLLABORATION_MONTH_OPTIONS },
    ];

    return [
      {
        id: "categories",
        label: "类型",
        options: ALL_CATEGORIES.map((c) => ({ value: c, label: CREATOR_CATEGORY_LABEL[c] })),
        selected: f.categories,
      },
      {
        id: "ratings",
        label: "评级",
        options: ALL_RATINGS.map((r) => ({
          value: String(r),
          label: RATING_LABELS[r],
          icon: <RatingStars value={r} size="sm" />,
        })),
        selected: f.ratings.map(String),
      },
      {
        id: "engagement",
        label: "互动率",
        options: BUCKET_REGISTRY.engagement.map((b) => ({ value: b.id, label: b.label })),
        selected: f.engagement,
      },
      {
        id: "medianViews",
        label: "均播放",
        options: BUCKET_REGISTRY.medianViews.map((b) => ({ value: b.id, label: b.label })),
        selected: f.medianViews,
      },
      {
        id: "avgLikes",
        label: "均点赞",
        options: BUCKET_REGISTRY.avgLikes.map((b) => ({ value: b.id, label: b.label })),
        selected: f.avgLikes,
      },
      {
        id: "sources",
        label: "来源",
        options: ALL_SOURCES.map((s) => ({ value: s, label: CREATOR_SOURCE_LABEL[s] })),
        selected: f.sources,
      },
      {
        id: "topics",
        label: "话题词",
        options: props.availableTopics.map((tag) => ({ value: tag, label: tag })),
        selected: f.topics,
      },
      {
        id: "userTags",
        label: "标签",
        options: props.availableUserTags.map((tag) => ({ value: tag, label: tag })),
        selected: f.userTags,
      },
      {
        id: "collaboration",
        label: "合作时间",
        options: collaborationSections.flatMap((section) => section.options),
        sections: collaborationSections,
        selected: f.collaboration,
      },
      {
        id: "notes",
        label: "备注",
        options: BUCKET_REGISTRY.notes.map((b) => ({ value: b.id, label: b.label })),
        selected: f.notes,
      },
      {
        id: "email",
        label: "邮箱",
        options: BUCKET_REGISTRY.email.map((b) => ({ value: b.id, label: b.label })),
        selected: f.email,
      },
      {
        id: "collaborationCount",
        label: "合作次数",
        options: BUCKET_REGISTRY.collaborationCount.map((b) => ({
          value: b.id,
          label: b.label,
        })),
        selected: f.collaborationCount,
      },
    ];
  }, [
    props.filter,
    props.availableTopics,
    props.availableUserTags,
    props.availableCollaborationYears,
  ]);

  // 字段配置同步：只展示对应列被勾选的维度。
  const dimensions = useMemo(
    () =>
      allDimensions.filter((dim) => props.visibleColumns.has(COLUMN_BY_FILTER_DIMENSION[dim.id])),
    [allDimensions, props.visibleColumns],
  );

  // 直接在渲染期算出 active：当 activeDimension 对应的列被关掉时，回退到第一个
  // 可用维度即可——不需要 setState in effect 来同步派生状态。
  const totalSelected = dimensions.reduce((sum, d) => sum + d.selected.length, 0);
  const active = dimensions.find((d) => d.id === activeDimension) ?? dimensions[0];

  const chips = dimensions.flatMap((dim) =>
    dim.selected.map((value) => {
      const option = dim.options.find((o) => o.value === value);
      return {
        key: `${dim.id}:${value}`,
        dimensionLabel: dim.label,
        valueLabel: option?.label ?? value,
        onRemove: () => props.onToggleDimension(dim.id, value),
      };
    }),
  );

  const noDimensions = dimensions.length === 0;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          disabled={noDimensions}
          title={noDimensions ? "请在字段配置中开启至少一个可筛选列" : undefined}
          className={cn(
            "inline-flex h-8 items-center gap-1 rounded-full border px-3 text-[12px] transition-colors",
            noDimensions && "cursor-not-allowed opacity-50",
            !noDimensions && totalSelected > 0
              ? "border-[#ff4f00] bg-[#fff7f4] text-[#ff4f00]"
              : "border-[#c5c0b1] bg-[#fffefb] text-[#36342e] hover:bg-[#fffdf9]",
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          <span>筛选</span>
          {totalSelected > 0 && <span className="font-semibold">· {totalSelected}</span>}
          <ChevronDown className="h-3 w-3" />
        </button>
        {open && active && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
            <div className="absolute z-20 mt-1.5 flex w-[480px] overflow-hidden rounded-xl border border-[#c5c0b1] bg-[#fffefb]">
              <div className="max-h-[320px] w-[140px] shrink-0 overflow-y-auto border-r border-[#c5c0b1] bg-[#fffdf9] py-1.5">
                <div className="px-3 pt-1 pb-1 text-[10px] tracking-wide text-[#939084] uppercase">
                  筛选维度
                </div>
                {dimensions.map((dim) => {
                  const isActive = dim.id === active.id;
                  return (
                    <button
                      key={dim.id}
                      type="button"
                      onClick={() => setActiveDimension(dim.id)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-[12px]",
                        isActive
                          ? "bg-[#fffefb] font-medium text-[#ff4f00]"
                          : "text-[#36342e] hover:bg-[#fffefb]",
                      )}
                    >
                      <span>{dim.label}</span>
                      {dim.selected.length > 0 && (
                        <span
                          className={cn(
                            "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold",
                            isActive
                              ? "bg-[#fff7f4] text-[#ff4f00]"
                              : "bg-[#c5c0b1] text-[#939084]",
                          )}
                        >
                          {dim.selected.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="flex-1 py-1.5">
                <div className="flex items-center justify-between px-3 pt-1 pb-1">
                  <span className="text-[10px] tracking-wide text-[#939084] uppercase">
                    {active.label}
                  </span>
                  {totalSelected > 0 && (
                    <button
                      type="button"
                      onClick={props.onReset}
                      className="text-[11px] text-[#939084] hover:text-[#ff4f00]"
                    >
                      清空全部
                    </button>
                  )}
                </div>
                <div className="max-h-[280px] overflow-y-auto">
                  {active.options.length === 0 && (
                    <div className="px-3 py-2 text-[12px] text-[#939084]">暂无选项</div>
                  )}
                  {(active.sections ?? [{ label: "", options: active.options }]).map((section) => {
                    if (section.options.length === 0) return null;
                    return (
                      <div key={`${active.id}:${section.label || "options"}`}>
                        {active.sections && (
                          <div className="px-3 pt-2 pb-1 text-[10px] tracking-wide text-[#939084] uppercase">
                            {section.label}
                          </div>
                        )}
                        {section.options.map((option) => {
                          const selected = active.selected.includes(option.value);
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => props.onToggleDimension(active.id, option.value)}
                              className={cn(
                                "flex w-full items-center justify-between gap-2 px-3 py-1.5 text-[12px]",
                                selected
                                  ? "bg-[#fff7f4] text-[#ff4f00]"
                                  : "text-[#36342e] hover:bg-[#fffdf9]",
                              )}
                            >
                              <span className="flex items-center gap-2">
                                {option.icon}
                                {option.label}
                              </span>
                              {selected && <span aria-hidden="true">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex h-7 items-center gap-1 rounded-full border border-[#c5c0b1] bg-[#fff7f4] pr-1 pl-2.5 text-[11px] text-[#ff4f00]"
        >
          <span className="text-[#939084]">{chip.dimensionLabel}</span>
          <span>·</span>
          <span className="font-medium">{chip.valueLabel}</span>
          <button
            type="button"
            onClick={chip.onRemove}
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[#ff4f00] hover:bg-[#c5c0b1]"
            aria-label={`移除筛选 ${chip.dimensionLabel}: ${chip.valueLabel}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  );
}
