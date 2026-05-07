"use client";

import { Mail, Trash2 } from "lucide-react";
import type { CollaborationStatus } from "@/types/api";
import type { WorkspaceProject } from "@/features/project/components/project-context";
import { cn } from "@/lib/utils";
import {
  BulkProjectAction,
  BulkStatusAction,
  BulkTagsAction,
  BulkTrackAction,
} from "./library-bulk-actions";

interface Props {
  count: number;
  // 数据/上下文
  availableUserTags: string[];
  projects: WorkspaceProject[];
  currentProjectId: string;
  // 全部博主视角下没有单一项目可作用，改状态需要禁用
  isAllProjectsScope: boolean;
  // 动作
  onOutreach: () => void;
  onAddUserTags: (tags: string[]) => void;
  onMoveToProject: (projectId: string) => void;
  onChangeStatus: (status: CollaborationStatus) => void;
  onAddToTracking: () => void;
  onOpenTrackingBoard: () => void;
  onTrash: () => void;
  onClear: () => void;
}

export function LibraryBulkBar(props: Props) {
  if (props.count === 0) return null;
  return (
    <div className="sticky bottom-4 z-30 mx-auto flex w-fit items-center gap-2 rounded-full border border-[#c5c0b1] bg-[#fffefb] px-3 py-2">
      <span className="text-[12px] text-[#36342e]">
        已选 <span className="font-semibold text-[#201515]">{props.count}</span> 位博主
      </span>
      <span className="h-4 w-px bg-[#c5c0b1]" />

      <PrimaryAction onClick={props.onOutreach}>
        <Mail className="h-3.5 w-3.5" />
        建联
      </PrimaryAction>

      <BulkProjectAction
        creatorCount={props.count}
        projects={props.projects}
        currentProjectId={props.currentProjectId}
        onApply={props.onMoveToProject}
      />

      <BulkTagsAction
        creatorCount={props.count}
        availableUserTags={props.availableUserTags}
        onApply={props.onAddUserTags}
      />

      <BulkStatusAction
        creatorCount={props.count}
        disabled={props.isAllProjectsScope}
        disabledHint="切换到具体项目后可批量改状态"
        onApply={props.onChangeStatus}
      />

      <BulkTrackAction
        creatorCount={props.count}
        onApply={props.onAddToTracking}
        onOpenBoard={props.onOpenTrackingBoard}
      />

      <button
        type="button"
        onClick={props.onTrash}
        aria-label="加入回收站"
        className="inline-flex items-center rounded-full border border-[#fdf2f2] bg-[#fffefb] p-1.5 text-[#b00020] transition-colors hover:bg-[#fdf2f2]"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={props.onClear}
        className="text-[12px] text-[#939084] hover:text-[#36342e]"
      >
        取消
      </button>
    </div>
  );
}

function PrimaryAction({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
        "bg-[#ff4f00] text-[#fffefb] hover:bg-[#ff4f00]",
      )}
    >
      {children}
    </button>
  );
}
