"use client";

import { useMemo } from "react";

import { useOutreachState } from "@/features/outreach/components/outreach-state-context";
import type { Placement } from "@/features/outreach/data/board-placements";

import { getPlacementsByHandle } from "./registry";

// 抽屉里"投放数据"段落的取数 hook。把：
//   1. mock 投放（PLACEMENTS）
//   2. 用户通过"添加追踪"录入的 addedPlacements
//   3. 软删过滤（isPlacementDeleted）
// 收敛到一处，调用方（tab-overview）不再自己拼。
//
// 返回值是不可变快照 —— addedPlacements 变化时会重新计算。
export function useCreatorPlacements(handle: string): Placement[] {
  const { addedPlacements, isPlacementDeleted } = useOutreachState();
  return useMemo(() => {
    const fromMock = getPlacementsByHandle(handle);
    const normalized = handle.trim().startsWith("@") ? handle.trim() : `@${handle.trim()}`;
    const fromAdded = addedPlacements.filter((p) => p.creatorHandle === normalized);
    return [...fromAdded, ...fromMock].filter((p) => !isPlacementDeleted(p.id));
  }, [handle, addedPlacements, isPlacementDeleted]);
}
