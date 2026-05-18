"use client";

import Image from "next/image";
import { Mail, Trash2 } from "lucide-react";
import type { CollaborationStatus, Creator } from "@/types/api";
import type { WorkspaceProject } from "@/features/project/components/project-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BulkProjectAction,
  BulkStatusAction,
  BulkTagsAction,
  BulkTrackAction,
} from "./library-bulk-actions";

interface Props {
  count: number;
  // 已选博主列表，用于左侧的头像堆叠展示（替代「已选 N 位博主」文字）。
  selected: Creator[];
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

// 选中博主后的批量操作条。位置：嵌在工具栏行的中间空隙（左侧按钮和右侧搜索框之间），
// 而非底部 sticky —— 避免遮挡列表内容。flex 容器会撑满剩余空间，水平居中显示。
export function LibraryBulkBar(props: Props) {
  if (props.count === 0) return null;
  return (
    <div className="flex w-full items-center justify-center gap-1.5 rounded-full border border-[#c5c0b1] bg-[#fffefb] px-3 py-1.5">
      <AvatarStack creators={props.selected} total={props.count} />
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

      <Button
        unstyled
        type="button"
        onClick={props.onTrash}
        aria-label="加入回收站"
        className="inline-flex items-center rounded-full border border-[#fdf2f2] bg-[#fffefb] p-1.5 text-[#b00020] transition-colors hover:bg-[#fdf2f2]"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>

      <Button
        unstyled
        type="button"
        onClick={props.onClear}
        className="text-[12px] text-[#939084] hover:text-[#36342e]"
      >
        取消
      </Button>
    </div>
  );
}

function PrimaryAction({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <Button
      unstyled
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
        "bg-[#ff4f00] text-[#fffefb] hover:bg-[#ff4f00]",
      )}
    >
      {children}
    </Button>
  );
}

// 已选博主头像堆叠：取前 3 个头像左右部分重叠，超过 3 显示 `+N`。
// 替代原来的「已选 N 位博主」文字，更直观地呈现批量选中数量。
const AVATAR_LIMIT = 3;
function AvatarStack({ creators, total }: { creators: Creator[]; total: number }) {
  const visible = creators.slice(0, AVATAR_LIMIT);
  const remaining = total - visible.length;
  return (
    <div className="flex items-center" aria-label={`已选 ${total} 位博主`}>
      <div className="flex -space-x-1.5">
        {visible.map((creator) => (
          <div
            key={creator.id}
            className="h-6 w-6 overflow-hidden rounded-full bg-[#fff7f4] ring-2 ring-[#fffefb]"
            title={creator.name}
          >
            {creator.avatar ? (
              <Image
                src={creator.avatar}
                alt={creator.name}
                width={24}
                height={24}
                className="h-6 w-6 object-cover"
                unoptimized
              />
            ) : (
              <span className="grid h-6 w-6 place-items-center text-[10px] font-medium text-[#36342e]">
                {initialsOf(creator.name)}
              </span>
            )}
          </div>
        ))}
        {remaining > 0 && (
          <div
            className="grid h-6 w-6 place-items-center rounded-full bg-[#eceae3] text-[10px] font-medium text-[#36342e] ring-2 ring-[#fffefb]"
            aria-label={`还有 ${remaining} 位博主`}
          >
            +{remaining}
          </div>
        )}
      </div>
    </div>
  );
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
