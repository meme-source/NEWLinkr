import type {
  AudienceHighlight,
  AudienceSummary,
  CreatorProfile,
  EmailTemplateKey,
  EmailTemplateSegment,
  HoverMetricKey,
  InlineDataKey,
  MetricAggregation,
  ProjectSummary,
  RegionTierKey,
  SocialPlatformKey,
  TagTone,
} from "@/features/plugin/types";
import {
  COUNTRY_CPM_OVERRIDE_USD,
  COUNTRY_OPTIONS,
  COUNTRY_TO_FLAG,
  FLAG_TO_DISCOVERY_COUNTRY,
  LOCALE_REGION_TO_COUNTRY,
  REGION_TIER_BASE_CPM_USD,
  REGION_TIER_OPTIONS,
} from "@/features/plugin/data/countries";
import { noteTagPresets, tagToneOrder } from "@/features/plugin/data/projects";

export const SIDEBAR_CARD_RADIUS = "rounded-[24px]";
export const SIDEBAR_CONTROL_RADIUS = "rounded-[20px]";
export const SIDEBAR_COLLAPSED_WIDTH = 44;
export const SIDEBAR_MIN_WIDTH = 396;
export const SIDEBAR_MAX_WIDTH = 640;
export const SIDEBAR_PANEL_CARD_CLASSES = `${SIDEBAR_CARD_RADIUS} border border-[#c5c0b1] bg-[#fffefb] p-4`;
export const SIDEBAR_GRADIENT_CARD_CLASSES = `${SIDEBAR_CARD_RADIUS} border border-[#c5c0b1] bg-[linear-gradient(180deg,#fffefb_0%,#eceae3_100%)] p-4`;
export const SIDEBAR_CONTROL_CLASSES = `w-full appearance-none ${SIDEBAR_CONTROL_RADIUS} border border-[#c5c0b1] bg-[#fffdf9] px-3 py-3 pr-10 text-sm text-[#201515] outline-none transition-colors focus:border-[#ff4f00]/35`;
export const SIDEBAR_SECONDARY_BUTTON_CLASSES = `${SIDEBAR_CONTROL_RADIUS} border border-[#c5c0b1] bg-[#fffefb] px-4 py-2.5 text-sm font-semibold transition-all hover:border-[#c5c0b1] hover:bg-[#eceae3] active:scale-[0.98]`;
export const SIDEBAR_FILLED_BUTTON_CLASSES = `${SIDEBAR_CONTROL_RADIUS} bg-[#ff4f00] px-4 py-2.5 text-sm font-semibold text-[#fffdf9] transition-all hover:bg-[#ff4f00] active:scale-[0.98]`;
export const EMAIL_PERSONALIZED_HIGHLIGHT_CLASSES =
  "rounded-[5px] bg-[#fff3a3] px-0.5 font-semibold text-[#36342e] ring-1 ring-[#e2c75a]/80";
export const EMAIL_PERSONALIZED_BADGE_CLASSES =
  "rounded-full bg-[#fff3a3] text-[#36342e] ring-1 ring-[#e2c75a]/80";
export const SCRAPE_COUNT_OPTIONS = [5, 10, 15];
export const HOVER_CARD_MAX_METRICS = 4;
export const DEFAULT_HOVER_METRICS: HoverMetricKey[] = [
  "rate",
  "likes",
  "comments",
  "engagementOrViews",
];
export const DEFAULT_HOVER_METRIC_MODES: Record<HoverMetricKey, MetricAggregation> = {
  rate: "average",
  plays: "median",
  likes: "median",
  comments: "median",
  engagementOrViews: "median",
};
export const SOCIAL_PLATFORM_OPTIONS: Array<{ key: SocialPlatformKey; label: string }> = [
  { key: "tiktok", label: "TikTok" },
  { key: "instagram", label: "Instagram" },
  { key: "youtube", label: "YouTube" },
  { key: "x", label: "X" },
];
export const DEFAULT_INLINE_DATA_KEYS: InlineDataKey[] = [
  "plays",
  "likes",
  "comments",
  "engagement",
  "publishedAt",
];

export const WORD_CLOUD_COLORS = [
  "#201515",
  "#36342e",
  "#54514a",
  "#6e6b62",
  "#8a877e",
  "#939084",
  "#a39f95",
  "#b5b2aa",
  "#c5c0b1",
  "#36342e",
];

export function formatPlays(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function formatLikes(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function formatComments(n: number): string {
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function parseMetricToNumber(value: string): number {
  const m = value.trim().match(/([\d.]+)\s*(万|千|[KkMmBb]?)/);
  if (!m) return 0;
  const num = parseFloat(m[1]);
  const unit = m[2];
  if (unit === "万") return num * 10_000;
  if (unit === "千") return num * 1_000;
  const normalizedUnit = unit.toUpperCase();
  if (normalizedUnit === "K") return num * 1_000;
  if (normalizedUnit === "M") return num * 1_000_000;
  if (normalizedUnit === "B") return num * 1_000_000_000;
  return num;
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function getSuggestedCpmUsd(country: string, tier: RegionTierKey): string {
  const cpm = COUNTRY_CPM_OVERRIDE_USD[country] ?? REGION_TIER_BASE_CPM_USD[tier];
  return cpm.toFixed(2);
}

export function getCountryFlag(country: string) {
  return (
    COUNTRY_TO_FLAG[country] ?? COUNTRY_OPTIONS.find((item) => item.name === country)?.flag ?? "🌐"
  );
}

export function getRegionTierForCountry(country: string): RegionTierKey {
  return COUNTRY_OPTIONS.find((item) => item.name === country)?.tier ?? "developing";
}

export function getRegionTierLabel(tier: RegionTierKey) {
  return REGION_TIER_OPTIONS.find((item) => item.key === tier)?.label ?? "发展中地区";
}

export function inferCountryFromLocale(locale: string) {
  const region = locale.match(/[-_]([A-Za-z]{2})\b/)?.[1]?.toUpperCase();
  if (!region) return null;
  return LOCALE_REGION_TO_COUNTRY[region] ?? null;
}

export function parseCpmAmount(cpm: string) {
  const amount = Number.parseFloat(cpm.replace(/[^\d.]/g, ""));
  return Number.isFinite(amount) && amount > 0 ? amount.toFixed(2) : "10.00";
}

export function getCreatorEmail(creator: CreatorProfile) {
  return creator.email ?? `${creator.handle.replace("@", "")}@mail.demo`;
}

export function getCreatorContactEmail(creator: CreatorProfile) {
  return creator.email ?? null;
}

export function getCreatorAveragePlays(creator: CreatorProfile, scrapeCount?: number) {
  // The original implementation in plugin-path-demo derived this from
  // generateSyntheticVideos when scrapeCount was provided. Synthetic-video
  // generation lives next to the floating cards and pulling it in here would
  // create a circular import; the fallback path produces the same value
  // creator.totalPlays uses, which preserves snapshot parity for sidebar use.
  void scrapeCount;
  return creator.totalPlays ?? "4.8M";
}

export function getCreatorMedianPlays(creator: CreatorProfile, scrapeCount?: number) {
  const averagePlays = parseMetricToNumber(getCreatorAveragePlays(creator, scrapeCount));
  return formatPlays(averagePlays * 0.82);
}

export function getCreatorCpm(creator: CreatorProfile) {
  return creator.cpm ?? "$10.00";
}

export function getCreatorMedianComments(creator: CreatorProfile) {
  const likesStr = creator.likes ?? "";
  const m = likesStr.match(/([\d.]+)\s*(万|千|k|K|m|M)?/);
  if (!m) return "—";
  const base = parseFloat(m[1]);
  const unit = m[2];
  const mul =
    unit === "万"
      ? 1e4
      : unit === "千"
        ? 1e3
        : unit === "k" || unit === "K"
          ? 1e3
          : unit === "m" || unit === "M"
            ? 1e6
            : 1;
  const likesNum = base * mul;
  const comments = likesNum * 0.08;
  if (comments >= 1e4) return `${(comments / 1e4).toFixed(1)}万`;
  if (comments >= 1e3) return `${(comments / 1e3).toFixed(1)}k`;
  return Math.round(comments).toString();
}

export function getCreatorMetricSnapshot(creator: CreatorProfile, scrapeCount?: number) {
  return {
    rate: creator.rate,
    cpm: getCreatorCpm(creator),
    medianComments: getCreatorMedianComments(creator),
    averagePlays: getCreatorAveragePlays(creator, scrapeCount),
    medianPlays: getCreatorMedianPlays(creator, scrapeCount),
    medianLikes: creator.likes,
    engagementRate: creator.er,
  };
}

export function getCreatorTopicSummary(
  topics: Array<{ label: string; weight: number }>,
  scrapeCount: number,
) {
  const sortedTopics = [...topics].sort((left, right) => {
    if (right.weight !== left.weight) return right.weight - left.weight;
    return left.label.localeCompare(right.label);
  });

  const maxWeight = sortedTopics[0]?.weight ?? 1;
  const topicsWithMentions = sortedTopics.map((topic, index) => {
    const weightedMentions = Math.round((topic.weight / (maxWeight + 2)) * scrapeCount);
    const decayMentions = Math.max(1, scrapeCount - index - 1);
    const mentions = Math.max(
      1,
      Math.min(scrapeCount, Math.round((weightedMentions + decayMentions) / 2)),
    );
    return { ...topic, mentions };
  });

  topicsWithMentions.sort((left, right) => {
    if (right.mentions !== left.mentions) return right.mentions - left.mentions;
    if (right.weight !== left.weight) return right.weight - left.weight;
    return left.label.localeCompare(right.label);
  });

  return {
    primaryTopics: topicsWithMentions.slice(0, 3),
    remainingTopics: topicsWithMentions.slice(3),
  };
}

export function getCreatorReview(creator: CreatorProfile) {
  return creator.review ?? "评论区互动自然，广告痕迹低，品牌合作接受度较高。";
}

export function getCreatorDiagnostics(creator: CreatorProfile) {
  const erNum = Number.parseFloat(creator.er.replace("%", ""));
  const safeEr = Number.isFinite(erNum) ? erNum : 3.5;
  const flopRate = Math.max(10, Math.min(35, Math.round(30 - safeEr * 2)));
  const hitRate = Math.max(5, Math.min(25, Math.round(safeEr * 2.5)));
  const base = getCreatorAveragePlays(creator);
  const stabilityText =
    safeEr >= 4 ? "表现极度稳定，适合做常规曝光投放。" : "流量整体平稳，偶有波动，需关注近期节奏。";
  const positiveSentiment = Math.max(60, Math.min(92, Math.round(60 + safeEr * 6)));
  return {
    flopRate,
    hitRate,
    normalRange: base,
    stabilityText,
    positiveSentiment,
    lowBotRisk: safeEr >= 3.5,
  };
}

export function getAudienceSummary(creator: CreatorProfile): AudienceSummary {
  return (
    creator.audienceSummary ?? {
      gender: { female: 72, male: 28 },
      age: [
        { range: "0-17", pct: 3 },
        { range: "18-25", pct: 22 },
        { range: "25-34", pct: 65 },
        { range: "35-44", pct: 8 },
        { range: "45+", pct: 2 },
      ],
      regionT1: { pct: 62, flags: ["🇺🇸", "🇨🇦", "🇬🇧"] },
      regionT2: { pct: 24, flags: ["🇵🇭", "🇮🇩", "🇧🇷"] },
    }
  );
}

export function computeAudienceHighlights(summary: AudienceSummary): AudienceHighlight[] {
  const out: AudienceHighlight[] = [];
  if (summary.gender && summary.gender.female >= 60) {
    out.push({ label: "女性受众", pct: summary.gender.female });
  }
  if (summary.age) {
    const dominant = [...summary.age].sort((a, b) => b.pct - a.pct)[0];
    if (dominant && dominant.pct >= 40) {
      out.push({ label: `${dominant.range} 岁`, pct: dominant.pct });
    }
  }
  if (summary.regionT1) {
    out.push({
      label: "发达地区",
      pct: summary.regionT1.pct,
      flag: summary.regionT1.flag,
      flags: summary.regionT1.flags,
    });
  }
  if (summary.regionT2) {
    out.push({
      label: "发展中地区",
      pct: summary.regionT2.pct,
      flag: summary.regionT2.flag,
      flags: summary.regionT2.flags,
    });
  }
  return out;
}

export function getCreatorLocation(creator: CreatorProfile) {
  if (creator.country && COUNTRY_TO_FLAG[creator.country]) {
    return { country: creator.country, flag: COUNTRY_TO_FLAG[creator.country] };
  }

  const summary = getAudienceSummary(creator);
  const primaryFlag = summary.regionT1?.flags?.[0] ?? summary.regionT2?.flags?.[0];
  if (primaryFlag && FLAG_TO_DISCOVERY_COUNTRY[primaryFlag]) {
    return {
      country: FLAG_TO_DISCOVERY_COUNTRY[primaryFlag],
      flag: primaryFlag,
    };
  }

  return { country: "美国", flag: "🇺🇸" };
}

export function getCreatorType(creator: CreatorProfile) {
  if (creator.creatorType?.trim()) return creator.creatorType.trim();

  const profileText = `${creator.bio} ${creator.statBadges.join(" ")}`.toLowerCase();
  if (/(科技|数码|3c|tech|gadget|gear|评测)/.test(profileText)) return "科技类博主";
  if (/(露营|户外|徒步|公路旅行|outdoor|camp)/.test(profileText)) return "户外类";
  if (/(家庭|亲子|family)/.test(profileText)) return "家庭类";
  if (/(旅行|travel)/.test(profileText)) return "旅行类";
  if (/(美妆|护肤|彩妆|beauty)/.test(profileText)) return "美妆类";
  if (/(健身|运动|fitness)/.test(profileText)) return "运动类";
  return "科技类博主";
}

export function getCreatorPersonalizationSummary(
  creator: CreatorProfile,
  project?: ProjectSummary,
) {
  const location = getCreatorLocation(creator);
  const primaryTopic =
    creator.topics?.[0]?.label.replace(/^#/, "") ??
    creator.statBadges[0] ??
    getCreatorType(creator).replace("类", "");
  const secondaryTopic =
    creator.topics?.[1]?.label.replace(/^#/, "") ?? creator.statBadges[1] ?? "真实体验";
  const projectAngle = project?.productDescription.trim() || "这轮内容合作";
  const review = getCreatorReview(creator).replace(/[。.!！]$/, "");

  return {
    greetingName: creator.name,
    locationLabel: `${location.flag} ${location.country}`,
    primaryTopic,
    secondaryTopic,
    projectAngle,
    creatorProof: `${creator.handle} 最近围绕「${primaryTopic}」的内容和我们的「${projectAngle}」很契合`,
    aiReason: `${review}，适合用更自然的体验式内容切入`,
    replyAsk: "近期档期、报价区间和更适合的合作形式",
    email: getCreatorEmail(creator),
  };
}

export function getEmailTemplateSegments(
  template: EmailTemplateKey,
  creator: CreatorProfile,
  project?: ProjectSummary,
): EmailTemplateSegment[] {
  if (!template) return [];

  const info = getCreatorPersonalizationSummary(creator, project);

  if (template === "followup") {
    return [
      { text: "Hi " },
      { text: info.greetingName, personalized: true },
      { text: ",\n\n上次已经和你简单同步过合作方向，这边补充一下我们这轮的最新窗口。\n\n" },
      { text: "我重新看了一下你的账号，" },
      { text: info.creatorProof, personalized: true },
      { text: "。\n\n" },
      { text: "- 合作方向：" },
      { text: info.projectAngle, personalized: true },
      { text: "\n- 内容切入：" },
      { text: `${info.primaryTopic} / ${info.secondaryTopic}`, personalized: true },
      {
        text: "\n- 希望确认：近期档期、报价区间、可接受的合作形式\n\n如果方便的话，也可以直接回复到 ",
      },
      { text: info.email, personalized: true },
      { text: "，我们会尽快跟进。\n\n谢谢！\n2Linkr 团队" },
    ];
  }

  if (template === "gifted") {
    return [
      { text: "Hi " },
      { text: info.greetingName, personalized: true },
      { text: ",\n\n我们正在为 " },
      { text: info.projectAngle, personalized: true },
      { text: " 寻找适合先体验、再决定合作形式的创作者。\n\n" },
      { text: "AI 觉得你很适合这轮寄样，是因为 " },
      { text: info.aiReason, personalized: true },
      {
        text: "。\n\n如果你愿意，我们可以先寄一份样品给你，等你体验后再一起确认是否做短视频、图文或长期合作。\n\n期待听听你的想法。\n2Linkr 团队",
      },
    ];
  }

  return [
    { text: "Hi " },
    { text: info.greetingName, personalized: true },
    { text: ",\n\n我们最近在筛选一批适合 " },
    { text: info.projectAngle, personalized: true },
    { text: " 的创作者，看到你的账号后觉得内容调性、受众画像和互动氛围都很匹配。\n\n" },
    { text: "尤其是 " },
    { text: info.creatorProof, personalized: true },
    {
      text: "，这部分非常适合做第一轮合作沟通。\n\n想先和你确认三件事：\n- 你最近是否方便接合作\n- 当前的大致报价区间\n- 更适合的合作形式（短视频 / 组合发布 / 长期合作）\n\n如果方便的话，可以直接回复这封邮件，我们会把更具体的 brief 发给你。\n\n谢谢！\n2Linkr 团队",
    },
  ];
}

export function getEmailTemplateDraft(
  template: EmailTemplateKey,
  creator: CreatorProfile,
  project?: ProjectSummary,
) {
  return getEmailTemplateSegments(template, creator, project)
    .map((segment) => segment.text)
    .join("");
}

export function getEmailSubjectSegments(
  template: EmailTemplateKey,
  creator: CreatorProfile,
  project?: ProjectSummary,
): EmailTemplateSegment[] {
  if (template === "followup") {
    return [{ text: "跟进 " }, { text: creator.name, personalized: true }, { text: " 的合作档期" }];
  }
  if (template === "gifted") {
    return [
      { text: creator.name, personalized: true },
      { text: "，想寄样给你体验 " },
      { text: project?.name ?? "这轮新品", personalized: true },
    ];
  }
  if (template === "intro") {
    return [{ text: creator.name, personalized: true }, { text: " x 2Linkr 内容合作邀约" }];
  }
  return [];
}

export function getEmailTemplateSubject(
  template: EmailTemplateKey,
  creator: CreatorProfile,
  project?: ProjectSummary,
) {
  return getEmailSubjectSegments(template, creator, project)
    .map((segment) => segment.text)
    .join("");
}

export function getDefaultScheduleAt() {
  const date = new Date();
  date.setHours(date.getHours() + 2);
  date.setMinutes(Math.ceil(date.getMinutes() / 15) * 15, 0, 0);
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join("T");
}

export function formatScheduleLabel(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getTagTone(label: string): TagTone {
  const preset = noteTagPresets.find((item) => item.label.toLowerCase() === label.toLowerCase());
  if (preset) return preset.tone;
  const hash = Array.from(label).reduce((total, char) => total + char.charCodeAt(0), 0);
  return tagToneOrder[hash % tagToneOrder.length];
}

export function getTagChipClasses(tone: TagTone) {
  switch (tone) {
    case "amber":
      return "border-amber-300/45 bg-amber-50 text-amber-800 hover:bg-amber-100";
    case "blue":
      return "border-sky-300/45 bg-sky-50 text-sky-800 hover:bg-sky-100";
    case "emerald":
      return "border-emerald-300/45 bg-emerald-50 text-emerald-800 hover:bg-emerald-100";
    case "violet":
      return "border-violet-300/45 bg-violet-50 text-violet-800 hover:bg-violet-100";
    case "rose":
      return "border-rose-300/45 bg-rose-50 text-rose-800 hover:bg-rose-100";
    default:
      return "border-[#c5c0b1] bg-[#fffefb] text-[#36342e] hover:bg-[#eceae3]";
  }
}

export function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}
