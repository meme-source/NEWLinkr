// 受众数据 tab 共享的图表配色。整体只走 Linkr 暖色系（cream + orange + warm 中性灰），
// 不引入冷蓝 / 草绿 / 玫红，避免与品牌主色形成视觉冲突。所有颜色都从
// docs/DESIGN.md 的核心 token（`#ff4f00` / `#201515` / `#c5c0b1` / `#fffefb`）延伸而来。

export const CHART = {
  // 主色：Linkr Orange，给「关键转化 / 主导段 / 高亮 metric」。
  primary: "#ff4f00",
  // 主色稍浅的暖橙，用作 primary 的弱化变体或第二段。
  coral: "#ff8a5c",
  // 暖近黑：替代之前的冷蓝，作为 primary 的强对比 neutral。
  dark: "#3a3431",
  // 暖中灰：分布数据中的中等档位。
  graphite: "#7a6e5c",
  // 沙色：分布数据中的最弱档位。
  sand: "#c5b89e",
} as const;

// 与 CHART.* 对应的浅底色（chip / 区块底色）。
export const CHART_BG = {
  primary: "#fff1ea",
  coral: "#ffe5d6",
  dark: "#e8e4df",
  graphite: "#ece6db",
  sand: "#f1ecde",
} as const;
