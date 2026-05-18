// 把 v2 mock 的 Creator[] 重新分组成 FeatureGroupView[] —— 分组轴随维度变。
//
// 产品决策(2026-05 发现页重构讨论):四个维度侧重点不同,分组轴不可能统一。
// 「证据强度」只是 competitor 维度的语言,不该套到全部。
//   - competitor → 按竞品验证过的合作款组合(已验证 / 受众相近延展 / 长尾观察)
//   - scenario   → 按内容场景,每组对应一个用户选中的场景;一个达人可落入多组
//   - trending   → 按近期爆款拍法 / 趋势
//   - lowFollower→ 按爆发量级 / 性价比档位
//
// 每个 creator 还带一段维度专属 `dimensionData`,决定卡片主指标。
//
// 这是 mock 阶段的临时适配层 —— 真后端接入后整个文件应当被删除,由
// service 层直接产出 FeatureGroupView[]。

import type { ChatIntent } from "../../chat-types";
import type {
  ContentSampleView,
  CreatorDimensionData,
  FeatureGroupView,
  MatchedFeaturesView,
  OutputCreatorView,
} from "../../v3-view-models";
import type { ProposedScenario } from "../lib/scenario-proposal";
import type { Creator, EvidenceLevel, VideoPost } from "../mock-data";

/** 中间确认层产出的用户选择 —— 场景维度的选中场景 / 竞品维度的选中竞品。 */
export interface ConfirmedSelection {
  scenarios: ProposedScenario[];
  competitors: string[];
}

// ── 通用 helper ─────────────────────────────────────────────────────────────

/** 稳定哈希 —— 让「随机」派生在同一输入下可复现。 */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** 把 "8.1K" / "1.2M" / "920" 解析回数字。 */
function parseCompact(s: string): number {
  const m = s.trim().match(/^([\d.]+)\s*([KM]?)$/i);
  if (!m) return 0;
  const n = Number.parseFloat(m[1]);
  const unit = m[2].toUpperCase();
  return unit === "M" ? n * 1_000_000 : unit === "K" ? n * 1_000 : n;
}

function compactNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(Math.round(n));
}

/** 达人垂类 —— 取首个 audienceProfileTag,截断到第一个分隔符前。 */
function creatorType(c: Creator): string {
  const tag = c.audienceProfileTags?.[0];
  if (!tag) return "垂类内容博主";
  return tag.split(/[（(·/]/)[0].trim() || "垂类内容博主";
}

function contentSamples(videos: VideoPost[]): ContentSampleView[] {
  return videos.slice(0, 3).map((v) => ({
    thumbSeed: v.thumbSeed,
    postedAgo: v.postedAgo,
    views: v.views,
    isCollab: v.isCollab ?? false,
  }));
}

/** 最高单条播放 —— 取作品里最高,兜底用中位播放放大。 */
function peakViews(c: Creator): number {
  const fromVideos = c.videos.reduce((max, v) => Math.max(max, parseCompact(v.views)), 0);
  return Math.max(fromVideos, Math.round(c.medianViewsRaw * 2.6));
}

function emailStatus(c: Creator): OutputCreatorView["emailStatus"] {
  if (c.evidence === "high") return "verified";
  if (c.evidence === "medium") return "found";
  return "missing";
}

function matchedFeatures(c: Creator): MatchedFeaturesView {
  const hasAud = (c.audienceProfileTags?.length ?? 0) > 0;
  if (c.evidence === "high") return { theme: true, audience: hasAud, metrics: true, format: true };
  if (c.evidence === "medium")
    return { theme: true, audience: hasAud, metrics: false, format: true };
  return { theme: false, audience: hasAud, metrics: true, format: false };
}

function matchScore(c: Creator): number {
  const base = c.evidence === "high" ? 80 : c.evidence === "medium" ? 64 : 48;
  return Math.min(99, base + (hash(c.id) % 16));
}

/** Creator → OutputCreatorView,dimensionData 由各维度 grouper 注入。 */
function toCreatorView(c: Creator, dimensionData: CreatorDimensionData): OutputCreatorView {
  return {
    creatorId: c.id,
    handle: c.handle,
    avatarUrl: `https://i.pravatar.cc/120?img=${c.avatarSeed}`,
    followers: c.followersRaw,
    medianViews: c.medianViewsRaw,
    engagementRate: Number.parseFloat(c.er) || 0,
    emailStatus: emailStatus(c),
    featureMatchScore: matchScore(c),
    matchedFeatures: matchedFeatures(c),
    reasons: c.reasons,
    risks: c.risk ? [c.risk] : [],
    creatorType: creatorType(c),
    contentSamples: contentSamples(c.videos),
    dimensionData,
  };
}

interface GroupMeta {
  themes: string[];
  styleTags: string[];
}

function makeGroup(
  groupId: string,
  groupName: string,
  rationale: string,
  creators: OutputCreatorView[],
  meta: GroupMeta,
): FeatureGroupView {
  return {
    groupId,
    groupName,
    contentFeatures: { themes: meta.themes, keywords: [] },
    audienceFeatures: { ageSkew: "25-34", genderSkew: "balanced", countryTop: ["US"] },
    metricsFeatures: null,
    formatFeatures: { durationBand: "mid", styleTags: meta.styleTags },
    seedCoverage: Math.max(3, Math.round(creators.length / 4)),
    rationale,
    creators,
  };
}

function bucketByEvidence(creators: Creator[]): Record<EvidenceLevel, Creator[]> {
  const buckets: Record<EvidenceLevel, Creator[]> = { high: [], medium: [], weak: [] };
  creators.forEach((c) => buckets[c.evidence].push(c));
  return buckets;
}

/** 组内统一按 featureMatchScore 降序。 */
function sortByScore(a: OutputCreatorView, b: OutputCreatorView): number {
  return b.featureMatchScore - a.featureMatchScore;
}

// ── 维度一:竞品 —— 按竞品验证过的合作款组合 ───────────────────────────────

const COMPETITOR_GROUPS: Record<
  EvidenceLevel,
  { name: string; rationale: string; meta: GroupMeta }
> = {
  high: {
    name: "竞品已验证的合作款组合",
    rationale: "这组达人在同类品牌的合作中表现高于本人中位 1.5x 以上 —— 拍法已被验证，可直接复刻。",
    meta: { themes: ["核心使用场景演示", "效果对比"], styleTags: ["教程式", "效果对比"] },
  },
  medium: {
    name: "受众组合相近的延展达人",
    rationale: "受众画像与竞品达人重合 ≥ 65%，尚无直接合作样本，适合作为次推 brief 候选。",
    meta: { themes: ["生活方式 vlog", "种草"], styleTags: ["vlog", "种草"] },
  },
  weak: {
    name: "长尾发现 · 单点指标突出",
    rationale: "未合作过同品类，但互动率 / 增速等单点指标突出，可作为观察池。",
    meta: { themes: ["兴趣垂直内容"], styleTags: ["日常切片"] },
  },
};

function groupByVerifiedCombo(
  creators: Creator[],
  selection: ConfirmedSelection,
): FeatureGroupView[] {
  const buckets = bucketByEvidence(creators);
  return (["high", "medium", "weak"] as EvidenceLevel[])
    .filter((lv) => buckets[lv].length > 0)
    .map((lv) => {
      const spec = COMPETITOR_GROUPS[lv];
      const creatorViews = buckets[lv]
        .map((c) => {
          const brandPool = selection.competitors.length > 0 ? selection.competitors : null;
          const collabBrand =
            lv === "weak"
              ? null
              : brandPool
                ? brandPool[hash(c.id) % brandPool.length]
                : "同类头部品牌";
          const dd: CreatorDimensionData = {
            kind: "competitor",
            replicaConfidence: matchScore(c),
            collabBrand,
            collabCount: lv === "high" ? 2 + (hash(c.id) % 3) : lv === "medium" ? 1 : 0,
          };
          return toCreatorView(c, dd);
        })
        .sort(sortByScore);
      return makeGroup(`fg_comp_${lv}`, spec.name, spec.rationale, creatorViews, spec.meta);
    });
}

// ── 维度二:场景 —— 按内容场景,一个达人可落入多组 ─────────────────────────

// 每个场景下,达人能拍的「角度」候选 —— 用 hash 选,保证可复现。
const SCENARIO_ANGLES = ["实测演示", "竞品对比", "痛点切入", "工作流串讲", "前后对比"];

/** 一个达人适配某个场景 —— hash 决定,约 2/3 命中率。 */
function fitsScenario(creatorId: string, scenarioId: string): boolean {
  return hash(`${creatorId}::${scenarioId}`) % 3 !== 0;
}

function groupByScenario(creators: Creator[], scenarios: ProposedScenario[]): FeatureGroupView[] {
  if (scenarios.length === 0) {
    // 没有选中场景(异常路径)—— 退化为单组,不丢结果。
    const all = creators
      .map((c) =>
        toCreatorView(c, {
          kind: "scenario",
          fitScore: matchScore(c),
          angle: "实测演示",
          alsoFits: [],
        }),
      )
      .sort(sortByScore);
    return [
      makeGroup("fg_scene_all", "全部候选场景", "未选择具体场景，先按通用适配度给出候选。", all, {
        themes: ["真实使用演示"],
        styleTags: ["教程式"],
      }),
    ];
  }

  // 每个达人先算出它适配哪些场景 —— 至少命中一个(取 hash 最小的那个兜底)。
  const fitMap = new Map<string, string[]>();
  for (const c of creators) {
    const hit = scenarios.filter((s) => fitsScenario(c.id, s.id)).map((s) => s.id);
    if (hit.length === 0) {
      const forced = [...scenarios].sort(
        (a, b) => hash(`${c.id}::${a.id}`) - hash(`${c.id}::${b.id}`),
      )[0];
      hit.push(forced.id);
    }
    fitMap.set(c.id, hit);
  }
  const nameById = new Map(scenarios.map((s) => [s.id, s.name]));

  return scenarios.map((scene) => {
    const creatorViews = creators
      .filter((c) => fitMap.get(c.id)?.includes(scene.id))
      .map((c) => {
        const fitIds = fitMap.get(c.id) ?? [];
        const angle = SCENARIO_ANGLES[hash(`${c.id}::${scene.id}::a`) % SCENARIO_ANGLES.length];
        const dd: CreatorDimensionData = {
          kind: "scenario",
          fitScore: matchScore(c),
          angle,
          alsoFits: fitIds
            .filter((id) => id !== scene.id)
            .map((id) => nameById.get(id) ?? "")
            .filter(Boolean),
        };
        return toCreatorView(c, dd);
      })
      .sort(sortByScore);
    const rationale = `${scene.rationale} 能拍这个场景的达人类型：${scene.creatorTypes.join(" / ")}。`;
    return makeGroup(`fg_scene_${scene.id}`, scene.name, rationale, creatorViews, {
      themes: scene.creatorTypes,
      styleTags: [scene.name],
    });
  });
}

// ── 维度三:对标爆款 —— 按近期爆款拍法 / 趋势 ──────────────────────────────

const VIRAL_FORMATS: { id: string; name: string; rationale: string; meta: GroupMeta }[] = [
  {
    id: "streak",
    name: "近期连续起量 · 拍法已跑通",
    rationale: "近 14 天多条达到爆款阈值，拍法稳定可复制，是品类内最确定的对标对象。",
    meta: { themes: ["连续爆款"], styleTags: ["系列化", "强钩子"] },
  },
  {
    id: "single",
    name: "单条爆款 · 拍法待验证",
    rationale: "出现过单条爆款但尚未连续复现，作为 brief 候选、观察其下一条表现。",
    meta: { themes: ["单点爆款"], styleTags: ["话题切入"] },
  },
  {
    id: "climbing",
    name: "数据稳步攀升 · 起量信号已现",
    rationale: "播放与互动近 7 天持续走高，处在起量早期，性价比窗口尚未关闭。",
    meta: { themes: ["增长曲线"], styleTags: ["日常切片"] },
  },
];

function groupByViralFormat(creators: Creator[]): FeatureGroupView[] {
  return VIRAL_FORMATS.map((fmt, idx) => {
    const creatorViews = creators
      .filter((c) => hash(`${c.id}::vf`) % VIRAL_FORMATS.length === idx)
      .map((c) => {
        const dd: CreatorDimensionData = {
          kind: "trending",
          peakViews: peakViews(c),
          viralCount: fmt.id === "streak" ? 3 + (hash(c.id) % 3) : 1 + (hash(c.id) % 2),
          postedAgo: c.videos[0]?.postedAgo ?? "近期",
          formatLabel: fmt.name.split(" · ")[0],
        };
        return toCreatorView(c, dd);
      })
      .sort(sortByScore);
    return makeGroup(`fg_viral_${fmt.id}`, fmt.name, fmt.rationale, creatorViews, fmt.meta);
  }).filter((g) => g.creators.length > 0);
}

// ── 维度四:低粉爆款 —— 按爆发量级 / 性价比档位 ────────────────────────────

const BURST_TIERS: { id: string; name: string; rationale: string; max: number; meta: GroupMeta }[] =
  [
    {
      id: "nano",
      name: "极低粉高爆发 · 性价比首选",
      rationale: "粉丝 1 万以下但单条爆款播放远超粉丝量级，单价最低、ROI 想象空间最大。",
      max: 10_000,
      meta: { themes: ["黑马爆款"], styleTags: ["原生感", "强钩子"] },
    },
    {
      id: "rising",
      name: "腰部潜力 · 起量进行时",
      rationale: "粉丝 1-3 万，已有爆款且仍在涨粉，趁报价未起来锁定。",
      max: 30_000,
      meta: { themes: ["成长型"], styleTags: ["系列化"] },
    },
    {
      id: "growing",
      name: "成长型 · 稳定输出",
      rationale: "粉丝 3 万以上但仍属低粉区间，输出稳定、合作风险更低。",
      max: Number.POSITIVE_INFINITY,
      meta: { themes: ["稳定输出"], styleTags: ["教程式"] },
    },
  ];

function burstTierOf(followers: number): string {
  return (BURST_TIERS.find((t) => followers < t.max) ?? BURST_TIERS[BURST_TIERS.length - 1]).id;
}

function estPrice(followers: number): string {
  // 粗估单价 —— 低粉区间按粉丝量级线性给一个区间感的数字。
  const base = Math.max(200, Math.round((followers / 1_000) * 35));
  return `约 ¥${compactNum(base)}`;
}

function groupByBurstTier(creators: Creator[]): FeatureGroupView[] {
  return BURST_TIERS.map((tier) => {
    const creatorViews = creators
      .filter((c) => burstTierOf(c.followersRaw) === tier.id)
      .map((c) => {
        const peak = peakViews(c);
        const burstMultiple = c.followersRaw > 0 ? peak / c.followersRaw : 0;
        const viralCount = 1 + (hash(c.id) % 3);
        const dd: CreatorDimensionData = {
          kind: "lowFollower",
          burstMultiple: Math.round(burstMultiple * 10) / 10,
          peakViews: peak,
          estPrice: estPrice(c.followersRaw),
          repeatable: viralCount > 1,
        };
        return toCreatorView(c, dd);
      })
      .sort((a, b) => {
        const am = a.dimensionData.kind === "lowFollower" ? a.dimensionData.burstMultiple : 0;
        const bm = b.dimensionData.kind === "lowFollower" ? b.dimensionData.burstMultiple : 0;
        return bm - am;
      });
    return makeGroup(`fg_burst_${tier.id}`, tier.name, tier.rationale, creatorViews, tier.meta);
  }).filter((g) => g.creators.length > 0);
}

// ── 分组调度 ────────────────────────────────────────────────────────────────

/**
 * 把 Creator[] 按维度的分组轴打包成 FeatureGroupView[]。
 * `selection` 来自中间确认层(场景维度的选中场景 / 竞品维度的选中竞品)。
 *
 * 真后端接入后整个函数应被删除 —— 直接消费 service 层产出的 FeatureGroupView。
 */
export function deriveFeatureGroups(
  creators: Creator[],
  intent: ChatIntent,
  selection: ConfirmedSelection,
): FeatureGroupView[] {
  switch (intent) {
    case "competitor":
      return groupByVerifiedCombo(creators, selection);
    case "scenario":
      return groupByScenario(creators, selection.scenarios);
    case "trending":
      return groupByViralFormat(creators);
    case "lowFollower":
      return groupByBurstTier(creators);
  }
}
