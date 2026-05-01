"use client";

import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

import { CreatorProfileProvider } from "@/features/creator/components/creator-profile-context";
import { WorkspaceProjectBar } from "@/features/project/components/project-bar";
import { WorkspaceProjectProvider } from "@/features/project/components/project-context";
import { WorkspaceSidebar } from "@/features/workspace-shell/components/workspace-sidebar";

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

  return (
    <WorkspaceProjectProvider>
      <CreatorProfileProvider>
        <div className="h-screen w-screen overflow-hidden bg-[#f5f4ed]">
          <div className="flex h-full min-h-0 w-full">
            <WorkspaceSidebar
              notifOpen={notifOpen}
              setNotifOpen={setNotifOpen}
              userOpen={userOpen}
              setUserOpen={setUserOpen}
              mainScrollRef={mainScrollRef}
            />

            <main ref={mainScrollRef} className="min-h-0 min-w-0 flex-1 overflow-y-auto px-6 py-8">
              {pathname !== "/workspace/discovery" ? (
                <WorkspaceProjectBar pathname={pathname} />
              ) : null}
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
      </CreatorProfileProvider>
    </WorkspaceProjectProvider>
  );
}
