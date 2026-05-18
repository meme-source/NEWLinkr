// 把博主数据(后台产出的维度化分析 + 卡片自带的松散 tags / tradeoffs)整理
// 成「深度分析」的特征 tag 列表。每条 tag = 一个客观特征 + 它所属的维度。
//
// 维度是【开放集合】—— 维度由后台配置,一次任务分析出多少个维度,就摆多少
// 个,前端不写死维度清单、也不封顶。维度名不在 UI 上显示,只决定胶囊底色
// (见 tokens.ts analysisTintFor)。
//
// 定位:深度分析是【辅助信息】—— 它只把博主在各维度上的客观特征摆出来,帮
// 用户自己判断,绝不替用户下结论。所以 tag 永远是可观察的事实(「沉浸式
// Vlog」「重合 82%」「女性受众为主」),不出现「推荐」「值得」「适合」这类
// 倾向词。报价 / 商务类信息一般不进深度分析(已在指标区呈现)—— 唯一例外是
// 「找平替」模式:此时「平替依据」会摆在最前面,见 deriveAlternativeReasons。

import type { AnalysisDimension, FilterMode, InfluencerCardAnalysisTag } from "./types";

type Entry = InfluencerCardAnalysisTag;

// ── 招牌特征词典 ──────────────────────────────────────────────────────────
// 较难理解的行话(沉浸式 Vlog / 全景 B-roll / 低饱和度…)。直接当 chip 堆着
// 用户看不懂,这里把它们归到对应维度,并换成一眼能懂的 tag。
export const FEATURE_GLOSSARY: Record<string, Entry> = {
  "沉浸式 Vlog": { dimension: "内容形式", tag: "沉浸式 Vlog" },
  极少口播: { dimension: "内容形式", tag: "极少口播" },
  "全景 B-roll": { dimension: "视觉调性", tag: "空镜素材多" },
  低饱和度: { dimension: "视觉调性", tag: "低饱和冷调" },
  "VLOG 风格": { dimension: "内容形式", tag: "Vlog 风格" },
  受众重合: { dimension: "账号数据", tag: "受众重合" },
};

// 搜索结果默认补充的「招牌特征」—— 找相似 / 找平替种子博主的内容风格。候选
// 博主之所以被判定相似,正是因为在这些维度上同源,所以默认补进深度分析。
const SIGNATURE_TRAITS = ["沉浸式 Vlog", "全景 B-roll", "低饱和度"];

// 报价 / 商务 / 合作阶段类标签 —— 不属于内容维度,且指标区已呈现报价,深度
// 分析不收;命中即丢弃。
const COMMERCIAL_TEST =
  /报价|性价比|成本|预算|价格|cpm|cpe|商业化|广告|品牌|转化|建联|邮箱|联系|首测|测试样本|成长期|扩量|覆盖广/i;

// ── 维度归类(仅用于 tags / tradeoffs 这类松散短词)──────────────────────
// 命中即归入该维度;顺序即优先级(越靠前越先判定)。未命中兜底「内容主题」。
// 注:后台产出的 audience / topics 已经维度化,不走这套规则。
const DIMENSION_RULES: Array<{ test: RegExp; dimension: AnalysisDimension }> = [
  { test: /口播|vlog|b-roll|拍摄|叙事|形式|出镜|教程|剪辑/i, dimension: "内容形式" },
  {
    test: /视觉|画面|色调|镜头|调色|空镜|质感|调性|风格|气质|温暖|冷调|饱和|情绪|自然/,
    dimension: "视觉调性",
  },
  {
    test: /量级|粉丝|头部|尾部|中部|微小|体量|播放|曝光|稳定|周更|输出|数据|互动|er|活跃|评论|点赞|受众|重合|画像|时区|海外|澳洲|英国|欧洲|新西兰|日本|德国|市场|地区/i,
    dimension: "账号数据",
  },
  { test: /主题|品类|选品|赛道|护肤|徒步|公路|山系|生活方式|测评|成分/, dimension: "内容主题" },
];

function dimensionOf(text: string): AnalysisDimension {
  for (const rule of DIMENSION_RULES) {
    if (rule.test.test(text)) return rule.dimension;
  }
  return "内容主题";
}

// 单个松散标签 → 一条维度归类后的 tag。招牌行话查词典换说法;百分比标签报
// 重合度;商务类标签丢弃;其余直接当 tag 用。
function entryFromTag(raw: string): Entry | null {
  const t = raw.trim();
  if (!t || COMMERCIAL_TEST.test(t)) return null;

  const glossary = FEATURE_GLOSSARY[t];
  if (glossary) return glossary;

  const dimension = dimensionOf(t);

  // 百分比标签:"内容 95%" / "受众 82%" → 重合度。
  const pct = t.match(/(\d{1,3})\s*%/);
  if (pct) return { dimension, tag: `重合 ${pct[1]}%` };

  return { dimension, tag: t };
}

// ── 找平替判断逻辑 ─────────────────────────────────────────────────────────
// 维度名:「平替依据」在「找平替」模式下永远摆在深度分析最前面。

const ALTERNATIVE_DIMENSION = "平替依据";

/** 「找平替」判断要用到的种子↔候选指标对比。每项 = 一对「种子 / 候选」值。 */
export interface AnalysisSeedComparison {
  fans?: { seed: string; candidate: string };
  price?: { seed: string; candidate: string };
  cpm?: { seed: string; candidate: string };
  cpe?: { seed: string; candidate: string };
  medianViews?: { seed: string; candidate: string };
  er?: { seed: string; candidate: string };
}

/** deriveAlternativeReasons 的输入 —— 来自后台产出的种子↔候选指标对比。 */
export interface AlternativeSource {
  seedComparison?: AnalysisSeedComparison;
}

// 一项指标的「种子 / 候选」对比 → 一个「<指标> <候选> vs <种子>」的客观要素
// 胶囊。两端任一缺失就跳过。注意:这里只摆数字,不写「更低 / 更省」——方向交
// 给用户自己看数字判断。
function comparisonTag(label: string, pair?: { seed: string; candidate: string }): string | null {
  const seed = pair?.seed.trim();
  const candidate = pair?.candidate.trim();
  if (!seed || !candidate) return null;
  return `${label} ${candidate} vs ${seed}`;
}

/**
 * 「找平替」判断逻辑 —— 摆出一个候选博主「凭什么算平替」的【判断要素】。
 *
 * 不下「更低 / 更省」这类结论,而是把判断所依据的具体数据原样摆出来:每个
 * 胶囊 = 一项指标的「候选 vs 种子」实际数值对比(报价 / CPM / CPE / 粉丝 /
 * 中位播放 / 互动率)。用户自己看数字判断 —— 这才是【辅助信息】。
 *
 * 这是【判断逻辑】的占位实现:真实后端会基于种子博主 ↔ 候选博主的完整指标
 * 产出这份对比,这里先用卡片上 seedComparison 字段里后台已配平的数据。换真
 * 实后端时直接替换本函数体即可。
 *
 * 顺序:成本要素在前(报价 / CPM / CPE)→ 体量与表现在后(粉丝 / 播放 / 互动)。
 */
export function deriveAlternativeReasons(source: AlternativeSource): string[] {
  const comparison = source.seedComparison;
  if (!comparison) return [];
  return [
    comparisonTag("报价", comparison.price),
    comparisonTag("CPM", comparison.cpm),
    comparisonTag("CPE", comparison.cpe),
    comparisonTag("粉丝", comparison.fans),
    comparisonTag("中位播放", comparison.medianViews),
    comparisonTag("互动率", comparison.er),
  ].filter((tag): tag is string => tag !== null);
}

export interface AnalysisSource {
  tradeoffs?: string[];
  tags?: string[];
  /** 后台产出的「受众人群」维度特征(性别 / 年龄段 / 地域人群…)。已维度化,
   *  原样落入「受众人群」维度,不走关键词归类。 */
  audience?: string[];
  /** 后台产出的「内容主题」维度特征。已维度化,原样落入「内容主题」维度。 */
  topics?: Array<{ label: string }>;
  /** 当前筛选模式 —— 「找平替」时深度分析会把「平替依据」摆在最前面。 */
  filterMode?: FilterMode;
  /** 「找平替」判断所需:种子↔候选的指标对比。 */
  seedComparison?: AnalysisSeedComparison;
}

/**
 * 推导深度分析的特征 tag 列表。
 *
 * 「找平替」模式下,「平替依据」(种子↔候选的逐项数值对比)排在最前 ——
 * 见 deriveAlternativeReasons。其后是后台维度化产出(audience → 受众人群、
 * topics → 内容主题),再后是卡片自带的松散短词(tags、招牌内容特征,按关
 * 键词归类;tradeoffs 仅在「找相似」下散入内容维度,「找平替」下不用)。
 *
 * 维度【不封顶】—— 后台分析出多少个维度,就摆多少个;同一维度内 tag 也不限
 * 量。tag 全局去重。维度按【首次出现顺序】排列,渲染时同维度的 tag 相邻、
 * 靠底色聚成一族。每个 tag 只摆客观特征,不下结论。
 */
export function deriveAnalysis(card: AnalysisSource): InfluencerCardAnalysisTag[] {
  const order: AnalysisDimension[] = [];
  const buckets = new Map<AnalysisDimension, string[]>();
  const seen = new Set<string>();

  const add = (dimension: AnalysisDimension, rawTag: string): void => {
    const tag = rawTag.trim();
    if (!tag || seen.has(tag)) return;
    seen.add(tag);
    const list = buckets.get(dimension);
    if (list) {
      list.push(tag);
    } else {
      buckets.set(dimension, [tag]);
      order.push(dimension);
    }
  };

  // 找平替:「平替依据」摆在最前面 —— 种子↔候选的逐项数值对比。
  const isAlternative = card.filterMode === "找平替";
  if (isAlternative) {
    for (const reason of deriveAlternativeReasons(card)) add(ALTERNATIVE_DIMENSION, reason);
  }

  // 后台已维度化的产出 —— 维度名由后台写定,前端直接采用。
  for (const item of card.audience ?? []) add("受众人群", item);
  for (const topic of card.topics ?? []) add("内容主题", topic.label);

  // 卡片自带的松散短词 —— 按关键词归类到内容维度。
  const addLoose = (raw: string): void => {
    const entry = entryFromTag(raw);
    if (entry) add(entry.dimension, entry.tag);
  };
  for (const tag of card.tags ?? []) addLoose(tag);
  // 找平替模式下 tradeoffs 已并入「平替依据」,不再散进内容维度。
  if (!isAlternative) {
    for (const line of card.tradeoffs ?? []) addLoose(line);
  }
  for (const trait of SIGNATURE_TRAITS) addLoose(trait);

  // 按维度首次出现顺序摊平 —— 同维度的 tag 相邻,渲染成一片时底色聚成一族。
  const flat: InfluencerCardAnalysisTag[] = [];
  for (const dimension of order) {
    for (const tag of buckets.get(dimension) ?? []) {
      flat.push({ dimension, tag });
    }
  }
  return flat;
}
