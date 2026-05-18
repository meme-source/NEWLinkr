// Creator registry — 全项目唯一的"博主数据"解析入口。
//
// 核心规则（2026-05-07 加固）：
//   ★ 只有"已入库"的博主才能弹出信息卡。"已入库"的判定优先级：
//       1. 博主库 mock（features/creator/data/mock.ts）—— 完整 Creator
//       2. 建联表（OUTREACH_CREATORS）+ 投放表（PLACEMENTS）—— 同一份后端数据
//          的另一面，记录已存在但字段稀疏，按 mock 合并合成完整 Creator
//   ★ 不在以上任何一处的 handle（典型场景：博主发现里 AI 即时推送的搜索结
//      果，用户尚未点收藏入库）—— resolveCreator 返回 null，调用方拿到 null
//      时不应弹出抽屉。这条规则把"未入库 → 没有信息卡"做成强约束，避免任何
//      入口靠捏造数据强行渲染。
//
// CreatorResolverInput 的 fallback 字段只用于在第 2 层合成时补齐细节
// （region / topics 等可视化字段），而不是"无中生有"地把陌生 handle 升级
// 为可弹出的博主。
//
// 真实后端接通时（NEXT_PUBLIC_USE_MOCK=false），这一层换成 fetch；UI 不改。

import type { Collaboration, Creator, CreatorCategory, Platform } from "@/types/api";
import type { Placement } from "@/features/outreach/data/board-placements";
import type { OutreachCreator } from "@/features/outreach/data/outreach-types";
import { PLACEMENTS } from "@/features/outreach/data/board-placements";
import { OUTREACH_CREATORS } from "@/features/outreach/data/outreach-creators";
import { getCreators } from "./index";

// ── 解析入参 ─────────────────────────────────────────────────────────────────
// 第 3 项额外接受 linkr-discovery-bundle 里 discovery 列表传过来的"宽对象"
// （name / avatarUrl / region / followers / er / platform / tags 都是 optional），
// 让 TS 通过 excess-property check；运行时 resolveCreator 仍然只看 handle，
// 走 destination 的"未入库 → null"规则，不会因为这些 hint 字段而强行弹卡。
export type CreatorResolverInput =
  | Creator
  | { id: string }
  | {
      handle: string;
      fallback?: CreatorFallback;
      name?: string;
      avatarUrl?: string;
      region?: string;
      // Bundle's discovery passes pre-formatted display strings here ("1.2M", "5.2%"),
      // so the permissive form accepts either a raw number or the display string.
      followers?: number | string;
      er?: number | string;
      platform?: Platform;
      tags?: string[];
    };

export interface CreatorFallback {
  name?: string;
  avatar?: string | null;
  region?: string;
  platform?: Platform;
  followers?: number;
  engagementRate?: number;
  category?: CreatorCategory;
  topics?: string[];
}

// 判断 input 是否就是一个完整 Creator。Creator 必有 id + handle + collaborations。
function isCreator(input: CreatorResolverInput): input is Creator {
  return (
    typeof (input as Creator).id === "string" &&
    typeof (input as Creator).handle === "string" &&
    Array.isArray((input as Creator).collaborations)
  );
}

// ── 直接查询 ─────────────────────────────────────────────────────────────────

export function getCreatorById(id: string): Creator | null {
  return getCreators().find((c) => c.id === id) ?? null;
}

export function getCreatorByHandle(handle: string, fallback?: CreatorFallback): Creator | null {
  const normalized = normalizeHandle(handle);
  const lib = getCreators().find((c) => normalizeHandle(c.handle) === normalized);
  // 命中博主库 → 直接返回完整 Creator。注意此时 fallback 必须丢弃 ——
  // 调用方传过来的 hint（投放卡的稀疏字段）可能比博主库里的真实字段更陈旧 /
  // 不准确，让真实数据胜出，这样无论从哪个入口点进来都显示同一份卡。
  if (lib) return lib;
  return synthesizeFromOutreach(normalized, fallback);
}

// ── 合成（仅当 handle 已在建联 / 投放表里出现） ─────────────────────────────
//
// 这两张表本身就是"已入库"的博主在另一处的镜像。命中即合成完整 Creator。
// 没命中说明该 handle 根本不在 DB —— 不合成。
function synthesizeFromOutreach(handle: string, fallback?: CreatorFallback): Creator | null {
  const outreach = OUTREACH_CREATORS.find((o) => normalizeHandle(o.handle) === handle);
  const placement = PLACEMENTS.find((p) => normalizeHandle(p.creatorHandle) === handle);
  if (!outreach && !placement) return null;
  return buildSyntheticCreator({ outreach, placement, handle, fallback });
}

function buildSyntheticCreator(input: {
  outreach?: OutreachCreator;
  placement?: Placement;
  handle: string;
  fallback?: CreatorFallback;
}): Creator {
  const { outreach, placement, handle, fallback } = input;
  const id = outreach?.id ?? deriveIdFromHandle(handle);
  const name = outreach?.name ?? placement?.creatorName ?? fallback?.name ?? handle;
  const avatar = placement?.creatorAvatarUrl ?? fallback?.avatar ?? defaultAvatarFor(handle);
  const followers = outreach?.followers ?? placement?.creatorFollowers ?? fallback?.followers ?? 0;
  const platform: Platform =
    mapPlacementPlatform(placement?.platform) ?? fallback?.platform ?? "tiktok";
  const collaborations: Collaboration[] = outreach
    ? [
        {
          id: `${outreach.id}-${outreach.projectId}`,
          projectId: outreach.projectId,
          status: outreach.status,
          joinedAt: placement?.postedAt ?? outreach.lastContact ?? "",
          lastContactAt: placement?.postedAt ?? null,
          trackedContentIds: [],
          method: placement?.spendUsd ? "paid" : null,
          budget: null,
          finalPrice: placement?.spendUsd ?? null,
          notes: "",
        },
      ]
    : [];
  return {
    id,
    handle,
    name,
    platform,
    avatar,
    region: fallback?.region ?? "—",
    followers,
    medianViews: 0,
    engagementRate: placement?.er ?? fallback?.engagementRate ?? 0,
    estimatedPrice: null,
    emailStatus: "missing",
    recentActiveAt: placement?.postedAt ?? null,
    rating: 1,
    source: "manual",
    category: placement?.creatorCategory ?? fallback?.category ?? "other",
    topics: fallback?.topics ?? [],
    userTags: [],
    lastContactAt: placement?.postedAt ?? null,
    lastResponseAt: null,
    lastEmailOpenedAt: null,
    nextFollowUp: outreach?.nextFollowUpAt ?? null,
    addedAt: placement?.postedAt ?? "",
    emails: [],
    dms: [{ platform, handle }],
    socialLinks: placement?.creatorProfileUrl
      ? [{ platform, url: placement.creatorProfileUrl }]
      : [],
    manualContactName: null,
    rateCard: null,
    paymentTerms: null,
    usageRights: null,
    manager: null,
    collaborations,
    // 合成博主默认无近期内容快照 / 受众分析 —— 抽屉显示空态。Phase 1+
    // 接通后端时由真实数据接口回填。
    recentPosts: [],
    audienceAnalysis: null,
    favorited: false,
    lastRefreshedAt: placement?.postedAt ? `${placement.postedAt}T08:30:00Z` : null,
  };
}

// ── 顶层解析：所有调用点都用它 ──────────────────────────────────────────────
//
// 返回 Creator | null：null 表示"未入库"，调用方应直接放弃打开抽屉。
//
// 优先级（必须严格保持，否则不同入口会弹出不一样的卡片）：
//   1. 博主库 mock（getCreators()）—— 命中即返回完整 Creator
//   2. 建联 / 投放表合成 —— 同一份后端数据的另一面
//   3. 都没命中 → null（未入库）
export function resolveCreator(input: CreatorResolverInput): Creator | null {
  if (isCreator(input)) {
    console.info("[creator-registry] resolved via direct Creator", {
      handle: input.handle,
      emails: input.emails.length,
      collaborations: input.collaborations.length,
      userTags: input.userTags.length,
    });
    return input;
  }
  if ("id" in input) {
    const found = getCreatorById(input.id);
    console.info("[creator-registry] resolved by id", {
      id: input.id,
      hit: Boolean(found),
    });
    return found;
  }
  const found = getCreatorByHandle(input.handle, input.fallback);
  const inLibrary = getCreators().some(
    (c) => c.handle.replace(/^@/, "") === input.handle.replace(/^@/, ""),
  );
  console.info("[creator-registry] resolved by handle", {
    handle: input.handle,
    layer: found ? (inLibrary ? "library" : "synth-from-outreach") : "null",
    emails: found?.emails.length ?? 0,
    collaborations: found?.collaborations.length ?? 0,
    userTags: found?.userTags.length ?? 0,
  });
  return found;
}

// ── 投放查询 ─────────────────────────────────────────────────────────────────

export function getPlacementsByHandle(handle: string): Placement[] {
  const normalized = normalizeHandle(handle);
  return PLACEMENTS.filter((p) => normalizeHandle(p.creatorHandle) === normalized);
}

// ── 工具 ─────────────────────────────────────────────────────────────────────

function normalizeHandle(handle: string): string {
  const trimmed = handle.trim();
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

function deriveIdFromHandle(handle: string): string {
  return handle.replace(/^@/, "").replace(/[^a-zA-Z0-9_]/g, "_");
}

function defaultAvatarFor(handle: string): string {
  const seed = handle.replace(/^@/, "");
  return `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(seed)}&backgroundColor=fdf0e8`;
}

function mapPlacementPlatform(p: Placement["platform"] | undefined): Platform | null {
  if (!p) return null;
  if (p === "TikTok") return "tiktok";
  if (p === "Instagram") return "instagram";
  return null;
}
