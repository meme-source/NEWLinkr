"use client";

import { useCallback, useMemo, useState } from "react";
import type { Creator, CreatorCategory, Rating } from "@/types/api";
import type { LibraryFilterState } from "@/features/library/types";
import type {
  FilterDimensionId,
  ToggleableColumnId,
} from "@/features/library/hooks/use-library-columns";
import { BUCKET_REGISTRY, matchBuckets } from "@/features/library/data/filter-buckets";
import { matchCollaborationTime } from "@/features/library/data/collaboration-time-filter";

const EMPTY_FILTER: LibraryFilterState = {
  search: "",
  sources: [],
  categories: [],
  ratings: [],
  topics: [],
  userTags: [],
  engagement: [],
  medianViews: [],
  avgLikes: [],
  collaboration: [],
  notes: [],
  email: [],
  collaborationCount: [],
};

// 字符串数组的"切换"操作，所有维度复用同一份 helper。
function toggleInArray<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export function useLibraryFilter() {
  const [state, setState] = useState<LibraryFilterState>(EMPTY_FILTER);

  const setSearch = useCallback((search: string) => {
    setState((prev) => ({ ...prev, search }));
  }, []);

  // 统一的维度切换入口：filter bar 不需要为每个维度暴露独立 prop。
  // 类型化维度（categories/sources/ratings）在这里把 string 转回原始类型。
  const toggleDimension = useCallback((dimension: FilterDimensionId, value: string) => {
    setState((prev) => {
      switch (dimension) {
        case "categories":
          return { ...prev, categories: toggleInArray(prev.categories, value as CreatorCategory) };
        case "sources":
          return { ...prev, sources: toggleInArray(prev.sources, value as Creator["source"]) };
        case "ratings":
          return { ...prev, ratings: toggleInArray(prev.ratings, Number(value) as Rating) };
        case "topics":
        case "userTags":
        case "engagement":
        case "medianViews":
        case "avgLikes":
        case "collaboration":
        case "notes":
        case "email":
        case "collaborationCount":
          return { ...prev, [dimension]: toggleInArray(prev[dimension], value) };
      }
    });
  }, []);

  const reset = useCallback(() => setState(EMPTY_FILTER), []);

  const hasAny = useMemo(
    () =>
      state.search.length > 0 ||
      state.sources.length > 0 ||
      state.categories.length > 0 ||
      state.ratings.length > 0 ||
      state.topics.length > 0 ||
      state.userTags.length > 0 ||
      state.engagement.length > 0 ||
      state.medianViews.length > 0 ||
      state.avgLikes.length > 0 ||
      state.collaboration.length > 0 ||
      state.notes.length > 0 ||
      state.email.length > 0 ||
      state.collaborationCount.length > 0,
    [state],
  );

  return { state, setSearch, toggleDimension, reset, hasAny };
}

// 给定一组 creators，过滤出符合 filter 状态的子集（不依赖 React，方便测试）。
//
// visibleColumns 同步字段配置：当某列被关闭时（比如用户隐藏了 "类型"），
// 即使 filter.categories 仍存有值，也跳过该维度——保持 UI 与底层逻辑一致。
// 不传 visibleColumns（或传 undefined）等同于"全部启用"，便于单元测试与服务端复用。
export function applyLibraryFilter(
  creators: Creator[],
  filter: LibraryFilterState,
  visibleColumns?: Set<ToggleableColumnId>,
): Creator[] {
  const isActive = (column: ToggleableColumnId): boolean =>
    visibleColumns === undefined || visibleColumns.has(column);

  const search = filter.search.trim().toLowerCase();
  return creators.filter((c) => {
    if (search) {
      // 搜索覆盖：handle + 姓名 + 系统话题词 + 用户标签。
      const haystack =
        `${c.handle} ${c.name} ${c.topics.join(" ")} ${c.userTags.join(" ")}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    // 类型化维度
    if (
      isActive("category") &&
      filter.categories.length > 0 &&
      !filter.categories.includes(c.category)
    ) {
      return false;
    }
    if (isActive("source") && filter.sources.length > 0 && !filter.sources.includes(c.source)) {
      return false;
    }
    if (isActive("rating") && filter.ratings.length > 0 && !filter.ratings.includes(c.rating)) {
      return false;
    }
    if (
      isActive("topics") &&
      filter.topics.length > 0 &&
      !filter.topics.some((t) => c.topics.includes(t))
    ) {
      return false;
    }
    if (
      isActive("userTags") &&
      filter.userTags.length > 0 &&
      !filter.userTags.some((t) => c.userTags.includes(t))
    ) {
      return false;
    }

    // 桶维度：每个 column 对应 BUCKET_REGISTRY 里的一个分桶集。
    // 合作时间单独按年份 / 月份匹配，不再走相对时间分桶。
    if (isActive("engagement") && !matchBuckets(c, BUCKET_REGISTRY.engagement, filter.engagement)) {
      return false;
    }
    if (
      isActive("medianViews") &&
      !matchBuckets(c, BUCKET_REGISTRY.medianViews, filter.medianViews)
    ) {
      return false;
    }
    if (isActive("avgLikes") && !matchBuckets(c, BUCKET_REGISTRY.avgLikes, filter.avgLikes)) {
      return false;
    }
    if (isActive("collaboration") && !matchCollaborationTime(c, filter.collaboration)) {
      return false;
    }
    if (isActive("notes") && !matchBuckets(c, BUCKET_REGISTRY.notes, filter.notes)) {
      return false;
    }
    if (isActive("email") && !matchBuckets(c, BUCKET_REGISTRY.email, filter.email)) {
      return false;
    }
    if (
      isActive("collaborationCount") &&
      !matchBuckets(c, BUCKET_REGISTRY.collaborationCount, filter.collaborationCount)
    ) {
      return false;
    }

    return true;
  });
}
