// 场景维度的「中间确认层」数据源 —— 从 ParsedBrief 反推出内容场景。
//
// 产品决策(2026-05 发现页重构讨论):场景维度是三层结构
//   场景(产品反推) → 能拍这个场景的「达人类型」 → 该类型下的具体达人
// AI 把产品反推成 N 个场景是一个高后果判断 —— 场景推错,整个达人列表全错。
// 所以提交后必须先把场景给用户确认(勾选要哪几个),再去找达人。
//
// mock 阶段:从 brief.sceneCombos 派生(combo.method = 内容场景,combo.type =
// 达人类型)。真后端接入后由 /api/discovery/chat 的场景反推事件直接送出。

import type { ParsedBrief } from "./parsed-brief-types";

export interface ProposedScenario {
  id: string;
  /** 内容场景名 —— 如「上手实操」「竞品对比」「真实工作流」。 */
  name: string;
  /** 为什么从产品反推出这个场景。 */
  rationale: string;
  /** 能拍这个场景的达人类型(三层结构的中间层)。 */
  creatorTypes: string[];
  /** AI 默认勾选 —— 前 3 个高置信场景。 */
  recommended: boolean;
}

function uniq(arr: string[]): string[] {
  return [...new Set(arr.filter(Boolean))];
}

// brief 缺 sceneCombos(unknown 产品)时的兜底场景集合 —— 通用但仍可执行。
const GENERIC_SCENARIOS: ProposedScenario[] = [
  {
    id: "scene_g0",
    name: "真实使用演示",
    rationale: "真实使用感是新品最稳的转化路径,适合作为主推场景。",
    creatorTypes: ["垂类测评博主", "生活方式博主"],
    recommended: true,
  },
  {
    id: "scene_g1",
    name: "痛点 / 解决方案",
    rationale: "先立痛点再给方案,适合教育型产品建立需求。",
    creatorTypes: ["科普博主", "种草博主"],
    recommended: true,
  },
  {
    id: "scene_g2",
    name: "横向对比",
    rationale: "和同类产品对比,帮已有选择困难的用户做二次决策。",
    creatorTypes: ["测评博主"],
    recommended: true,
  },
  {
    id: "scene_g3",
    name: "日常植入",
    rationale: "把产品融进日常内容,适合扩展非核心人群。",
    creatorTypes: ["vlog 博主", "生活方式博主"],
    recommended: false,
  },
];

/**
 * 从 brief 反推出候选内容场景。combo.method 视为「内容场景」,combo.type
 * 与 cooperationMethods 一起解析出「能拍这个场景的达人类型」。
 */
export function proposeScenarios(brief: ParsedBrief): ProposedScenario[] {
  const combos = brief.sceneCombos ?? [];
  if (combos.length === 0) return GENERIC_SCENARIOS;

  const coopMethods = brief.cooperationMethods ?? [];
  return combos.map((combo, i) => {
    const creatorTypes = uniq([
      combo.type,
      ...coopMethods.filter((cm) => cm.methods.includes(combo.method)).map((cm) => cm.type),
    ]);
    return {
      id: `scene_${i}`,
      name: combo.method,
      rationale: combo.rationale,
      creatorTypes,
      recommended: i < 3,
    };
  });
}
