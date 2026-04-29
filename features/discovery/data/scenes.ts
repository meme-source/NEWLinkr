export const MOCK_SCENES: {
  id: string;
  icon: string;
  name: string;
  type: string;
  reason: string;
  format: string;
  creatorCount: number;
  avgEngagement: string;
}[] = [
  {
    id: "routine",
    icon: "🌙",
    name: "晚间护肤 routine",
    type: "修复 / 舒缓",
    reason: "适合展示连续使用、肤感变化和第二天状态",
    format: "真人出镜 + 步骤教程",
    creatorCount: 342,
    avgEngagement: "8.2%",
  },
  {
    id: "science",
    icon: "🔬",
    name: "成分科普测评",
    type: "信任建立",
    reason: "适合解释成分、功效机制和敏感肌顾虑",
    format: "成分讲解 + 近景质地",
    creatorCount: 156,
    avgEngagement: "6.7%",
  },
  {
    id: "unbox",
    icon: "📦",
    name: "开箱 & 初体验",
    type: "新品种草",
    reason: "适合快速讲清包装、质地、第一印象和购买理由",
    format: "短视频 + 购买钩子",
    creatorCount: 289,
    avgEngagement: "11.3%",
  },
  {
    id: "makeup",
    icon: "💄",
    name: "GRWM 妆前护肤",
    type: "生活方式",
    reason: "适合把产品自然嵌入妆前流程和日常场景",
    format: "GRWM + 使用前后",
    creatorCount: 201,
    avgEngagement: "9.8%",
  },
];

export const MOCK_OG_PREVIEW = {
  title: "防蓝光护眼面霜 · MyBrand 官网",
  image: "https://picsum.photos/seed/product-thumb/240/240",
  domain: "mybrand.com",
};

export const MOCK_AI_CATEGORY = { l1: "美妆护肤", l2: "护肤" };
