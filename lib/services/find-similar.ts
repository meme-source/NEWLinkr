// 找相似 / 找平替主服务（spec §4 + §5）。
//
// Phase 0 实现走启发式 + mock 候选池：
//   1. 解析种子 → 拿到完整 Creator
//   2. 按 category 选权重模板
//   3. 全库扫一遍，硬门槛淘汰 + 5 维评分
//   4. 排序 → 截 Top N
//   5. 对每个结果派生 chips / narrative / contact_badge / key_metrics
//   6. budget mode 额外计算 saving_pct / CPM 并叠加 alt_chips
//
// 切到真实 API 时，只换 lib/discovery/creator-pool.ts；本文件不需要改。
//
// Service contract：
//   - 输入是已经过 zod 校验的 FindSimilarRequest
//   - 业务失败抛 AppError 子类（NotFoundError 等）
//   - 不接触 NextRequest / NextResponse

import { randomUUID } from "node:crypto";
import { NotFoundError } from "@/lib/api/errors";
import type {
  Creator,
  FindSimilarRequest,
  FindSimilarResponse,
  FindSimilarSeedSnapshot,
  SimilarAlternativeExtras,
  SimilarContactBadge,
  SimilarCreatorResult,
  SimilarKeyMetrics,
  SimilarSearchMode,
} from "@/types/api";
import { aggregateSimilarity, deriveTradeoffs } from "@/lib/scoring/similarity/aggregate";
import { deriveCoreChips } from "@/lib/scoring/similarity/chips";
import { applyHardFilters } from "@/lib/scoring/similarity/filters";
import {
  DISPLAY_DECIMALS,
  DISPLAY_MAX,
  INTERNAL_MAX,
  toDisplayScore,
} from "@/lib/scoring/similarity/normalize";
import { pickWeightTemplate } from "@/lib/scoring/similarity/weights";
import {
  findCandidatesForSeed,
  findSeedByHandle,
  findSeedById,
} from "@/lib/discovery/creator-pool";

const DEFAULT_LIMIT = 20;
const DEFAULT_MIN_SIMILARITY_FOR_ALT = 75;

export async function findSimilarCreators(input: FindSimilarRequest): Promise<FindSimilarResponse> {
  const seed = resolveSeed(input);
  const template = pickWeightTemplate(seed.category);
  const now = new Date();

  const allCandidates = findCandidatesForSeed(seed);
  let filteredOutCount = 0;

  const scored: Array<{
    candidate: Creator;
    result: ReturnType<typeof aggregateSimilarity>;
  }> = [];
  for (const candidate of allCandidates) {
    const verdict = applyHardFilters({
      seed,
      candidate,
      filters: input.filters,
      platform: input.platform,
      now,
    });
    if (!verdict.passed) {
      filteredOutCount += 1;
      continue;
    }
    const result = aggregateSimilarity({ seed, candidate, template, now });
    scored.push({ candidate, result });
  }

  // Budget mode 在硬门槛之上再卡一层相似度门槛（spec §5.2）。
  const minSimilarity = input.minSimilarityForAlt ?? DEFAULT_MIN_SIMILARITY_FOR_ALT;
  const filteredForMode =
    input.mode === "budget"
      ? scored.filter((s) => {
          const passes = s.result.internalScore >= minSimilarity;
          if (!passes) filteredOutCount += 1;
          return passes;
        })
      : scored;

  const sorted = filteredForMode.sort((a, b) => {
    if (input.mode === "budget") {
      const sa = computeAlternativeScore(seed, a.candidate, a.result.internalScore);
      const sb = computeAlternativeScore(seed, b.candidate, b.result.internalScore);
      return sb - sa;
    }
    return b.result.internalScore - a.result.internalScore;
  });

  const limit = input.limit ?? DEFAULT_LIMIT;
  const top = sorted.slice(0, limit);

  const results = top.map((entry) =>
    buildResult({
      seed,
      candidate: entry.candidate,
      aggregate: entry.result,
      mode: input.mode,
    }),
  );

  return {
    searchId: `search_${randomUUID()}`,
    mode: input.mode,
    seed: buildSeedSnapshot(seed, template.id),
    sampleUsed: {
      posts: input.postSampleSize,
      covers: input.coverSampleSize,
    },
    visualStatus: "ready",
    displayScale: {
      internalMax: INTERNAL_MAX,
      displayMax: DISPLAY_MAX,
      decimals: DISPLAY_DECIMALS,
    },
    results,
    filteredOutCount,
  };
}

function resolveSeed(input: FindSimilarRequest): Creator {
  let seed: Creator | null = null;
  if (input.seedCreatorId) seed = findSeedById(input.seedCreatorId);
  if (!seed && input.seedHandle) seed = findSeedByHandle(input.seedHandle);
  if (!seed) {
    throw new NotFoundError(
      `Seed creator not found: ${input.seedCreatorId ?? input.seedHandle ?? "(empty)"}`,
    );
  }
  return seed;
}

function buildSeedSnapshot(seed: Creator, templateId: string): FindSimilarSeedSnapshot {
  return {
    creatorId: seed.id,
    handle: seed.handle,
    country: seed.region,
    primaryCategory: seed.category,
    weightTemplate: templateId as FindSimilarSeedSnapshot["weightTemplate"],
    estimatedPrice: seed.estimatedPrice,
    medianViews: seed.medianViews,
    engagementRate: seed.engagementRate,
    estimatedCpm: formatCpm(estimateCpm(seed)),
  };
}

type BuildResultInput = {
  seed: Creator;
  candidate: Creator;
  aggregate: ReturnType<typeof aggregateSimilarity>;
  mode: SimilarSearchMode;
};

function buildResult(input: BuildResultInput): SimilarCreatorResult {
  const { seed, candidate, aggregate, mode } = input;

  const altExtras =
    mode === "budget" ? buildAlternativeExtras(seed, candidate, aggregate.internalScore) : null;
  const altChipSignals = altExtras
    ? {
        savingPct: altExtras.estimatedSavingPct,
        cpmDeltaPct: cpmDeltaPct(seed, candidate),
      }
    : undefined;

  const chips = deriveCoreChips({
    seed,
    candidate,
    mode,
    topic: aggregate.topic,
    format: aggregate.format,
    visual: aggregate.visual,
    altSignals: altChipSignals,
  });

  const keyMetrics: SimilarKeyMetrics = {
    estimatedPrice: candidate.estimatedPrice,
    engagementRatePct: Number.isFinite(candidate.engagementRate)
      ? Number(candidate.engagementRate.toFixed(1))
      : null,
    medianLikes: medianFromPosts(candidate, "likes"),
    medianComments: medianFromPosts(candidate, "comments"),
  };

  const tradeoffs = deriveTradeoffs(seed, candidate);
  const narrative = buildNarrative(seed, candidate, aggregate);

  // budget mode 时 internal_score 替换为 alternative_score（综合排序键）。
  const internalScore =
    mode === "budget" && altExtras
      ? computeAlternativeScore(seed, candidate, aggregate.internalScore)
      : aggregate.internalScore;

  return {
    creatorId: candidate.id,
    handle: candidate.handle,
    platform: candidate.platform,
    avatarUrl: candidate.avatar,
    country: candidate.region,
    countryEmoji: extractCountryEmoji(candidate.region),
    language: null,
    projectTags: candidate.userTags,
    internalScore,
    displayScore: toDisplayScore(internalScore),
    radar: aggregate.radar,
    keyMetrics,
    coreChips: chips,
    contactBadge: buildContactBadge(candidate),
    alternativeExtras: altExtras,
    subscoresDetail: aggregate.subscoresDetail,
    narrative,
    tradeoffs,
  };
}

function buildContactBadge(creator: Creator): SimilarContactBadge {
  const primaryEmail = creator.emails.find((e) => e.primary) ?? creator.emails[0] ?? null;
  if (creator.emailStatus === "verified" && primaryEmail) {
    return {
      status: "verified",
      label: "邮箱已验证",
      email: primaryEmail.address,
      externalLinks: creator.socialLinks.map((l) => l.url),
    };
  }
  if (creator.emailStatus === "found" && primaryEmail) {
    return {
      status: "found",
      label: "邮箱已找到",
      email: primaryEmail.address,
      externalLinks: creator.socialLinks.map((l) => l.url),
    };
  }
  return {
    status: "missing",
    label: "邮箱缺失",
    email: null,
    externalLinks: creator.socialLinks.map((l) => l.url),
  };
}

function buildNarrative(
  seed: Creator,
  candidate: Creator,
  aggregate: ReturnType<typeof aggregateSimilarity>,
): string {
  // 模板拼接（Phase 1+ 由 LLM rerank 接管，spec §4.8）。这里给一段
  // "可读、不夸大、有据可查"的中文，紧贴 evidence。
  const segments: string[] = [];
  if (seed.category === candidate.category) {
    segments.push(`同属${seed.category}类目`);
  }
  if (aggregate.topic.score >= 70) {
    segments.push("内容主题高度相近");
  } else if (aggregate.topic.score >= 50) {
    segments.push("内容主题部分重合");
  }
  if (aggregate.format.score >= 70) {
    segments.push("内容形式接近");
  }
  if (aggregate.subscoresDetail.data.score >= 70) {
    segments.push("数据量级匹配");
  }
  if (aggregate.subscoresDetail.activity.score >= 80) {
    segments.push("近期活跃稳定");
  }
  if (segments.length === 0) {
    segments.push("评分整体偏中等，建议结合详情判断");
  }
  return segments.join("；") + "。";
}

function buildAlternativeExtras(
  seed: Creator,
  candidate: Creator,
  similarityInternal: number,
): SimilarAlternativeExtras {
  const seedMid = parsePriceMid(seed.estimatedPrice);
  const candMid = parsePriceMid(candidate.estimatedPrice);
  const saving =
    seedMid !== null && candMid !== null && seedMid > 0
      ? Math.round(((seedMid - candMid) / seedMid) * 100)
      : null;
  const cpm = estimateCpm(candidate);
  const cpe = estimateCpe(candidate);
  return {
    similarityScoreInternal: similarityInternal,
    similarityScoreDisplay: toDisplayScore(similarityInternal),
    estimatedSavingPct: saving,
    estimatedCpm: formatCpm(cpm),
    estimatedCpe: formatCpe(cpe),
    keyMetricsOverride: {
      estimatedPrice: candidate.estimatedPrice,
      savingPctLabel: formatSavingLabel(saving),
      estimatedCpm: formatCpm(cpm),
      estimatedCpe: formatCpe(cpe),
    },
  };
}

function computeAlternativeScore(seed: Creator, candidate: Creator, similarity: number): number {
  // 找平替的综合排序键 = 0.4 × 相似度 + 0.4 × 价格优势 + 0.2 × 数据接近度。
  // 把价格优势放进排序键，让"便宜且像"排在前面。
  const seedMid = parsePriceMid(seed.estimatedPrice);
  const candMid = parsePriceMid(candidate.estimatedPrice);
  let savingScore = 0;
  if (seedMid !== null && candMid !== null && seedMid > 0) {
    const ratio = (seedMid - candMid) / seedMid;
    savingScore = Math.max(0, Math.min(100, ratio * 100));
  }
  const dataRatio =
    seed.medianViews > 0 && candidate.medianViews > 0
      ? Math.min(seed.medianViews, candidate.medianViews) /
        Math.max(seed.medianViews, candidate.medianViews)
      : 0.5;
  const dataScore = dataRatio * 100;
  return Math.round(similarity * 0.4 + savingScore * 0.4 + dataScore * 0.2);
}

function parsePriceMid(estimatedPrice: string | null): number | null {
  if (!estimatedPrice) return null;
  const matches = estimatedPrice.match(/\d[\d,]*/g);
  if (!matches || matches.length === 0) return null;
  const numbers = matches.map((m) => Number(m.replace(/,/g, ""))).filter((n) => Number.isFinite(n));
  if (numbers.length === 0) return null;
  if (numbers.length === 1) return numbers[0]!;
  return (numbers[0]! + numbers[1]!) / 2;
}

function estimateCpm(creator: Creator): number | null {
  const mid = parsePriceMid(creator.estimatedPrice);
  if (mid === null || creator.medianViews <= 0) return null;
  return (mid / creator.medianViews) * 1000;
}

function estimateCpe(creator: Creator): number | null {
  const mid = parsePriceMid(creator.estimatedPrice);
  if (mid === null || creator.medianViews <= 0 || creator.engagementRate <= 0) return null;
  return mid / (creator.medianViews * (creator.engagementRate / 100));
}

function cpmDeltaPct(seed: Creator, candidate: Creator): number | null {
  const seedCpm = estimateCpm(seed);
  const candCpm = estimateCpm(candidate);
  if (seedCpm === null || candCpm === null || seedCpm === 0) return null;
  return Math.round(((candCpm - seedCpm) / seedCpm) * 100);
}

function formatSavingLabel(saving: number | null): string | null {
  if (saving === null) return null;
  if (saving > 0) return `省 ${saving}%`;
  if (saving < 0) return `贵 ${Math.abs(saving)}%`;
  return "价格相当";
}

function formatCpm(value: number | null): string | null {
  if (value === null || !Number.isFinite(value)) return null;
  return `$${value.toFixed(1)}`;
}

function formatCpe(value: number | null): string | null {
  if (value === null || !Number.isFinite(value)) return null;
  return `$${value.toFixed(2)}`;
}

function medianFromPosts(creator: Creator, key: "likes" | "comments"): number | null {
  const values = (creator.recentPosts ?? []).map((p) => p[key]).filter((v) => Number.isFinite(v));
  if (values.length === 0) return null;
  values.sort((a, b) => a - b);
  const mid = Math.floor(values.length / 2);
  return values.length % 2 === 0 ? Math.round((values[mid - 1]! + values[mid]!) / 2) : values[mid]!;
}

function extractCountryEmoji(region: string): string {
  if (!region) return "";
  // mock 中 region 直接是 emoji（如 "🇺🇸"），抽出第一个字形簇即可。
  const trimmed = region.trim();
  // 国旗 emoji 由 2 个 regional indicator 字符组成，4 个 code unit。
  const segments = [...trimmed];
  return segments.slice(0, 2).join("");
}
