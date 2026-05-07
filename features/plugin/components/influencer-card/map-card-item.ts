// Adapter from the carousel's loose `CardItem` shape to the strict
// `InfluencerCardData` the new card consumes.

import { ACCENT } from "./tokens";
import type {
  CoverCount,
  EmailStatus,
  InfluencerCardData,
  InfluencerCardMetric,
  InfluencerCardRadarAxis,
  InfluencerCardSampleConfig,
  ScrapeCount,
} from "./types";

export interface CardItemLike {
  id: string;
  name: string;
  email?: unknown;
  emailStatusLabel?: string;
  country?: string;
  /** Optional creator-type label rendered as the category pill on the header's
   *  second line (e.g. "科技类博主"). When absent, the pill is not rendered. */
  creatorType?: string;
  tags?: string[];
  er?: string;
  price?: string;
  medianLikes?: string;
  medianComments?: string;
  visualPending?: boolean;
  subscores?: {
    topic: number;
    format: number;
    visual: number;
    data: number;
    activity: number;
    contact: number;
  };
  altSubscores?: {
    similarity: number;
    costAdvantage: number;
    dataPerformance: number;
    contactabilityRisk: number;
  };
}

const COUNTRY_CODE_MAP: Record<string, string> = {
  中国: "CN",
  CHINA: "CN",
  美国: "US",
  USA: "US",
  "UNITED STATES": "US",
  英国: "GB",
  UK: "GB",
  日本: "JP",
  JAPAN: "JP",
  韩国: "KR",
  德国: "DE",
  GERMANY: "DE",
  法国: "FR",
  FRANCE: "FR",
  加拿大: "CA",
  CANADA: "CA",
  澳大利亚: "AU",
  AUSTRALIA: "AU",
  新加坡: "SG",
  SINGAPORE: "SG",
};

const COUNTRY_LABEL_MAP: Record<string, string> = {
  CN: "中国",
  US: "美国",
  GB: "英国",
  JP: "日本",
  KR: "韩国",
  DE: "德国",
  FR: "法国",
  CA: "加拿大",
  AU: "澳大利亚",
  SG: "新加坡",
};

// Seed features used when the card has no usable tags. Mirrors the legacy
// radar's static feature set so the card stays useful even when subscores
// are absent — preferable to showing nothing.
const SEED_FEATURES = [
  "报价更低",
  "受众重合",
  "沉浸式 Vlog",
  "极少口播",
  "全景 B-roll",
  "低饱和度",
];

function normalizeCountry(country?: string): string | undefined {
  if (!country) return undefined;
  const trimmed = country.trim();
  if (!trimmed) return undefined;
  const upper = trimmed.toUpperCase();
  const direct = upper.match(/\b([A-Z]{2})\b/)?.[1];
  if (direct) return direct;
  return COUNTRY_CODE_MAP[upper] ?? COUNTRY_CODE_MAP[trimmed];
}

function localiseCountry(code?: string, original?: string): string | undefined {
  if (code && COUNTRY_LABEL_MAP[code]) return COUNTRY_LABEL_MAP[code];
  const trimmed = original?.trim();
  if (!trimmed) return undefined;
  // CJK input: surface as-is rather than dropping it.
  if (/[一-鿿]/.test(trimmed)) return trimmed;
  return undefined;
}

function emailStatusFor(card: CardItemLike): EmailStatus {
  const raw = card.email;
  if (typeof raw === "string" && raw.trim().length > 0) {
    return { kind: "found", address: raw.trim() };
  }
  if (card.emailStatusLabel) {
    return { kind: "verified", label: card.emailStatusLabel };
  }
  return { kind: "missing", label: "邮箱未找到" };
}

function metricsFor(card: CardItemLike): InfluencerCardMetric[] {
  return [
    {
      label: "预估报价",
      value: card.price ?? "—",
      hint: "系统估算，建议建联确认",
      estimated: true,
    },
    { label: "互动率", value: card.er ?? "—" },
    { label: "中位点赞", value: card.medianLikes ?? "—" },
    { label: "中位评论", value: card.medianComments ?? "—" },
  ];
}

function defaultFeatures(card: CardItemLike): string[] {
  const fromCard = (card.tags ?? []).filter((t) => !/%$/.test(t.trim()));
  const merged = [...fromCard, ...SEED_FEATURES];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of merged) {
    if (!seen.has(tag)) {
      seen.add(tag);
      out.push(tag);
    }
    if (out.length >= 6) break;
  }
  return out;
}

function radarFor(card: CardItemLike): InfluencerCardRadarAxis[] {
  const accent = ACCENT.terracotta;
  const s = card.subscores;
  if (s) {
    return [
      { subject: "主题", value: s.topic, color: accent },
      { subject: "形式", value: s.format, color: accent },
      { subject: "视觉", value: s.visual, color: accent },
      { subject: "活跃", value: s.activity, color: accent },
      { subject: "数据", value: s.data, color: accent },
    ];
  }
  const a = card.altSubscores;
  if (a) {
    // 找平替 only has 4 dimensions; pad to 5 by re-using similarity as
    // activity so the radar shape stays visually consistent.
    return [
      { subject: "相似", value: a.similarity, color: accent },
      { subject: "成本", value: a.costAdvantage, color: accent },
      { subject: "数据", value: a.dataPerformance, color: accent },
      { subject: "风险", value: a.contactabilityRisk, color: accent },
      { subject: "活跃", value: a.similarity, color: accent },
    ];
  }
  return [
    { subject: "主题", value: 92, color: accent },
    { subject: "形式", value: 78, color: accent },
    { subject: "视觉", value: 86, color: accent },
    { subject: "活跃", value: 100, color: accent },
    { subject: "数据", value: 82, color: accent },
  ];
}

export interface MapCardItemOptions {
  scrapeCount: ScrapeCount;
  coverCount: CoverCount;
  perspective: boolean;
  userTags: string[];
}

export function mapCardItemToInfluencerCard(
  card: CardItemLike,
  { scrapeCount, coverCount, perspective, userTags }: MapCardItemOptions,
): InfluencerCardData {
  const handle = card.name.replace(/^@/, "");
  const initials = (handle.charAt(0) || "?").toUpperCase();
  const countryCode = normalizeCountry(card.country);
  const countryLabel = localiseCountry(countryCode, card.country);
  const sample: InfluencerCardSampleConfig = {
    scrapeCount,
    coverCount,
    perspective,
  };
  return {
    id: card.id,
    handle,
    initials,
    countryCode,
    countryLabel,
    creatorType: card.creatorType,
    email: emailStatusFor(card),
    tags: userTags,
    features: defaultFeatures(card),
    metrics: metricsFor(card),
    radar: radarFor(card),
    sample,
  };
}
