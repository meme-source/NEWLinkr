import type { ChatChips, NumRange } from "../chat-types";
import type { ParsedBrief } from "./lib/parsed-brief-types";
import type { Creator } from "./mock-data";

export function applyHardFilters(creators: Creator[], chips: ChatChips): Creator[] {
  return creators.filter((c) => {
    if (!c.platforms.includes(chips.platform)) return false;
    if (!matchCountries(c, chips.countries)) return false;
    if (!matchRange(c.followersRaw, chips.followers)) return false;
    if (!matchRange(c.medianViewsRaw, chips.views)) return false;
    return true;
  });
}

function matchRange(value: number, range: NumRange): boolean {
  // Normalise: if min > max, treat the range as swapped rather than empty.
  const min = range.min;
  const max = range.max;
  const lo = min === null ? null : max !== null && min > max ? max : min;
  const hi = max === null ? null : min !== null && max < min ? min : max;
  if (lo !== null && value < lo) return false;
  if (hi !== null && value > hi) return false;
  return true;
}

/**
 * Brief-driven filtering for the intake submit.
 *
 * Goes beyond `applyHardFilters` (which is single-platform / single-bucket /
 * single-country) by:
 *   - Honouring the full primary+secondary platform list from the brief
 *   - Honouring the full country list from the brief
 *   - Sampling across head / mid / tail tiers in the brief's mix percentages
 *   - Capping at brief.creatorCount when the pool is large enough
 *
 * Falls back to the brief's pool order when sampling under-fills (e.g. the
 * mock pool has only 12 US/CA/GB candidates but the brief asks for 30 →
 * we surface the available 12 with a head/mid/tail mix as close to the
 * requested ratio as possible).
 */
export function applyBriefFilters(creators: Creator[], brief: ParsedBrief): Creator[] {
  const allowedPlatforms = collectPlatforms(brief);
  const allowedFlags = collectFlags(brief.countries);

  const pool = creators.filter((c) => {
    if (!c.platforms.some((p) => allowedPlatforms.has(p))) return false;
    if (allowedFlags.size > 0 && !allowedFlags.has(c.flag)) return false;
    return true;
  });

  return sampleByMix(pool, brief);
}

function collectPlatforms(brief: ParsedBrief): Set<string> {
  const all = [...brief.platformsPrimary, ...brief.platformsSecondary].map((p) => p.toLowerCase());
  const known = new Set<string>();
  for (const p of all) {
    if (p === "tiktok" || p === "tt") known.add("tiktok");
    else if (p === "youtube" || p === "yt" || p === "ytb") known.add("youtube");
    else if (p === "instagram" || p === "ig" || p === "ins") known.add("instagram");
    // x / twitter not in mock Platform yet — silently dropped here so the
    // filter doesn't reject every creator. When we extend Platform, this
    // mapping picks them up automatically.
  }
  if (known.size === 0) known.add("tiktok"); // safety net
  return known;
}

const COUNTRY_FLAG: Record<string, string> = {
  us: "🇺🇸",
  gb: "🇬🇧",
  ca: "🇨🇦",
  au: "🇦🇺",
};

function collectFlags(countries: ParsedBrief["countries"]): Set<string> {
  const out = new Set<string>();
  for (const c of countries) {
    const flag = COUNTRY_FLAG[c];
    if (flag) out.add(flag);
  }
  return out;
}

type Tier = "head" | "mid" | "tail";

function inferTier(followers: number, brief: ParsedBrief): Tier {
  const t = brief.followerTiers;
  if (followers >= t.head.min) return "head";
  if (followers >= t.mid.min) return "mid";
  return "tail";
}

function sampleByMix(pool: Creator[], brief: ParsedBrief): Creator[] {
  const buckets: Record<Tier, Creator[]> = { head: [], mid: [], tail: [] };
  for (const c of pool) buckets[inferTier(c.followersRaw, brief)].push(c);

  // Sort each tier by a stable quality proxy so the picks feel curated, not
  // random — high evidence first, then higher ER, then higher follower count.
  const evidenceRank: Record<Creator["evidence"], number> = { high: 0, medium: 1, weak: 2 };
  const sortKey = (c: Creator) => [evidenceRank[c.evidence], -parseFloat(c.er), -c.followersRaw];
  for (const tier of ["head", "mid", "tail"] as Tier[]) {
    buckets[tier].sort((a, b) => {
      const ka = sortKey(a);
      const kb = sortKey(b);
      for (let i = 0; i < ka.length; i++) {
        if (ka[i] !== kb[i]) return ka[i] - kb[i];
      }
      return 0;
    });
  }

  const target = brief.creatorCount;
  const quotas: Record<Tier, number> = {
    head: Math.round((target * brief.followerMix.head) / 100),
    mid: Math.round((target * brief.followerMix.mid) / 100),
    tail: Math.round((target * brief.followerMix.tail) / 100),
  };

  // Round-trip rounding can leave the sum off by 1 — fix by adjusting the
  // largest quota tier to land exactly on `target`.
  const sum = quotas.head + quotas.mid + quotas.tail;
  if (sum !== target) {
    const biggest: Tier =
      quotas.head >= quotas.mid && quotas.head >= quotas.tail
        ? "head"
        : quotas.mid >= quotas.tail
          ? "mid"
          : "tail";
    quotas[biggest] += target - sum;
  }

  const picked: Creator[] = [];
  const leftover: Creator[] = [];
  for (const tier of ["head", "mid", "tail"] as Tier[]) {
    const want = quotas[tier];
    picked.push(...buckets[tier].slice(0, want));
    leftover.push(...buckets[tier].slice(want));
  }

  // Backfill if a tier ran short — surface the next-best candidates from
  // the leftover pool so the user still gets close to the brief's count.
  if (picked.length < target) {
    leftover.sort((a, b) => {
      const ka = sortKey(a);
      const kb = sortKey(b);
      for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return ka[i] - kb[i];
      return 0;
    });
    picked.push(...leftover.slice(0, target - picked.length));
  }

  return picked;
}

function matchCountries(creator: Creator, countries: ChatChips["countries"]): boolean {
  // Empty selection = 全球 (no country constraint).
  if (countries.length === 0) return true;

  const flag = creator.flag;
  return countries.some((id) => {
    switch (id) {
      case "us":
        return flag === "🇺🇸";
      case "gb":
        return flag === "🇬🇧";
      case "ca":
        return flag === "🇨🇦";
      case "au":
        return flag === "🇦🇺";
      case "sea":
        return creator.countryCode === "sea";
      case "me":
        // No middle-east mock creators yet; keep the filter honest.
        return false;
    }
  });
}
