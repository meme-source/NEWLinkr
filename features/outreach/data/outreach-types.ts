import type { CollaborationStatus } from "@/types/api";

// §3.2 建联看板状态 ——
// 现在统一使用 types/api.ts 中的 CollaborationStatus（7 个核心状态）。
// 看板上不会出现 "待评估"（pending）状态——pending 表示尚未决定是否建联，
// 这类博主只会出现在博主库里；一旦推到建联看板，最低也是 "待建联"（queued）。
//
// 旧的 OutreachStatus / CooperationStatus / "建联成功" / "已暂停" 已废弃，
// 全部 label / 配色由 lib/creator.ts 统一供给。
export type OutreachLifecycleStatus = Exclude<CollaborationStatus, "pending">;

// 看板里下拉可选的 6 个状态（剔除 pending）。
export const OUTREACH_ALLOWED_STATUSES: readonly OutreachLifecycleStatus[] = [
  "queued",
  "sent",
  "collaborating",
  "completed",
  "paused",
  "rejected",
];

// 兼容旧 import：badge / dot 配色来自 lib/creator.ts 的全局调色板。
export { COLLABORATION_STATUS_STYLE as COLLABORATION_STATUS_CFG } from "@/lib/creator";

export interface OutreachCreator {
  id: string;
  handle: string;
  name: string;
  platform: string;
  method: string;
  // §3.2 唯一状态字段，统一到 CollaborationStatus。
  // pending 不会出现在 outreach 看板（见上方注释）。
  status: CollaborationStatus;
  lastContact: string;
  followers: number;
  projectId: string;
  // §3.2.4 multi-round contact. round=1 hidden in UI.
  round: number;
  // §3.2.5 排期 —— 仅在 status 为 collaborating / completed 时有意义。
  // 旧字段 cooperationStatus 已并入 status，不再单独维护。
  scheduledPublishAt?: string;
  // §3.2.6 next-follow-up reminder date (ISO yyyy-mm-dd).
  nextFollowUpAt?: string;
}

// §3.5 Template scope: separates "通用 / 非通用" templates.
export type TemplateScope = "universal" | "specific";

export interface Template {
  id: number;
  name: string;
  scope: TemplateScope;
  scenes: string[];
  subject: string;
  body: string;
  usage: number;
  openRate: number;
  replyRate: number;
  lastUpdated: string;
  projectIds?: string[];
  audienceTags?: string[];
  purpose?: string;
}

export interface MyTemplate extends Template {
  basedOn?: string;
  wordCount?: number;
}

export interface TrashItem {
  id: number;
  name: string;
  deletedDaysAgo: number;
}

export type TemplateTab = "all" | "system" | "mine" | "trash";

// Zaiper Design — scene chip palette, 全部落在 cream + 单一 accent 体系内。
export const SCENE_CFG: Record<string, string> = {
  初次: "bg-[#fff7f4] text-[#ff4f00] border-[#ffc8b3]",
  简短: "bg-[#eceae3] text-[#36342e] border-[#c5c0b1]",
  精品: "bg-[#fdf6e3] text-[#936400] border-[#e8d3a0]",
  跟进: "bg-[#eef1f6] text-[#2c4a78] border-[#c4cfdf]",
  确认: "bg-[#f1eef6] text-[#5a3d8f] border-[#d4c8e0]",
  感谢: "bg-[#ebf2ec] text-[#3d6a4a] border-[#c0d2c5]",
};
