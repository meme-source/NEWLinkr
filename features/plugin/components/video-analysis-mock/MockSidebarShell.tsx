"use client";

import { Activity, Mail, PanelRight, Search, Settings, User } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

export type SidebarTabId = "similar" | "current" | "email" | "quick" | "single-post";

interface SidebarTabSpec {
  id: SidebarTabId;
  label: string;
  Icon: typeof Search;
  /** "single-post" 跟前 4 个不是同一组功能 —— 它针对当前打开的帖子，
   *  视觉上用上方一条短分割线区分。 */
  divided?: boolean;
}

const TABS: SidebarTabSpec[] = [
  { id: "similar", label: "找相似", Icon: Search },
  { id: "current", label: "博主分析", Icon: User },
  { id: "email", label: "邮件建联", Icon: Mail },
  { id: "quick", label: "预览设置", Icon: Settings },
  { id: "single-post", label: "单帖 AI 分析", Icon: Activity, divided: true },
];

interface MockSidebarShellProps {
  activeTab: SidebarTabId;
  onSelectTab: (tab: SidebarTabId) => void;
  children: ReactNode;
}

/**
 * MockSidebarShell — Linkr 浏览器扩展侧栏的精简视觉 mock。
 *
 * 真产品的 SimilarSidebar 有 70+ props（项目选择 / 创作者卡 / 多 tab 内容 /
 * 邮件草稿 / 数据同步配置 …）。本 mock 只复刻**视觉骨架**：
 *  - 右侧 44px 窄列 NavRail（5 个已有 icon + 短分割线 + 新增 Activity icon）
 *  - 左侧主内容区由父组件通过 children 注入
 *  - 选中态 token 跟真 SidebarNavRail 完全一致（`bg-[#ff4f00]/10 text-[#ff4f00]`）
 *
 * "单帖 AI 分析" icon 上方画一条 1px 短分割线，视觉表达"这是另一组功能"
 * （区别于 NavRail 上方那 4 个跟项目流程相关的入口）。
 */
export function MockSidebarShell({ activeTab, onSelectTab, children }: MockSidebarShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className="flex h-full border-l"
      style={{
        borderColor: "#c5c0b1",
        width: collapsed ? 44 : 424,
        transition: "width 200ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {!collapsed ? (
        <div className="flex-1 overflow-hidden bg-[#fffefb]" style={{ minWidth: 0 }}>
          {children}
        </div>
      ) : null}

      <nav
        aria-label="侧栏导航"
        className="flex w-11 flex-shrink-0 flex-col items-center border-l"
        style={{ borderColor: "#c5c0b1", backgroundColor: "#eceae3" }}
      >
        <div className="flex flex-col items-center gap-2 pt-5">
          <NavIconButton
            icon={<PanelRight className="h-3.5 w-3.5" />}
            tooltip={collapsed ? "打开侧栏" : "收起侧栏"}
            active={false}
            onClick={() => setCollapsed((c) => !c)}
            ariaLabel={collapsed ? "打开侧栏" : "收起侧栏"}
          />

          {TABS.map((tab) => (
            <div key={tab.id} className="flex flex-col items-center gap-2">
              {tab.divided ? (
                <div
                  className="h-px w-5"
                  style={{ backgroundColor: "#c5c0b1" }}
                  role="separator"
                  aria-orientation="horizontal"
                />
              ) : null}
              <NavIconButton
                icon={<tab.Icon className="h-3.5 w-3.5" />}
                tooltip={tab.label}
                active={!collapsed && activeTab === tab.id}
                onClick={() => {
                  if (collapsed) setCollapsed(false);
                  onSelectTab(tab.id);
                }}
                ariaLabel={tab.label}
              />
            </div>
          ))}
        </div>
      </nav>
    </aside>
  );
}

function NavIconButton({
  icon,
  tooltip,
  active,
  onClick,
  ariaLabel,
}: {
  icon: ReactNode;
  tooltip: string;
  active: boolean;
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <div className="group relative">
      <Button
        unstyled
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        aria-pressed={active}
        className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150"
        style={{
          backgroundColor: active ? "rgba(255, 79, 0, 0.10)" : "transparent",
          color: active ? "#ff4f00" : "#939084",
        }}
      >
        {icon}
      </Button>
      <span
        className="pointer-events-none absolute top-1/2 right-[calc(100%+8px)] z-50 -translate-y-1/2 rounded-[8px] px-2.5 py-1 text-[11px] whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100"
        style={{ backgroundColor: "#201515", color: "#fffefb" }}
      >
        {tooltip}
      </span>
    </div>
  );
}

// ─── Placeholder 内容（非 single-post 的 4 个 tab）──────────────────────

export function MockOtherTabPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div
        className="mb-3 flex h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: "#eceae3", color: "#939084" }}
      >
        <Settings size={18} strokeWidth={2} aria-hidden />
      </div>
      <div className="text-[13px] font-semibold" style={{ color: "#201515" }}>
        {label}
      </div>
      <div className="mt-1.5 text-[11px] leading-[1.55]" style={{ color: "#939084" }}>
        这一栏由真产品的 SimilarSidebar 负责，
        <br />本 mock 只演示「单帖 AI 分析」入口。
      </div>
    </div>
  );
}
