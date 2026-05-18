// v3 §4.6：把 v2 mock 的 `Creator[]` 重新分组成 `FeatureGroupView[]`。
//
// 这是 mock 阶段的临时适配层 —— 真后端接入后整个文件应当被删除，由
// /api/discovery/chat 的 `feature_groups` SSE 事件直接送出 FeatureGroupView[]。
// 保留这个适配层是为了让 ResultsCanvas 的渲染层先按 v3 形态写好，等数据源
// 真正切换时只动 data layer 不动 UI。
//
// 派生规则（mock 期）：
//   - 用 v2 的 `evidence` 等级（high/medium/weak）作为组划分键 —— 这是当前
//     mock 里唯一能稳定区分"特征强度"的字段
//   - high 组 → "竞品已验证的合作款组合"
//   - medium 组 → "受众组合相近的延展达人"
//   - weak 组 → "长尾发现 · 单点指标突出"
//   - 每个 creator 的 matchedFeatures 4 个轴由 evidence + 现有字段近似派生
//   - featureMatchScore 用 evidence + audienceProfileTags 长度近似 (0-100)
//   - emailStatus 用 evidence 近似（high=verified, medium=found, weak=missing）

import type { AudienceAgeSkew, DurationBand } from "@/types/api";
import type { ChatIntent } from "../../chat-types";
import type {
  FeatureGroupView,
  MatchedFeaturesView,
  OutputCreatorView,
} from "../../v3-view-models";
import type { Creator, EvidenceLevel } from "../mock-data";

// ── 组级元数据 ──────────────────────────────────────────────────────────────
// 每个 intent × evidence 组合对应一条 group 描述。intent 影响组名 + rationale。
interface GroupSpec {
  groupName: (intent: ChatIntent) => string;
  rationale: (intent: ChatIntent) => string;
  // 组特征清单（前端组头展示用），由 mock 数据近似生成
  themes: string[];
  ageSkew: AudienceAgeSkew;
  durationBand: DurationBand;
  styleTags: string[];
}

const GROUP_SPECS: Record<EvidenceLevel, GroupSpec> = {
  high: {
    groupName: (intent) =>
      intent === "scenario"
        ? "高匹配场景组合 · 直接执行"
        : intent === "trending"
          ? "近期爆款组合 · 拍法已验证"
          : "竞品已验证的合作款组合",
    rationale: (intent) =>
      intent === "scenario"
        ? "本组特征来自你产品类目下，过去 90 天高 ROI 场景样本的共性提炼。"
        : intent === "trending"
          ? "本组特征来自近 14 天该品类内已经爆款的达人组合，拍法稳定可复制。"
          : "本组特征来自系统观察到的、在同类品牌中表现高于本人中位 1.5x 以上的达人组合。",
    themes: ["核心使用场景演示", "产品教程", "效果对比"],
    ageSkew: "25-34",
    durationBand: "mid",
    styleTags: ["教程式", "效果对比", "POV"],
  },
  medium: {
    groupName: (intent) =>
      intent === "scenario"
        ? "受众组合相近 · 场景延展"
        : intent === "trending"
          ? "起量信号已现 · 拍法相近"
          : "受众组合相近的延展达人",
    rationale: (intent) =>
      intent === "scenario"
        ? "受众重合度高，可作为同场景下的次推 brief 候选。"
        : intent === "trending"
          ? "近 7 天有起量信号，但样本量不及高匹配组；建议作为 brief 候选。"
          : "受众画像与产品 ICP 重合 ≥ 65%，但尚未有直接合作样本。",
    themes: ["生活方式 vlog", "测评", "种草"],
    ageSkew: "25-34",
    durationBand: "mid",
    styleTags: ["vlog", "测评", "种草"],
  },
  weak: {
    groupName: () => "长尾发现 · 单点指标突出",
    rationale: () => "未直接合作过同品类，但互动率 / 增速 / 受众纯度等单点指标突出，可作为观察池。",
    themes: ["小众生活方式", "兴趣垂直内容"],
    ageSkew: "15-24",
    durationBand: "short",
    styleTags: ["GRWM", "日常切片"],
  },
};

// ── Per-creator 派生 ────────────────────────────────────────────────────────

function deriveMatchedFeatures(c: Creator): MatchedFeaturesView {
  // evidence 强度越高，命中轴越多；audienceProfileTags 是否存在决定 audience 命中
  const hasAudienceTags = (c.audienceProfileTags?.length ?? 0) > 0;
  if (c.evidence === "high") {
    return { theme: true, audience: hasAudienceTags, metrics: true, format: true };
  }
  if (c.evidence === "medium") {
    return { theme: true, audience: hasAudienceTags, metrics: false, format: true };
  }
  // weak
  return { theme: false, audience: hasAudienceTags, metrics: true, format: false };
}

function deriveScore(c: Creator, m: MatchedFeaturesView): number {
  const base = c.evidence === "high" ? 80 : c.evidence === "medium" ? 65 : 50;
  const hitBonus =
    (m.theme ? 5 : 0) + (m.audience ? 4 : 0) + (m.metrics ? 4 : 0) + (m.format ? 3 : 0);
  return Math.min(99, base + hitBonus);
}

function deriveEmailStatus(c: Creator): OutputCreatorView["emailStatus"] {
  if (c.evidence === "high") return "verified";
  if (c.evidence === "medium") return "found";
  return "missing";
}

function toOutputCreator(c: Creator): OutputCreatorView {
  const matched = deriveMatchedFeatures(c);
  return {
    creatorId: c.id,
    handle: c.handle,
    avatarUrl: `https://i.pravatar.cc/120?img=${c.avatarSeed}`,
    followers: c.followersRaw,
    medianViews: c.medianViewsRaw,
    // v2 `er` 是 "5.2%" 字符串；解析回浮点。
    engagementRate: Number.parseFloat(c.er) || 0,
    emailStatus: deriveEmailStatus(c),
    featureMatchScore: deriveScore(c, matched),
    matchedFeatures: matched,
    reasons: c.reasons,
    risks: c.risk ? [c.risk] : [],
  };
}

// ── Bucket → FeatureGroupView ──────────────────────────────────────────────

function bucketByEvidence(creators: Creator[]): Record<EvidenceLevel, Creator[]> {
  const buckets: Record<EvidenceLevel, Creator[]> = { high: [], medium: [], weak: [] };
  creators.forEach((c) => buckets[c.evidence].push(c));
  return buckets;
}

/**
 * 把 v2 mock 的 Creator[] 重新打包成 v3 FeatureGroupView[]，按 evidence 强度
 * 分 3 组。空组会被过滤掉。
 *
 * 真后端接入后整个函数应被删除 —— 直接消费 service 层产出的 FeatureGroupView。
 */
export function deriveFeatureGroups(creators: Creator[], intent: ChatIntent): FeatureGroupView[] {
  const buckets = bucketByEvidence(creators);
  const orderedLevels: EvidenceLevel[] = ["high", "medium", "weak"];

  return orderedLevels
    .map((level) => {
      const items = buckets[level];
      if (items.length === 0) return null;
      const spec = GROUP_SPECS[level];
      const groupView: FeatureGroupView = {
        groupId: `fg_${level}`,
        groupName: spec.groupName(intent),
        contentFeatures: { themes: spec.themes, keywords: [] },
        audienceFeatures: {
          ageSkew: spec.ageSkew,
          genderSkew: "female_dominant",
          countryTop: ["US"],
        },
        metricsFeatures: null,
        formatFeatures: { durationBand: spec.durationBand, styleTags: spec.styleTags },
        seedCoverage: Math.max(3, Math.round(items.length / 6)),
        rationale: spec.rationale(intent),
        creators: items
          .map(toOutputCreator)
          // 文档约束：组内按 featureMatchScore 降序
          .sort((a, b) => b.featureMatchScore - a.featureMatchScore),
      };
      return groupView;
    })
    .filter((g): g is FeatureGroupView => g !== null);
}
