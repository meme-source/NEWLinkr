import {
  COUNTRY_OPTIONS,
  COUNTRY_TO_FLAG,
  FLAG_TO_DISCOVERY_COUNTRY,
  LOCALE_REGION_TO_COUNTRY,
  REGION_TIER_OPTIONS,
} from "@/features/plugin/data/countries";
import {
  formatPlays,
  generateSyntheticVideos,
  parseMetricToNumber,
} from "@/features/plugin/lib/synthetic";
import type {
  AudienceHighlight,
  AudienceSummary,
  CreatorProfile,
  RegionTierKey,
} from "@/features/plugin/types";

export function getCreatorEmail(creator: CreatorProfile) {
  return creator.email ?? `${creator.handle.replace("@", "")}@mail.demo`;
}

export function getCreatorContactEmail(creator: CreatorProfile) {
  return creator.email ?? null;
}

export function getCreatorAveragePlays(creator: CreatorProfile, scrapeCount?: number) {
  if (typeof scrapeCount === "number") {
    const videos = generateSyntheticVideos(creator, Math.max(18, scrapeCount));
    if (videos.length > 0) {
      const averagePlays =
        videos.reduce((sum, video) => sum + video.plays, 0) / videos.length;
      return formatPlays(averagePlays);
    }
  }
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
  const mul = unit === "万" ? 1e4 : unit === "千" ? 1e3 : unit === "k" || unit === "K" ? 1e3 : unit === "m" || unit === "M" ? 1e6 : 1;
  const likesNum = base * mul;
  const comments = likesNum * 0.08;
  if (comments >= 1e4) return `${(comments / 1e4).toFixed(1)}万`;
  if (comments >= 1e3) return `${(comments / 1e3).toFixed(1)}k`;
  return Math.round(comments).toString();
}

export function getCreatorMetricSnapshot(creator: CreatorProfile, scrapeCount?: number) {
  // Plugin 内所有“同一个博主”的指标卡都从这一份 snapshot 取值，
  // 这样悬浮卡、找相似卡和侧边详情卡会始终保持同一数据源。
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
  scrapeCount: number
) {
  const sortedTopics = [...topics].sort((left, right) => {
    if (right.weight !== left.weight) {
      return right.weight - left.weight;
    }
    return left.label.localeCompare(right.label);
  });

  const maxWeight = sortedTopics[0]?.weight ?? 1;
  const topicsWithMentions = sortedTopics.map((topic, index) => {
    const weightedMentions = Math.round((topic.weight / (maxWeight + 2)) * scrapeCount);
    const decayMentions = Math.max(1, scrapeCount - index - 1);
    const mentions = Math.max(
      1,
      Math.min(scrapeCount, Math.round((weightedMentions + decayMentions) / 2))
    );
    return { ...topic, mentions };
  });

  topicsWithMentions.sort((left, right) => {
    if (right.mentions !== left.mentions) {
      return right.mentions - left.mentions;
    }
    if (right.weight !== left.weight) {
      return right.weight - left.weight;
    }
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
    safeEr >= 4
      ? "表现极度稳定，适合做常规曝光投放。"
      : "流量整体平稳，偶有波动，需关注近期节奏。";
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
  if (creator.creatorType?.trim()) {
    return creator.creatorType.trim();
  }

  const profileText = `${creator.bio} ${creator.statBadges.join(" ")}`.toLowerCase();

  if (/(科技|数码|3c|tech|gadget|gear|评测)/.test(profileText)) {
    return "科技类博主";
  }
  if (/(露营|户外|徒步|公路旅行|outdoor|camp)/.test(profileText)) {
    return "户外类";
  }
  if (/(家庭|亲子|family)/.test(profileText)) {
    return "家庭类";
  }
  if (/(旅行|travel)/.test(profileText)) {
    return "旅行类";
  }
  if (/(美妆|护肤|彩妆|beauty)/.test(profileText)) {
    return "美妆类";
  }
  if (/(健身|运动|fitness)/.test(profileText)) {
    return "运动类";
  }

  return "科技类博主";
}

export function getCreatorAudienceBreakdown(creator: CreatorProfile) {
  return (
    creator.audienceBreakdown ?? [
      { label: "北美受众", value: "62%" },
      { label: "女性 25-34", value: "48%" },
      { label: "户外兴趣人群", value: "71%" },
    ]
  );
}

export function getAudienceSummary(creator: CreatorProfile): AudienceSummary {
  return creator.audienceSummary ?? {
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
  };
}

export function computeAudienceHighlights(summary: AudienceSummary): AudienceHighlight[] {
  const out: AudienceHighlight[] = [];
  // Gender — show female if ≥ 60%
  if (summary.gender && summary.gender.female >= 60) {
    out.push({ label: "女性受众", pct: summary.gender.female });
  }
  // Age — show dominant group if ≥ 40%
  if (summary.age) {
    const dominant = [...summary.age].sort((a, b) => b.pct - a.pct)[0];
    if (dominant && dominant.pct >= 40) {
      out.push({ label: `${dominant.range} 岁`, pct: dominant.pct });
    }
  }
  // Region — show T1 and T2 with country flag
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

export function getCountryFlag(country: string) {
  return COUNTRY_TO_FLAG[country] ?? COUNTRY_OPTIONS.find((item) => item.name === country)?.flag ?? "🌐";
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
