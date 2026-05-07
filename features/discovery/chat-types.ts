// Chat-driven discovery types — mirror the v2.0 spec (Discovery Page v2).
// Backend is stubbed; these types describe the shape produced by the
// simulated streaming flow in `data/chat-flow.ts`.

import type { PlatformId } from "./types";

export type ChatIntent = "competitor" | "scenario" | "trending";

export type FollowerBucket = "any" | "nano" | "micro" | "mid" | "macro" | "mega";
// Multi-select country codes. Empty array = 全球 (no country constraint).
export type CountryCode = "us" | "gb" | "ca" | "au" | "sea" | "me";

// Views slider: 0 = 不限, otherwise a step index 1..6 mapping to thresholds
// (1k, 10k, 50k, 100k, 500k, 1m). The slider lives in the bottom chip strip.
export type ViewsStep = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface ChatChips {
  platform: PlatformId;
  // Empty array = 全球 (未指定); otherwise final filter is the union over selected countries.
  countries: CountryCode[];
  // Empty array = 任意语言; otherwise final filter is the union over selected languages.
  languages: string[];
  follower: FollowerBucket;
  viewsStep: ViewsStep;
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
