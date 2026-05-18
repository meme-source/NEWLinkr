"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, GripVertical, Layers, NotebookPen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CollaborationStatus, Creator } from "@/types/api";
import { cn } from "@/lib/utils";
import { useResizableDrawer } from "@/lib/hooks/use-resizable-drawer";
import { useCreatorOverrides } from "@/features/creator/components/creator-overrides-context";
import type { DrawerTabId } from "./drawer-types";
import { DrawerHeader } from "./drawer-header";
import { TabContent } from "./tab-content";
import { TabAudience } from "./tab-audience";
import { TabCollaborations } from "./tab-collaborations";
import { TabNotes } from "./tab-notes";

const DEFAULT_WIDTH = 720;

interface Props {
  data: Creator | null;
  onClose: () => void;
  onChangeCollaborationStatus?: (
    creatorId: string,
    projectId: string,
    next: CollaborationStatus,
  ) => void;
}

const TABS: { id: DrawerTabId; label: string; Icon: typeof BarChart3 }[] = [
  { id: "content", label: "内容数据", Icon: BarChart3 },
  { id: "audience", label: "受众数据", Icon: Users },
  { id: "collaborations", label: "项目合作", Icon: Layers },
  { id: "notes", label: "备注", Icon: NotebookPen },
];

export function DrawerShell({ data: rawData, onClose, onChangeCollaborationStatus }: Props) {
  const [tab, setTab] = useState<DrawerTabId>("content");
  const [toast, setToast] = useState<string | null>(null);
  const { width, startResize } = useResizableDrawer({
    defaultWidth: DEFAULT_WIDTH,
    maxWidthVw: 70,
  });

  // 应用 override 后的最新博主数据。表格 + 抽屉共享 store，
  // 抽屉「合作复盘」点击「更新」后，本地 reopen 也会读到最新值。
  const { applyOverrides } = useCreatorOverrides();
  const data = useMemo(() => (rawData ? applyOverrides(rawData) : null), [rawData, applyOverrides]);

  useEffect(() => {
    if (!data) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [data, onClose]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(id);
  }, [toast]);

  const handleFavoriteToggle = useCallback(
    (favorited: boolean) => {
      if (!favorited || !data) return;
      setToast(`已收藏 ${data.name} 至博主库`);
    },
    [data],
  );

  const showToast = useCallback((msg: string) => setToast(msg), []);

  return (
    <AnimatePresence>
      {data && (
        <>
          <motion.div
            key="bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100]"
            style={{ background: "rgba(20,20,19,0.22)", backdropFilter: "blur(3px)" }}
            onClick={onClose}
          />
          <motion.aside
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 260 }}
            className="fixed top-0 right-0 bottom-0 z-[110] max-w-[70vw] bg-[#fffdf9]"
            style={{ width, boxShadow: "-30px 0 80px -40px rgba(20,20,19,0.35)" }}
          >
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="拖动调整宽度"
              onMouseDown={startResize}
              className="group absolute top-0 bottom-0 left-0 z-[120] flex w-2 -translate-x-1/2 cursor-col-resize items-center justify-center"
            >
              <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent transition-colors group-hover:bg-[#ff4f00]/40" />
              <span className="relative flex h-9 w-4 items-center justify-center rounded-full border border-[#c5c0b1] bg-[#fffefb] text-[#939084] transition-colors group-hover:border-[#ff4f00]/50 group-hover:text-[#ff4f00]">
                <GripVertical className="h-3 w-3" strokeWidth={2.25} />
              </span>
            </div>
            <div className="flex h-full flex-col overflow-y-auto">
              <div className="sticky top-0 z-10">
                <DrawerHeader
                  creator={data}
                  onClose={onClose}
                  onChangeCollaborationStatus={onChangeCollaborationStatus}
                  onFavoriteToggle={handleFavoriteToggle}
                  onToast={showToast}
                />
                <nav className="flex items-center gap-1 border-b border-[#c5c0b1] bg-[rgba(250,249,245,0.92)] px-6 backdrop-blur">
                  {TABS.map((t) => {
                    const active = tab === t.id;
                    return (
                      <Button
                        unstyled
                        key={t.id}
                        type="button"
                        onClick={() => setTab(t.id)}
                        className={cn(
                          "relative inline-flex items-center gap-1.5 px-3 pt-2 pb-2.5 text-[12px] font-medium transition-colors",
                          active ? "text-[#ff4f00]" : "text-[#36342e] hover:text-[#201515]",
                        )}
                      >
                        <t.Icon className="h-3.5 w-3.5" />
                        {t.label}
                        {active && (
                          <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-t bg-[#ff4f00]" />
                        )}
                      </Button>
                    );
                  })}
                </nav>
              </div>

              <div className="px-6 py-5">
                {tab === "content" && <TabContent creator={data} />}
                {tab === "audience" && <TabAudience creator={data} onToast={showToast} />}
                {tab === "collaborations" && (
                  <TabCollaborations
                    creator={data}
                    onChangeCollaborationStatus={onChangeCollaborationStatus}
                  />
                )}
                {tab === "notes" && <TabNotes creator={data} />}
              </div>
            </div>
            <AnimatePresence>
              {toast && (
                <motion.div
                  key={toast}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="pointer-events-none absolute bottom-6 left-1/2 z-[130] -translate-x-1/2 rounded-full bg-zinc-900 px-4 py-2 text-[12px] font-medium whitespace-nowrap text-white shadow-lg ring-1 ring-black/10"
                >
                  {toast}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
