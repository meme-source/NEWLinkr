import type { AudienceCredibility } from "@/types/api";

// 6 个维度各预置一组 1 句话总结，按 creator.id 做种子选词，
// 同一个博主每次拿到的总结稳定，不同博主之间能产生差异。
// 文案保持简短口语，避免长解释。

type SummaryKey = keyof NonNullable<AudienceCredibility["summaries"]>;

const POOLS: Record<SummaryKey, string[]> = {
  authenticFans: [
    "粉丝评论多围绕日常体验，真实互动占比稳健。",
    "评论里少有套话，反应更接近真实声音。",
    "粉丝互动里大量真情流露，真粉占比明显高于平均。",
  ],
  productInterest: [
    "粉丝主动追问款式、价格与用法，购买信号明确。",
    "评论里常出现使用对比与体验讨论，转化潜力较高。",
    "对产品细节有较多追问，体现真实购买意向。",
  ],
  positiveSentiment: [
    "评论以肯定与喜爱为主，整体氛围正向。",
    "情绪倾向积极，对博主与所推荐内容多为认可。",
    "正面评价比例稳定居前，受众情绪健康。",
  ],
  trustScore: [
    "内容真诚、不刻意带货，粉丝认可度高。",
    "讲解客观、信息透明，被认为可信赖。",
    "互动里多见「中肯」「客观」的反馈，少推销感。",
  ],
  professionalismScore: [
    "内容信息密度高，常被夸「专业」「学到东西」。",
    "对所在领域输出清晰，专业形象稳定。",
    "讲解结构清晰、用语准确，被视为可信源。",
  ],
  affinityScore: [
    "风格鲜明，粉丝高频表达喜欢与认同。",
    "用户黏性强，评论里大量「太喜欢」「必追」类发言。",
    "幽默 / 真诚的风格让博主在全球受众里都很受欢迎。",
  ],
};

const KEYS: SummaryKey[] = [
  "authenticFans",
  "productInterest",
  "positiveSentiment",
  "trustScore",
  "professionalismScore",
  "affinityScore",
];

// 简单 hash：把字符串折成一个 32-bit 整数当种子。
function hashSeed(input: string, salt: number): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h ^ input.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

export function pickCredibilitySummaries(
  creatorId: string,
): NonNullable<AudienceCredibility["summaries"]> {
  const out: NonNullable<AudienceCredibility["summaries"]> = {};
  KEYS.forEach((key, idx) => {
    const pool = POOLS[key];
    const seed = hashSeed(creatorId, idx + 1);
    out[key] = pool[seed % pool.length];
  });
  return out;
}
