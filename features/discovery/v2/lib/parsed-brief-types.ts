import type { CountryCode, FollowerBucket } from "../../chat-types";
import type { PlatformId } from "../../types";

// ─── Contracts for the brief / product parsers ────────────────────────────
//
// These shapes are the **boundary** between the discovery agent flow and
// whatever produces structured understanding of a brief. Today the producer
// is a keyword-routed mock living next to this file (see brief-parser.ts /
// product-parser.ts); at S4 the producer becomes a real Anthropic call.
//
// The shape must stay stable across that swap — anything that consumes a
// ParsedBrief / ParsedProduct should never know which producer ran.

/** What the AI deduces from a product page (or a bare product URL). */
export interface ParsedProduct {
  /** Display name — e.g. "Tabbit", "敏感肌修复面霜". */
  name: string;
  /** Optional brand if distinct from name (e.g. CeraVe → 敏感肌修复面霜). */
  brand?: string;
  /** Coarse category, free-form Chinese — e.g. "AI 工具 / 生产力 / 浏览器扩展". */
  category: string;
  /** Target geographic market, free-form — e.g. "美/加/英 等发达国家". */
  market: string;
  /** Core selling points, 2-5 items. */
  sellingPoints: string[];
  /** One-line audience description. */
  audience: string;
  /** Original URL passed in. */
  url: string;
}

/** What the AI deduces from the full brief text on submit. */
export interface ParsedBrief {
  product: ParsedProduct;

  // ── Hard filters ──
  /** Primary platforms the brief explicitly prioritizes. */
  platformsPrimary: string[];
  /** Secondary platforms (lower priority). */
  platformsSecondary: string[];
  /** Countries the brief targets. */
  countries: CountryCode[];
  /** ISO-639-1 lower-case (en/zh/ja/ko/...). */
  language: string;

  // ── Sourcing mix ──
  /** Total creator count requested by the brief. */
  creatorCount: number;
  /** Tier mix as percentages summing to 100 — head/mid/tail. */
  followerMix: { head: number; mid: number; tail: number };
  followerTiers: TierRanges;
  medianViewTiers: TierRanges;

  // ── Audience profile ──
  audienceProfilesMust: string[];
  audienceProfilesMustNot: string[];

  // ── Deliverables / commercials ──
  deliverables: Record<string, string>;
  /** Free-form budget summary (CPM-based, flat fees, etc.). */
  budgetSummary: string;
  /** Content retention, e.g. "三个月内不允许删除". Empty if unspecified. */
  contentRetention: string;
  /** Whether voiceover is required. */
  mustVoiceover: boolean;

  // ── Step content per tab ──
  // Optional. When omitted, the runner falls back to legacy hardcoded copy.
  /** Tab 2 step E — top scene combos (type × method) ranked by the AI. */
  sceneCombos?: ReadonlyArray<{ type: string; method: string; rationale: string }>;
  /** Tab 2 step D — creator type → cooperation methods rows. */
  cooperationMethods?: ReadonlyArray<{ type: string; methods: readonly string[] }>;
  /** Tab 1 step C — competitor brands the AI surfaces. */
  competitorBrands?: readonly string[];
  /** Tab 3 step C — category baseline tiles. */
  categoryBaseline?: {
    basisLine: string;
    tiles: ReadonlyArray<{ label: string; value: string }>;
  };
  /** Tab 3 step E — trend label pills. */
  trendLabels?: ReadonlyArray<{ label: string; count: number }>;
  /** Tab 1 / Tab 3 step D — scan summary numbers. */
  scanSummary?: {
    /** Tab 1: "12,430 条相关帖子已扫描" / Tab 3: "8,230 条相关帖子已扫描" */
    scanned: { count: number; label: string };
    /** Tab 1: "286 条命中同类品牌合作" / Tab 3: "194 条达到爆款阈值" */
    matched: { count: number; label: string };
    /** Time budget label, e.g. "6.5s". */
    duration: string;
  };

  // ── Provenance ──
  /** Original brief text the user pasted, for downstream "ask again" turns. */
  rawBriefText: string;
  /** Which fixture / model produced this — for debugging the swap path. */
  source: "fixture" | "anthropic";
  /** Fixture id when source === "fixture", model id when source === "anthropic". */
  sourceVariant: string;
}

interface TierRanges {
  head: { min: number; max: number };
  mid: { min: number; max: number };
  tail: { min: number; max: number };
}

// ─── Bridge helpers from ParsedBrief → existing ChatChips ────────────────

/**
 * Pick the single platform a freshly-parsed brief should default the chat
 * chips to. We honour primary-first; if none match the existing PlatformId
 * union we fall back to TikTok (current default).
 */
export function pickPrimaryPlatform(brief: ParsedBrief): PlatformId {
  const known: PlatformId[] = ["tiktok", "instagram", "youtube"];
  const all = [...brief.platformsPrimary, ...brief.platformsSecondary];
  for (const p of all) {
    const lower = p.toLowerCase();
    if (lower === "tiktok" || lower === "tt") return "tiktok";
    if (lower === "youtube" || lower === "yt" || lower === "ytb") return "youtube";
    if (lower === "instagram" || lower === "ig" || lower === "ins") return "instagram";
  }
  // X / Twitter is in the brief but not in PlatformId yet — fall back.
  void known;
  return "tiktok";
}

/**
 * The brief encodes a head/mid/tail mix; the existing FollowerBucket chip is
 * single-select. When we have a mix we deliberately leave the chip as `any`
 * so the user sees "all tiers" — the actual mix sampling is enforced by
 * applyHardFilters (S3 work). Returning a single bucket here would silently
 * collapse the brief's intent.
 */
export function pickFollowerBucket(brief: ParsedBrief): FollowerBucket {
  void brief;
  return "any";
}
