"use client";

import { useCallback, useEffect, useState } from "react";

// 字段配置：博主库表格中可由用户开关的列。
// 几个固定列（选择 / 博主 / 操作 / 推广活动）不在此 Set 中——前者一直可见，
// 后者仅在 scope === "all" 时由表格自行决定是否渲染。
export const TOGGLEABLE_COLUMNS = [
  "category",
  "status",
  "rating",
  "engagement",
  "medianViews",
  "avgLikes",
  "source",
  // 系统话题词（content topics）。
  "topics",
  // 用户自定义标签。
  "userTags",
  "collaboration",
  "notes",
  "email",
  "collaborationCount",
] as const;

export type ToggleableColumnId = (typeof TOGGLEABLE_COLUMNS)[number];

export const COLUMN_LABEL: Record<ToggleableColumnId, string> = {
  category: "类型",
  status: "状态",
  rating: "评级",
  engagement: "互动率",
  medianViews: "均播放",
  avgLikes: "均点赞",
  source: "来源",
  topics: "话题词",
  userTags: "标签",
  collaboration: "合作时间",
  notes: "备注",
  email: "邮箱",
  collaborationCount: "合作次数",
};

// 字段配置 ↔ 筛选维度 的对照表。
//   - 字段配置里勾上某列 → 筛选维度面板里出现对应项
//   - 取消勾选          → 筛选项隐藏 + applyLibraryFilter 也跳过该维度
// 状态列不在这里：状态由表格上方的 status tabs 单独承载，避免双入口冲突。
// 如需新增筛选维度，请同时在这里登记，否则筛选不会生效。
export const FILTER_DIMENSION_BY_COLUMN = {
  category: "categories",
  source: "sources",
  rating: "ratings",
  topics: "topics",
  userTags: "userTags",
  engagement: "engagement",
  medianViews: "medianViews",
  avgLikes: "avgLikes",
  collaboration: "collaboration",
  notes: "notes",
  email: "email",
  collaborationCount: "collaborationCount",
} as const;

export type FilterDimensionId =
  (typeof FILTER_DIMENSION_BY_COLUMN)[keyof typeof FILTER_DIMENSION_BY_COLUMN];

export const COLUMN_BY_FILTER_DIMENSION: Record<FilterDimensionId, ToggleableColumnId> = {
  categories: "category",
  sources: "source",
  ratings: "rating",
  topics: "topics",
  userTags: "userTags",
  engagement: "engagement",
  medianViews: "medianViews",
  avgLikes: "avgLikes",
  collaboration: "collaboration",
  notes: "notes",
  email: "email",
  collaborationCount: "collaborationCount",
};

const DEFAULT_VISIBLE: Set<ToggleableColumnId> = new Set([
  "category",
  "status",
  "rating",
  "topics",
  "notes",
]);

// v5: 默认勾选收敛到 类型/状态/评级/话题词/备注 五项；旧版本的本地配置会被覆盖。
const STORAGE_KEY = "2linkr:library-columns:v5";

function readStored(): Set<ToggleableColumnId> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const filtered = parsed.filter((value): value is ToggleableColumnId =>
      (TOGGLEABLE_COLUMNS as readonly string[]).includes(value as string),
    );
    return new Set(filtered);
  } catch (error) {
    console.warn("Failed to read library column config", error);
    return null;
  }
}

export function useLibraryColumns() {
  const [visible, setVisible] = useState<Set<ToggleableColumnId>>(DEFAULT_VISIBLE);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const stored = readStored();
    if (stored) setVisible(stored);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(visible)));
    } catch (error) {
      console.warn("Failed to persist library column config", error);
    }
  }, [visible]);

  const toggle = useCallback((id: ToggleableColumnId) => {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const reset = useCallback(() => setVisible(new Set(DEFAULT_VISIBLE)), []);

  return { visible, toggle, reset };
}
