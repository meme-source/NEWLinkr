import type {
  AnalysisBasis,
  ChatIntent,
  CreatorCardData,
  CreatorEvidence,
  ResultGroupData,
} from "../chat-types";

function creator(
  id: string,
  handle: string,
  name: string,
  avatarSeed: number,
  region: string,
  followers: string,
  medianViews: string,
  er: string,
  hasEmail: boolean,
  evidence: CreatorEvidence,
): CreatorCardData {
  return {
    id,
    handle,
    name,
    avatarSeed,
    region,
    followers,
    medianViews,
    er,
    hasEmail,
    riskLow: true,
    evidence,
  };
}

const COMPETITOR_GROUPS: ResultGroupData[] = [
  {
    key: "high",
    label: "强证据 · 明确合作",
    hint: "近 90 天有品牌 @ + #ad / 折扣码组合",
    count: 12,
    defaultExpanded: true,
    creators: [
      creator("c-h-1", "@skincare_sam", "Skincare Sam", 47, "🇺🇸", "320K", "45K", "5.4%", true, {
        tag: "high",
        badge: "合作证据：强",
        reasons: [
          "近 60 天发过 3 条 CeraVe 合作内容",
          "帖子含 #ad 与 @cerave",
          "合作帖播放高于本人中位 1.8x",
        ],
        sample: {
          thumbHue: 18,
          caption: "My honest CeraVe routine review",
          meta: "#ad · @cerave · 86K 播放 · 2026-04-12",
        },
      }),
      creator("c-h-2", "@laura.derm", "Laura · Derm", 21, "🇺🇸", "182K", "32K", "6.1%", true, {
        tag: "high",
        badge: "合作证据：强",
        reasons: [
          "Bio 长期挂 LRP 折扣码 LAURA15",
          "近 90 天 4 条 La Roche-Posay 合作帖",
          "合作帖 ER 6.8% · 高于本人中位 1.3x",
        ],
        sample: {
          thumbHue: 32,
          caption: "What I use every night for sensitive skin",
          meta: "#paidpartnership · @larocheposay",
        },
      }),
    ],
  },
  {
    key: "medium",
    label: "中证据 · 疑似合作",
    hint: "caption 提牌 + 折扣码或链接，缺正式披露",
    count: 35,
    defaultExpanded: false,
    creators: [
      creator("c-m-1", "@everyday.glow", "Everyday Glow", 9, "🇨🇦", "76K", "18K", "4.8%", true, {
        tag: "medium",
        badge: "合作证据：中",
        reasons: [
          "近 30 天 2 条 caption 提到 Cetaphil",
          "Linktree 永久跳转至 Cetaphil 产品页",
          "无 #ad 标签",
        ],
      }),
    ],
  },
  {
    key: "weak",
    label: "弱证据 · 仅提及",
    hint: "caption 出现品牌名 / 标签，未触发更强信号",
    count: 239,
    defaultExpanded: false,
    creators: [],
  },
];

const SCENARIO_GROUPS: ResultGroupData[] = [
  {
    key: "skincare-creator",
    label: "护肤博主 · 主推（空瓶记 / 成分对比）",
    hint: "护肤垂类，敏感肌话题表达稳定",
    count: 85,
    defaultExpanded: true,
    creators: [
      creator("s-1", "@glowwithsun", "Glow With Sun", 21, "🇺🇸", "89K", "42K", "6.1%", true, {
        badge: "场景匹配 91",
        reasons: [
          "近 30 天发过 5 条空瓶 / 成分对比内容",
          "护肤分类中位 42K · 高于 Micro 圈层 2.1x",
          "评论高频词：sensitive skin · night routine",
        ],
        risks: ["建议 brief 贴近她的「夜间步骤教程」结构"],
      }),
      creator("s-2", "@quietroutine", "Quiet Routine", 16, "🇬🇧", "54K", "23K", "7.4%", true, {
        badge: "场景匹配 87",
        reasons: [
          "擅长 4–6 周连续记录格式",
          "近 90 天 8 条护肤垂类内容",
          "ER 7.4% 高于护肤分类 Micro 中位 7.0%",
        ],
      }),
    ],
  },
  {
    key: "beauty-creator",
    label: "美妆博主 · 主推（GRWM）",
    hint: "妆前流程嵌入产品场景",
    count: 142,
    defaultExpanded: false,
    creators: [],
  },
  {
    key: "derm-creator",
    label: "皮肤科医生 · 次推（成分讲解）",
    hint: "信任建立类，适合成分背书",
    count: 18,
    defaultExpanded: false,
    creators: [],
  },
];

const TRENDING_GROUPS: ResultGroupData[] = [
  {
    key: "sustained",
    label: "持续增长 · 14 天多条爆款",
    hint: "近 14 天 ≥ 2 条高于本人中位 2x",
    count: 15,
    defaultExpanded: true,
    creators: [
      creator(
        "t-s-1",
        "@beauty_sora_lab",
        "Beauty Sora Lab",
        25,
        "🇺🇸",
        "268K",
        "52K",
        "7.4%",
        true,
        {
          badge: "标签：持续增长",
          reasons: [
            "14 天 2 条爆款，超本人中位 3.4x",
            "代表帖播放 180K（分类基线 2.1x）",
            "当前播放仍在增长 · 日均 +8K",
          ],
          risks: ["爆款集中在测试性内容，brief 需贴近该形式", "报价可能上调"],
          sample: {
            thumbHue: 12,
            caption: "Testing viral serum for 7 days",
            meta: "180K 播放 · 中位 3.4x · 分类基线 2.1x",
          },
        },
      ),
    ],
  },
  {
    key: "single-viral",
    label: "单条爆款 · 一炮内容",
    hint: "1 条远超中位，其余仍在中位附近",
    count: 28,
    defaultExpanded: false,
    creators: [
      creator("t-v-1", "@minimalkit", "Minimal Kit", 48, "🇬🇧", "44K", "9K", "4.6%", false, {
        badge: "标签：单条爆款",
        reasons: [
          "14 天 1 条 220K 播放（超中位 24x）",
          "其他帖子仍在 8–12K",
          "爆款主题：morning routine 真实测评",
        ],
      }),
    ],
  },
  {
    key: "rising",
    label: "新晋潜力 · 圈层上扬",
    hint: "近 30 天中位高于过去 60 天 1.5x+",
    count: 12,
    defaultExpanded: false,
    creators: [],
  },
  {
    key: "niche",
    label: "高于圈层 · 小博高 ER",
    hint: "粉丝 < 50K 但 ER 已达爆款阈值",
    count: 20,
    defaultExpanded: false,
    creators: [],
  },
];

const GROUPS_BY_INTENT: Record<ChatIntent, ResultGroupData[]> = {
  competitor: COMPETITOR_GROUPS,
  scenario: SCENARIO_GROUPS,
  trending: TRENDING_GROUPS,
};

export function getGroupsForIntent(intent: ChatIntent): ResultGroupData[] {
  return GROUPS_BY_INTENT[intent];
}

export function getBasisForIntent(intent: ChatIntent, ctx: AnalysisBasis): AnalysisBasis {
  if (intent === "competitor") {
    return {
      ...ctx,
      brandsSearched: ["CeraVe", "La Roche-Posay", "Cetaphil"],
      postsAnalyzed: 12_430,
      candidatesFound: 286,
    };
  }
  if (intent === "scenario") {
    return {
      ...ctx,
      postsAnalyzed: 8_960,
      candidatesFound: 245,
      baselineNote: "美妆护肤 · Micro 中位 20K",
    };
  }
  return {
    ...ctx,
    postsAnalyzed: 8_230,
    candidatesFound: 75,
    baselineNote: "Micro 爆款阈值 100K · ER 12.6%",
  };
}

export function getResultHintForIntent(intent: ChatIntent): string {
  if (intent === "competitor")
    return "要不要加个筛选？比如「只看公开邮箱」「证据强度 ≥ 中」「排除已 No」";
  if (intent === "scenario") return "需要继续聚焦吗？比如「只看护肤博主」「再加 ER ≥ 6%」";
  return "要不要追问？比如「只看持续增长的」「排除单条爆款」「再细分到 30 天」";
}
