import { Mail, PanelRight, Search, Settings, User } from "lucide-react";

import { cn } from "@/lib/utils";
import type { SidebarTab } from "@/features/plugin/types";

export function SimilarSidebarNavRail({
  activeSidebarTab,
  collapsed,
  onSelectSidebarTab,
  onToggleCollapse,
}: {
  activeSidebarTab: SidebarTab;
  collapsed: boolean;
  onSelectSidebarTab: (tab: SidebarTab) => void;
  onToggleCollapse: () => void;
}) {
  const selectTab = (tab: SidebarTab) => {
    onSelectSidebarTab(tab);
    if (collapsed) onToggleCollapse();
  };

  const navItems: Array<{
    tab: SidebarTab;
    label: string;
    icon: typeof Search;
  }> = [
    { tab: "similar", label: "找相似", icon: Search },
    { tab: "current", label: "博主分析", icon: User },
    { tab: "email", label: "邮件建联", icon: Mail },
    { tab: "quick", label: "预览设置", icon: Settings },
  ];

  return (
    <div className="flex w-11 flex-shrink-0 flex-col items-center border-l border-[#e8e6dc] bg-[#f0ece4]">
      <div className="flex flex-col items-center gap-2 pt-5">
        <div className="group relative">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "打开侧边栏" : "收起侧边栏"}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150",
              "text-[#87867f] hover:bg-white hover:text-[#4d4c48]"
            )}
          >
            <PanelRight className="h-3.5 w-3.5" />
          </button>
          <span className="pointer-events-none absolute right-[calc(100%+8px)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-[10px] bg-[#141413] px-2.5 py-1 text-[11px] text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
            {collapsed ? "打开侧边栏" : "收起侧边栏"}
          </span>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const active = !collapsed && activeSidebarTab === item.tab;
          return (
            <div key={item.tab} className="group relative">
              <button
                type="button"
                onClick={() => selectTab(item.tab)}
                aria-label={item.label}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150",
                  active
                    ? "bg-[#c96442]/10 text-[#c96442]"
                    : "text-[#87867f] hover:bg-white hover:text-[#4d4c48]"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
              <span className="pointer-events-none absolute right-[calc(100%+8px)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-[10px] bg-[#141413] px-2.5 py-1 text-[11px] text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex-1" />
    </div>
  );
}
