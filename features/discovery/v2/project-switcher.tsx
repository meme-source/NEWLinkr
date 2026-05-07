"use client";

import { ChevronDown, FolderOpen, Pencil, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  useWorkspaceProject,
  type WorkspaceProject,
} from "@/features/project/components/project-context";

// Inner panel is keyed by `${currentProject.id}::${menuVersion}` so every
// fresh open remounts the rename input and naturally resets the draft text.
// This avoids an effect that would otherwise sync `editingName` to
// `currentProject.name` on each open.

interface ProjectSwitcherProps {
  onToast?: (message: string) => void;
}

// §3 项目切换器。状态机：
//   closed  → 点 trigger → openMenu()
//   openMenu → 点 input / pencil → focus + 全选
//   editing rename → Enter 提交 / Escape 还原 / Blur 自动保存
//   切换列表项 → store.switchTo + toast + close
//   "+ 新建项目" → store.create(default name) + toast + close
export function ProjectSwitcher({ onToast }: ProjectSwitcherProps) {
  const {
    projects,
    currentProject,
    currentProjectId,
    selectProject,
    renameProject,
    quickCreateProject,
  } = useWorkspaceProject();

  const [menuOpen, setMenuOpen] = useState(false);
  // Bumped on every open so the inner panel remounts and the rename input
  // re-reads `currentProject.name` as its defaultValue. Replaces an effect
  // that would otherwise sync editing state.
  const [menuVersion, setMenuVersion] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const openMenu = useCallback(() => {
    setMenuVersion((v) => v + 1);
    setMenuOpen(true);
  }, []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // Close on outside click or Escape. The Escape-while-editing case is
  // handled inside <RenamePanel/>, which calls stopPropagation on Escape so
  // it never reaches this listener.
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (popoverRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      closeMenu();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, closeMenu]);

  const otherProjects = projects.filter((p) => p.id !== currentProjectId);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (menuOpen ? closeMenu() : openMenu())}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className="inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-[12.5px] font-normal text-[var(--warm-gray)] transition-colors hover:bg-[var(--background-alt)] hover:text-[var(--dark-charcoal)]"
      >
        <FolderOpen className="h-3.5 w-3.5 opacity-70" aria-hidden />
        <span className="max-w-[180px] truncate">{currentProject.name}</span>
        <ChevronDown
          className={`h-3 w-3 opacity-70 transition-transform duration-150 ${
            menuOpen ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>

      {menuOpen ? (
        <div
          ref={popoverRef}
          role="menu"
          className="animate-in fade-in slide-in-from-top-1 absolute top-full left-0 z-50 mt-2 w-[280px] origin-top-left rounded-xl border bg-white p-2 shadow-lg"
          style={{
            borderColor: "var(--border-tertiary)",
            boxShadow: "0 12px 32px rgba(32, 21, 21, 0.12)",
          }}
        >
          <Section label="当前项目">
            <RenamePanel
              key={`${currentProject.id}::${menuVersion}`}
              initialName={currentProject.name}
              onCommit={(next) => {
                renameProject(currentProject.id, next);
                onToast?.(`已改名为「${next}」`);
                closeMenu();
              }}
              onAutoSave={(next) => {
                renameProject(currentProject.id, next);
                onToast?.(`已改名为「${next}」`);
              }}
            />
          </Section>

          {otherProjects.length > 0 ? (
            <>
              <Divider />
              <Section label="切换到">
                <ul className="flex flex-col gap-0.5">
                  {otherProjects.map((project) => (
                    <li key={project.id}>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          selectProject(project.id);
                          onToast?.(`已切换到「${project.name}」`);
                          closeMenu();
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-[var(--background-alt)]"
                      >
                        <FolderOpen
                          className="h-3.5 w-3.5 shrink-0 text-[var(--warm-gray)]"
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--foreground)]">
                          {project.name}
                        </span>
                        <ProjectMeta project={project} />
                      </button>
                    </li>
                  ))}
                </ul>
              </Section>
            </>
          ) : null}

          <Divider />

          <Section>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                const next = quickCreateProject();
                onToast?.(`已新建「${next.name}」（点项目名可改）`);
                closeMenu();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] font-medium text-[var(--primary)] transition-colors hover:bg-[rgba(255,79,0,0.08)]"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              新建项目
            </button>
          </Section>
        </div>
      ) : null}
    </div>
  );
}

function Section({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 px-1 py-1">
      {label ? (
        <div className="px-2 pt-1 text-[10.5px] font-semibold tracking-wider text-[var(--warm-gray)] uppercase">
          {label}
        </div>
      ) : null}
      {children}
    </div>
  );
}

function Divider() {
  return <div className="my-1 h-px" style={{ background: "var(--border-tertiary)" }} />;
}

function ProjectMeta({ project }: { project: WorkspaceProject }) {
  // Best-effort candidate count — surfaces the spec's "{count} 个候选" hint
  // without requiring server data; for now we don't store this on the model
  // so we hide the meta when there's nothing meaningful to show.
  if (!project.endDate) return null;
  return <span className="shrink-0 text-[11px] text-[var(--warm-gray)]">{project.endDate}</span>;
}

interface RenamePanelProps {
  initialName: string;
  // Enter / pencil-icon click → commit + close.
  onCommit: (next: string) => void;
  // Blur with a different non-empty value → auto-save without closing the
  // popover, so the user can keep navigating.
  onAutoSave: (next: string) => void;
}

// Uncontrolled rename input — the parent remounts this with `key` whenever
// the popover opens, so we never need an effect to sync state. Escape
// restores the original name and blurs; Enter commits + closes.
function RenamePanel({ initialName, onCommit, onAutoSave }: RenamePanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const focusInput = useCallback(() => {
    const node = inputRef.current;
    if (!node) return;
    node.focus();
    node.select();
  }, []);

  return (
    <div className="flex items-center gap-1.5 rounded-lg px-2 py-1 transition-colors focus-within:bg-[var(--background-alt)] hover:bg-[var(--background-alt)]">
      <input
        ref={inputRef}
        defaultValue={initialName}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            const next = event.currentTarget.value.trim();
            if (!next || next === initialName) {
              event.currentTarget.value = initialName;
              return;
            }
            onCommit(next);
          } else if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            event.currentTarget.value = initialName;
            event.currentTarget.blur();
          }
        }}
        onBlur={(event) => {
          const next = event.currentTarget.value.trim();
          if (!next) {
            event.currentTarget.value = initialName;
            return;
          }
          if (next !== initialName) onAutoSave(next);
        }}
        onClick={(event) => {
          event.currentTarget.select();
        }}
        aria-label="重命名当前项目"
        className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-[var(--foreground)] outline-none placeholder:text-[var(--warm-gray)]"
      />
      <button
        type="button"
        onClick={focusInput}
        aria-label="编辑名称"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[var(--warm-gray)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
      >
        <Pencil className="h-3 w-3" aria-hidden />
      </button>
    </div>
  );
}
