// 入口 re-export，保持现有 import 路径稳定。
// 真正的实现在 ./drawer/* 中拆分。
//
// 2026-05-07：抽屉收敛到"Creator 单一形态"。调用方应通过
// useCreatorProfile().openCreatorProfile(...) 触发，不要直接渲染本组件。
"use client";

import type { CollaborationStatus, Creator } from "@/types/api";
import { DrawerShell } from "./drawer/drawer-shell";

interface Props {
  creator: Creator | null;
  onClose: () => void;
  onChangeCollaborationStatus?: (
    creatorId: string,
    projectId: string,
    next: CollaborationStatus,
  ) => void;
}

export function CreatorProfileDrawer({ creator, onClose, onChangeCollaborationStatus }: Props) {
  return (
    <DrawerShell
      data={creator}
      onClose={onClose}
      onChangeCollaborationStatus={onChangeCollaborationStatus}
    />
  );
}
