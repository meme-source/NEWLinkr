import type { ChatIntent } from "../../chat-types";
import {
  renderCount,
  revealBaselineTiles,
  revealPills,
  revealTypePills,
  sleep,
  typeLine,
} from "./animation";
import type { ParsedBrief } from "./parsed-brief-types";

export type StepStatus = "pending" | "active" | "done";

/**
 * StepConfig drives the streaming reasoning canvas.
 *
 * - `time` is the user-facing duration label that appears once the step is
 *   `done`. Keep it human-rounded ("1.2s"), not the precise duration.
 * - `duration` is the minimum animation budget. The runner waits at least this
 *   long even if `render()` resolves early — protects against backends that
 *   stream too fast and lose the "did some work" feel.
 * - `render` populates the result element with the streaming content.
 */
export interface StepConfig {
  id: string;
  title: string;
  time: string;
  duration: number;
  render: (el: HTMLElement) => Promise<void>;
}

// All three intents emit the same product (A) + ICP (B) understanding steps
// before diverging.

function isUnknown(brief: ParsedBrief): boolean {
  return brief.sourceVariant === "unknown";
}

function buildProductStep(brief: ParsedBrief): StepConfig {
  const product = brief.product;
  return {
    id: "product_parse",
    title: "看你的产品页",
    time: "1.2s",
    duration: 1200,
    render: async (el) => {
      if (isUnknown(brief)) {
        await typeLine(el, "未识别产品", "strong", 30);
        await sleep(160);
        await typeLine(el, "AI 暂无法从该链接提取产品信息（接入 LLM 后修复）", "meta", 18);
        return;
      }
      const metaParts = [product.brand, product.market].filter(Boolean);
      await typeLine(el, product.name, "strong", 30);
      await sleep(160);
      await typeLine(el, metaParts.join(" · "), "meta", 22);
    },
  };
}

function buildIcpStep(brief: ParsedBrief): StepConfig {
  const product = brief.product;
  return {
    id: "icp",
    title: "提一下你的目标人群",
    time: "1.8s",
    duration: 1500,
    render: async (el) => {
      if (isUnknown(brief)) {
        await typeLine(el, "卖点 / 受众：待 AI 解析", undefined, 22);
        return;
      }
      const sellingLine =
        product.sellingPoints.length > 0
          ? `核心卖点：${product.sellingPoints.join(" / ")}`
          : "核心卖点：待补充";
      const audienceLine = product.audience ? `受众：${product.audience}` : "";
      await typeLine(el, sellingLine, undefined, 24);
      if (audienceLine) {
        await sleep(160);
        await typeLine(el, audienceLine, "meta", 22);
      }
    },
  };
}

// v3 §4.5：3 个 intent 共用同一套 6 步骨架。具体内容在第 3 / 4 步因 intent 略
// 不同（竞品反推品牌、场景反推场景组合、爆款反推爆款品类），第 5 / 6 步是
// 文档新增的"提炼共性特征 → 匹配可建联同款达人"。每步如果对应 brief 字段
// 缺失就走兜底文案（不再像 v2 那样静默跳过）—— 文档承诺的是"6 步进度感"，
// 单步条件性出现会破坏这种节奏。
const STEP_BUILDERS: Record<ChatIntent, (brief: ParsedBrief) => StepConfig[]> = {
  competitor: buildCompetitorStepsV3,
  scenario: buildScenarioStepsV3,
  trending: buildTrendingStepsV3,
  // lowFollower 复用 trending 6 步骨架；差异目前只在入口卡片文案。
  lowFollower: buildTrendingStepsV3,
};

// 第 3 步：反推参考对象 —— 每个 intent 的锚点定义不同
function buildAnchorStep(intent: ChatIntent, brief: ParsedBrief): StepConfig {
  if (intent === "competitor") {
    const brands = brief.competitorBrands ?? [];
    return {
      id: "anchor_brands",
      title: "反推同品类品牌",
      time: "0.4s",
      duration: 900,
      render: async (el) => {
        if (brands.length === 0) {
          await typeLine(el, "未指定竞品 — 系统按品类自动锚定", "meta", 22);
          return;
        }
        const wrap = document.createElement("div");
        wrap.className = "brand-pills";
        el.appendChild(wrap);
        await revealPills(wrap, [...brands], 130);
      },
    };
  }
  if (intent === "scenario") {
    return {
      id: "anchor_scenes",
      title: "反推内容场景",
      time: "0.6s",
      duration: 1100,
      render: async (el) => {
        const profiles = brief.audienceProfilesMust;
        if (profiles.length === 0) {
          await typeLine(el, "按品类匹配通用场景组合", "meta", 22);
          return;
        }
        const items = profiles.map((label, i) => ({
          label,
          priority: i < 2 ? "主推" : i < 4 ? "次推" : "补充",
        }));
        const wrap = document.createElement("div");
        wrap.className = "type-pills";
        el.appendChild(wrap);
        await revealTypePills(wrap, items, 140);
      },
    };
  }
  // trending
  return {
    id: "anchor_category",
    title: "反推爆款品类",
    time: "0.4s",
    duration: 900,
    render: async (el) => {
      if (brief.categoryBaseline) {
        await revealBaselineTiles(
          el,
          brief.categoryBaseline.basisLine,
          brief.categoryBaseline.tiles,
        );
        return;
      }
      await typeLine(el, "按品类自动拉爆款基线", "meta", 22);
    },
  };
}

// 第 4 步：扫帖子库找种子 —— 内部仍叫 seeds（v3 §0.3：种子在系统内部存活，
// 但用户层不再暴露）。文案侧重"扫了多少 / 命中多少"，不出现"种子"二字。
function buildSeedScanStep(intent: ChatIntent, brief: ParsedBrief): StepConfig {
  const fallbackByIntent: Record<ChatIntent, string> = {
    competitor: "近 90 天品牌带话题贴",
    scenario: "近 90 天历史场景样本",
    trending: "近 14 天高表现贴",
    lowFollower: "近 14 天高表现贴",
  };
  return {
    id: "seed_scan",
    title:
      intent === "trending" || intent === "lowFollower" ? "扫近 14 天爆款贴" : "扫帖子库找参考",
    time: brief.scanSummary?.duration ?? "6.5s",
    duration: 2800,
    render: async (el) => {
      const scan = brief.scanSummary;
      if (!scan) {
        await typeLine(el, fallbackByIntent[intent], "meta", 22);
        return;
      }
      await renderCount(el, scan.scanned.count, scan.scanned.label);
      await sleep(220);
      await renderCount(el, scan.matched.count, scan.matched.label);
    },
  };
}

// 第 5 步：提炼共性特征 —— v3 新增。把后端的 FeatureGroup 数量在此先用展位
// 文案讲出来，等 v3 mock 接入后改为渲染实际特征徽章。
function buildFeatureSynthesisStep(intent: ChatIntent, brief: ParsedBrief): StepConfig {
  return {
    id: "feature_synthesis",
    title: "提炼共性特征",
    time: "0.3s",
    duration: 900,
    render: async (el) => {
      // 用 trendLabels / sceneCombos 长度作为"特征组数"的当前数据源 ——
      // 接入真实 service 后改为读 feature_groups.length。
      const groupCount =
        intent === "scenario"
          ? (brief.sceneCombos?.length ?? 3)
          : intent === "trending" || intent === "lowFollower"
            ? (brief.trendLabels?.length ?? 3)
            : 3;
      await typeLine(el, `识别 ${groupCount} 组共性特征`, "strong", 28);
      await sleep(160);
      await typeLine(el, "覆盖内容主题 / 受众组合 / 数据曲线 / 内容形式", "meta", 20);
    },
  };
}

// 第 6 步：匹配可建联同款达人 —— v3 新增。运行时由 onReady 之后的 canvas
// 渲染填充实际数量；此处只先把"承诺"打出来。
function buildOutputMatchStep(_intent: ChatIntent, _brief: ParsedBrief): StepConfig {
  return {
    id: "output_match",
    title: "匹配可建联同款达人",
    time: "1.2s",
    duration: 1200,
    render: async (el) => {
      await typeLine(el, "按共性特征匹配候选池", undefined, 24);
      await sleep(160);
      await typeLine(el, "过滤未验证邮箱 / 不活跃 / 已 No 的达人", "meta", 20);
    },
  };
}

function buildCompetitorStepsV3(brief: ParsedBrief): StepConfig[] {
  return [
    buildProductStep(brief),
    buildIcpStep(brief),
    buildAnchorStep("competitor", brief),
    buildSeedScanStep("competitor", brief),
    buildFeatureSynthesisStep("competitor", brief),
    buildOutputMatchStep("competitor", brief),
  ];
}

function buildScenarioStepsV3(brief: ParsedBrief): StepConfig[] {
  return [
    buildProductStep(brief),
    buildIcpStep(brief),
    buildAnchorStep("scenario", brief),
    buildSeedScanStep("scenario", brief),
    buildFeatureSynthesisStep("scenario", brief),
    buildOutputMatchStep("scenario", brief),
  ];
}

function buildTrendingStepsV3(brief: ParsedBrief): StepConfig[] {
  return [
    buildProductStep(brief),
    buildIcpStep(brief),
    buildAnchorStep("trending", brief),
    buildSeedScanStep("trending", brief),
    buildFeatureSynthesisStep("trending", brief),
    buildOutputMatchStep("trending", brief),
  ];
}

/**
 * Returns the streaming step list for the given intent + parsed brief. v3
 * §4.5：固定 6 步骨架，不再因 brief 缺字段而跳步 —— 用户看到的是稳定的
 * 「6 步推进」节奏；缺字段走兜底文案保持节奏。
 */
export function getAgentSteps(intent: ChatIntent, brief: ParsedBrief): StepConfig[] {
  return STEP_BUILDERS[intent](brief);
}

// ─── Per-intent exit-card copy ─────────────────────────────────────────────

export interface ExitCardCopy {
  /** Template used by AgentConsole's count line — e.g. "75 个近期起量达人". */
  countLabel: (count: number) => string;
  /** Subtitle below the count line. */
  subtitle: string;
  /** Header shown above the results canvas grid. */
  canvasTitle: (count: number) => string;
  /** Secondary line under the canvas header. */
  canvasSubtitle: string;
}

// v3 §4.5 / §4.6：退出卡 + 结果区标题不再描述"按 X 分组"，而是统一收束到
// "依据 N 位达人组合 → 匹配出 M 位可直接建联的同款达人"。M 用 n 占位，N
// 在画布顶 SearchBasisCard 里另行填充（暂时由 mock 估算）。
const EXIT_COPY: Record<ChatIntent, ExitCardCopy> = {
  competitor: {
    countLabel: (n) => `${n} 位可直接建联的同款达人`,
    subtitle: "已按竞品合作款组合特征匹配，过滤掉无邮箱与不活跃的达人",
    canvasTitle: (n) => `${n} 位可直接建联的同款达人`,
    canvasSubtitle: "按特征组分组 · 每组对应竞品已验证的合作款组合",
  },
  scenario: {
    countLabel: (n) => `${n} 位可拍出场景的达人`,
    subtitle: "已按内容场景组合匹配，过滤掉无邮箱与不活跃的达人",
    canvasTitle: (n) => `${n} 位可拍出场景的达人`,
    canvasSubtitle: "按场景组合分组 · 每组对应可立刻执行的合作脚本",
  },
  trending: {
    countLabel: (n) => `${n} 位与爆款组合相似的达人`,
    subtitle: "已按近期爆款共性特征匹配，过滤掉无邮箱与不活跃的达人",
    canvasTitle: (n) => `${n} 位与爆款组合相似的达人`,
    canvasSubtitle: "按起量特征组分组 · 每组沉淀近 14 天的爆款拍法",
  },
  lowFollower: {
    countLabel: (n) => `${n} 位与爆款组合相似的达人`,
    subtitle: "已按近期爆款共性特征匹配，过滤掉无邮箱与不活跃的达人",
    canvasTitle: (n) => `${n} 位与爆款组合相似的达人`,
    canvasSubtitle: "按起量特征组分组 · 每组沉淀近 14 天的爆款拍法",
  },
};

export function getExitCopy(intent: ChatIntent, brief?: ParsedBrief): ExitCardCopy {
  const base = EXIT_COPY[intent];
  if (brief && isUnknown(brief)) {
    const unknownNote = "AI 未识别产品 — 列表按通用条件筛选，接入 LLM 后将自动重排";
    return {
      ...base,
      subtitle: unknownNote,
      canvasSubtitle: unknownNote,
    };
  }
  return base;
}

// v3 §4.5：SearchBasisCard 文案 —— "依据 N 位达人组合 → 匹配出 M 位可建联
// 同款达人"。N 是种子数（系统内部），M 是输出数（用户看到的卡片总数）。后端
// 接入前，N 用一个固定估算函数；接入后由 DiscoveryBasis.seedCount 直接填。
const SEED_BASIS_PHRASE: Record<ChatIntent, (seedCount: number) => string> = {
  competitor: (n) => `依据 ${n} 位竞品已验证的达人组合`,
  scenario: (n) => `依据 ${n} 位场景历史样本达人`,
  trending: (n) => `依据 ${n} 位近期爆款达人组合`,
  lowFollower: (n) => `依据 ${n} 位近期爆款达人组合`,
};

export function getSeedBasisPhrase(intent: ChatIntent, seedCount: number): string {
  return SEED_BASIS_PHRASE[intent](seedCount);
}

/**
 * Mock 阶段没有真实种子数 —— 用输出总数估算一个稳定且看起来合理的种子数。
 * 真后端接入后这里整个函数应被删，改读 DiscoveryBasis.seedCount。
 */
export function estimateSeedCount(outputTotal: number): number {
  if (outputTotal <= 0) return 0;
  // 输出 ≈ 种子 × 12 ~ 25（文档 §12.3 提到的"1:10~1:30 种子→输出转化"），
  // 取中位 1:20。下限保到 8，避免出现"依据 1 位达人"。
  return Math.max(8, Math.round(outputTotal / 20));
}
