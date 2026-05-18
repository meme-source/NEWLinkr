"use client";

import { Activity, Lock, Mail, PanelRight, Search, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SidebarTab } from "@/features/plugin/types";
import { Button } from "@/components/ui/button";

export function SidebarNavRail({
  collapsed,
  onToggleCollapse,
  activeSidebarTab,
  onSelectSidebarTab,
  isSinglePostUnlocked,
  onLockedSinglePostClick,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeSidebarTab: SidebarTab;
  onSelectSidebarTab: (tab: SidebarTab) => void;
  // 单帖 AI 分析只有在浏览器里「打开了某个帖子」后才可用 —— 没打开时锁住置灰。
  isSinglePostUnlocked: boolean;
  // 锁住状态下被点击 —— 父组件弹一条「先打开帖子」的提醒。
  onLockedSinglePostClick: () => void;
}) {
  return (
    <div className="flex w-11 flex-shrink-0 flex-col items-center border-l border-[#c5c0b1] bg-[#eceae3]">
      <div className="flex flex-col items-center gap-2 pt-5">
        <div className="group relative">
          <Button
            unstyled
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "打开侧边栏" : "收起侧边栏"}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150",
              "text-[#939084] hover:bg-[#fffefb] hover:text-[#36342e]",
            )}
          >
            <PanelRight className="h-3.5 w-3.5" />
          </Button>
          <span className="pointer-events-none absolute top-1/2 right-[calc(100%+8px)] z-50 -translate-y-1/2 rounded-[8px] bg-[#201515] px-2.5 py-1 text-[11px] whitespace-nowrap text-[#fffefb] opacity-0 transition-opacity group-hover:opacity-100">
            {collapsed ? "打开侧边栏" : "收起侧边栏"}
          </span>
        </div>

        <div className="group relative">
          <Button
            unstyled
            type="button"
            onClick={() => {
              onSelectSidebarTab("similar");
              if (collapsed) onToggleCollapse();
            }}
            aria-label="找相似"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150",
              !collapsed && activeSidebarTab === "similar"
                ? "bg-[#ff4f00]/10 text-[#ff4f00]"
                : "text-[#939084] hover:bg-[#fffefb] hover:text-[#36342e]",
            )}
          >
            <Search className="h-3.5 w-3.5" />
          </Button>
          <span className="pointer-events-none absolute top-1/2 right-[calc(100%+8px)] z-50 -translate-y-1/2 rounded-[8px] bg-[#201515] px-2.5 py-1 text-[11px] whitespace-nowrap text-[#fffefb] opacity-0 transition-opacity group-hover:opacity-100">
            找相似
          </span>
        </div>

        <div className="group relative">
          <Button
            unstyled
            type="button"
            onClick={() => {
              onSelectSidebarTab("current");
              if (collapsed) onToggleCollapse();
            }}
            aria-label="博主分析"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150",
              !collapsed && activeSidebarTab === "current"
                ? "bg-[#ff4f00]/10 text-[#ff4f00]"
                : "text-[#939084] hover:bg-[#fffefb] hover:text-[#36342e]",
            )}
          >
            <User className="h-3.5 w-3.5" />
          </Button>
          <span className="pointer-events-none absolute top-1/2 right-[calc(100%+8px)] z-50 -translate-y-1/2 rounded-[8px] bg-[#201515] px-2.5 py-1 text-[11px] whitespace-nowrap text-[#fffefb] opacity-0 transition-opacity group-hover:opacity-100">
            博主分析
          </span>
        </div>

        <div className="group relative">
          <Button
            unstyled
            type="button"
            onClick={() => {
              onSelectSidebarTab("email");
              if (collapsed) onToggleCollapse();
            }}
            aria-label="邮件建联"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150",
              !collapsed && activeSidebarTab === "email"
                ? "bg-[#ff4f00]/10 text-[#ff4f00]"
                : "text-[#939084] hover:bg-[#fffefb] hover:text-[#36342e]",
            )}
          >
            <Mail className="h-3.5 w-3.5" />
          </Button>
          <span className="pointer-events-none absolute top-1/2 right-[calc(100%+8px)] z-50 -translate-y-1/2 rounded-[8px] bg-[#201515] px-2.5 py-1 text-[11px] whitespace-nowrap text-[#fffefb] opacity-0 transition-opacity group-hover:opacity-100">
            邮件建联
          </span>
        </div>

        <div className="group relative">
          <Button
            unstyled
            type="button"
            onClick={() => {
              onSelectSidebarTab("quick");
              if (collapsed) onToggleCollapse();
            }}
            aria-label="预览设置"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150",
              !collapsed && activeSidebarTab === "quick"
                ? "bg-[#ff4f00]/10 text-[#ff4f00]"
                : "text-[#939084] hover:bg-[#fffefb] hover:text-[#36342e]",
            )}
          >
            <Settings className="h-3.5 w-3.5" />
          </Button>
          <span className="pointer-events-none absolute top-1/2 right-[calc(100%+8px)] z-50 -translate-y-1/2 rounded-[8px] bg-[#201515] px-2.5 py-1 text-[11px] whitespace-nowrap text-[#fffefb] opacity-0 transition-opacity group-hover:opacity-100">
            预览设置
          </span>
        </div>

        {/* 1px 沙色短分割线 —— 单帖 AI 分析独立于上面 4 个跟项目流程相关的入口。 */}
        <div className="h-px w-5 bg-[#c5c0b1]" role="separator" aria-orientation="horizontal" />

        <div className="group relative">
          <Button
            unstyled
            type="button"
            onClick={() => {
              // 锁住时点击不切换 tab、不展开侧边栏，只触发提醒。
              if (!isSinglePostUnlocked) {
                onLockedSinglePostClick();
                return;
              }
              onSelectSidebarTab("single-post");
              if (collapsed) onToggleCollapse();
            }}
            aria-label="单帖 AI 分析"
            aria-disabled={!isSinglePostUnlocked}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150",
              !isSinglePostUnlocked
                ? "cursor-not-allowed text-[#c5c0b1]"
                : !collapsed && activeSidebarTab === "single-post"
                  ? "bg-[#ff4f00]/10 text-[#ff4f00]"
                  : "text-[#939084] hover:bg-[#fffefb] hover:text-[#36342e]",
            )}
          >
            {isSinglePostUnlocked ? (
              <Activity className="h-3.5 w-3.5" />
            ) : (
              <Lock className="h-3 w-3" />
            )}
          </Button>
          <span className="pointer-events-none absolute top-1/2 right-[calc(100%+8px)] z-50 -translate-y-1/2 rounded-[8px] bg-[#201515] px-2.5 py-1 text-[11px] whitespace-nowrap text-[#fffefb] opacity-0 transition-opacity group-hover:opacity-100">
            {isSinglePostUnlocked ? "单帖 AI 分析" : "打开任意帖子后解锁"}
          </span>
        </div>
      </div>

      <div className="flex-1" />
    </div>
  );
}
