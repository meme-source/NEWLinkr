"use client";

import { Mail, PanelRight, Search, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SidebarTab } from "@/features/plugin/types";

export function SidebarNavRail({
  collapsed,
  onToggleCollapse,
  activeSidebarTab,
  onSelectSidebarTab,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeSidebarTab: SidebarTab;
  onSelectSidebarTab: (tab: SidebarTab) => void;
}) {
  return (
    <div className="flex w-11 flex-shrink-0 flex-col items-center border-l border-[#c5c0b1] bg-[#eceae3]">
      <div className="flex flex-col items-center gap-2 pt-5">
        <div className="group relative">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "打开侧边栏" : "收起侧边栏"}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150",
              "text-[#939084] hover:bg-[#fffefb] hover:text-[#36342e]",
            )}
          >
            <PanelRight className="h-3.5 w-3.5" />
          </button>
          <span className="pointer-events-none absolute top-1/2 right-[calc(100%+8px)] z-50 -translate-y-1/2 rounded-[10px] bg-[#201515] px-2.5 py-1 text-[11px] whitespace-nowrap text-[#fffefb] opacity-0 transition-opacity group-hover:opacity-100">
            {collapsed ? "打开侧边栏" : "收起侧边栏"}
          </span>
        </div>

        <div className="group relative">
          <button
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
          </button>
          <span className="pointer-events-none absolute top-1/2 right-[calc(100%+8px)] z-50 -translate-y-1/2 rounded-[10px] bg-[#201515] px-2.5 py-1 text-[11px] whitespace-nowrap text-[#fffefb] opacity-0 transition-opacity group-hover:opacity-100">
            找相似
          </span>
        </div>

        <div className="group relative">
          <button
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
          </button>
          <span className="pointer-events-none absolute top-1/2 right-[calc(100%+8px)] z-50 -translate-y-1/2 rounded-[10px] bg-[#201515] px-2.5 py-1 text-[11px] whitespace-nowrap text-[#fffefb] opacity-0 transition-opacity group-hover:opacity-100">
            博主分析
          </span>
        </div>

        <div className="group relative">
          <button
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
          </button>
          <span className="pointer-events-none absolute top-1/2 right-[calc(100%+8px)] z-50 -translate-y-1/2 rounded-[10px] bg-[#201515] px-2.5 py-1 text-[11px] whitespace-nowrap text-[#fffefb] opacity-0 transition-opacity group-hover:opacity-100">
            邮件建联
          </span>
        </div>

        <div className="group relative">
          <button
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
          </button>
          <span className="pointer-events-none absolute top-1/2 right-[calc(100%+8px)] z-50 -translate-y-1/2 rounded-[10px] bg-[#201515] px-2.5 py-1 text-[11px] whitespace-nowrap text-[#fffefb] opacity-0 transition-opacity group-hover:opacity-100">
            预览设置
          </span>
        </div>
      </div>

      <div className="flex-1" />
    </div>
  );
}
