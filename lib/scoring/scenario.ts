// 按营销场景找 —— 推荐分公式
// 来源：博主发现页实现逻辑.md §4.5 §4.6

// 场景本身的推荐分（决定先展示哪个场景）
export type SceneScoreInput = {
  productFit: number;           // 产品卖点匹配 0-100
  expressiveness: number;       // 内容可表达性 0-100
  historicalPerformance: number;// 同品类历史表现 0-100
  creatorSupply: number;        // 达人供给数量 0-100
};

export function sceneScore(input: SceneScoreInput): number {
  return Math.round(
    input.productFit * 0.4 +
      input.expressiveness * 0.25 +
      input.historicalPerformance * 0.2 +
      input.creatorSupply * 0.15,
  );
}

// 场景下达人的推荐分
export type ScenarioCreatorScoreInput = {
  sceneMatch: number;           // 场景匹配度 0-100
  scenePerformance: number;     // 该场景内容表现 0-100
  formatFit: number;            // 内容形式适配 0-100
  commercialAvailability: number;// 商业可用性 0-100
  dataStability: number;        // 数据稳定性 0-100
};

export function scenarioCreatorScore(input: ScenarioCreatorScoreInput): number {
  return Math.round(
    input.sceneMatch * 0.4 +
      input.scenePerformance * 0.3 +
      input.formatFit * 0.15 +
      input.commercialAvailability * 0.1 +
      input.dataStability * 0.05,
  );
}
