"use client";

import {
  TrackingSetupDialog,
  type TrackingSetupPayload,
} from "@/features/outreach/components/tracking-setup-dialog";
import {
  useOutreachState,
  type AddPlacementInput,
} from "@/features/outreach/components/outreach-state-context";
import { useWorkspaceProject } from "@/features/project/components/project-context";
import type { CreatorCategory } from "@/types/api";

// §3.3 工作台侧「投放追踪」入口的薄包装。
//
// 真正的弹窗 UI 在 TrackingSetupDialog（props 驱动、与插件端共用）；这里只负责
// 把它接到 OutreachState：用户提交后构造 AddPlacementInput → addPlacement()，
// 网格 / 抽屉 / 博主库立即看到新卡片与候选博主。
//
// 入口有两个：
//   a) 投放表现 网格右上角「+ 投放追踪」—— 博主未知，从链接识别
//   b) 博主抽屉头部「投放追踪」          —— 博主已知，prefill 在 props 里

export interface AddPlacementCreatorPrefill {
  creatorHandle: string;
  creatorName: string;
  creatorAvatarUrl: string;
  creatorFollowers: number;
  creatorCategory: CreatorCategory;
  creatorProfileUrl: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  // 从博主抽屉调起时，博主信息已知，直接 prefill 跳过识别。
  prefill?: AddPlacementCreatorPrefill;
}

export function AddPlacementDialog({ open, onClose, prefill }: Props) {
  const { addPlacement } = useOutreachState();
  const { currentProject } = useWorkspaceProject();

  const handleSubmit = (payload: TrackingSetupPayload) => {
    // payload.creatorHandle 形如 "@xxx"，由弹窗从链接识别。
    const handleNoAt = payload.creatorHandle.replace(/^@/, "");
    const input: AddPlacementInput = {
      projectId: currentProject.id,
      postUrl: payload.postUrl,
      // 勾选「确认合作」= 合作中；否则 = 候选（仅观察）。
      collabPhase: payload.collaborating ? "collaborating" : "candidate",
      spendUsd: payload.spendUsd,
      trackingPeriodDays: payload.trackingPeriodDays,
      publishAt: payload.publishAt,
      trackingEndsAt: payload.trackingEndsAt,
      // prefill 优先；没 prefill 时用链接里识别出的 handle。
      creatorHandle: prefill?.creatorHandle ?? payload.creatorHandle,
      creatorName: prefill?.creatorName ?? handleNoAt,
      creatorAvatarUrl:
        prefill?.creatorAvatarUrl ??
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(handleNoAt)}`,
      creatorFollowers: prefill?.creatorFollowers ?? 0,
      creatorCategory: prefill?.creatorCategory ?? "other",
      creatorProfileUrl: prefill?.creatorProfileUrl ?? `https://www.tiktok.com/@${handleNoAt}`,
    };
    addPlacement(input);
  };

  return (
    <TrackingSetupDialog
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      projectName={currentProject.name}
    />
  );
}
