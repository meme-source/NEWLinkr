"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, CircleHelp, FolderOpen, Plus, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ProjectSummary } from "@/features/plugin/types";

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
      {/* canopy strip: a wide top bar that visually covers the content below */}
      <div className="flex items-center gap-2 pb-2">
        <FolderOpen className="h-[14px] w-[14px] shrink-0 text-[#c96442]" strokeWidth={2.2} />
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#87867f]">
          项目
        </span>

        <div className="relative min-w-0 flex-1" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-haspopup="listbox"
            aria-expanded={menuOpen}
            className={cn(
              "group/trigger flex h-7 w-full items-center gap-1 rounded-md px-1.5 text-left text-[13px] font-semibold text-[#141413] outline-none transition-colors hover:bg-[#f5f4ed]"
            )}
          >
            <span className="min-w-0 flex-1 truncate leading-none">{selectedProject.name}</span>
            <ChevronDown
              className={cn(
                "h-[13px] w-[13px] shrink-0 text-[#87867f] transition-transform",
                menuOpen && "rotate-180"
              )}
              strokeWidth={2.2}
            />
          </button>

          {menuOpen ? (
            <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 overflow-hidden rounded-[14px] border border-[#e8e6dc] bg-white p-1.5 shadow-[0_16px_40px_rgba(20,20,19,0.12)]">
              <div role="listbox" aria-label="项目列表" className="space-y-1">
                {projects.map((project) => {
                  const isSelected = project.id === selectedProject.id;
                  return (
                    <div
                      key={project.id}
                      className={cn(
                        "flex items-center gap-2 rounded-[10px] px-2 py-1.5 transition-colors",
                        isSelected ? "bg-[#f5f4ed]" : "hover:bg-[#faf9f5]"
                      )}
                    >
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          onSelectProject(project.id);
                          setMenuOpen(false);
                        }}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      >
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#141413]">
                          {project.name}
                        </span>
                        {isSelected ? (
                          <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-medium text-[#87867f]">
                            当前
                          </span>
                        ) : null}
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (!canDelete) return;
                          setMenuOpen(false);
                          onDeleteProject(project.id);
                        }}
                        disabled={!canDelete}
                        aria-label={canDelete ? `删除项目 ${project.name}` : `无法删除项目 ${project.name}`}
                        className={cn(
                          "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors",
                          canDelete
                            ? "text-[#9c403a] hover:bg-[#fbeae6]"
                            : "cursor-not-allowed text-[#c8c5bc]"
                        )}
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        <div className="group/help relative">
          <button
            type="button"
            aria-label="项目说明"
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[#87867f] transition-colors hover:bg-[#f5f4ed] hover:text-[#4d4c48]"
          >
            <CircleHelp className="h-[14px] w-[14px]" strokeWidth={2} />
          </button>
          <span className="pointer-events-none absolute right-0 top-[calc(100%+6px)] z-50 block w-[220px] rounded-[10px] bg-[#141413] px-3 py-2 text-[11px] leading-5 text-white opacity-0 shadow-md transition-opacity group-hover/help:opacity-100">
            收藏、No、标签和后续匹配分析都会归属到当前项目
          </span>
        </div>

        <div className="group/new relative">
          <button
            type="button"
            onClick={onQuickCreateProject}
            aria-label="新建项目"
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[#c96442] transition-colors hover:bg-[#f5f4ed]"
          >
            <Plus className="h-[14px] w-[14px]" strokeWidth={2.4} />
          </button>
          <span className="pointer-events-none absolute right-0 top-[calc(100%+6px)] z-30 whitespace-nowrap rounded-[10px] bg-[#141413] px-2.5 py-1 text-[10px] text-white opacity-0 shadow-md transition-opacity group-hover/new:opacity-100">
            新建项目
          </span>
        </div>
      </div>

      {/* canopy edge: a soft gradient band that visually "covers" the content below */}
      <div className="pointer-events-none h-[6px] rounded-b-[10px] bg-[linear-gradient(180deg,#f1ede2_0%,rgba(241,237,226,0)_100%)] border-t border-[#ece8dc]" />
    </div>
  );
}
