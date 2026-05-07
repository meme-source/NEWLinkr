// 数值 / 时间 / 是否型筛选维度的预设分桶。
//
// 设计原则：
//   - 每个 bucket 自带 match(creator) 谓词，apply 阶段不再 switch
//   - 所有 bucket id 都是字符串，方便和 LibraryFilterState 里的 string[] 对齐
//   - 多选语义：选中多个桶时取并集（命中任一即可）
//
// 这里只放 React 无关的纯数据，方便单元测试 + 服务端复用。

import type { Creator } from "@/types/api";

export interface FilterBucket {
  id: string;
  label: string;
  match: (creator: Creator) => boolean;
}

// ── 互动率 (engagementRate, %) ────────────────────────────────────────────────
export const ENGAGEMENT_BUCKETS: FilterBucket[] = [
  { id: "lt1", label: "< 1%", match: (c) => c.engagementRate < 1 },
  { id: "1-3", label: "1% - 3%", match: (c) => c.engagementRate >= 1 && c.engagementRate < 3 },
  { id: "3-5", label: "3% - 5%", match: (c) => c.engagementRate >= 3 && c.engagementRate < 5 },
  { id: "5-10", label: "5% - 10%", match: (c) => c.engagementRate >= 5 && c.engagementRate < 10 },
  { id: "gt10", label: "≥ 10%", match: (c) => c.engagementRate >= 10 },
];

// ── 均播放 (medianViews) ──────────────────────────────────────────────────────
export const MEDIAN_VIEWS_BUCKETS: FilterBucket[] = [
  { id: "lt1k", label: "< 1K", match: (c) => c.medianViews < 1_000 },
  {
    id: "1k-10k",
    label: "1K - 10K",
    match: (c) => c.medianViews >= 1_000 && c.medianViews < 10_000,
  },
  {
    id: "10k-100k",
    label: "10K - 100K",
    match: (c) => c.medianViews >= 10_000 && c.medianViews < 100_000,
  },
  {
    id: "100k-1m",
    label: "100K - 1M",
    match: (c) => c.medianViews >= 100_000 && c.medianViews < 1_000_000,
  },
  { id: "gt1m", label: "≥ 1M", match: (c) => c.medianViews >= 1_000_000 },
];

// 均点赞 ≈ medianViews × engagementRate / 100。后端真实数据接通后请改为读取真实字段。
function avgLikes(c: Creator): number {
  if (!c.medianViews || !c.engagementRate) return 0;
  return Math.round((c.medianViews * c.engagementRate) / 100);
}

export const AVG_LIKES_BUCKETS: FilterBucket[] = [
  { id: "lt100", label: "< 100", match: (c) => avgLikes(c) < 100 },
  { id: "100-1k", label: "100 - 1K", match: (c) => avgLikes(c) >= 100 && avgLikes(c) < 1_000 },
  {
    id: "1k-10k",
    label: "1K - 10K",
    match: (c) => avgLikes(c) >= 1_000 && avgLikes(c) < 10_000,
  },
  { id: "gt10k", label: "≥ 10K", match: (c) => avgLikes(c) >= 10_000 },
];

// ── 合作时间 ──────────────────────────────────────────────────────────────────
// 数据底层仍然是 lastContactAt（建联时间）；UI 上对外表述为"合作时间"。
function daysSinceLastContact(c: Creator): number | null {
  if (!c.lastContactAt) return null;
  const then = new Date(c.lastContactAt).getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((Date.now() - then) / 86_400_000);
}

export const LAST_CONTACT_BUCKETS: FilterBucket[] = [
  {
    id: "7d",
    label: "7 天内",
    match: (c) => {
      const d = daysSinceLastContact(c);
      return d !== null && d <= 7;
    },
  },
  {
    id: "30d",
    label: "8 - 30 天",
    match: (c) => {
      const d = daysSinceLastContact(c);
      return d !== null && d > 7 && d <= 30;
    },
  },
  {
    id: "90d",
    label: "31 - 90 天",
    match: (c) => {
      const d = daysSinceLastContact(c);
      return d !== null && d > 30 && d <= 90;
    },
  },
  {
    id: "gt90d",
    label: "超过 90 天",
    match: (c) => {
      const d = daysSinceLastContact(c);
      return d !== null && d > 90;
    },
  },
  { id: "never", label: "尚未合作", match: (c) => daysSinceLastContact(c) === null },
];

// ── 备注（任一 collab 中存在非空 notes） ─────────────────────────────────────
function hasNotes(c: Creator): boolean {
  return c.collaborations.some((collab) => Boolean(collab.notes && collab.notes.trim()));
}

export const NOTES_BUCKETS: FilterBucket[] = [
  { id: "has", label: "有备注", match: hasNotes },
  { id: "none", label: "无备注", match: (c) => !hasNotes(c) },
];

// ── 邮箱 ──────────────────────────────────────────────────────────────────────
export const EMAIL_BUCKETS: FilterBucket[] = [
  { id: "has", label: "有邮箱", match: (c) => c.emails.length > 0 },
  { id: "none", label: "无邮箱", match: (c) => c.emails.length === 0 },
];

// ── 合作次数 ──────────────────────────────────────────────────────────────────
export const COLLABORATION_COUNT_BUCKETS: FilterBucket[] = [
  { id: "0", label: "0 次", match: (c) => c.collaborations.length === 0 },
  { id: "1", label: "1 次", match: (c) => c.collaborations.length === 1 },
  {
    id: "2-5",
    label: "2 - 5 次",
    match: (c) => c.collaborations.length >= 2 && c.collaborations.length <= 5,
  },
  { id: "gt5", label: "5 次以上", match: (c) => c.collaborations.length > 5 },
];

// 集中导出：bucket dimension id → bucket 列表。apply 阶段直接 lookup。
export const BUCKET_REGISTRY = {
  engagement: ENGAGEMENT_BUCKETS,
  medianViews: MEDIAN_VIEWS_BUCKETS,
  avgLikes: AVG_LIKES_BUCKETS,
  collaboration: LAST_CONTACT_BUCKETS,
  notes: NOTES_BUCKETS,
  email: EMAIL_BUCKETS,
  collaborationCount: COLLABORATION_COUNT_BUCKETS,
} as const;

export type BucketDimensionId = keyof typeof BUCKET_REGISTRY;

// 给定一组已选 bucket ids，命中其中任一即匹配（多选并集）。
export function matchBuckets(
  creator: Creator,
  buckets: readonly FilterBucket[],
  selectedIds: readonly string[],
): boolean {
  if (selectedIds.length === 0) return true;
  return buckets.some((b) => selectedIds.includes(b.id) && b.match(creator));
}
