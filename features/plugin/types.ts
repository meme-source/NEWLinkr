// Plugin domain types — shared by plugin-path-demo and supporting modules.

import type { Project } from "@/features/project/lib/project-model";

export type DemoStage = "floating" | "card";
export type ReviewFlow = "idle" | "sequential";
export type SidebarTab = "similar" | "current" | "email" | "quick" | "single-post";
export type CurrentDetailTab = "pricing" | "audience";
export type RegionTierKey = "developed" | "developing" | "underdeveloped";
export type MetricAggregation = "median" | "average";
export type HoverMetricKey = "rate" | "plays" | "likes" | "comments" | "engagementOrViews";
export type InlineDataKey = "plays" | "likes" | "comments" | "engagement" | "publishedAt";
export type SocialPlatformKey = "tiktok" | "instagram" | "youtube" | "x";
export type SearchModeKey = "comprehensive" | "budget" | "seed" | "tier" | "geo" | "brand";
// 模板 id 现由共享层 features/email 提供（系统/我的模板的归一化 id），
// 空串表示「未选择模板」。
export type EmailTemplateKey = string;
export type EmailTemplateSegment = { text: string; personalized?: boolean };
export type TagTone = "amber" | "blue" | "emerald" | "violet" | "rose";
export type AudienceRegion = { pct: number; flag?: string; flags?: string[] };
export type EmailRecipientMessage = {
  creatorId: string;
  subject: string;
  content: string;
  subjectSegments: EmailTemplateSegment[];
  contentSegments: EmailTemplateSegment[];
  personalizedSegmentCount: number;
};
export type EmailSendOptions = {
  subject: string;
  attachmentCount: number;
  mode: "now" | "scheduled";
  scheduledAt?: string;
  senderAddress?: string;
  recipientCreatorIds?: string[];
  recipientMessages?: EmailRecipientMessage[];
  templateKey?: Exclude<EmailTemplateKey, ""> | "custom";
};
// 插件端的项目视图 —— 统一 Project 模型（features/project/lib/project-model.ts）
// 的一个投影：只取插件 UI 实际用到的字段，外加一个纯展示的 createdLabel。
// 创建项目时用 toProjectSummary() 从完整 Project 映射过来。
export type ProjectSummary = Pick<Project, "id" | "name" | "productDescription" | "createdAt"> & {
  // 列表里显示的"创建于"友好文案，纯展示，不进统一模型。
  createdLabel: string;
  uploadedListNames?: string[];
};
export type ProjectScopedState = {
  savedCreatorIds: string[];
  dismissedCreatorIds: string[];
  creatorTags: Record<string, string[]>;
};

export type AudienceSummary = {
  gender?: { female: number; male: number };
  age?: Array<{ range: string; pct: number }>;
  regionT1?: AudienceRegion;
  regionT2?: AudienceRegion;
};

export type CreatorProfile = {
  id: string;
  handle: string;
  name: string;
  country?: string;
  creatorType?: string;
  followers: string;
  likes: string;
  videos: string;
  er: string;
  rate: string;
  bio: string;
  statBadges: string[];
  email?: string;
  totalPlays?: string;
  cpm?: string;
  review?: string;
  audienceBreakdown?: Array<{ label: string; value: string }>;
  audienceSummary?: AudienceSummary;
  outreachPreview?: string;
  topics?: Array<{ label: string; weight: number }>;
};

export type AudienceHighlight = {
  label: string;
  pct: number;
  flag?: string;
  flags?: string[];
};
