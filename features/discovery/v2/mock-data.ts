export type EvidenceLevel = "high" | "medium" | "weak";
export type Platform = "tiktok" | "instagram" | "youtube";
export type CountryCode = "us" | "sea" | "global";

export interface VideoPost {
  id: string;
  thumbSeed: number;
  postedAgo: string;
  duration: string;
  er: string;
  views: string;
  likes: string;
  comments: string;
  isCollab?: boolean;
  caption: string;
}

export interface Creator {
  id: string;
  handle: string;
  displayName: string;
  avatarSeed: number;
  flag: string;
  countryLabel: string;
  countryCode: CountryCode;
  platforms: Platform[];
  followers: string;
  followersRaw: number;
  medianViews: string;
  medianViewsRaw: number;
  er: string;
  evidence: EvidenceLevel;
  reasons: string[];
  risk?: string;
  videos: VideoPost[];
}

export interface CreatorGroup {
  key: EvidenceLevel;
  label: string;
  hint: string;
  rule: EvidenceRule;
  count: number;
  creators: Creator[];
}

export interface EvidenceRule {
  title: string;
  bullets: string[];
}

export const EVIDENCE_RULES: Record<EvidenceLevel, EvidenceRule> = {
  high: {
    title: "强证据 — 同时满足以下任一组合",
    bullets: [
      "近 90 天发布过 ≥ 1 条核心对标竞品的合作内容",
      "且该达人近 30 天平均互动率高于其历史基线 ≥ 1.3 倍",
      "或粉丝画像与产品 ICP 重合度 ≥ 65%",
    ],
  },
  medium: {
    title: "中证据 — 命中以下任一指标",
    bullets: [
      "近 90 天发布过同类目（非核心竞品）合作内容",
      "或评论区高频出现产品相关关键词（前 10%）",
      "或内容风格 / 叙事切入与产品定位匹配，但缺少直接合作证据",
    ],
  },
  weak: {
    title: "弱证据 — 长尾候选",
    bullets: [
      "尚未发布过同类目内容，需 cold outreach",
      "互动率 / 增速 / 受众纯度等单点指标突出",
      "建议作为观察池，2-4 周复评",
    ],
  },
};

const r = (seed: number, max: number) => {
  const x = Math.sin(seed) * 10000;
  return Math.floor((x - Math.floor(x)) * max);
};

const makeVideos = (base: number, isCollabSet: number[] = []): VideoPost[] =>
  Array.from({ length: 4 }, (_, i) => {
    const s = base * 100 + i;
    const er = (8 + r(s, 35)).toFixed(1);
    return {
      id: `v-${s}`,
      thumbSeed: s,
      postedAgo: ["2 hours", "1 day", "3 days", "1 week"][i],
      duration: ["00:14", "00:32", "00:21", "00:47"][i],
      er: `${er}%`,
      views: ["2.5K", "8.1K", "1.2K", "5.7K"][i],
      likes: ["883", "2.4K", "412", "1.9K"][i],
      comments: ["3", "47", "12", "31"][i],
      isCollab: isCollabSet.includes(i),
      caption: [
        "POV: 第一次试这款竟然真的有效…",
        "敏感肌救星 vs 大牌平价测评",
        "护肤新人三件套｜不踩雷指南",
        "code LINKR15 优惠分享",
      ][i],
    };
  });

/**
 * Mock pool sized to exercise every chip combination — covers all six
 * countries (US/UK/CA/AU/SEA/ME), all five follower buckets (nano → mega),
 * and all view tiers up to 1M+. Keep evidence distribution roughly balanced
 * (high ≈ medium ≈ weak) so each group renders.
 *
 * Naming guideline for new entries: handle = `@<firstname>.<theme>`.
 * `countryCode` is mostly "global" — only "us" and "sea" gate the country
 * chip filter; the other flags are visual labels.
 */
export const MOCK_CREATORS: Creator[] = [
  // ─── 强证据 (high) — 9 creators across follower buckets ──────────
  {
    id: "c1",
    handle: "@maya.skinlab",
    displayName: "Maya Lin",
    avatarSeed: 12,
    flag: "🇺🇸",
    countryLabel: "United States",
    countryCode: "us",
    platforms: ["tiktok", "instagram"],
    followers: "42.8K",
    followersRaw: 42800,
    medianViews: "12.4K",
    medianViewsRaw: 12400,
    er: "9.2%",
    evidence: "high",
    reasons: [
      "近 60 天发布过 2 条竞品合作内容（同类目）",
      "近 30 天平均播放量高于历史基线 1.8 倍",
      "评论区出现「敏感肌」「修复」高频词",
    ],
    risk: "爆款集中在测评类，建议 brief 贴近真实使用场景",
    videos: makeVideos(1, [0, 3]),
  },
  {
    id: "c2",
    handle: "@joycebeauty",
    displayName: "Joyce Tran",
    avatarSeed: 47,
    flag: "🇨🇦",
    countryLabel: "Canada",
    countryCode: "global",
    platforms: ["tiktok", "youtube"],
    followers: "118.2K",
    followersRaw: 118200,
    medianViews: "34.1K",
    medianViewsRaw: 34100,
    er: "8.7%",
    evidence: "high",
    reasons: [
      "粉丝画像 70% 为 18-24 岁女性，与产品 ICP 高度一致",
      "近 3 条视频均以「成分党」叙事切入",
    ],
    videos: makeVideos(2, [1]),
  },
  {
    id: "c7",
    handle: "@elena.routine",
    displayName: "Elena Park",
    avatarSeed: 32,
    flag: "🇰🇷",
    countryLabel: "South Korea",
    countryCode: "global",
    platforms: ["tiktok", "instagram", "youtube"],
    followers: "86.5K",
    followersRaw: 86500,
    medianViews: "22.3K",
    medianViewsRaw: 22300,
    er: "10.4%",
    evidence: "high",
    reasons: ["近 90 天 3 条同类目爆款，平均播放破 50K", "粉丝复购率 28%，远超类目均值"],
    risk: "排期较满，需提前 3 周锁定档期",
    videos: makeVideos(7, [0, 2]),
  },
  {
    id: "c10",
    handle: "@sofiaglow",
    displayName: "Sofia Reyes",
    avatarSeed: 81,
    flag: "🇺🇸",
    countryLabel: "United States",
    countryCode: "us",
    platforms: ["tiktok", "instagram"],
    followers: "1.4M",
    followersRaw: 1_400_000,
    medianViews: "320K",
    medianViewsRaw: 320_000,
    er: "6.8%",
    evidence: "high",
    reasons: [
      "粉丝量 1M+ 顶部博主，最近 30 天 4 条爆款均跨越百万播放",
      "上月与同类目品牌完成两次官宣合作",
    ],
    risk: "档期紧，报价高于品类均值 30%",
    videos: makeVideos(10, [0, 2]),
  },
  {
    id: "c11",
    handle: "@layla.derm",
    displayName: "Layla Hassan",
    avatarSeed: 64,
    flag: "🇦🇪",
    countryLabel: "UAE (Middle East)",
    countryCode: "global",
    platforms: ["tiktok", "instagram"],
    followers: "560K",
    followersRaw: 560_000,
    medianViews: "138K",
    medianViewsRaw: 138_000,
    er: "8.1%",
    evidence: "high",
    reasons: ["中东市场护肤垂类前 5%", "近 90 天 5 条同类目内容均以阿拉伯语+英语双轨发布"],
    videos: makeVideos(11, [1, 3]),
  },
  {
    id: "c12",
    handle: "@hiro.skintest",
    displayName: "Hiroaki S.",
    avatarSeed: 18,
    flag: "🇬🇧",
    countryLabel: "United Kingdom",
    countryCode: "global",
    platforms: ["tiktok", "youtube"],
    followers: "215K",
    followersRaw: 215_000,
    medianViews: "62K",
    medianViewsRaw: 62_000,
    er: "9.5%",
    evidence: "high",
    reasons: [
      "近 14 天 2 条爆款讲到「神经酰胺」「敏感肌」",
      "粉丝重合度与 CeraVe / Cetaphil 达 41%",
    ],
    videos: makeVideos(12, [0, 1]),
  },
  {
    id: "c13",
    handle: "@bella.am.routine",
    displayName: "Bella Crawford",
    avatarSeed: 92,
    flag: "🇦🇺",
    countryLabel: "Australia",
    countryCode: "global",
    platforms: ["tiktok", "instagram"],
    followers: "780K",
    followersRaw: 780_000,
    medianViews: "192K",
    medianViewsRaw: 192_000,
    er: "7.6%",
    evidence: "high",
    reasons: ["晨间护肤系列连发 6 条破 100K", "粉丝粘性 / 完播率均位列澳洲护肤垂类前 8%"],
    videos: makeVideos(13, [2, 3]),
  },
  {
    id: "c14",
    handle: "@nadia.beauty",
    displayName: "Nadia Putri",
    avatarSeed: 39,
    flag: "🇮🇩",
    countryLabel: "Indonesia (SEA)",
    countryCode: "sea",
    platforms: ["tiktok", "instagram"],
    followers: "1.2M",
    followersRaw: 1_200_000,
    medianViews: "286K",
    medianViewsRaw: 286_000,
    er: "9.0%",
    evidence: "high",
    reasons: ["东南亚护肤垂类 Mega 级，月增长 15%", "近 30 天 3 条与本地药妆品牌合作（同类目）"],
    videos: makeVideos(14, [0, 2]),
  },
  {
    id: "c15",
    handle: "@chloe.skinjournal",
    displayName: "Chloe Adair",
    avatarSeed: 7,
    flag: "🇨🇦",
    countryLabel: "Canada",
    countryCode: "global",
    platforms: ["tiktok"],
    followers: "1.05M",
    followersRaw: 1_050_000,
    medianViews: "245K",
    medianViewsRaw: 245_000,
    er: "7.2%",
    evidence: "high",
    reasons: ["1M+ 头部博主 · 近期与 La Roche-Posay 完成深度合作", "评论区高频「夜间」「修复」"],
    risk: "热门时段排期需提前 6 周",
    videos: makeVideos(15, [1, 3]),
  },

  // ─── 中证据 (medium) — 8 creators ──────────────────────────
  {
    id: "c3",
    handle: "@ren.studio",
    displayName: "Ren Park",
    avatarSeed: 23,
    flag: "🇬🇧",
    countryLabel: "United Kingdom",
    countryCode: "global",
    platforms: ["tiktok"],
    followers: "27.4K",
    followersRaw: 27400,
    medianViews: "9.8K",
    medianViewsRaw: 9800,
    er: "11.3%",
    evidence: "medium",
    reasons: ["过去 90 天有 1 次同类目合作（中度证据）", "中位互动率高于品类基线"],
    risk: "近期更新频率偏低（< 2 条/周）",
    videos: makeVideos(3, [2]),
  },
  {
    id: "c4",
    handle: "@kalanidiaries",
    displayName: "Kalani M.",
    avatarSeed: 38,
    flag: "🇦🇺",
    countryLabel: "Australia",
    countryCode: "global",
    platforms: ["tiktok", "instagram"],
    followers: "63.5K",
    followersRaw: 63500,
    medianViews: "18.7K",
    medianViewsRaw: 18700,
    er: "7.4%",
    evidence: "medium",
    reasons: ["评论区品牌提及度排名前 12%", "vlog 风格契合产品故事化推广"],
    videos: makeVideos(4),
  },
  {
    id: "c8",
    handle: "@thalia.routine",
    displayName: "Thalia Wu",
    avatarSeed: 16,
    flag: "🇹🇼",
    countryLabel: "Taiwan (SEA)",
    countryCode: "sea",
    platforms: ["tiktok", "instagram"],
    followers: "34.9K",
    followersRaw: 34900,
    medianViews: "11.2K",
    medianViewsRaw: 11200,
    er: "9.6%",
    evidence: "medium",
    reasons: ["产品出现在「精选好物」合集中", "粉丝重叠度与同类目竞品达 38%"],
    risk: "合作多为置换，付费率有待验证",
    videos: makeVideos(8, [1]),
  },
  {
    id: "c16",
    handle: "@gracewithgrain",
    displayName: "Grace Whitfield",
    avatarSeed: 51,
    flag: "🇺🇸",
    countryLabel: "United States",
    countryCode: "us",
    platforms: ["tiktok", "youtube"],
    followers: "186K",
    followersRaw: 186_000,
    medianViews: "44K",
    medianViewsRaw: 44_000,
    er: "6.9%",
    evidence: "medium",
    reasons: ["近期与平价护肤品牌合作 1 次", "评论区相关关键词进入前 9%"],
    videos: makeVideos(16, [3]),
  },
  {
    id: "c17",
    handle: "@amaal.am",
    displayName: "Amaal K.",
    avatarSeed: 73,
    flag: "🇸🇦",
    countryLabel: "Saudi Arabia (Middle East)",
    countryCode: "global",
    platforms: ["tiktok", "instagram"],
    followers: "98K",
    followersRaw: 98_000,
    medianViews: "26K",
    medianViewsRaw: 26_000,
    er: "8.4%",
    evidence: "medium",
    reasons: ["中东市场温和护肤垂类，近 60 天 1 次官方探店", "粉丝画像与产品价位带契合"],
    videos: makeVideos(17, [0]),
  },
  {
    id: "c18",
    handle: "@oliver.derm",
    displayName: "Oliver Bennett",
    avatarSeed: 26,
    flag: "🇬🇧",
    countryLabel: "United Kingdom",
    countryCode: "global",
    platforms: ["tiktok", "instagram"],
    followers: "522K",
    followersRaw: 522_000,
    medianViews: "118K",
    medianViewsRaw: 118_000,
    er: "5.9%",
    evidence: "medium",
    reasons: ["皮肤科背景的科普博主，叙事切入与产品定位匹配", "尚未与核心竞品合作"],
    risk: "ER 偏低，需关注完播率",
    videos: makeVideos(18),
  },
  {
    id: "c19",
    handle: "@minh.routine",
    displayName: "Minh Trang",
    avatarSeed: 84,
    flag: "🇻🇳",
    countryLabel: "Vietnam (SEA)",
    countryCode: "sea",
    platforms: ["tiktok"],
    followers: "147K",
    followersRaw: 147_000,
    medianViews: "38K",
    medianViewsRaw: 38_000,
    er: "9.8%",
    evidence: "medium",
    reasons: ["越南护肤增速博主，粉丝纯度高", "近 90 天 2 条与本地竞品合作"],
    videos: makeVideos(19, [1, 2]),
  },
  {
    id: "c20",
    handle: "@avery.evening",
    displayName: "Avery Doyle",
    avatarSeed: 62,
    flag: "🇨🇦",
    countryLabel: "Canada",
    countryCode: "global",
    platforms: ["tiktok", "instagram"],
    followers: "276K",
    followersRaw: 276_000,
    medianViews: "74K",
    medianViewsRaw: 74_000,
    er: "7.1%",
    evidence: "medium",
    reasons: ["夜间护肤系列叙事强，与产品「夜间用」卖点贴合", "粉丝中位年龄 26 岁"],
    videos: makeVideos(20, [0]),
  },

  // ─── 弱证据 (weak) — 7 creators ────────────────────────────
  {
    id: "c5",
    handle: "@noah.everyday",
    displayName: "Noah Walker",
    avatarSeed: 55,
    flag: "🇺🇸",
    countryLabel: "United States",
    countryCode: "us",
    platforms: ["tiktok"],
    followers: "12.1K",
    followersRaw: 12100,
    medianViews: "3.2K",
    medianViewsRaw: 3200,
    er: "13.6%",
    evidence: "weak",
    reasons: ["粉丝量较小但互动率突出（13.6%）", "尚未发布过同类目内容，需 cold outreach"],
    risk: "样本量较小，需追加 2 周观察",
    videos: makeVideos(5, [0]),
  },
  {
    id: "c6",
    handle: "@aleenadaily",
    displayName: "Aleena R.",
    avatarSeed: 71,
    flag: "🇸🇬",
    countryLabel: "Singapore (SEA)",
    countryCode: "sea",
    platforms: ["tiktok", "instagram"],
    followers: "8.4K",
    followersRaw: 8400,
    medianViews: "2.1K",
    medianViewsRaw: 2100,
    er: "10.8%",
    evidence: "weak",
    reasons: ["东南亚区域增长博主，粉丝增速 +12% / 月"],
    risk: "暂无品牌合作记录",
    videos: makeVideos(6),
  },
  {
    id: "c9",
    handle: "@miko.tries",
    displayName: "Miko Tanaka",
    avatarSeed: 29,
    flag: "🇯🇵",
    countryLabel: "Japan",
    countryCode: "global",
    platforms: ["tiktok", "youtube"],
    followers: "5.9K",
    followersRaw: 5900,
    medianViews: "1.6K",
    medianViewsRaw: 1600,
    er: "12.4%",
    evidence: "weak",
    reasons: ["小众但忠实粉丝，评论区高频出现「真实」「测评」"],
    risk: "纯小语种内容，需评估海外触达",
    videos: makeVideos(9, [3]),
  },
  {
    id: "c21",
    handle: "@beth.skinpath",
    displayName: "Beth Salinger",
    avatarSeed: 44,
    flag: "🇦🇺",
    countryLabel: "Australia",
    countryCode: "global",
    platforms: ["tiktok"],
    followers: "3.2K",
    followersRaw: 3200,
    medianViews: "920",
    medianViewsRaw: 920,
    er: "15.2%",
    evidence: "weak",
    reasons: ["nano 级博主但 ER 异常高（15%+）", "尚未有任何品牌合作历史"],
    risk: "数据样本太小，需 4 周观察期",
    videos: makeVideos(21),
  },
  {
    id: "c22",
    handle: "@yusuf.gentle",
    displayName: "Yusuf Demir",
    avatarSeed: 58,
    flag: "🇹🇷",
    countryLabel: "Turkey (Middle East)",
    countryCode: "global",
    platforms: ["tiktok", "instagram"],
    followers: "17.8K",
    followersRaw: 17800,
    medianViews: "4.6K",
    medianViewsRaw: 4600,
    er: "11.0%",
    evidence: "weak",
    reasons: ["土耳其温和护肤垂类潜力博主", "未触达欧美市场"],
    videos: makeVideos(22, [2]),
  },
  {
    id: "c23",
    handle: "@piper.glow",
    displayName: "Piper Howell",
    avatarSeed: 96,
    flag: "🇬🇧",
    countryLabel: "United Kingdom",
    countryCode: "global",
    platforms: ["tiktok"],
    followers: "640K",
    followersRaw: 640_000,
    medianViews: "9.2K",
    medianViewsRaw: 9200,
    er: "1.4%",
    evidence: "weak",
    reasons: ["macro 级粉丝但 ER 跌至 1.4%，疑似买粉", "近 60 天 0 条同类目内容"],
    risk: "粉丝质量需深度核查",
    videos: makeVideos(23),
  },
  {
    id: "c24",
    handle: "@ada.routinequiet",
    displayName: "Ada Park",
    avatarSeed: 33,
    flag: "🇨🇦",
    countryLabel: "Canada",
    countryCode: "global",
    platforms: ["youtube"],
    followers: "4.7K",
    followersRaw: 4700,
    medianViews: "1.1K",
    medianViewsRaw: 1100,
    er: "12.0%",
    evidence: "weak",
    reasons: ["youtube short 创作者，护肤片段化叙事", "粉丝增速 +18% / 月，潜力候选"],
    risk: "tiktok 同步未启用",
    videos: makeVideos(24, [3]),
  },
];

export function groupCreators(creators: Creator[]): CreatorGroup[] {
  const buckets: Record<EvidenceLevel, Creator[]> = {
    high: [],
    medium: [],
    weak: [],
  };
  creators.forEach((c) => buckets[c.evidence].push(c));
  const groups: CreatorGroup[] = [
    {
      key: "high",
      label: "强证据",
      hint: "同类目合作 + 粉丝画像高度匹配",
      rule: EVIDENCE_RULES.high,
      count: buckets.high.length,
      creators: buckets.high,
    },
    {
      key: "medium",
      label: "中证据",
      hint: "部分指标命中，建议人工复核",
      rule: EVIDENCE_RULES.medium,
      count: buckets.medium.length,
      creators: buckets.medium,
    },
    {
      key: "weak",
      label: "弱证据",
      hint: "高潜力小博主，可作为长尾候选",
      rule: EVIDENCE_RULES.weak,
      count: buckets.weak.length,
      creators: buckets.weak,
    },
  ];
  return groups.filter((g) => g.count > 0);
}
