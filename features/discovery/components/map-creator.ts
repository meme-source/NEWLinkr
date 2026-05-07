// Adapter: discovery's `CreatorCardData` → shared `InfluencerCardData`.
// Keeps discovery and the plugin demo on the exact same card component.

import { ACCENT } from "@/features/plugin/components/influencer-card/tokens";
import type {
  EmailStatus,
  InfluencerCardData,
  InfluencerCardMetric,
  InfluencerCardRadarAxis,
  InfluencerCardSampleConfig,
} from "@/features/plugin/components/influencer-card/types";
import type { CreatorCardData } from "../chat-types";

const FLAG_TO_CODE: Record<string, string> = {
  "🇺🇸": "US",
  "🇬🇧": "GB",
  "🇨🇦": "CA",
  "🇦🇺": "AU",
  "🇨🇳": "CN",
  "🇯🇵": "JP",
  "🇰🇷": "KR",
  "🇫🇷": "FR",
  "🇩🇪": "DE",
  "🇸🇬": "SG",
};

const COUNTRY_LABEL: Record<string, string> = {
  US: "美国",
  GB: "英国",
  CA: "加拿大",
  AU: "澳大利亚",
  CN: "中国",
  JP: "日本",
  KR: "韩国",
  FR: "法国",
  DE: "德国",
  SG: "新加坡",
};

// Mirrors plugin adapter's seed list — kept identical so a creator with no
// usable feature signals still produces the same chip set on either surface.
const SEED_FEATURES = [
  "报价更低",
  "受众重合",
  "沉浸式 Vlog",
  "极少口播",
  "全景 B-roll",
  "低饱和度",
];

export interface MapCreatorOptions {
  tags: string[];
  sample: InfluencerCardSampleConfig;
}

export function mapCreatorToInfluencerCard(
  creator: CreatorCardData,
  { tags, sample }: MapCreatorOptions,
): InfluencerCardData {
  const handle = creator.handle.replace(/^@/, "");
  const initials = (handle.charAt(0) || "?").toUpperCase();
  const region = creator.region.trim();
  const countryCode = FLAG_TO_CODE[region];
  const countryLabel = countryCode ? COUNTRY_LABEL[countryCode] : undefined;

  const email: EmailStatus = creator.hasEmail
    ? { kind: "verified", label: "邮箱已找到" }
    : { kind: "missing", label: "邮箱待补充" };

  const metrics: InfluencerCardMetric[] = [
    {
      label: "预估报价",
      value: "—",
      hint: "系统估算，建议建联确认",
      estimated: true,
    },
    { label: "互动率", value: creator.er },
    { label: "中位播放", value: creator.medianViews },
    { label: "粉丝", value: creator.followers },
  ];

  const features = mergeFeatures([creator.evidence.badge]);

  const accent = ACCENT.terracotta;
  // Discovery mock data has no per-creator subscores yet — fall back to the
  // same shape the plugin adapter uses when subscores are missing.
  const radar: InfluencerCardRadarAxis[] = [
    { subject: "主题", value: 92, color: accent },
    { subject: "形式", value: 78, color: accent },
    { subject: "视觉", value: 86, color: accent },
    { subject: "活跃", value: 100, color: accent },
    { subject: "数据", value: 82, color: accent },
  ];

  return {
    id: creator.id,
    handle,
    initials,
    countryCode,
    countryLabel,
    email,
    tags,
    features,
    metrics,
    radar,
    sample,
  };
}

function mergeFeatures(extras: (string | null | undefined)[]): string[] {
  const merged = [...extras.filter((x): x is string => Boolean(x)), ...SEED_FEATURES];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const f of merged) {
    if (!seen.has(f)) {
      seen.add(f);
      out.push(f);
    }
    if (out.length >= 6) break;
  }
  return out;
}
