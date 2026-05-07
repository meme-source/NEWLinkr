"use client";

import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

import type { CollaborationStatus } from "@/types/api";
import { CreatorProfileProvider } from "@/features/creator/components/creator-profile-context";
import { OutreachStateProvider } from "@/features/outreach/components/outreach-state-context";
import { WorkspaceProjectBar } from "@/features/project/components/project-bar";
import { WorkspaceProjectProvider } from "@/features/project/components/project-context";
import { SidebarCollapseProvider } from "@/features/workspace-shell/components/sidebar-collapse-context";
import { WorkspaceSidebar } from "@/features/workspace-shell/components/workspace-sidebar";
import { cn } from "@/lib/utils";

// Layout intentionally stays "use client" because it uses usePathname() to
// decide whether to render <WorkspaceProjectBar /> at the top of <main>, and
// owns the click-outside backdrop coordinated between the sidebar's
// notification and user menus. Internal state is otherwise pushed down into
// <WorkspaceSidebar /> so this file stays small.

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const mainScrollRef = useRef<HTMLElement>(null);
  const isDiscovery = pathname === "/workspace/discovery";
  const isOutreach = pathname === "/workspace/outreach";

  // Phase 0：抽屉里"合作 tab"的状态修改通道暂时只走 console.info，与博主库 page 的
  // 现有写法一致；Phase 1+ 接入真实后端时把这里替换成 service 调用。
  // 注：把 handler 挂在 layout 层，意味着不论从哪个页面（库 / 建联看板 / 发现页）
  // 打开博主抽屉，合作 tab 都拥有相同的下拉编辑能力。
  const handleChangeCollaborationStatus = (
    creatorId: string,
    projectId: string,
    next: CollaborationStatus,
  ) => {
    console.info("creator collaboration status", { creatorId, projectId, status: next });
  };

  return (
    <WorkspaceProjectProvider>
      <OutreachStateProvider>
        <CreatorProfileProvider onChangeCollaborationStatus={handleChangeCollaborationStatus}>
          <SidebarCollapseProvider>
            <div className="h-screen w-screen overflow-hidden bg-[var(--ws-bg)]">
              <div className="flex h-full min-h-0 w-full">
                <WorkspaceSidebar
                  notifOpen={notifOpen}
                  setNotifOpen={setNotifOpen}
                  userOpen={userOpen}
                  setUserOpen={setUserOpen}
                  mainScrollRef={mainScrollRef}
                />

                <main
                  ref={mainScrollRef}
                  className={cn(
                    "min-h-0 min-w-0 flex-1",
                    isDiscovery ? "overflow-hidden" : "overflow-y-auto px-6 py-8",
                  )}
                >
                  {!isDiscovery && !isOutreach ? <WorkspaceProjectBar pathname={pathname} /> : null}
                  {children}
                </main>

                {(notifOpen || userOpen) && (
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => {
                      setNotifOpen(false);
                      setUserOpen(false);
                    }}
                  />
                )}
              </div>
            </div>
          </SidebarCollapseProvider>
        </CreatorProfileProvider>
      </OutreachStateProvider>
    </WorkspaceProjectProvider>
  );
}
