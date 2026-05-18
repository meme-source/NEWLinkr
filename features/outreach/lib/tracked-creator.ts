// §3.3 把「投放追踪」弹窗录入的博主同步成一条完整 Creator —— 让候选 / 合作
// 博主进入博主库。candidate 阶段在库里映射为合作状态「待评估」(pending)，
// collaborating / completed 则映射成对应的 CollaborationStatus。
//
// Phase 1+ 接入真实后端时，这里整体由 service.createCreator(input) 取代。

import type { CollaborationStatus, Creator, CreatorCategory } from "@/types/api";
import type { PlacementCollabPhase } from "@/features/outreach/data/board-placements";

export interface TrackedCreatorInput {
  handle: string; // 形如 "@xxx"
  name: string;
  avatar: string | null;
  followers: number;
  category: CreatorCategory;
  projectId: string;
  profileUrl: string;
  phase: PlacementCollabPhase;
}

function todayIso(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// 合作生命周期 → 博主库里的合作状态。
const PHASE_TO_STATUS: Record<PlacementCollabPhase, CollaborationStatus> = {
  candidate: "pending",
  collaborating: "collaborating",
  completed: "completed",
};

export function buildTrackedCreator(input: TrackedCreatorInput): Creator {
  const today = todayIso();
  const slug = input.handle.replace(/^@/, "").toLowerCase();
  const id = `tracked-${slug}-${Date.now().toString(36)}`;
  const isCandidate = input.phase === "candidate";

  return {
    id,
    handle: input.handle,
    name: input.name,
    platform: "tiktok",
    avatar: input.avatar,
    region: "—",
    followers: input.followers,
    medianViews: 0,
    engagementRate: 0,
    estimatedPrice: null,
    emailStatus: "missing",
    recentActiveAt: null,
    rating: 1,
    source: "plugin",
    category: input.category,
    topics: [],
    userTags: isCandidate ? ["候选"] : [],
    lastContactAt: null,
    lastResponseAt: null,
    lastEmailOpenedAt: null,
    nextFollowUp: null,
    addedAt: today,
    emails: [],
    dms: [],
    socialLinks: [{ platform: "tiktok", url: input.profileUrl }],
    manualContactName: null,
    rateCard: null,
    paymentTerms: null,
    usageRights: null,
    manager: null,
    collaborations: [
      {
        id: `collab-${id}`,
        projectId: input.projectId,
        status: PHASE_TO_STATUS[input.phase],
        joinedAt: today,
        lastContactAt: null,
        trackedContentIds: [],
        method: null,
        budget: null,
        finalPrice: null,
        notes: isCandidate
          ? "从社媒链接提取的候选博主，尚未决定合作。"
          : "通过「投放追踪」录入的合作博主。",
      },
    ],
    recentPosts: [],
    audienceAnalysis: null,
    favorited: false,
    lastRefreshedAt: null,
  };
}
