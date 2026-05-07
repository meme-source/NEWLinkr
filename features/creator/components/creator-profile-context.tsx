"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { CollaborationStatus, Creator } from "@/types/api";
import { resolveCreator, type CreatorResolverInput } from "@/features/creator/data/registry";
import { CreatorProfileDrawer } from "@/features/creator/components/creator-profile-drawer";

// 抽屉对外契约：openCreatorProfile 接收 Creator / { id } / { handle, fallback? }，
// 由 features/creator/data/registry.ts 解析为统一 Creator。这样不同入口
// （library / inbox / schedule / board）打开的都是同一份卡片。
//
// "未入库 → 没有信息卡"：resolveCreator 返回 null 时这里直接 noop。典型场景是
// 博主发现里 AI 即时推送的结果（用户未点收藏入库），不允许弹卡片。
interface Ctx {
  openCreatorProfile: (input: CreatorResolverInput) => void;
  closeCreatorProfile: () => void;
}

interface ProviderProps {
  children: React.ReactNode;
  onChangeCollaborationStatus?: (
    creatorId: string,
    projectId: string,
    next: CollaborationStatus,
  ) => void;
}

const CreatorProfileContext = createContext<Ctx | null>(null);

export function CreatorProfileProvider({ children, onChangeCollaborationStatus }: ProviderProps) {
  const [creator, setCreator] = useState<Creator | null>(null);

  const openCreatorProfile = useCallback((input: CreatorResolverInput) => {
    const resolved = resolveCreator(input);
    if (!resolved) return;
    setCreator(resolved);
  }, []);
  const closeCreatorProfile = useCallback(() => setCreator(null), []);

  const value = useMemo(
    () => ({ openCreatorProfile, closeCreatorProfile }),
    [openCreatorProfile, closeCreatorProfile],
  );

  return (
    <CreatorProfileContext.Provider value={value}>
      {children}
      <CreatorProfileDrawer
        creator={creator}
        onClose={closeCreatorProfile}
        onChangeCollaborationStatus={onChangeCollaborationStatus}
      />
    </CreatorProfileContext.Provider>
  );
}

export function useCreatorProfile(): Ctx {
  const ctx = useContext(CreatorProfileContext);
  if (!ctx) {
    // Silently noop outside the provider — avoids breaking isolated demos.
    return {
      openCreatorProfile: () => {},
      closeCreatorProfile: () => {},
    };
  }
  return ctx;
}
