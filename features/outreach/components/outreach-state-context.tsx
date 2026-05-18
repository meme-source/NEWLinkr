"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import type { OutreachCreator } from "@/features/outreach/data/outreach-types";
import type { Placement, PlacementCollabPhase } from "@/features/outreach/data/board-placements";
import { buildTrackedCreator } from "@/features/outreach/lib/tracked-creator";
import type { CollaborationStatus, Creator, CreatorCategory } from "@/types/api";

// §3.2 / §3.3 跨子组件共享的"建联看板状态覆盖"。
// 建联看板和档期日历共用同一份 OUTREACH_CREATORS mock 数据；当用户在
// 看板表格 / 当日面板的下拉里改状态时，需要让另一边也立刻看到新值。
// 这层 context 维护一个 statusOverrides 字典：creatorId → 用户改过的状态。
// 子组件读时统一通过 resolveStatus(creator) 拿"考虑了 override 的最终状态"。
//
// 2026-05-07：投放卡片改版后，自动识别状态（增长中 / 稳定中 / 下降中）由
// 数据监测产生，不可由用户手动改写；保留下来的"用户行为"是：
//   - 暂停 / 恢复 → isPlacementPaused / togglePlacementPaused
//   - 删除（软删） → isPlacementDeleted / setPlacementDeleted
//   - 刷新       → lastRefreshedAt / refreshPlacements
// 由此 placementStatusOverride 已彻底移除。
//
// Phase 0 mock 阶段，覆盖只活在 React 状态里；Phase 1+ 接入真实 service 时，
// 把 setStatusOverride 替换为 service 调用 + invalidate query 即可，子组件
// 不需要改。
interface OutreachStateValue {
  resolveStatus: (creator: OutreachCreator) => CollaborationStatus;
  setStatusOverride: (creatorId: string, next: CollaborationStatus) => void;
  // 编辑发文时间。null = 清空。Phase 1+ 接入 service 时替换实现。
  resolvePublishAt: (creator: OutreachCreator) => string | undefined;
  setPublishOverride: (creatorId: string, next: string | null) => void;
  // 投放卡片：用户主动暂停（区别于自动识别的 status）。
  isPlacementPaused: (placementId: string) => boolean;
  togglePlacementPaused: (placementId: string) => void;
  // 投放卡片：软删。命中的 id 会被父级 grid 与抽屉过滤掉。
  isPlacementDeleted: (placementId: string) => boolean;
  setPlacementDeleted: (placementId: string) => void;
  // 投放卡片：用户在 ⋯ 菜单手动标记「已完成」（区别于自动识别的趋势 status）。
  isPlacementCompleted: (placementId: string) => boolean;
  markPlacementCompleted: (placementId: string) => void;
  // 投放卡片：刷新时间戳，未刷新过则为 null。卡片网格头部据此显示
  // "YYYY-MM-DD HH:mm 更新"。
  lastRefreshedAt: Date | null;
  refreshPlacements: () => void;
  // 用户通过"添加追踪"入口手动录入的投放记录。Phase 0 mock 阶段只活在内存里；
  // Phase 1+ 接入 service 时改为 service.createPlacement(input) + invalidate。
  // 网格按 addedPlacements 在前 / mock PLACEMENTS 在后的顺序合并展示。
  addedPlacements: Placement[];
  addPlacement: (input: AddPlacementInput) => void;
  // 「投放追踪」弹窗录入的博主（候选 / 合作）同步进博主库 —— 博主库表格
  // 把它们并到 getCreators() 之前展示。
  addedCreators: Creator[];
}

// 「投放追踪」表单的入参。从一条 TikTok 视频链接录入；链接里能解析到博主
// handle，其余博主信息由调用方（drawer 已知 / grid 由 mock 解析）补齐。
export interface AddPlacementInput {
  projectId: string;
  postUrl: string;
  // 合作生命周期：candidate = 仅观察的候选；collaborating = 已确认合作。
  collabPhase: PlacementCollabPhase;
  // 合作费用（USD）；候选阶段为 0。
  spendUsd: number;
  // 追踪周期（天）。
  trackingPeriodDays?: number;
  // 约定发布时间 / 追踪截止时间（仅合作阶段录入）。
  publishAt?: string;
  trackingEndsAt?: string;
  creatorHandle: string;
  creatorName: string;
  creatorAvatarUrl: string;
  creatorFollowers: number;
  creatorCategory: CreatorCategory;
  creatorProfileUrl: string;
}

const OutreachStateContext = createContext<OutreachStateValue | null>(null);

export function OutreachStateProvider({ children }: { children: React.ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, CollaborationStatus>>({});
  const [publishOverrides, setPublishOverrides] = useState<Record<string, string | null>>({});
  const [pausedSet, setPausedSet] = useState<ReadonlySet<string>>(() => new Set());
  const [deletedSet, setDeletedSet] = useState<ReadonlySet<string>>(() => new Set());
  const [completedSet, setCompletedSet] = useState<ReadonlySet<string>>(() => new Set());
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [addedPlacements, setAddedPlacements] = useState<readonly Placement[]>([]);
  const [addedCreators, setAddedCreators] = useState<readonly Creator[]>([]);

  const resolveStatus = useCallback(
    (creator: OutreachCreator): CollaborationStatus => overrides[creator.id] ?? creator.status,
    [overrides],
  );

  const setStatusOverride = useCallback((creatorId: string, next: CollaborationStatus) => {
    setOverrides((prev) => ({ ...prev, [creatorId]: next }));
    console.info("outreach status", { creatorId, status: next });
  }, []);

  const resolvePublishAt = useCallback(
    (creator: OutreachCreator): string | undefined => {
      const override = publishOverrides[creator.id];
      if (override === null) return undefined;
      return override ?? creator.scheduledPublishAt;
    },
    [publishOverrides],
  );

  const setPublishOverride = useCallback((creatorId: string, next: string | null) => {
    setPublishOverrides((prev) => ({ ...prev, [creatorId]: next }));
    console.info("outreach publishAt", { creatorId, publishAt: next });
  }, []);

  const isPlacementPaused = useCallback(
    (placementId: string): boolean => pausedSet.has(placementId),
    [pausedSet],
  );

  const togglePlacementPaused = useCallback((placementId: string) => {
    setPausedSet((prev) => {
      const next = new Set(prev);
      if (next.has(placementId)) next.delete(placementId);
      else next.add(placementId);
      console.info("placement paused", { placementId, paused: next.has(placementId) });
      return next;
    });
  }, []);

  const isPlacementDeleted = useCallback(
    (placementId: string): boolean => deletedSet.has(placementId),
    [deletedSet],
  );

  const setPlacementDeleted = useCallback((placementId: string) => {
    setDeletedSet((prev) => {
      if (prev.has(placementId)) return prev;
      const next = new Set(prev);
      next.add(placementId);
      console.info("placement deleted", { placementId });
      return next;
    });
  }, []);

  const isPlacementCompleted = useCallback(
    (placementId: string): boolean => completedSet.has(placementId),
    [completedSet],
  );

  const markPlacementCompleted = useCallback((placementId: string) => {
    setCompletedSet((prev) => {
      if (prev.has(placementId)) return prev;
      const next = new Set(prev);
      next.add(placementId);
      console.info("placement completed", { placementId });
      return next;
    });
  }, []);

  const refreshPlacements = useCallback(() => {
    const now = new Date();
    setLastRefreshedAt(now);
    console.info("placement refresh", { at: now.toISOString() });
  }, []);

  const addPlacement = useCallback((input: AddPlacementInput) => {
    const id = `p-user-${Date.now().toString(36)}`;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    // Phase 0 mock：刚录入的投放尚未抓到任何监测数据，所以播放 / 互动指标全部为 0，
    // 状态默认"稳定中"（曲线无法判断方向）。Phase 1+ 接入真实抓取后这里只下发
    // creator + url + spend，service 端拉数据回填。
    const placeholder: Placement = {
      id,
      projectId: input.projectId,
      creatorHandle: input.creatorHandle,
      creatorName: input.creatorName,
      creatorAvatarUrl: input.creatorAvatarUrl,
      platform: "TikTok",
      creatorCategory: input.creatorCategory,
      creatorFollowers: input.creatorFollowers,
      creatorProfileUrl: input.creatorProfileUrl,
      postedAt: `${yyyy}-${mm}-${dd}`,
      status: "稳定中",
      collabPhase: input.collabPhase,
      spendUsd: input.spendUsd,
      postUrl: input.postUrl,
      trackingPeriodDays: input.trackingPeriodDays,
      publishAt: input.publishAt,
      trackingEndsAt: input.trackingEndsAt,
      views: 0,
      er: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      favorites: 0,
      viewsTrend7d: Array.from({ length: 7 }, () => 0),
      viewsTrend30d: Array.from({ length: 30 }, () => 0),
    };
    setAddedPlacements((prev) => [placeholder, ...prev]);
    // 候选 / 合作博主同步进博主库。
    const trackedCreator = buildTrackedCreator({
      handle: input.creatorHandle,
      name: input.creatorName,
      avatar: input.creatorAvatarUrl,
      followers: input.creatorFollowers,
      category: input.creatorCategory,
      projectId: input.projectId,
      profileUrl: input.creatorProfileUrl,
      phase: input.collabPhase,
    });
    setAddedCreators((prev) => [trackedCreator, ...prev]);
    setLastRefreshedAt(today);
    console.info("placement added", {
      id,
      postUrl: input.postUrl,
      creatorHandle: input.creatorHandle,
      collabPhase: input.collabPhase,
    });
  }, []);

  const value = useMemo<OutreachStateValue>(
    () => ({
      resolveStatus,
      setStatusOverride,
      resolvePublishAt,
      setPublishOverride,
      isPlacementPaused,
      togglePlacementPaused,
      isPlacementDeleted,
      setPlacementDeleted,
      isPlacementCompleted,
      markPlacementCompleted,
      lastRefreshedAt,
      refreshPlacements,
      addedPlacements: addedPlacements as Placement[],
      addPlacement,
      addedCreators: addedCreators as Creator[],
    }),
    [
      resolveStatus,
      setStatusOverride,
      resolvePublishAt,
      setPublishOverride,
      isPlacementPaused,
      togglePlacementPaused,
      isPlacementDeleted,
      setPlacementDeleted,
      isPlacementCompleted,
      markPlacementCompleted,
      lastRefreshedAt,
      refreshPlacements,
      addedPlacements,
      addPlacement,
      addedCreators,
    ],
  );

  return <OutreachStateContext.Provider value={value}>{children}</OutreachStateContext.Provider>;
}

// Hook 默认在 provider 缺失时回落到只读模式：resolveStatus 直接读 creator.status，
// setStatusOverride 是 noop。这样 BoardProgress 等组件在未挂 provider 的环境
// （旧测试 / Storybook）下也能渲染。
export function useOutreachState(): OutreachStateValue {
  const ctx = useContext(OutreachStateContext);
  if (!ctx) {
    return {
      resolveStatus: (creator) => creator.status,
      setStatusOverride: () => {},
      resolvePublishAt: (creator) => creator.scheduledPublishAt,
      setPublishOverride: () => {},
      isPlacementPaused: () => false,
      togglePlacementPaused: () => {},
      isPlacementDeleted: () => false,
      setPlacementDeleted: () => {},
      isPlacementCompleted: () => false,
      markPlacementCompleted: () => {},
      lastRefreshedAt: null,
      refreshPlacements: () => {},
      addedPlacements: [],
      addPlacement: () => {},
      addedCreators: [],
    };
  }
  return ctx;
}
