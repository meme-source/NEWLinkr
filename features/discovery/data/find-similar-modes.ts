import type { FindSimilarMode } from "../types";

export const FIND_SIMILAR_MODE_META: Record<
  FindSimilarMode,
  {
    icon: string;
    title: string;
    desc: string;
    accent: string;
    softBg: string;
    softBorder: string;
  }
> = {
  找相似: {
    icon: "🪞",
    title: "找相似",
    desc: "风格、粉丝画像高度一致的博主",
    accent: "#c96442",
    softBg: "#fef3e8",
    softBorder: "#f5d0a9",
  },
  找平替: {
    icon: "💰",
    title: "找平替",
    desc: "报价更低、效果相当的替代博主",
    accent: "#8a6622",
    softBg: "#fcf6e8",
    softBorder: "#e8d5a0",
  },
  找种子达人: {
    icon: "🌱",
    title: "找种子达人",
    desc: "低重合、高潜力的种子达人",
    accent: "#3f7d35",
    softBg: "#eef6ef",
    softBorder: "#b8d9bb",
  },
};
