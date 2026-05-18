// Chat-driven discovery types — mirror the v2.0 spec (Discovery Page v2).
// Backend is stubbed; these types describe the shape produced by the
// simulated streaming flow in `data/chat-flow.ts`.

import type { PlatformId } from "./types";

// `lowFollower` 暂时是 trending 的 UI 别名 —— 入口卡片单独展示「找低粉爆款
// 达人」，点击后下游 agent 流程沿用 trending 分支（详见 intent-hero.ts、
// agent-steps.ts 里的 lowFollower → trending 映射）。
export type ChatIntent = "competitor" | "scenario" | "trending" | "lowFollower";

export type FollowerBucket = "any" | "nano" | "micro" | "mid" | "macro" | "mega";
// Multi-select country codes. Empty array = 全球 (no country constraint).
export type CountryCode = "us" | "gb" | "ca" | "au" | "sea" | "me";

// Inclusive numeric range. `null` on either side means unbounded on that side
// (i.e. `{ min: 1000, max: null }` reads as "≥ 1000", `{ min: null, max: null }`
// reads as "不限"). Used by both the 粉丝量 and 均播 chip filters.
export interface NumRange {
  min: number | null;
  max: number | null;
}

export interface ChatChips {
  platform: PlatformId;
  // Empty array = 全球 (未指定); otherwise final filter is the union over selected countries.
  countries: CountryCode[];
  // Empty array = 任意语言; otherwise final filter is the union over selected languages.
  languages: string[];
  followers: NumRange;
  views: NumRange;
  // v3 §4.4：「仅可建联」开关。默认开启 → 隐式过滤掉无邮箱、不活跃、已被 No
  // 的达人。关闭时保留全部候选（也包括未验证邮箱）。文档把 v2 的「证据强度」
  // 二级筛选下沉到了系统内部，对外只暴露这一个可建联开关。
  contactableOnly: boolean;
}

export interface ChatProductMemory {
  url: string | null;
  rawText: string | null;
  parsedName: string | null;
  parsedCategory: string | null;
}

export type ProgressStatus = "pending" | "running" | "done";

export interface AnalysisStep {
  key: string;
  label: string;
  status: ProgressStatus;
  detail?: string;
  durationMs?: number;
}

export interface AnalysisBasis {
  platformLabel: string;
  countryLabel: string;
  timeRange: string;
  productLine: string;
  brandsSearched?: string[];
  postsAnalyzed?: number;
  candidatesFound?: number;
  baselineNote?: string;
}

export type EvidenceTag = "high" | "medium" | "weak";

export interface EvidencePost {
  thumbHue: number;
  caption: string;
  meta: string;
}

export interface CreatorEvidence {
  tag?: EvidenceTag;
  badge: string;
  reasons: string[];
  risks?: string[];
  sample?: EvidencePost;
}

export interface CreatorCardData {
  id: string;
  handle: string;
  name: string;
  avatarSeed: number;
  region: string;
  followers: string;
  medianViews: string;
  er: string;
  hasEmail: boolean;
  riskLow: boolean;
  evidence: CreatorEvidence;
}

export interface ResultGroupData {
  key: string;
  label: string;
  hint?: string;
  count: number;
  defaultExpanded: boolean;
  creators: CreatorCardData[];
}

export type ChatMessage =
  | { id: string; role: "user"; text: string; chips: ChatChips }
  | {
      id: string;
      role: "assistant";
      intent: ChatIntent;
      basis: AnalysisBasis;
      steps: AnalysisStep[];
      groups: ResultGroupData[];
      hint: string | null;
      streaming: boolean;
    };
