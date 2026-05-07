import type {
  CollaborationStatus,
  CreatorRelationship,
  CreatorSource,
  StatusBucket,
} from "../types";

// ── Status (workflow position in a single project) ───────────────────────────
export const STATUS_LABEL: Record<CollaborationStatus, string> = {
  pending: "待评估",
  queued: "待建联",
  contacted: "已建联",
  responding: "已回复",
  negotiating: "谈判中",
  collaborating: "合作中",
  completed: "已完成",
  excluded: "已排除",
};

export const STATUS_BADGE: Record<CollaborationStatus, { badge: string; dot: string }> = {
  pending: { badge: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-400" },
  queued: { badge: "bg-violet-50 text-violet-700 border-violet-200", dot: "bg-violet-400" },
  contacted: { badge: "bg-sky-50 text-sky-700 border-sky-200", dot: "bg-sky-400" },
  responding: { badge: "bg-cyan-50 text-cyan-700 border-cyan-200", dot: "bg-cyan-400" },
  negotiating: { badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-400" },
  collaborating: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-400",
  },
  completed: { badge: "bg-[#eceae3] text-[#939084] border-[#c5c0b1]", dot: "bg-[#c5c0b1]" },
  excluded: { badge: "bg-red-50 text-red-400 border-red-100", dot: "bg-red-300" },
};

// Phase 1 user-selectable options. Phase 2 unlocks responding & negotiating.
export const STATUS_OPTIONS: CollaborationStatus[] = [
  "pending",
  "queued",
  "contacted",
  "collaborating",
  "completed",
  "excluded",
];

// ── Bucket → which statuses belong to it ─────────────────────────────────────
export const BUCKET_STATUSES: Record<StatusBucket, CollaborationStatus[]> = {
  all: [
    "pending",
    "queued",
    "contacted",
    "responding",
    "negotiating",
    "collaborating",
    "completed",
    "excluded",
  ],
  pending_followup: ["pending", "queued"],
  in_progress: ["contacted", "responding", "negotiating", "collaborating"],
  archived: ["completed"],
  excluded: ["excluded"],
};

export const BUCKET_LABEL: Record<StatusBucket, string> = {
  all: "全部",
  pending_followup: "待跟进",
  in_progress: "进行中",
  archived: "归档",
  excluded: "已排除",
};

export const BUCKET_HINT: Record<StatusBucket, string> = {
  all: "全部博主",
  pending_followup: "待评估 · 待建联",
  in_progress: "已建联 · 合作中",
  archived: "已完成",
  excluded: "已排除",
};

export const BUCKET_ORDER: StatusBucket[] = [
  "all",
  "pending_followup",
  "in_progress",
  "archived",
  "excluded",
];

// ── Relationship (cumulative across all projects) ────────────────────────────
export const RELATIONSHIP_LABEL: Record<CreatorRelationship, string> = {
  cold: "👋 冷",
  warm: "🌱 温",
  hot: "🔥 热",
  partner: "🤝 合作伙伴",
  inactive: "💤 沉默",
};

export const RELATIONSHIP_BADGE: Record<CreatorRelationship, string> = {
  cold: "bg-[#eceae3] text-[#939084] border-[#c5c0b1]",
  warm: "bg-amber-50 text-amber-700 border-amber-200",
  hot: "bg-orange-50 text-orange-700 border-orange-200",
  partner: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-[#eceae3] text-[#c5c0b1] border-[#c5c0b1]",
};

// ── Source ───────────────────────────────────────────────────────────────────
export const SOURCE_LABEL: Record<CreatorSource, string> = {
  plugin: "插件收藏",
  search: "搜索收藏",
  manual: "手动导入",
  referral: "他人推荐",
};

export const SOURCE_OPTIONS: CreatorSource[] = ["plugin", "search", "manual", "referral"];
