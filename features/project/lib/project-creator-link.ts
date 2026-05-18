// 项目 × 达人 关联 —— 「项目」重构的核心实体。
//
// 背景：项目卡片要展现「网红列表 + 各状态统计」。但在混合合作模式下，
// 合作方式 / 报价 / 建联状态 / 内容产出 都因人而异 —— 它们不属于 Project，
// 而属于「某个达人 ∈ 某个项目」这条关联记录。
//
//   Project ──< ProjectCreatorLink >── Creator（全局达人库）
//      1                N                    1
//
// ProjectCreatorLink 只持有 creatorId 引用，绝不复制达人档案字段（关注数、
// 头像等），避免数据漂移。卡片上的统计全部由 deriveProjectStats() 实时聚合，
// 不在 Project 上冗余存储。

import type { ProjectCollaborationType } from "@/features/project/lib/project-model";

// ── 建联漏斗状态 ────────────────────────────────────────────────────────
// 达人在某个项目里走到了哪一步。卡片上的「状态统计」直接数这个字段。
export type OutreachStage =
  | "not_contacted" // 待建联
  | "contacted" // 已建联
  | "negotiating" // 洽谈中
  | "confirmed" // 已确认 / 已签约
  | "shipping" // 寄样中
  | "content_review" // 内容制作 / 审稿中
  | "published" // 已发布
  | "settled" // 已结算
  | "declined" // 已拒绝（达人侧）
  | "dropped"; // 已流失（我方放弃）

// 主漏斗顺序（推进态）。declined / dropped 是终止态，不进主漏斗。
// 用于进度计算与卡片漏斗条渲染。
export const OUTREACH_FUNNEL: readonly OutreachStage[] = [
  "not_contacted",
  "contacted",
  "negotiating",
  "confirmed",
  "shipping",
  "content_review",
  "published",
  "settled",
] as const;

export const OUTREACH_STAGE_LABEL: Record<OutreachStage, string> = {
  not_contacted: "待建联",
  contacted: "已建联",
  negotiating: "洽谈中",
  confirmed: "已确认",
  shipping: "寄样中",
  content_review: "内容制作",
  published: "已发布",
  settled: "已结算",
  declined: "已拒绝",
  dropped: "已流失",
};

// 付款状态 —— 仅 paid / affiliate 合作有意义；gifted 用 "not_applicable"。
export type PaymentStatus = "not_applicable" | "pending" | "partial" | "paid";

// 达人「如何进入这个项目」。注意区别于 types/api.ts 的全局 CreatorSource
// （那记录达人如何进入达人库）—— 同名概念不同维度，故另起名字。
export type ProjectCreatorSource =
  | "top_recommended" // TOP 推荐
  | "favorited" // 用户收藏
  | "uploaded_list" // 自有名单上传
  | "platform_matched"; // 平台匹配

// 每个达人在本项目实际采用的合作方式 —— "" / "mixed" 是项目级概念，
// 落到具体达人时必然是三选一。
export type LinkCollaborationType = Exclude<ProjectCollaborationType, "" | "mixed">;

// 单条已发布内容及其表现数据。
export interface Deliverable {
  id: string;
  url: string;
  format: string; // 对应 Project.contentFormats 里的取值
  publishedAt: string;
  impressions: number;
  engagements: number;
  conversions: number;
}

// 寄样信息 —— gifted、以及含寄样的 paid 合作填写。
export interface LinkShippingInfo {
  trackingNo: string;
  shippedAt: string;
  address: string;
}

export interface ProjectCreatorLink {
  id: string;
  projectId: string;
  creatorId: string; // 指向全局达人库，不复制档案字段

  source: ProjectCreatorSource;
  stage: OutreachStage;
  collaborationType: LinkCollaborationType;

  // ── 商务 ──
  quote: number | null; // 一口价报价（paid）
  currency: string | null;
  commissionRate: number | null; // 佣金率 0–1（affiliate）
  affiliateLink: string | null;
  discountCode: string | null;
  paymentStatus: PaymentStatus;

  // ── 寄样 ──
  shipping: LinkShippingInfo | null;

  // ── 产出 ──
  deliverables: Deliverable[];

  // ── 跟进 ──
  nextAction: string; // 下一步动作；"" = 无
  lastContactAt: string;
  notes: string;

  addedAt: string;
  updatedAt: string;
}

// ── 派生统计 ────────────────────────────────────────────────────────────
// 项目卡片 / 详情上的「状态统计」「预算消耗」「实际效果」全部由这里实时聚合。
// 单一数据源（links），杜绝与 Project 上冗余字段不一致。
export interface ProjectStats {
  totalCreators: number;
  funnel: Record<OutreachStage, number>;
  budgetAllocated: number; // Σ quote
  budgetSpent: number; // Σ 已结算（paymentStatus === "paid"）的 quote
  actual: {
    impressions: number;
    engagements: number;
    conversions: number;
  };
  progress: number; // 0–1，推进态达人的平均漏斗完成度
}

function emptyFunnel(): Record<OutreachStage, number> {
  return {
    not_contacted: 0,
    contacted: 0,
    negotiating: 0,
    confirmed: 0,
    shipping: 0,
    content_review: 0,
    published: 0,
    settled: 0,
    declined: 0,
    dropped: 0,
  };
}

export function deriveProjectStats(links: readonly ProjectCreatorLink[]): ProjectStats {
  const funnel = emptyFunnel();
  let budgetAllocated = 0;
  let budgetSpent = 0;
  const actual = { impressions: 0, engagements: 0, conversions: 0 };

  for (const link of links) {
    funnel[link.stage] += 1;

    if (link.quote) {
      budgetAllocated += link.quote;
      if (link.paymentStatus === "paid") {
        budgetSpent += link.quote;
      }
    }

    for (const deliverable of link.deliverables) {
      actual.impressions += deliverable.impressions;
      actual.engagements += deliverable.engagements;
      actual.conversions += deliverable.conversions;
    }
  }

  // 进度 = 每个推进态达人「走到第几档 / 总档数」对所有人取均值。
  const activeLinks = links.filter((link) => link.stage !== "declined" && link.stage !== "dropped");
  const progress =
    activeLinks.length === 0
      ? 0
      : activeLinks.reduce((sum, link) => {
          const reached = OUTREACH_FUNNEL.indexOf(link.stage) + 1;
          return sum + reached / OUTREACH_FUNNEL.length;
        }, 0) / activeLinks.length;

  return { totalCreators: links.length, funnel, budgetAllocated, budgetSpent, actual, progress };
}
