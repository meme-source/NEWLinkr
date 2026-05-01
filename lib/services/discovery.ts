// 博主发现服务层
//
// 三种发现模式，每个对应一个 API route。Phase 2-4 会用真实数据实现：
//   - byCompetitor: 找投过同行的达人（用品牌名搜帖子）
//   - byScenario:   按营销场景找（先解析产品，再按场景匹配）
//   - byTrending:   找近期爆款达人（基于互动率与播放量倍数）
//
// 当前实现返回与原 route stub 等价的空结果。真实实现时只动这个文件。
//
// Service contract:
//   - 接收已经过 zod 校验的 Request 类型
//   - 业务失败抛 AppError 子类（NotFoundError、UpstreamError 等）
//   - 不直接接触 NextRequest / NextResponse
//   - 不读未经包装的环境变量（用 lib/data/* 客户端）

import type {
  CompetitorCreatorResult,
  CompetitorDiscoveryRequest,
  ScenarioCreatorResult,
  ScenarioMatchRequest,
  ScenarioParseRequest,
  ScenarioParseResponse,
  SearchBasis,
  TrendingCreatorResult,
  TrendingDiscoveryRequest,
} from "@/types/api";

export type CompetitorDiscoveryResult = {
  basis: SearchBasis;
  results: CompetitorCreatorResult[];
};

export async function discoverByCompetitor(
  input: CompetitorDiscoveryRequest,
): Promise<CompetitorDiscoveryResult> {
  // TODO Phase 3:
  // 1. 用品牌名扩展别名 / 官方账号 / 域名
  // 2. 在 posts 表中搜 mentions / hashtags / external_links
  // 3. 给每条匹配帖子打证据强度（高/中/低）
  // 4. 按 creator 聚合，过滤 No / 风险 / 不活跃
  // 5. 用 lib/scoring/competitor.ts 算分排序
  return {
    basis: {
      platform: input.platform,
      category: input.category,
      timeRangeDays: input.timeRangeDays,
      postsAnalyzed: 0,
      candidatesFound: 0,
    },
    results: [],
  };
}

export async function parseProductForScenarios(
  _input: ScenarioParseRequest,
): Promise<ScenarioParseResponse> {
  // TODO Phase 2:
  // 1. 如果给了 url，抓取页面拿标题/主图/描述
  // 2. 调 Claude 提取 category + sellingPoints
  // 3. 在 scene_library 中匹配 3-6 个场景
  // 4. 对每个场景统计 creator_count / avg_ER
  return {
    productSummary: { category: "", sellingPoints: [] },
    recommendedScenes: [],
  };
}

export async function matchCreatorsByScenarios(
  _input: ScenarioMatchRequest,
): Promise<{ results: ScenarioCreatorResult[] }> {
  // TODO Phase 2:
  // 1. 在 creator_scene_stats 找擅长该场景的达人
  // 2. 用 lib/scoring/scenario.ts 算分
  return { results: [] };
}

export type TrendingDiscoveryResult = {
  basis: SearchBasis;
  results: TrendingCreatorResult[];
};

export async function discoverByTrending(
  input: TrendingDiscoveryRequest,
): Promise<TrendingDiscoveryResult> {
  // TODO Phase 4:
  // 1. 拉时间范围内品类相关 posts
  // 2. 算每条相对本人 median_views 的倍数
  // 3. 算相对品类基线的倍数
  // 4. 聚合到 creator，用 classifyTrendType 打标签
  // 5. 用 lib/scoring/trending.ts 算分
  return {
    basis: {
      platform: input.platform,
      category: input.category,
      timeRangeDays: input.timeRangeDays,
      postsAnalyzed: 0,
      candidatesFound: 0,
    },
    results: [],
  };
}
