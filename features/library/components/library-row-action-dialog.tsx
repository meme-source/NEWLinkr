"use client";

import { FolderInput, Trash2 } from "lucide-react";
import type { Creator } from "@/types/api";
import type { WorkspaceProject } from "@/features/project/components/project-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// 两个二级动作弹层共用一个组件：UI 形态相近、状态由 page 持有。
// 这里只做"展示 + 触发回调"，不持有业务状态。
export type RowDialogState =
  | { kind: "move"; creator: Creator }
  | { kind: "trash"; creator: Creator }
  | null;

interface Props {
  state: RowDialogState;
  projects: WorkspaceProject[];
  currentProjectId: string;
  onClose: () => void;
  onMove: (projectId: string) => void;
  onTrash: () => void;
}

export function LibraryRowActionDialog({
  state,
  projects,
  currentProjectId,
  onClose,
  onMove,
  onTrash,
}: Props) {
  if (!state) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#201515]/40 px-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-[360px] rounded-lg border border-[#c5c0b1] bg-[#fffefb] p-5"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {state.kind === "move" ? (
          <MovePanel
            creator={state.creator}
            projects={projects}
            currentProjectId={currentProjectId}
            onPick={onMove}
            onClose={onClose}
          />
        ) : (
          <TrashPanel creator={state.creator} onConfirm={onTrash} onClose={onClose} />
        )}
      </div>
    </div>
  );
}

function MovePanel({
  creator,
  projects,
  currentProjectId,
  onPick,
  onClose,
}: {
  creator: Creator;
  projects: WorkspaceProject[];
  currentProjectId: string;
  onPick: (projectId: string) => void;
  onClose: () => void;
}) {
  // "全部博主" 视图下 currentProjectId === ALL_PROJECTS，candidates 自然包含全部具体项目；
  // 在具体项目视图下，过滤掉当前项目（移动到自己没意义）。
  const candidates = projects.filter((p) => p.id !== currentProjectId);
  return (
    <>
      <DialogHeader
        icon={<FolderInput className="h-4 w-4 text-[#ff4f00]" />}
        title="移动到项目"
        subtitle={`将 ${creator.name} 移到下面的项目中`}
      />
      {candidates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#c5c0b1] px-3 py-4 text-center text-[12px] text-[#939084]">
          暂无其他可选项目
        </div>
      ) : (
        <div className="max-h-[260px] space-y-1 overflow-y-auto">
          {candidates.map((project) => (
            <Button
              unstyled
              key={project.id}
              type="button"
              onClick={() => onPick(project.id)}
              className="flex w-full items-center justify-between gap-2 rounded-lg border border-transparent px-3 py-2 text-left text-[13px] text-[#36342e] transition-colors hover:border-[#c5c0b1] hover:bg-[#fffdf9]"
            >
              <span className="truncate">{project.name}</span>
              <span className="shrink-0 text-[11px] text-[#939084]">{project.status}</span>
            </Button>
          ))}
        </div>
      )}
      <DialogFooter>
        <SecondaryButton onClick={onClose}>取消</SecondaryButton>
      </DialogFooter>
    </>
  );
}

function TrashPanel({
  creator,
  onConfirm,
  onClose,
}: {
  creator: Creator;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <DialogHeader
        icon={<Trash2 className="h-4 w-4 text-[#b00020]" />}
        title="移到回收站"
        subtitle={`确定要把 ${creator.name} 移到回收站吗？`}
      />
      <p className="text-[12px] leading-[1.6] text-[#939084]">
        回收站中的博主可在 30 天内恢复，超过后会被永久删除。
      </p>
      <DialogFooter>
        <SecondaryButton onClick={onClose}>取消</SecondaryButton>
        <Button
          unstyled
          type="button"
          onClick={onConfirm}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors",
            "bg-[#b00020] text-[#fffefb] hover:bg-[#8e0019]",
          )}
        >
          <Trash2 className="h-3.5 w-3.5" />
          移到回收站
        </Button>
      </DialogFooter>
    </>
  );
}

function DialogHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-3">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#fff7f4]">
          {icon}
        </span>
        <span className="text-[14px] font-semibold text-[#201515]">{title}</span>
      </div>
      <p className="text-[12px] text-[#939084]">{subtitle}</p>
    </div>
  );
}

function DialogFooter({ children }: { children: React.ReactNode }) {
  return <div className="mt-4 flex items-center justify-end gap-2">{children}</div>;
}

function SecondaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      unstyled
      type="button"
      onClick={onClick}
      className="rounded-full border border-[#c5c0b1] bg-[#fffefb] px-3.5 py-1.5 text-[12px] text-[#36342e] transition-colors hover:bg-[#fffdf9]"
    >
      {children}
    </Button>
  );
}
