"use client";

import { ChevronDown, Plus } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { CollaborationStatusCell } from "@/features/creator/components/collaboration-status-cell";
import { useCreatorPlacements } from "@/features/creator/data/use-creator-placements";
import { useWorkspaceProject } from "@/features/project/components/project-context";
import { deriveEffectiveCollabStatus } from "@/lib/creator";
import type { Collaboration, CollaborationStatus, Creator } from "@/types/api";
import { cn } from "@/lib/utils";

interface Props {
  creator: Creator;
  // 抽屉外层注入。给定时每个 chip 的状态可下拉编辑。
  onChangeCollaborationStatus?: (
    creatorId: string,
    projectId: string,
    next: CollaborationStatus,
  ) => void;
  onToast?: (msg: string) => void;
}

// 抽屉 header 的项目 chip 列。
// 每个 chip = 项目名（点击下拉切换其他项目，即「转移项目」）+ 状态下拉。
// 状态徽章是博主在该项目下合作状态的「唯一来源」，同时承载展示与调整。
// 0 项目时显示「未加入项目」+ 新增按钮（按钮 Phase 2 接入；当前提示「即将上线」）。
export function HeaderProjectChips({ creator, onChangeCollaborationStatus, onToast }: Props) {
  const { projects, resolveProjectName } = useWorkspaceProject();
  // useCreatorPlacements 已合并 mock + 用户录入并过滤软删，所以 placement 的存在
  // 已经等价于"该项目下有真实投放执行" —— 不需要再判一遍 isPlacementDeleted。
  const placements = useCreatorPlacements(creator.handle);
  const collabs = creator.collaborations;

  const handleAddProjectClick = () => {
    onToast?.("加入项目功能即将上线");
  };

  if (collabs.length === 0) {
    return (
      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="text-[#939084]">尚未加入任何项目</span>
        <Button
          unstyled
          type="button"
          onClick={handleAddProjectClick}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#c5c0b1] px-2 py-0.5 text-[#36342e] transition-colors hover:border-[#ff4f00] hover:text-[#ff4f00]"
        >
          <Plus className="h-3 w-3" />
          加入项目
        </Button>
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
        const hasActivePlacements = placements.some((p) => p.projectId === collab.projectId);
        const effectiveStatus = deriveEffectiveCollabStatus(collab.status, hasActivePlacements);
        return (
          <div
            key={collab.id}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#c5c0b1] bg-[#fffefb] py-0.5 pr-1 pl-2 text-[11px]"
          >
            <ProjectSwitcher
              currentProjectId={collab.projectId}
              currentProjectName={resolveProjectName(collab.projectId)}
              projects={projects.map((p) => ({ id: p.id, name: p.name }))}
              collab={collab}
              onToast={onToast}
            />
            <span className="text-[#939084]" aria-hidden>
              ·
            </span>
            <CollaborationStatusCell value={effectiveStatus} onChange={onChange} compact />
          </div>
        );
      })}
      <Button
        unstyled
        type="button"
        onClick={handleAddProjectClick}
        aria-label="加入项目"
        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-[#c5c0b1] text-[#939084] transition-colors hover:border-[#ff4f00] hover:text-[#ff4f00]"
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}

interface ProjectSwitcherProps {
  currentProjectId: string;
  currentProjectName: string;
  projects: { id: string; name: string }[];
  collab: Collaboration;
  onToast?: (msg: string) => void;
}

interface MenuPosition {
  top: number;
  left: number;
}

// 项目名 chip：直接点击展开「其他项目」列表，选中即转移。
// 不再嵌套二级「移项目」菜单，避免多此一举。
//
// 菜单 portal 到 body：抽屉的 sticky header + 半透明 tab 栏会形成新的层叠
// 上下文，inline 渲染的菜单会被 tab 栏盖住或穿模。portal + viewport 定位
// 可以彻底脱离父级 stacking context（同 CollaborationStatusCell 的做法）。
function ProjectSwitcher({
  currentProjectId,
  currentProjectName,
  projects,
  collab,
  onToast,
}: ProjectSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<MenuPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const update = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuPos({ top: rect.bottom + 4, left: rect.left });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const otherProjects = projects.filter((p) => p.id !== currentProjectId);

  const handleMove = (target: { id: string; name: string }) => {
    setOpen(false);
    // TODO Phase 2：调用 services/library 的 moveCollaboration(collab.id, target.id)
    console.warn(`[move-project] collab=${collab.id} from=${currentProjectId} to=${target.id}`);
    onToast?.(`已转移到「${target.name}」`);
  };

  return (
    <>
      <Button
        unstyled
        ref={triggerRef}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="inline-flex items-center gap-1 font-medium text-[#36342e] transition-colors hover:text-[#ff4f00]"
        aria-haspopup="menu"
        aria-expanded={open}
        title="点击转移到其他项目"
      >
        <span>{currentProjectName}</span>
        <ChevronDown
          className={cn("h-3 w-3 opacity-70 transition-transform", open && "rotate-180")}
        />
      </Button>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[1000]"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            {menuPos && (
              <div
                role="menu"
                style={{ top: menuPos.top, left: menuPos.left }}
                className="fixed z-[1001] min-w-[160px] overflow-hidden rounded-lg border border-[#c5c0b1] bg-[#fffefb] py-1 shadow-lg shadow-[rgba(20,20,19,0.12)]"
              >
                <div className="px-2.5 pt-1 pb-0.5 text-[10px] font-semibold tracking-wide text-[#939084] uppercase">
                  转移到
                </div>
                {otherProjects.length === 0 ? (
                  <div className="px-2.5 py-1.5 text-[11px] text-[#939084]">没有其他项目可转移</div>
                ) : (
                  otherProjects.map((p) => (
                    <Button
                      unstyled
                      key={p.id}
                      type="button"
                      role="menuitem"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleMove(p);
                      }}
                      className="flex w-full items-center px-2.5 py-1.5 text-left text-[11px] text-[#36342e] hover:bg-[#fffdf9]"
                    >
                      {p.name}
                    </Button>
                  ))
                )}
              </div>
            )}
          </>,
          document.body,
        )}
    </>
  );
}
