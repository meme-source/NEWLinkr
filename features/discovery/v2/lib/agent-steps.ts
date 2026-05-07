import { renderCount, revealPills, sleep, typeLine } from "./animation";

export type StepStatus = "pending" | "active" | "done";

/**
 * StepConfig drives the streaming reasoning canvas.
 *
 * - `time` is the user-facing duration label that appears once the step is
 *   `done`. Keep it human-rounded ("1.2s"), not the precise duration.
 * - `duration` is the minimum animation budget. The runner waits at least this
 *   long even if `render()` resolves early — protects against backends that
 *   stream too fast and lose the "did some work" feel.
 * - `narration` is an italicized transition line shown after `render()`
 *   resolves (used today only between step 2 and step 3).
 * - `render` populates the result element with the streaming content.
 */
export interface StepConfig {
  id: string;
  title: string;
  time: string;
  duration: number;
  narration?: string;
  render: (el: HTMLElement) => Promise<void>;
}

/**
 * The 4-step natural-language script. Copy is locked by the v2 mock §4 —
 * any technical word ("解析"/"反推"/"扫描"/"AGENT") is intentionally banned.
 */
export const AGENT_STEPS: StepConfig[] = [
  {
    id: "product_parse",
    title: "看你的产品页",
    time: "1.2s",
    duration: 1200,
    render: async (el) => {
      await typeLine(el, "敏感肌修复面霜", "strong", 30);
      await sleep(160);
      await typeLine(el, "CeraVe · $19.99 · 美国市场", "meta", 22);
    },
  },
  {
    id: "icp",
    title: "提一下你的目标人群",
    time: "1.8s",
    duration: 1500,
    narration: "把卖点和受众反推出来后，下一步要找到同类竞品 ↓",
    render: async (el) => {
      await typeLine(el, "核心卖点：敏感肌 / 神经酰胺 / 夜间用", undefined, 24);
      await sleep(160);
      await typeLine(el, "受众：18-35 岁女性 · $20-30 价位", "meta", 22);
    },
  },
  {
    id: "brands",
    title: "找同类品牌",
    time: "0.4s",
    duration: 900,
    render: async (el) => {
      const wrap = document.createElement("div");
      wrap.className = "brand-pills";
      el.appendChild(wrap);
      await revealPills(wrap, ["CeraVe", "La Roche-Posay", "Cetaphil", "Aveeno", "Vanicream"], 130);
    },
  },
  {
    id: "scan",
    title: "在 TikTok 翻帖子",
    time: "6.5s",
    duration: 2800,
    render: async (el) => {
      await renderCount(el, 12430, "条相关帖子已扫描");
      await sleep(220);
      await renderCount(el, 286, "条命中同类品牌合作");
    },
  },
];
