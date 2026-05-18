"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, CircleHelp, FolderOpen, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectSummary } from "@/features/plugin/types";
import { Button } from "@/components/ui/button";

export function SidebarProjectSelector({
  projects,
  selectedProject,
  onSelectProject,
  onQuickCreateProject,
  onDeleteProject,
}: {
  projects: ProjectSummary[];
  selectedProject: ProjectSummary;
  onSelectProject: (projectId: string) => void;
  onQuickCreateProject: () => void;
  onDeleteProject: (projectId: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const canDelete = projects.length > 1;

  return (
    <div className="relative mb-3">
      <div className="flex items-center gap-2 pb-2">
        <FolderOpen className="h-[14px] w-[14px] shrink-0 text-[#ff4f00]" strokeWidth={2.2} />
        <span className="text-[11px] font-semibold tracking-[0.08em] text-[#939084] uppercase">
          项目
        </span>

        <div className="relative min-w-0 flex-1" ref={menuRef}>
          <Button
            unstyled
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-haspopup="listbox"
            aria-expanded={menuOpen}
            className={cn(
              "group/trigger flex h-7 w-full items-center gap-1 rounded-md px-1.5 text-left text-[13px] font-semibold text-[#201515] transition-colors outline-none hover:bg-[#eceae3]",
            )}
          >
            <span className="min-w-0 flex-1 truncate leading-none">{selectedProject.name}</span>
            <ChevronDown
              className={cn(
                "h-[13px] w-[13px] shrink-0 text-[#939084] transition-transform",
                menuOpen && "rotate-180",
              )}
              strokeWidth={2.2}
            />
          </Button>

          {menuOpen ? (
            <div className="absolute top-[calc(100%+6px)] right-0 left-0 z-40 overflow-hidden rounded-[8px] border border-[#c5c0b1] bg-[#fffefb] p-1.5">
              <div role="listbox" aria-label="项目列表" className="space-y-1">
                {projects.map((project) => {
                  const isSelected = project.id === selectedProject.id;
                  return (
                    <div
                      key={project.id}
                      className={cn(
                        "flex items-center gap-2 rounded-[8px] px-2 py-1.5 transition-colors",
                        isSelected ? "bg-[#eceae3]" : "hover:bg-[#fffdf9]",
                      )}
                    >
                      <Button
                        unstyled
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          onSelectProject(project.id);
                          setMenuOpen(false);
                        }}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      >
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#201515]">
                          {project.name}
                        </span>
                        {isSelected ? (
                          <span className="rounded-full bg-[#fffefb] px-1.5 py-0.5 text-[10px] font-medium text-[#939084]">
                            当前
                          </span>
                        ) : null}
                      </Button>
                      <Button
                        unstyled
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (!canDelete) return;
                          setMenuOpen(false);
                          onDeleteProject(project.id);
                        }}
                        disabled={!canDelete}
                        aria-label={
                          canDelete ? `删除项目 ${project.name}` : `无法删除项目 ${project.name}`
                        }
                        className={cn(
                          "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors",
                          canDelete
                            ? "text-[#b00020] hover:bg-[#fdf2f2]"
                            : "cursor-not-allowed text-[#c5c0b1]",
                        )}
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        <div className="group/help relative">
          <Button
            unstyled
            type="button"
            aria-label="项目说明"
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[#939084] transition-colors hover:bg-[#eceae3] hover:text-[#36342e]"
          >
            <CircleHelp className="h-[14px] w-[14px]" strokeWidth={2} />
          </Button>
          <span className="pointer-events-none absolute top-[calc(100%+6px)] right-0 z-50 block w-[220px] rounded-[8px] bg-[#201515] px-3 py-2 text-[11px] leading-5 text-[#fffefb] opacity-0 transition-opacity group-hover/help:opacity-100">
            收藏、No、标签和后续匹配分析都会归属到当前项目
          </span>
        </div>

        <div className="group/new relative">
          <Button
            unstyled
            type="button"
            onClick={onQuickCreateProject}
            aria-label="新建项目"
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[#ff4f00] transition-colors hover:bg-[#eceae3]"
          >
            <Plus className="h-[14px] w-[14px]" strokeWidth={2.4} />
          </Button>
          <span className="pointer-events-none absolute top-[calc(100%+6px)] right-0 z-30 rounded-[8px] bg-[#201515] px-2.5 py-1 text-[10px] whitespace-nowrap text-[#fffefb] opacity-0 transition-opacity group-hover/new:opacity-100">
            新建项目
          </span>
        </div>
      </div>

      <div className="pointer-events-none h-[6px] rounded-b-[8px] border-t border-[#c5c0b1] bg-[linear-gradient(180deg,#eceae3_0%,rgba(241,237,226,0)_100%)]" />
    </div>
  );
}
