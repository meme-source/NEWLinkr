"use client";

import { Check, ChevronDown, FolderOpen, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
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
  /**
   * Popover anchor edge. "left" (default) opens the dropdown flush with the
   * trigger's left edge — correct when the switcher sits at a left margin
   * (console header). "right" opens it flush with the right edge so a
   * top-right-pinned switcher doesn't overflow the viewport.
   */
  align?: "left" | "right";
}

const DEFAULT_PROJECT_NAME = "未命名项目";
const RENAME_PLACEHOLDER = "编辑项目名称";

// §3 项目切换器。状态机：
//   closed  → 点 trigger → openMenu()
//   openMenu → 点 input / 灰色 ✓ → focus + 全选
//   editing rename → Enter 提交 / Escape 还原 / Blur 自动保存
//   切换列表项 → store.switchTo + toast + close
//   "+ 新建项目" → store.create(默认名) + toast + 保持菜单打开 + 自动聚焦改名框
export function ProjectSwitcher({ onToast, align = "left" }: ProjectSwitcherProps) {
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
  // Set right after "+ 新建项目" so the next render auto-focuses the rename
  // input — guides the user to fill in the project name immediately.
  const [justCreated, setJustCreated] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const openMenu = useCallback(() => {
    setMenuVersion((v) => v + 1);
    setMenuOpen(true);
  }, []);
  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setJustCreated(false);
  }, []);

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
      <Button
        unstyled
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
      </Button>

      {menuOpen ? (
        <div
          ref={popoverRef}
          role="menu"
          className={`animate-in fade-in slide-in-from-top-1 absolute top-full z-50 mt-2 w-[280px] rounded-lg border bg-white p-2 shadow-lg ${
            align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left"
          }`}
          style={{
            borderColor: "var(--border-tertiary)",
            boxShadow: "0 12px 32px rgba(32, 21, 21, 0.12)",
          }}
        >
          <Section label="当前项目">
            <RenamePanel
              key={`${currentProject.id}::${menuVersion}`}
              initialName={currentProject.name}
              autoFocus={justCreated}
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
                      <Button
                        unstyled
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
                      </Button>
                    </li>
                  ))}
                </ul>
              </Section>
            </>
          ) : null}

          <Divider />

          <Section>
            <Button
              unstyled
              type="button"
              role="menuitem"
              onClick={() => {
                quickCreateProject();
                onToast?.("已新建项目，请填写项目名称");
                // Keep the menu open so the user can immediately rename the
                // freshly created project; the inner panel will remount via
                // the version key and auto-focus the rename input.
                setJustCreated(true);
                setMenuVersion((v) => v + 1);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] font-medium text-[var(--primary)] transition-colors hover:bg-[rgba(255,79,0,0.08)]"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              新建项目
            </Button>
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
  // True for projects that still carry the default placeholder name (i.e.
  // freshly created via "+ 新建项目"). When true, the rename input mounts
  // focused so the user is immediately prompted to type a real name.
  autoFocus?: boolean;
  // Enter / orange-checkmark click → commit + close.
  onCommit: (next: string) => void;
  // Blur with a different non-empty value → auto-save without closing the
  // popover, so the user can keep navigating.
  onAutoSave: (next: string) => void;
}

// Uncontrolled rename input — the parent remounts this with `key` whenever
// the popover opens, so we never need an effect to sync state. Escape
// restores the original name and blurs; Enter commits + closes. The single
// piece of local state, `hasEdited`, drives the gray → orange transition on
// the trailing checkmark and gates whether clicking it saves vs. focuses.
function RenamePanel({ initialName, autoFocus = false, onCommit, onAutoSave }: RenamePanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isUnnamed = initialName === DEFAULT_PROJECT_NAME;
  const [hasEdited, setHasEdited] = useState(false);

  const focusInput = useCallback(() => {
    const node = inputRef.current;
    if (!node) return;
    node.focus();
    node.select();
  }, []);

  // Mirrors the commit gate (non-empty AND different from current name).
  // Anything that wouldn't save should leave the checkmark gray.
  const computeHasEdited = useCallback(
    (value: string): boolean => {
      const trimmed = value.trim();
      if (trimmed.length === 0) return false;
      if (trimmed === initialName) return false;
      return true;
    },
    [initialName],
  );

  const commitFromInput = useCallback(() => {
    const node = inputRef.current;
    if (!node) return;
    const next = node.value.trim();
    if (!next || next === initialName) {
      node.value = isUnnamed ? "" : initialName;
      setHasEdited(false);
      return;
    }
    onCommit(next);
  }, [initialName, isUnnamed, onCommit]);

  const handleCheckClick = useCallback(() => {
    if (hasEdited) {
      commitFromInput();
    } else {
      focusInput();
    }
  }, [hasEdited, commitFromInput, focusInput]);

  // Auto-focus on mount when this panel was opened in response to "+ 新建项目".
  // Component remounts via `key`, so this effect only runs once per open.
  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  return (
    <div className="flex items-center gap-1.5 rounded-lg px-2 py-1 transition-colors focus-within:bg-[var(--background-alt)] hover:bg-[var(--background-alt)]">
      <input
        ref={inputRef}
        defaultValue={isUnnamed ? "" : initialName}
        placeholder={isUnnamed ? RENAME_PLACEHOLDER : undefined}
        onChange={(event) => {
          setHasEdited(computeHasEdited(event.currentTarget.value));
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            const next = event.currentTarget.value.trim();
            if (!next || next === initialName) {
              event.currentTarget.value = isUnnamed ? "" : initialName;
              setHasEdited(false);
              return;
            }
            onCommit(next);
          } else if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            event.currentTarget.value = isUnnamed ? "" : initialName;
            setHasEdited(false);
            event.currentTarget.blur();
          }
        }}
        onBlur={(event) => {
          const next = event.currentTarget.value.trim();
          if (!next) {
            event.currentTarget.value = isUnnamed ? "" : initialName;
            setHasEdited(false);
            return;
          }
          if (next !== initialName) onAutoSave(next);
        }}
        onClick={(event) => {
          event.currentTarget.select();
        }}
        aria-label="重命名当前项目"
        className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)] placeholder:opacity-50"
      />
      <Button
        unstyled
        type="button"
        onClick={handleCheckClick}
        aria-label={hasEdited ? "保存名称" : "编辑名称"}
        className={
          hasEdited
            ? "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[var(--primary)] transition-colors hover:bg-[rgba(255,79,0,0.12)]"
            : "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[var(--warm-gray)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
        }
      >
        <Check className="h-3.5 w-3.5" aria-hidden />
      </Button>
    </div>
  );
}
