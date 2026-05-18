// Tokens for InfluencerCard.
//
// All values flow from docs/DESIGN.md (Linkr 3 Design System, Zapier-inspired).
// The key invariants:
//   - Surfaces: cream `#fffefb`, off-white `#fffdf9`, light sand `#eceae3` only.
//     No pure white. No cool grays.
//   - Borders: sand `#c5c0b1` everywhere by default; `#b5b2aa` only for special spans.
//     Inner-cell dividers go through `rgba(197, 192, 177, 0.4)` per §6.5.2.
//   - Accent: Linkr Orange `#ff4f00` for CTA + active states ONLY. Never as
//     decorative text fill. The legacy key `terracotta` is retained because
//     subcomponents already destructure it; the value is the new Linkr Orange.
//   - Typography: Inter for all functional UI. Editorial Source Serif 4 only for
//     deliberate editorial moments — handle / metric values stay on Inter.
//   - Depth: borders, not shadows. The card outline is a single 1px sand border;
//     anything stronger would conflict with §6 "border-first" elevation.

import type { AnalysisDimension } from "./types";

export const CARD = {
  width: 320,
  radius: 8,
  shadow: "none",
  background: "#fffefb",
  bodyBackground: "#fffdf9",
  divider: "rgba(197, 192, 177, 0.4)",
} as const;

export const SURFACE = {
  white: "#fffefb",
  subtle: "#fffdf9",
  inset: "#fffdf9",
  hover: "#eceae3",
  pill: "#fffefb",
  toggleTrack: "#c5c0b1",
} as const;

export const BORDER = {
  hairline: "#c5c0b1",
  input: "#c5c0b1",
  dashed: "#b5b2aa",
  pill: "#c5c0b1",
} as const;

export const TEXT = {
  primary: "#201515",
  heading: "#201515",
  body: "#36342e",
  secondary: "#36342e",
  tertiary: "#36342e",
  filterLabel: "#939084",
  muted: "#939084",
  axisLabel: "#939084",
  axisValue: "#36342e",
  link: "#ff4f00",
  emailFound: "#ff4f00",
  highlight: "#ff4f00",
} as const;

export const ACCENT = {
  terracotta: "#ff4f00",
  terracottaSoft: "rgba(255, 79, 0, 0.12)",
} as const;

// 深度分析:每个内容维度一档浅底色,用来区分胶囊 tag 所属维度(维度名不
// 显示)。所有 tag 连成一片排列,同维度的靠底色聚成一族。每档都是高明度、
// 低饱和的暖彩,落在奶油底色上柔和、成一族;这是产品方明确要求的彩色 pill
// 填充,属于对 docs/DESIGN.md §6.5.1「pill 不做彩色填充」的一处记录在案的例外。
//
// 维度是开放集合(后台配置)——已知维度在此登记固定底色;后台新增的未知维
// 度由 analysisTintFor 按维度名 hash 出一档稳定底色,无需改前端。
const ANALYSIS_TINT_KNOWN: Record<string, string> = {
  平替依据: "#ffdcc2", // 暖橘 ——「找平替」的依据,摆在最前、底色最暖
  内容主题: "#fde4d6", // 暖杏
  内容形式: "#f6eccd", // 奶黄
  视觉调性: "#f3e1e4", // 暖粉
  账号数据: "#e3ede0", // 薄荷
  受众人群: "#e2e8f3", // 薄蓝
};

// 未知维度的兜底调色板 —— 同样是高明度低饱和暖彩,和已登记的几档同族。
const ANALYSIS_TINT_FALLBACK = ["#fde4d6", "#f6eccd", "#f3e1e4", "#e3ede0", "#e2e8f3", "#ece3f1"];

/** 取某个维度的胶囊底色。已登记维度用固定色;未知维度按维度名 hash 出一档
 *  稳定底色 —— 同名维度永远得到同一档色,保证同维度 tag 聚成一族。 */
export function analysisTintFor(dimension: AnalysisDimension): string {
  const known = ANALYSIS_TINT_KNOWN[dimension];
  if (known) return known;
  let hash = 0;
  for (let i = 0; i < dimension.length; i += 1) {
    hash = (hash * 31 + dimension.charCodeAt(i)) >>> 0;
  }
  return ANALYSIS_TINT_FALLBACK[hash % ANALYSIS_TINT_FALLBACK.length];
}

export const AVATAR = {
  // Per the floating-creator-card reference: sand→sand gradient, white serif
  // initial, no shadow. Visual contrast on the initial is intentionally low
  // (the avatar reads as a tonal placeholder, not a billboard).
  gradient: "linear-gradient(135deg, #eceae3 0%, #c5c0b1 100%)",
  innerHighlight: "inset 0 0.83px 1.67px 0 rgba(255, 254, 251, 0.32)",
  shadow: "none",
} as const;

export const TYPE = {
  filterLabel: { size: 11, lineHeight: 16, weight: 500 },
  pillText: { size: 11, lineHeight: 16, weight: 500 },
  handle: {
    size: 17,
    lineHeight: 20.5,
    weight: 700,
    tracking: "-0.3px",
    family: '"Times New Roman", Times, serif',
  },
  metaInline: { size: 12, lineHeight: 18, weight: 400 },
  tagPlaceholder: { size: 12, lineHeight: 18, weight: 400 },
  metricLabel: { size: 10, lineHeight: 15, weight: 500, tracking: "0.5px" },
  metricValue: { size: 13, lineHeight: 19.5, weight: 600, tracking: "-0.146px" },
  sectionLabel: { size: 10, lineHeight: 15, weight: 600, tracking: "0.5px" },
  chip: { size: 11, lineHeight: 16.5, weight: 500, tracking: "0.064px" },
  analysisHeading: { size: 11, lineHeight: 16.5, weight: 600, tracking: "0.064px" },
  analysisDimension: { size: 12, lineHeight: 16, weight: 600 },
  analysisVerdict: { size: 11, lineHeight: 14, weight: 600 },
  analysisDetail: { size: 11, lineHeight: 15.5, weight: 400 },
  cta: { size: 13, lineHeight: 19.5, weight: 600, tracking: "-0.146px" },
} as const;
