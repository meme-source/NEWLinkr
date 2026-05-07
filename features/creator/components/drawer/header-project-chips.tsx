"use client";

import { Plus } from "lucide-react";

import { CollaborationStatusCell } from "@/features/creator/components/collaboration-status-cell";
import { useWorkspaceProject } from "@/features/project/components/project-context";
import type { CollaborationStatus, Creator } from "@/types/api";

interface Props {
  creator: Creator;
  // 抽屉外层注入。给定时每个 chip 的状态可下拉编辑。
  onChangeCollaborationStatus?: (
    creatorId: string,
    projectId: string,
    next: CollaborationStatus,
  ) => void;
}

// 抽屉 header 第 3 行：博主当前所属项目的 chip 列。
// 每个 chip = 项目名 + 该项目下的状态下拉。多项目并存时全部展示。
// 0 项目时显示「未加入项目」+ 新增按钮（按钮 Phase 2 接入）。
export function HeaderProjectChips({ creator, onChangeCollaborationStatus }: Props) {
  const { resolveProjectName } = useWorkspaceProject();
  const collabs = creator.collaborations;

  if (collabs.length === 0) {
    return (
      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="text-[#939084]">尚未加入任何项目</span>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#c5c0b1] px-2 py-0.5 text-[#36342e] transition-colors hover:border-[#ff4f00] hover:text-[#ff4f00]"
        >
          <Plus className="h-3 w-3" />
          加入项目
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {collabs.map((collab) => {
        const onChange = onChangeCollaborationStatus
          ? (next: CollaborationStatus) =>
              onChangeCollaborationStatus(creator.id, collab.projectId, next)
          : undefined;
        return (
          <div
            key={collab.id}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#c5c0b1] bg-[#fffefb] py-0.5 pr-1 pl-2 text-[11px]"
          >
            <span className="font-medium text-[#36342e]">
              {resolveProjectName(collab.projectId)}
            </span>
            <span className="text-[#939084]" aria-hidden>
              ·
            </span>
            <CollaborationStatusCell value={collab.status} onChange={onChange} compact />
          </div>
        );
      })}
      <button
        type="button"
        aria-label="加入项目"
        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-[#c5c0b1] text-[#939084] transition-colors hover:border-[#ff4f00] hover:text-[#ff4f00]"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}
