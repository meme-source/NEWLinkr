"use client";

import { useState } from "react";
import { Flag, FolderInput, Plus, Tag, Target } from "lucide-react";
import type { CollaborationStatus } from "@/types/api";
import { COLLABORATION_STATUS_LABEL, COLLABORATION_STATUS_ORDER } from "@/lib/creator";
import type { WorkspaceProject } from "@/features/project/components/project-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// 共用的 trigger 按钮：和 LibraryBulkBar 里的 BulkButton 视觉一致。
function ActionButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      unstyled
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
        active
          ? "border-[#ff4f00] bg-[#fff7f4] text-[#ff4f00]"
          : "border-[#c5c0b1] bg-[#fffefb] text-[#36342e] hover:bg-[#fffdf9]",
      )}
    >
      {icon}
      {label}
    </Button>
  );
}

// 弹层壳：Bar 现已嵌入工具栏行（不再 sticky bottom），所以 popover 朝下展开。
function Popover({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} aria-hidden="true" />
      <div className="absolute top-full left-1/2 z-40 mt-2 w-[260px] -translate-x-1/2 rounded-lg border border-[#c5c0b1] bg-[#fffefb] p-3 shadow-lg shadow-[rgba(20,20,19,0.08)]">
        {children}
      </div>
    </>
  );
}

function PopoverTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 text-[11px] font-medium tracking-wide text-[#939084] uppercase">
      {children}
    </div>
  );
}

// ── 打标签 ────────────────────────────────────────────────────────────────────

interface BulkTagsActionProps {
  creatorCount: number;
  availableUserTags: string[];
  onApply: (tags: string[]) => void;
}

export function BulkTagsAction({ creatorCount, availableUserTags, onApply }: BulkTagsActionProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");

  const apply = (tags: string[]) => {
    if (tags.length === 0) return;
    onApply(tags);
  };

  const handleAddNew = () => {
    const value = input.trim();
    if (!value) return;
    apply([value]);
    setInput("");
  };

  return (
    <div className="relative">
      <ActionButton
        icon={<Tag className="h-3.5 w-3.5" />}
        label="打标签"
        active={open}
        onClick={() => setOpen((v) => !v)}
      />
      <Popover open={open} onClose={() => setOpen(false)}>
        <PopoverTitle>给 {creatorCount} 位博主打标签</PopoverTitle>
        {availableUserTags.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {availableUserTags.map((tag) => (
              <Button
                unstyled
                key={tag}
                type="button"
                onClick={() => apply([tag])}
                className="inline-flex items-center rounded-full border border-[#c5c0b1] bg-[#fffefb] px-2 py-0.5 text-[11px] text-[#36342e] transition-colors hover:border-[#ff4f00] hover:text-[#ff4f00]"
              >
                {tag}
              </Button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-1.5 rounded-full border border-[#c5c0b1] bg-[#fffdf9] py-1 pr-1 pl-3">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleAddNew();
              }
            }}
            placeholder="新标签，回车添加"
            className="h-6 min-w-0 flex-1 bg-transparent text-[11px] text-[#201515] outline-none placeholder:text-[#939084]"
          />
          <Button
            unstyled
            type="button"
            onClick={handleAddNew}
            disabled={input.trim().length === 0}
            aria-label="添加"
            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#ff4f00] text-[#fffefb] transition-colors hover:bg-[#ff4f00] disabled:cursor-not-allowed disabled:bg-[#c5c0b1]"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <div className="mt-2 text-[10.5px] text-[#939084]">点选标签即应用，可继续选择多个</div>
      </Popover>
    </div>
  );
}

// ── 移项目 ────────────────────────────────────────────────────────────────────

interface BulkProjectActionProps {
  creatorCount: number;
  projects: WorkspaceProject[];
  currentProjectId: string;
  onApply: (projectId: string) => void;
}

export function BulkProjectAction({
  creatorCount,
  projects,
  currentProjectId,
  onApply,
}: BulkProjectActionProps) {
  const [open, setOpen] = useState(false);
  const candidates = projects.filter((p) => p.id !== currentProjectId);

  const handlePick = (projectId: string) => {
    onApply(projectId);
    setOpen(false);
  };

  return (
    <div className="relative">
      <ActionButton
        icon={<FolderInput className="h-3.5 w-3.5" />}
        label="移项目"
        active={open}
        onClick={() => setOpen((v) => !v)}
      />
      <Popover open={open} onClose={() => setOpen(false)}>
        <PopoverTitle>把 {creatorCount} 位博主移到</PopoverTitle>
        {candidates.length === 0 ? (
          <div className="px-1 py-2 text-[12px] text-[#939084]">暂无其他可选项目</div>
        ) : (
          <div className="max-h-[240px] overflow-y-auto">
            {candidates.map((project) => (
              <Button
                unstyled
                key={project.id}
                type="button"
                onClick={() => handlePick(project.id)}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12px] text-[#36342e] transition-colors hover:bg-[#fffdf9]"
              >
                <span className="truncate">{project.name}</span>
                <span className="shrink-0 text-[10px] text-[#939084]">{project.status}</span>
              </Button>
            ))}
          </div>
        )}
      </Popover>
    </div>
  );
}

// ── 改状态 ────────────────────────────────────────────────────────────────────

interface BulkStatusActionProps {
  creatorCount: number;
  disabled?: boolean;
  disabledHint?: string;
  onApply: (status: CollaborationStatus) => void;
}

export function BulkStatusAction({
  creatorCount,
  disabled,
  disabledHint,
  onApply,
}: BulkStatusActionProps) {
  const [open, setOpen] = useState(false);

  const handlePick = (status: CollaborationStatus) => {
    onApply(status);
    setOpen(false);
  };

  return (
    <div className="relative">
      <Button
        unstyled
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        title={disabled ? disabledHint : undefined}
        disabled={disabled}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
          disabled && "cursor-not-allowed opacity-50",
          !disabled && open
            ? "border-[#ff4f00] bg-[#fff7f4] text-[#ff4f00]"
            : "border-[#c5c0b1] bg-[#fffefb] text-[#36342e] hover:bg-[#fffdf9]",
        )}
      >
        <Flag className="h-3.5 w-3.5" />
        改状态
      </Button>
      <Popover open={open} onClose={() => setOpen(false)}>
        <PopoverTitle>把 {creatorCount} 位博主改为</PopoverTitle>
        <div>
          {COLLABORATION_STATUS_ORDER.map((status) => (
            <Button
              unstyled
              key={status}
              type="button"
              onClick={() => handlePick(status)}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12px] text-[#36342e] transition-colors hover:bg-[#fffdf9]"
            >
              <span className="inline-flex items-center rounded-full border border-[#c5c0b1] bg-[#fffdf9] px-2 py-0.5 text-[11px]">
                {COLLABORATION_STATUS_LABEL[status]}
              </span>
            </Button>
          ))}
        </div>
      </Popover>
    </div>
  );
}

// ── 追踪投放 ──────────────────────────────────────────────────────────────────

interface BulkTrackActionProps {
  creatorCount: number;
  onApply: () => void;
  onOpenBoard: () => void;
}

export function BulkTrackAction({ creatorCount, onApply, onOpenBoard }: BulkTrackActionProps) {
  const [open, setOpen] = useState(false);

  const handleApply = () => {
    onApply();
    setOpen(false);
  };

  return (
    <div className="relative">
      <ActionButton
        icon={<Target className="h-3.5 w-3.5" />}
        label="追踪投放"
        active={open}
        onClick={() => setOpen((v) => !v)}
      />
      <Popover open={open} onClose={() => setOpen(false)}>
        <PopoverTitle>追踪投放</PopoverTitle>
        <div className="mb-2 text-[12px] leading-[1.5] text-[#36342e]">
          把已选的 <span className="font-semibold text-[#201515]">{creatorCount}</span>{" "}
          位博主加入追踪看板，后续可在看板里查看投放表现。
        </div>
        <div className="flex items-center justify-between gap-2">
          <Button
            unstyled
            type="button"
            onClick={() => {
              onOpenBoard();
              setOpen(false);
            }}
            className="text-[11px] text-[#939084] hover:text-[#ff4f00]"
          >
            查看追踪看板 →
          </Button>
          <div className="flex items-center gap-1.5">
            <Button
              unstyled
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-[#c5c0b1] bg-[#fffefb] px-2.5 py-1 text-[11px] text-[#36342e] hover:bg-[#fffdf9]"
            >
              取消
            </Button>
            <Button
              unstyled
              type="button"
              onClick={handleApply}
              className="inline-flex items-center gap-1 rounded-full bg-[#ff4f00] px-2.5 py-1 text-[11px] font-medium text-[#fffefb] hover:bg-[#ff4f00]"
            >
              <Target className="h-3 w-3" />
              加入
            </Button>
          </div>
        </div>
      </Popover>
    </div>
  );
}
