"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { useSearchParams } from "next/navigation";

import {
  BoardTab,
  BoardViewSwitcher,
  type BoardView,
} from "@/features/outreach/components/board-tab";
import { InboxTab } from "@/features/outreach/components/inbox-tab";
import { TemplatesTab } from "@/features/outreach/components/templates-tab";
import { WorkspaceProjectBar } from "@/features/project/components/project-bar";

// §2.1 Outreach surface (renamed to 项目管理 in the sidebar) only has three
// tabs: 追踪看板 / 收件箱 / 邮件模板. The schedule calendar is embedded inside
// the board's 项目概览 view, not a tab of its own.
type TabKey = "board" | "inbox" | "templates";

const TAB_COMPONENTS: Record<TabKey, React.ComponentType> = {
  board: BoardTab,
  inbox: InboxTab,
  templates: TemplatesTab,
};

function OutreachContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as TabKey) ?? "board";
  const boardView = (searchParams.get("view") as BoardView) ?? "overview";
  const TabContent = TAB_COMPONENTS[tab] ?? BoardTab;
  // §3.1 项目概览 是跨项目的鸟瞰，自带"全部项目"语义，不再叠 Project Bar；
  // 建联进度 / 投放表现 仍然按单项目筛选，所以保留。
  // OutreachStateProvider 已上移到 workspace layout，让博主抽屉（layout 级渲染）
  // 也能直接读 / 写 投放卡片状态（如 lastRefreshedAt、addPlacement）。
  const showProjectBar = !(tab === "board" && boardView === "overview");
  return (
    <div className="space-y-4">
      {tab === "board" ? <BoardViewSwitcher current={boardView} /> : null}
      {showProjectBar ? <WorkspaceProjectBar pathname={pathname} /> : null}
      <TabContent />
    </div>
  );
}

export default function OutreachPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse rounded-xl bg-[#eceae3]" />
          <div className="h-64 animate-pulse rounded-2xl bg-[#eceae3]" />
        </div>
      }
    >
      <OutreachContent />
    </Suspense>
  );
}
