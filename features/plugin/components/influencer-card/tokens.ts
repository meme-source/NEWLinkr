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

export const AVATAR = {
  // Per the floating-creator-card reference: sand→sand gradient, white serif
  // initial, no shadow. Visual contrast on the initial is intentionally low
  // (the avatar reads as a tonal placeholder, not a billboard).
  gradient: "linear-gradient(135deg, #eceae3 0%, #c5c0b1 100%)",
  innerHighlight: "inset 0 0.83px 1.67px 0 rgba(255, 254, 251, 0.32)",
  shadow: "none",
} as const;

export const TYPE = {
  filterLabel: { size: 12, lineHeight: 18, weight: 500 },
  pillText: { size: 12, lineHeight: 18, weight: 500 },
  handle: {
    size: 20,
    lineHeight: 24.2,
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
  radarHeading: { size: 11, lineHeight: 16.5, weight: 600, tracking: "0.064px" },
  axisLabel: { size: 8.333, lineHeight: 10, weight: 500 },
  axisValue: { size: 8.333, lineHeight: 10, weight: 500 },
  legend: { size: 11, lineHeight: 16.5, weight: 400, tracking: "0.064px" },
  cta: { size: 13, lineHeight: 19.5, weight: 600, tracking: "-0.146px" },
} as const;
