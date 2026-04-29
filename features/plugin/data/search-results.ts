import type { SearchModeKey } from "../types";

export const searchResults: Record<
  SearchModeKey,
  {
    total: string;
    helper: string;
    cards: Array<{
      id: string;
      name: string;
      email: string;
      country: string;
      fans: string;
      views: string;
      er: string;
      price: string;
      score: string;
      reason: string;
      reasons?: string[];
      tradeoffs?: string[];
      savingPct?: string;
      seedPrice?: string;
      tags: string[];
      subscores?: {
        topic: number;
        format: number;
        visual: number;
        data: number;
        activity: number;
        contact: number;
      };
      altSubscores?: {
        similarity: number;
        costAdvantage: number;
        dataPerformance: number;
        contactabilityRisk: number;
      };
      seedComparison?: {
        medianViews?: { seed: string; candidate: string };
        er?: { seed: string; candidate: string };
        price?: { seed: string; candidate: string };
        cpm?: { seed: string; candidate: string };
        cpe?: { seed: string; candidate: string };
        emailStatus?: string;
        systemConclusion?: string;
      };
      visualPending?: boolean;
      emailStatusLabel?: string;
    }>;
  }
> = {
  comprehensive: {
    total: "86",
    helper: "系统按内容、风格、受众和商业特征综合排序。",
    cards: [
      {
        id: "outdoor-jane",
        name: "@outdoor_jane",
        email: "outdoor.jane@creatormail.com",
        country: "美国",
        fans: "98K",
        views: "28K",
        er: "3.8%",
        price: "~$220",
        score: "87%",
        reason: "内容主题高度重合，商业化更轻，预算有限时的高性价比选择。",
        reasons: [
          "近 10 条均聚焦护肤 routine / 户外随拍",
          "中位播放接近：28K vs 当前 31K",
          "互动率 3.8%，活跃度高于赛道均值",
        ],
        tradeoffs: ["粉丝量更小", "品牌合作历史较少"],
        tags: ["内容 95%", "受众 82%", "报价更低"],
        subscores: {
          topic: 92,
          format: 78,
          visual: 85,
          data: 82,
          activity: 100,
          contact: 70,
        },
        emailStatusLabel: "已找到",
      },
      {
        id: "camp-mike",
        name: "@camp_mike",
        email: "camp.mike@creatormail.com",
        country: "美国",
        fans: "210K",
        views: "55K",
        er: "4.5%",
        price: "~$450",
        score: "82%",
        reason: "视觉风格很接近，但量级更大，适合作为矩阵中的头部搭配。",
        tags: ["内容 88%", "风格 91%", "量级更高"],
      },
    ],
  },
  budget: {
    total: "43",
    helper: "系统优先过滤高报价和高广告密度创作者。",
    cards: [
      {
        id: "trail-daily",
        name: "@trail.daily",
        email: "trail.daily@creatormail.com",
        country: "美国",
        fans: "76K",
        views: "25K",
        er: "4.1%",
        price: "~$180",
        score: "84",
        savingPct: "55%",
        seedPrice: "~$420",
        reason: "风格接近，报价更轻，更适合预算敏感项目。",
        reasons: [
          "内容主题相似：露营装备 / 周末测评",
          "预估 CPM $14 vs 当前 $24，更省钱",
          "近 30 天保持活跃，发文稳定",
        ],
        tradeoffs: ["粉丝量更小", "品牌合作密度低"],
        tags: ["报价更低", "内容接近", "广告频率低"],
        altSubscores: {
          similarity: 82,
          costAdvantage: 88,
          dataPerformance: 76,
          contactabilityRisk: 70,
        },
        seedComparison: {
          medianViews: { seed: "38K", candidate: "25K" },
          er: { seed: "4.2%", candidate: "4.1%" },
          price: { seed: "~$420", candidate: "~$180" },
          cpm: { seed: "$24", candidate: "$14" },
          cpe: { seed: "$0.65", candidate: "$0.34" },
          emailStatus: "已验证",
          systemConclusion:
            "适合预算敏感的测试型项目；如目标是大曝光，当前博主更稳；如目标是低成本测试，这个平替更合适。",
        },
        emailStatusLabel: "已验证",
      },
      {
        id: "camping-weekend",
        name: "@camping.weekend",
        email: "camping.weekend@creatormail.com",
        country: "加拿大",
        fans: "92K",
        views: "31K",
        er: "3.9%",
        price: "~$210",
        score: "80",
        savingPct: "45%",
        seedPrice: "~$420",
        reason: "受众略分散，但整体性价比更好，适合作为平替补充。",
        reasons: [
          "中位播放 31K，与当前博主接近",
          "预估 CPM $13，明显低于当前",
          "邮箱已找到，建联门槛低",
        ],
        tradeoffs: ["受众重合略低", "ER 略低"],
        tags: ["性价比高", "互动稳定", "量级接近"],
        visualPending: true,
        altSubscores: {
          similarity: 78,
          costAdvantage: 80,
          dataPerformance: 72,
          contactabilityRisk: 90,
        },
        seedComparison: {
          medianViews: { seed: "38K", candidate: "31K" },
          er: { seed: "4.2%", candidate: "3.9%" },
          price: { seed: "~$420", candidate: "~$210" },
          cpm: { seed: "$24", candidate: "$13" },
          emailStatus: "已找到",
        },
      },
    ],
  },
  seed: {
    total: "28",
    helper: "系统优先筛出低重合、高潜力的种子达人，便于首轮测试。",
    cards: [
      {
        id: "north-woods-ava",
        name: "@north.woods.ava",
        email: "north.woods.ava@creatormail.com",
        country: "美国",
        fans: "88K",
        views: "22K",
        er: "5.1%",
        price: "~$240",
        score: "89%",
        reason: "互动质量稳定、受众重合更低，适合作为首批测试的种子达人。",
        tags: ["低重合", "互动质量高", "适合首测"],
      },
      {
        id: "roam-family",
        name: "@roam.family",
        email: "roam.family@creatormail.com",
        country: "英国",
        fans: "134K",
        views: "35K",
        er: "4.0%",
        price: "~$260",
        score: "78%",
        reason: "内容切入点贴近当前赛道，能补充新受众，适合作为扩列种子。",
        tags: ["新受众补充", "调性贴近", "社群氛围好"],
      },
    ],
  },
  tier: {
    total: "64",
    helper: "同赛道创作者已按不同量级自动分层，方便搭配投放。",
    cards: [
      {
        id: "camp-headline",
        name: "@camp.headline",
        email: "camp.headline@creatormail.com",
        country: "美国",
        fans: "420K",
        views: "88K",
        er: "3.2%",
        price: "~$900",
        score: "81%",
        reason: "适合作为头部创作者补量，视觉和主题仍保持一致。",
        tags: ["头部量级", "主题接近", "覆盖更广"],
      },
      {
        id: "micro-camp-log",
        name: "@micro.camp.log",
        email: "micro.camp.log@creatormail.com",
        country: "美国",
        fans: "32K",
        views: "12K",
        er: "6.0%",
        price: "~$95",
        score: "79%",
        reason: "适合作为长尾创作者补充，互动率更高。",
        tags: ["长尾补充", "ER 更高", "预算轻"],
      },
    ],
  },
  geo: {
    total: "31",
    helper: "系统保留相似内容特征，并扩展到目标国家的同类创作者。",
    cards: [
      {
        id: "alpine-escape-de",
        name: "@alpine.escape.de",
        email: "alpine.escape.de@creatormail.com",
        country: "德国",
        fans: "102K",
        views: "30K",
        er: "4.3%",
        price: "~$250",
        score: "83%",
        reason: "视觉和生活方式表达相近，适合欧洲市场扩展。",
        tags: ["德国", "风格接近", "旅行受众"],
      },
      {
        id: "forest-weekend-jp",
        name: "@forest.weekend.jp",
        email: "forest.weekend.jp@creatormail.com",
        country: "日本",
        fans: "95K",
        views: "26K",
        er: "4.7%",
        price: "~$230",
        score: "80%",
        reason: "内容拍摄方式相近，但受众偏日系户外生活方式。",
        tags: ["日本", "调性接近", "内容稳定"],
      },
    ],
  },
  brand: {
    total: "19",
    helper: "系统优先筛出接过同类品牌、合作形式相近的创作者。",
    cards: [
      {
        id: "gear-partner",
        name: "@gear.partner",
        email: "gear.partner@creatormail.com",
        country: "美国",
        fans: "118K",
        views: "34K",
        er: "4.4%",
        price: "~$320",
        score: "88%",
        reason: "近 90 天有户外品牌合作记录，商业内容自然度较高。",
        tags: ["合作品牌相近", "自然度高", "转化信号强"],
      },
      {
        id: "camp-review-lab",
        name: "@camp.review.lab",
        email: "camp.review.lab@creatormail.com",
        country: "加拿大",
        fans: "140K",
        views: "38K",
        er: "3.6%",
        price: "~$360",
        score: "79%",
        reason: "商业成熟度高，适合快速进入建联和报价流程。",
        tags: ["商业成熟", "历史合作多", "类目契合"],
      },
    ],
  },
};
