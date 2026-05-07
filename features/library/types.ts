// Phase 1 CRM types for the creator library.
// Single source of truth for status, relationship, collaboration shape used by:
//   - features/library/data/* (mock data)
//   - features/library/helpers/* (status & relationship helpers)
//   - features/library/components/* (table, toolbar, modals)
//   - features/creator/components/creator-profile-drawer (5-tab drawer)

import type { Platform } from "@/types/api";

// ── Status (English keys, mapped to Chinese display labels via status-config) ─
// Phase 1 actively uses: pending / queued / contacted / collaborating / completed / excluded.
// responding & negotiating are Phase 2 placeholders kept in the union so data
// migration and bucket logic do not need a second pass when Phase 2 lands.
export type CollaborationStatus =
  | "pending"
  | "queued"
  | "contacted"
  | "responding"
  | "negotiating"
  | "collaborating"
  | "completed"
  | "excluded";

export type CreatorRelationship = "cold" | "warm" | "hot" | "partner" | "inactive";

export type CreatorSource = "plugin" | "search" | "manual" | "referral";

// ── Status buckets (5 tabs across the top of the table) ──────────────────────
export type StatusBucket = "all" | "pending_followup" | "in_progress" | "archived" | "excluded";

// ── Per-project collaboration record (one creator × one project = one record) ─
export interface Collaboration {
  id: string;
  projectId: string;
  status: CollaborationStatus;
  joinedAt: string;
  lastContactAt: string | null;
  trackedContentIds: string[];
  cost: number | null;
  notes: string;
}

// ── Timeline event (auto-emitted by status changes / outreach actions) ───────
export type TimelineEventType =
  | "status_change"
  | "email_sent"
  | "email_replied"
  | "tracked_added"
  | "manual";

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  at: string;
  summary: string;
  projectId?: string;
}

// ── Creator (CRM-shaped) ──────────────────────────────────────────────────────
export interface LibraryCreator {
  // identity
  id: string;
  handle: string;
  name: string;
  platform: Platform;
  region: string;
  avatarUrl: string;

  // metrics
  followers: number;
  avgViews: number;
  avgLikes: number;
  engagementRate: number;

  // CRM
  owner: string | null;
  relationship: CreatorRelationship;
  source: CreatorSource;
  tags: string[];
  lastContactAt: string | null;
  lastResponseAt: string | null;
  nextFollowUp: string | null;
  addedAt: string;

  // contact
  emails: string[];
  dms: Partial<Record<Platform, string>>;
  socialLinks: string[];

  // sidecar collaboration history (one per project the creator is in)
  collaborations: Collaboration[];

  // freeform notes (Phase 1 plain text)
  notes: string;

  // optional event log; if omitted, drawer derives a minimal one from status changes
  timeline?: TimelineEvent[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Destination-restored 2026-05-07 — UI-layer types previously declared in
// features/library/types.ts before the bundle overwrite. They sit on top of
// the api-side `CollaborationStatus` (7-value union in types/api.ts) and are
// independent of the bundle's local CollaborationStatus declared above.
// Aliased import avoids duplicate-identifier collision with bundle's version.
// ─────────────────────────────────────────────────────────────────────────────
import type {
  CollaborationStatus as ApiCollaborationStatus,
  Creator as ApiCreator,
  CreatorCategory,
  Rating,
} from "@/types/api";

export type LibraryScope = "project" | "all";

// 7 个合作状态 + "全部"。每个 tab 直接对应 api 的 CollaborationStatus 的一个值，
// 不再做分桶聚合 —— 用户在状态下拉里看到什么，tab 上就有什么。
export type StatusTab = "all" | ApiCollaborationStatus;

export type LibraryViewRow = {
  creator: ApiCreator;
  // 在当前 scope 下展示的状态：scope=project 时取 collaborations 中匹配项目的 status；
  // scope=all 时取 dominantStatus()
  displayStatus: ApiCollaborationStatus | null;
  // scope=all 时显示参与项目数；scope=project 时为 1
  projectCount: number;
  // 当前评级（直接从 creator.rating 复制，方便排序）
  rating: Rating;
};

export type LibraryFilterState = {
  search: string;
  // 类型化字段：值集合受 types/api.ts 约束。
  sources: ApiCreator["source"][];
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
