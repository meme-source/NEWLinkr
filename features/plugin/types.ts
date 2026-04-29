// Plugin domain types — shared by plugin-path-demo and supporting modules.

export type DemoStage = "floating" | "card";
export type ReviewFlow = "idle" | "sequential";
export type SidebarTab = "similar" | "current" | "email" | "quick";
export type CurrentDetailTab = "pricing" | "audience";
export type RegionTierKey = "developed" | "developing" | "underdeveloped";
export type MetricAggregation = "median" | "average";
export type HoverMetricKey =
  | "rate"
  | "plays"
  | "likes"
  | "comments"
  | "engagementOrViews";
export type InlineDataKey =
  | "plays"
  | "likes"
  | "comments"
  | "engagement"
  | "publishedAt";
export type SocialPlatformKey = "tiktok" | "instagram" | "youtube" | "x";
export type SearchModeKey =
  | "comprehensive"
  | "budget"
  | "seed"
  | "tier"
  | "geo"
  | "brand";
export type EmailTemplateKey = "intro" | "followup" | "gifted" | "";
export type EmailTemplateSegment = { text: string; personalized?: boolean };
export type EmailTemplateMeta = {
  key: Exclude<EmailTemplateKey, "">;
  label: string;
  category: string;
  summary: string;
};
export type TagTone = "amber" | "blue" | "emerald" | "violet" | "rose";
export type AudienceRegion = { pct: number; flag?: string; flags?: string[] };
export type EmailSendOptions = {
  subject: string;
  attachmentCount: number;
  mode: "now" | "scheduled";
  scheduledAt?: string;
  senderAddress?: string;
  recipientCreatorIds?: string[];
};
export type ProjectSummary = {
  id: string;
  name: string;
  productDescription: string;
  createdAt: string;
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
