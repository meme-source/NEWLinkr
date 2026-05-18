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
import type { TiktokVideoCategory } from "@/features/plugin/components/tiktok-video-tile/types";
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
import { findEmailTemplate } from "@/features/email/data/templates";
import { renderTemplateSegments } from "@/features/email/render";
import type { TemplateVarMap } from "@/features/email/types";
import { DEFAULT_ACCOUNT_VARS } from "@/features/outreach/data/template-vars";

export const SIDEBAR_CARD_RADIUS = "rounded-[8px]";
export const SIDEBAR_CONTROL_RADIUS = "rounded-[8px]";
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
export const DEFAULT_ENABLED_BADGE_CATEGORIES: TiktokVideoCategory[] = [
  "viral",
  "flop",
  "paid",
  "shop",
];
export const DEFAULT_VIRAL_RATIO_THRESHOLD = 1.5;
export const DEFAULT_FLOP_RATIO_THRESHOLD = 0.7;
export const BADGE_CATEGORY_OPTIONS: ReadonlyArray<{
  key: TiktokVideoCategory;
  label: string;
  swatch: string;
}> = [
  { key: "viral", label: "爆款", swatch: "#ff5a3d" },
  { key: "flop", label: "扑街", swatch: "#3a8dff" },
  { key: "paid", label: "广告", swatch: "#1f6feb" },
  { key: "shop", label: "带货", swatch: "#16a34a" },
  { key: "normal", label: "普通", swatch: "#54514a" },
];

// 话题词云配色：Linkr 暖色家族，由橙主色延伸到珊瑚 / 铜棕 / 暖金 / 暖近黑，
// 避免一片灰黑，让词云有层次但不跳出品牌调性。
export const WORD_CLOUD_COLORS = [
  "#ff4f00",
  "#e0651f",
  "#3a3431",
  "#ff8a5c",
  "#b87333",
  "#7a6e5c",
  "#c08a3e",
  "#ff4f00",
  "#9a7a52",
  "#5b5347",
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

// 「中位数分享」：插件 mock 没有逐条分享数据，按账号点赞量派生
// （分享量级低于评论，取 likes 的 ~5%），与 medianComments 同一套合成口径。
export function getCreatorMedianShares(creator: CreatorProfile) {
  const likes = parseMetricToNumber(creator.likes);
  if (likes <= 0) return "—";
  return formatLikes(likes * 0.05);
}

// 核心指标取值：观看 / 点赞 / 评论 / 分享 各自支持「中位数 ↔ 平均数」切换。
// 平均数派生倍率沿用 metric-items.ts 既有口径（likes ×1.08、comments ×1.16），
// 保证悬浮卡与「博主分析」侧栏的同一指标数值一致。
export function getCreatorCoreMetricValue(
  creator: CreatorProfile,
  key: "plays" | "likes" | "comments" | "shares",
  mode: MetricAggregation,
  scrapeCount?: number,
): string {
  if (key === "plays") {
    return mode === "median"
      ? getCreatorMedianPlays(creator, scrapeCount)
      : getCreatorAveragePlays(creator, scrapeCount);
  }
  if (key === "likes") {
    if (mode === "average") return formatLikes(parseMetricToNumber(creator.likes) * 1.08);
    return creator.likes || "—";
  }
  if (key === "comments") {
    const median = getCreatorMedianComments(creator);
    if (mode === "average") return formatComments(parseMetricToNumber(median) * 1.16);
    return median;
  }
  const median = getCreatorMedianShares(creator);
  if (mode === "average") return formatLikes(parseMetricToNumber(median) * 1.12);
  return median;
}

// 户外品牌池：插件 mock 创作者均为露营 / 户外赛道，品牌提及从该池按 id 派生。
const OUTDOOR_BRAND_POOL = [
  "Patagonia",
  "The North Face",
  "REI Co-op",
  "Coleman",
  "YETI",
  "Columbia",
  "Osprey",
  "Salomon",
  "Decathlon",
  "MSR",
  "Hydro Flask",
  "Arc'teryx",
] as const;

function hashString(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// 「合作次数」：插件端没有真实合作记录，按 creator id 派生一个 0–5 的稳定值，
// 取代旧的「作品」字段，与 Web 端博主库信息卡口径对齐。
export function getCreatorCollaborationCount(creator: CreatorProfile) {
  return hashString(creator.id) % 6;
}

// 「品牌提及」：插件 mock 无逐条 brandMention，按 id 稳定地从户外品牌池抽 2–4 个，
// 每个品牌附一个 1–4 的提及次数，对齐 Web 端博主库信息卡的品牌提及区块。
export function getCreatorBrandMentions(
  creator: CreatorProfile,
): Array<{ brand: string; count: number }> {
  const rand = seededRandom(hashString(creator.id) + 1);
  const total = 2 + Math.floor(rand() * 3);
  const pool = [...OUTDOOR_BRAND_POOL];
  const picked: Array<{ brand: string; count: number }> = [];
  for (let i = 0; i < total && pool.length > 0; i += 1) {
    const idx = Math.floor(rand() * pool.length);
    const [brand] = pool.splice(idx, 1);
    picked.push({ brand, count: 1 + Math.floor(rand() * 4) });
  }
  return picked.sort((a, b) => b.count - a.count);
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
  if (/(露营|户外|徒步|公路旅行|outdoor|camp)/.test(profileText)) return "户外类博主";
  if (/(家庭|亲子|family)/.test(profileText)) return "家庭类博主";
  if (/(旅行|travel)/.test(profileText)) return "旅行类博主";
  if (/(美妆|护肤|彩妆|beauty)/.test(profileText)) return "美妆类博主";
  if (/(健身|运动|fitness)/.test(profileText)) return "运动类博主";
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

// 把当前博主 / 项目 / 账号信息映射成模板变量值。
// account 级变量对所有收件人相同 → 不算个性化；creator 级变量逐人不同 →
// personalized: true，在预览里高亮，也是「N 处高亮」的计数来源。
function buildTemplateVarMap(creator: CreatorProfile, project?: ProjectSummary): TemplateVarMap {
  return {
    my_name: { value: DEFAULT_ACCOUNT_VARS.my_name, personalized: false },
    my_role: { value: DEFAULT_ACCOUNT_VARS.my_role, personalized: false },
    brand_name: { value: DEFAULT_ACCOUNT_VARS.brand_name, personalized: false },
    brand_url: { value: DEFAULT_ACCOUNT_VARS.brand_url, personalized: false },
    project_name: { value: project?.name ?? "本次项目", personalized: false },
    product_name: { value: project?.name ?? "新品", personalized: false },
    product_link: { value: DEFAULT_ACCOUNT_VARS.brand_url, personalized: false },
    creator_name: { value: creator.name, personalized: true },
    creator_handle: { value: creator.handle, personalized: true },
    platform: { value: "TikTok", personalized: false },
  };
}

export function getEmailTemplateSegments(
  template: EmailTemplateKey,
  creator: CreatorProfile,
  project?: ProjectSummary,
): EmailTemplateSegment[] {
  const option = findEmailTemplate(template);
  if (!option) return [];
  return renderTemplateSegments(option.body, buildTemplateVarMap(creator, project));
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
  const option = findEmailTemplate(template);
  if (!option) return [];
  return renderTemplateSegments(option.subject, buildTemplateVarMap(creator, project));
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

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// 把模板生成的 segments 转成可编辑的 HTML：个性化片段加黄色高亮，换行转 <br>。
// 用于初始化逐人草稿的正文编辑器。
export function segmentsToHtml(segments: EmailTemplateSegment[]): string {
  return segments
    .map((segment) => {
      const html = escapeHtml(segment.text).replace(/\n/g, "<br>");
      return segment.personalized
        ? `<span style="background:#fff3a3;border-radius:4px;padding:0 2px;">${html}</span>`
        : html;
    })
    .join("");
}

// 把富文本 HTML 还原成纯文本，用于发送 payload 与日志记录。
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(div|p|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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
