// Adapter from the carousel's loose `CardItem` shape to the strict
// `InfluencerCardData` the new card consumes.

import { audienceByCreatorId } from "@/features/plugin/data/creator-audience";

import { type AnalysisSeedComparison, deriveAnalysis } from "./analysis";
import { flagFromCode } from "./flag";
import type {
  CoverCount,
  EmailStatus,
  FilterMode,
  InfluencerCardData,
  InfluencerCardMetric,
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
  /** 整卡推荐理由(一句话)。深度分析在数据极少时兜底用它。 */
  reason?: string;
  /** 逐条推荐理由 —— 深度分析的主要内容来源。 */
  reasons?: string[];
  /** 需要权衡的取舍点 —— 深度分析里标成「需权衡」。 */
  tradeoffs?: string[];
  /** 后台产出的「受众人群」维度特征(性别 / 年龄段 / 地域人群…)。 */
  audience?: string[];
  /** 后台产出的「内容主题」维度特征。 */
  topics?: Array<{ label: string }>;
  /** 「找平替」相对种子博主的省钱比例,如 "55%"。 */
  savingPct?: string;
  /** 「找平替」种子↔候选的指标对比(报价 / CPM / CPE…)。 */
  seedComparison?: AnalysisSeedComparison;
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

export interface MapCardItemOptions {
  scrapeCount: ScrapeCount;
  coverCount: CoverCount;
  perspective: boolean;
  userTags: string[];
  isSaved: boolean;
  /** 当前筛选模式 —— 「找平替」时深度分析会先摆「平替依据」。 */
  filterMode?: FilterMode;
}

export function mapCardItemToInfluencerCard(
  card: CardItemLike,
  { scrapeCount, coverCount, perspective, userTags, isSaved, filterMode }: MapCardItemOptions,
): InfluencerCardData {
  const handle = card.name.replace(/^@/, "");
  const initials = (handle.charAt(0) || "?").toUpperCase();
  const countryCode = normalizeCountry(card.country);
  const countryLabel = localiseCountry(countryCode, card.country);
  const flag = countryCode ? flagFromCode(countryCode) : undefined;
  const email = emailStatusFor(card);
  const emailAddress =
    email.kind === "found" ? email.address : email.kind === "verified" ? (email.address ?? "") : "";
  const hasEmail = emailAddress.length > 0;
  const sample: InfluencerCardSampleConfig = {
    scrapeCount,
    coverCount,
    perspective,
  };
  return {
    id: card.id,
    handle,
    name: handle,
    initials,
    countryCode,
    countryLabel,
    flag,
    creatorType: card.creatorType,
    email,
    emailAddress,
    hasEmail,
    isSaved,
    tags: userTags,
    metrics: metricsFor(card),
    // 深度分析的维度来源:卡片自带 audience/topics(后台维度化产出)优先,缺
    // 失时由 mock 受众表按 id 兜底;tags/tradeoffs 走关键词归类。「找平替」模
    // 式额外把 seedComparison 的逐项对比算成「平替依据」摆在最前。
    analysis: deriveAnalysis({
      tags: card.tags,
      tradeoffs: card.tradeoffs,
      audience: card.audience ?? audienceByCreatorId[card.id],
      topics: card.topics,
      filterMode,
      seedComparison: card.seedComparison,
    }),
    sample,
  };
}
