// 博主发现 service 桶 —— 兼容老路由 `@/lib/services/discovery` 导入。
//
// 文档：博主发现页实现逻辑.md §B.1。目录结构按维度分文件，每个文件同时含
// v2 兼容函数（老路由还在用）与 v3 service（SSE chat 接口将调度）。
//
// 不在这里写业务逻辑 —— 只做 re-export。

export {
  discoverByCompetitor,
  discoverCompetitorCreators,
  selectCompetitorSeeds,
  type CompetitorDiscoveryResult,
} from "./competitor";

export {
  parseProductForScenarios,
  matchCreatorsByScenarios,
  discoverScenarioCreators,
  pickScenarioFeatureGroups,
} from "./scenario";

export {
  discoverByTrending,
  discoverTrendingCreators,
  selectTrendingSeeds,
  type TrendingDiscoveryResult,
} from "./trending";
