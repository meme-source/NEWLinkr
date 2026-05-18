"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import type { CollaborationStatus, Creator, Rating } from "@/types/api";
import { deriveFavorited } from "@/lib/creator";

// 博主"用户编辑后的覆盖值"内存存储。
// 覆盖优先级高于 mock 数据：博主库表格 + 抽屉同时订阅本 store，
// 抽屉「合作复盘」点击「更新」、或抽屉里改合作状态后写入此处，表格立即同步。
//
// Phase 2 接入真实后端时整体替换为 service 调用 + SWR 缓存，
// 这层覆盖映射可直接删除（消费方改为读 server state）。

type CollabId = string;
type CreatorId = string;
type ProjectId = string;

interface CreatorOverride {
  rating?: Rating;
  collabNotes?: Record<CollabId, string>;
  // 某博主在某项目下的合作状态覆盖，按 projectId 索引。
  collabStatuses?: Record<ProjectId, CollaborationStatus>;
}

interface CreatorOverridesContextValue {
  // 给单个 creator 应用覆盖：rating 字段、collaborations[i].notes / status。
  applyOverrides: (creator: Creator) => Creator;
  // 一次性提交合作复盘：评级 + 备注同时写入。
  commitCompletionReview: (input: {
    creatorId: CreatorId;
    collabId: CollabId;
    rating: Rating;
    notes: string;
  }) => void;
  // 仅更新博主整体评级（抽屉头部点击星星走这条）。
  setCreatorRating: (creatorId: CreatorId, rating: Rating) => void;
  // 改某博主在某项目下的合作状态（抽屉里「合作中 → 已完成」等切换走这条）。
  setCollaborationStatus: (
    creatorId: CreatorId,
    projectId: ProjectId,
    status: CollaborationStatus,
  ) => void;
  // 软删除：批量把博主加入「已删除」集合。表格层调 isDeleted() 过滤掉它们。
  // mock 阶段不真正删 SEED；Phase 2 接 services/library.ts 的 trash() 落库。
  deleteCreators: (ids: CreatorId[]) => void;
  isDeleted: (id: CreatorId) => boolean;
}

const CreatorOverridesContext = createContext<CreatorOverridesContextValue | null>(null);

export function CreatorOverridesProvider({ children }: { children: React.ReactNode }) {
  const [overrides, setOverrides] = useState<Record<CreatorId, CreatorOverride>>({});
  const [deletedIds, setDeletedIds] = useState<Set<CreatorId>>(() => new Set());

  const deleteCreators = useCallback((ids: CreatorId[]) => {
    if (ids.length === 0) return;
    setDeletedIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.add(id);
      return next;
    });
  }, []);

  const isDeleted = useCallback((id: CreatorId) => deletedIds.has(id), [deletedIds]);

  const setCreatorRating = useCallback((creatorId: CreatorId, rating: Rating) => {
    setOverrides((prev) => ({
      ...prev,
      [creatorId]: { ...prev[creatorId], rating },
    }));
  }, []);

  const setCollaborationStatus = useCallback<
    CreatorOverridesContextValue["setCollaborationStatus"]
  >((creatorId, projectId, status) => {
    setOverrides((prev) => {
      const current = prev[creatorId] ?? {};
      return {
        ...prev,
        [creatorId]: {
          ...current,
          collabStatuses: { ...(current.collabStatuses ?? {}), [projectId]: status },
        },
      };
    });
  }, []);

  const commitCompletionReview = useCallback<
    CreatorOverridesContextValue["commitCompletionReview"]
  >(({ creatorId, collabId, rating, notes }) => {
    setOverrides((prev) => {
      const current = prev[creatorId] ?? {};
      const nextNotes = { ...(current.collabNotes ?? {}), [collabId]: notes };
      return {
        ...prev,
        [creatorId]: { ...current, rating, collabNotes: nextNotes },
      };
    });
  }, []);

  const applyOverrides = useCallback<CreatorOverridesContextValue["applyOverrides"]>(
    (creator) => {
      const o = overrides[creator.id];
      if (!o) return creator;
      const { collabNotes, collabStatuses } = o;
      const collaborations =
        collabNotes || collabStatuses
          ? creator.collaborations.map((collab) => {
              let next = collab;
              if (collabNotes && collabNotes[collab.id] !== undefined) {
                next = { ...next, notes: collabNotes[collab.id] };
              }
              if (collabStatuses && collabStatuses[collab.projectId] !== undefined) {
                next = { ...next, status: collabStatuses[collab.projectId] };
              }
              return next;
            })
          : creator.collaborations;
      return {
        ...creator,
        rating: o.rating ?? creator.rating,
        collaborations,
        // 改了合作状态后，收藏（红心）跟着重新判定 —— 与 lib/creator.ts 同一规则。
        favorited: deriveFavorited(collaborations),
      };
    },
    [overrides],
  );

  const value = useMemo<CreatorOverridesContextValue>(
    () => ({
      applyOverrides,
      commitCompletionReview,
      setCreatorRating,
      setCollaborationStatus,
      deleteCreators,
      isDeleted,
    }),
    [
      applyOverrides,
      commitCompletionReview,
      setCreatorRating,
      setCollaborationStatus,
      deleteCreators,
      isDeleted,
    ],
  );

  return (
    <CreatorOverridesContext.Provider value={value}>{children}</CreatorOverridesContext.Provider>
  );
}

// Provider 之外（独立 demo / 故事书）使用时返回恒等覆盖，避免组件爆炸。
const NOOP_VALUE: CreatorOverridesContextValue = {
  applyOverrides: (c) => c,
  commitCompletionReview: () => {},
  setCreatorRating: () => {},
  setCollaborationStatus: () => {},
  deleteCreators: () => {},
  isDeleted: () => false,
};

export function useCreatorOverrides(): CreatorOverridesContextValue {
  return useContext(CreatorOverridesContext) ?? NOOP_VALUE;
}
