// 博主库视图层类型 —— UI 专用扩展，不要复制 types/api.ts 中已有的字段。
//
// LibraryViewRow 的存在意义：在 "全部博主" 视角下，单条博主可能跨多个项目；
// 列表行需要预先算好 "当前桶下要展示的状态 / 评级 / 项目数" 等派生数据。

import type { CollaborationStatus, Creator, CreatorCategory, Rating } from "@/types/api";

export type LibraryScope = "project" | "all";

// 7 个合作状态 + "全部"。每个 tab 直接对应 CollaborationStatus 的一个值，
// 不再做分桶聚合 —— 用户在状态下拉里看到什么，tab 上就有什么。
export type StatusTab = "all" | CollaborationStatus;

export type LibraryViewRow = {
  creator: Creator;
  // 在当前 scope 下展示的状态：scope=project 时取 collaborations 中匹配项目的 status；
  // scope=all 时取 dominantStatus()
  displayStatus: CollaborationStatus | null;
  // scope=all 时显示参与项目数；scope=project 时为 1
  projectCount: number;
  // 当前评级（直接从 creator.rating 复制，方便排序）
  rating: Rating;
};

export type LibraryFilterState = {
  search: string;
  // 类型化字段：值集合受 types/api.ts 约束。
  sources: Creator["source"][];
  categories: CreatorCategory[];
  ratings: Rating[];
  // 系统话题词（content topics）。
  topics: string[];
  // 用户自定义标签。
  userTags: string[];
  // 桶字段：每个值是 features/library/data/filter-buckets.ts 中定义的 bucket id。
  engagement: string[];
  medianViews: string[];
  avgLikes: string[];
  // 合作时间：按年份 / 月份存储筛选值，例如 "year:2026"、"month:04"。
  collaboration: string[];
  notes: string[];
  email: string[];
  collaborationCount: string[];
};

export type LibrarySelectionState = {
  ids: Set<string>;
};
