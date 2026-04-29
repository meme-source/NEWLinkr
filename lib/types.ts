// 前后端共享的"数据合同"
// 任何 API 的请求 / 返回结构都写在这里。前端按这个写 UI，后端按这个返回数据。

// ===== 通用 =====
export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
};

export type Platform = "tiktok" | "instagram" | "youtube";

// ===== 达人 =====
export type Creator = {
  id: string;
  handle: string;
  platform: Platform;
  avatar: string | null;
  followers: number;
  medianViews: number;
  engagementRate: number;
  estimatedPrice: string | null;
  emailStatus: "found" | "verified" | "missing";
  recentActiveAt: string | null;
};

// ===== 项目 =====
export type Project = {
  id: string;
  name: string;
  productUrl: string | null;
  category: string;
  platform: Platform;
  createdAt: string;
};

// ===== 博主发现 - 找同行投过的 =====
export type CompetitorDiscoveryRequest = {
  projectId: string;
  platform: Platform;
  brandQuery: string;
  category: string;
  timeRangeDays: number;
};

export type CompetitorCreatorResult = {
  creator: Creator;
  evidenceStrength: "high" | "medium" | "low";
  score: number;
  reasons: string[];
  evidencePost: {
    url: string;
    brand: string;
    publishedAt: string;
    views: number;
  };
};

// ===== 博主发现 - 按营销场景找 =====
export type ScenarioParseRequest = {
  projectId: string;
  productUrl?: string;
  productDescription?: string;
  platform: Platform;
};

export type Scene = {
  id: string;
  name: string;
  reason: string;
  creatorCount: number;
  avgEngagementRate: string;
  recommendedFormat: string;
};

export type ScenarioParseResponse = {
  productSummary: {
    category: string;
    sellingPoints: string[];
  };
  recommendedScenes: Scene[];
};

export type ScenarioCreatorResult = {
  creator: Creator;
  matchScore: number;
  reasons: string[];
  recommendedShootingStyle: string;
};

// ===== 博主发现 - 找爆款达人 =====
export type TrendingDiscoveryRequest = {
  projectId: string;
  platform: Platform;
  category: string;
  timeRangeDays: 7 | 14 | 30;
};

export type TrendingCreatorResult = {
  creator: Creator;
  trendType: "持续增长" | "单条爆款" | "高互动小号" | "新晋潜力" | "稳定高表现";
  score: number;
  reasons: string[];
  heroPost: {
    url: string;
    views: number;
    vsCreatorBaseline: string;
    vsCategoryBaseline: string;
  };
};

// ===== 搜索依据（结果页顶部展示） =====
export type SearchBasis = {
  platform: string;
  category: string;
  timeRangeDays: number;
  postsAnalyzed: number;
  candidatesFound: number;
};
