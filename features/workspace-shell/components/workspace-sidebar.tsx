"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type RefObject } from "react";
import { Bell, ChevronDown, LogOut, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { WORKSPACE_NAV_ITEMS } from "@/features/workspace-shell/data/nav";
import {
  WORKSPACE_DEMO_NOTIFICATIONS,
  type WorkspaceNotification,
} from "@/features/workspace-shell/data/notifications";
import { WORKSPACE_DEMO_USER } from "@/features/workspace-shell/data/demo-user";
import {
  CollapseMark,
  ReleaseMark,
} from "@/features/workspace-shell/components/sidebar-toggle-icons";

type Props = {
  notifOpen: boolean;
  setNotifOpen: (open: boolean) => void;
  userOpen: boolean;
  setUserOpen: (open: boolean) => void;
  // Forwarded so wheel events on the sidebar can scroll the main pane.
  mainScrollRef: RefObject<HTMLElement | null>;
};

export function WorkspaceSidebar({
  notifOpen,
  setNotifOpen,
  userOpen,
  setUserOpen,
  mainScrollRef,
}: Props) {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<WorkspaceNotification[]>(
    WORKSPACE_DEMO_NOTIFICATIONS,
  );
  const [collapsed, setCollapsed] = useState(false);
  // Track which expandable sections are open
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["建联中心", "投放追踪", "设置"]));
  // Track the last-clicked child label within each section so it stays highlighted
  const [activeChild, setActiveChild] = useState<Record<string, string>>({});

  const unreadCount = notifications.filter((n) => n.unread).length;
  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));

  const toggleSection = (label: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });

  const handleSidebarWheel = (event: React.WheelEvent<HTMLElement>) => {
    const mainScrollElement = mainScrollRef.current;

    if (!mainScrollElement || event.ctrlKey) {
      return;
    }

    const canScrollVertically = mainScrollElement.scrollHeight > mainScrollElement.clientHeight;
    const canScrollHorizontally = mainScrollElement.scrollWidth > mainScrollElement.clientWidth;
    const hasVerticalDelta = event.deltaY !== 0;
    const hasHorizontalDelta = event.deltaX !== 0;

    if (
      (!hasVerticalDelta || !canScrollVertically) &&
      (!hasHorizontalDelta || !canScrollHorizontally)
    ) {
      return;
    }

    event.preventDefault();
    mainScrollElement.scrollBy({
      top: event.deltaY,
      left: event.deltaX,
      behavior: "auto",
    });
  };

  return (
    <aside
      onWheelCapture={handleSidebarWheel}
      className={cn(
        "z-40 flex h-full shrink-0 flex-col border-r border-[#e8e6dc] bg-[#faf9f5] py-5 transition-all duration-200",
        collapsed ? "w-14 px-2" : "w-56 px-4",
      )}
    >
      {/* Brand + collapse toggle */}
      <div
        className={cn(
          "mb-6 flex items-center",
          collapsed ? "justify-center" : "justify-between px-1",
        )}
      >
        {collapsed ? (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            title="展开侧边栏"
            className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-[#f0ece4]"
          >
            <ReleaseMark className="h-5 w-5 text-[#4d4c48]" />
          </button>
        ) : (
          <>
            <Link href="/" className="flex items-center gap-2.5 rounded-xl py-1">
              <div className="relative h-8 w-8 shrink-0">
                <Image
                  src="/2linkr-logo.png"
                  alt="2Linkr"
                  fill
                  sizes="32px"
                  className="object-contain"
                />
              </div>
              <span className="text-base font-semibold text-[#141413]">Linkr</span>
            </Link>
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              title="收起侧边栏"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#87867f] transition-colors hover:bg-[#f0ece4] hover:text-[#141413]"
            >
              <CollapseMark className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-x-hidden overflow-y-auto">
        {WORKSPACE_NAV_ITEMS.map((item) => {
          const hasChildren = !!item.children?.length;
          const isExpanded = expanded.has(item.label);
          // Parent is "active" if pathname matches exactly (leaf) or starts with href (section root)
          const parentActive = pathname === item.href || pathname.startsWith(item.href + "/");
          // Section with children: active when on that section's page
          const anyChildActive = hasChildren && pathname === item.href;

          if (collapsed) {
            // Collapsed: just icon + tooltip, no children
            return (
              <div key={item.href} className="group relative">
                <Link
                  href={item.href}
                  className={cn(
                    "mx-auto flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                    parentActive || anyChildActive
                      ? "bg-[#f5ede8] text-[#c96442]"
                      : "text-[#4d4c48] hover:bg-[#f0ece4] hover:text-[#141413]",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                </Link>
                <span className="pointer-events-none absolute top-1/2 left-full z-50 ml-3 -translate-y-1/2 rounded-lg bg-[#141413] px-2.5 py-1.5 text-xs whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  {item.label}
                </span>
              </div>
            );
          }

          // Expanded sidebar
          if (!hasChildren) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  parentActive
                    ? "bg-[#f5ede8] text-[#c96442]"
                    : "text-[#4d4c48] hover:bg-[#f0ece4] hover:text-[#141413]",
                )}
              >
                <item.icon className={cn("h-4 w-4 shrink-0", parentActive && "text-[#c96442]")} />
                {item.label}
              </Link>
            );
          }

          // Item with children
          return (
            <div key={item.href}>
              <button
                type="button"
                onClick={() => toggleSection(item.label)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  anyChildActive
                    ? "text-[#c96442]"
                    : "text-[#4d4c48] hover:bg-[#f0ece4] hover:text-[#141413]",
                )}
              >
                <item.icon className={cn("h-4 w-4 shrink-0", anyChildActive && "text-[#c96442]")} />
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 text-[#87867f] transition-transform duration-150",
                    isExpanded && "rotate-180",
                  )}
                />
              </button>

              {isExpanded && (
                <div className="mt-0.5 mb-1 ml-[22px] space-y-0.5 border-l border-[#e8e6dc] pl-3">
                  {item.children!.map((child) => {
                    const childActive =
                      anyChildActive &&
                      (activeChild[item.label] ?? item.children![0].label) === child.label;
                    return (
                      <Link
                        key={child.label}
                        href={child.href}
                        onClick={() =>
                          setActiveChild((prev) => ({ ...prev, [item.label]: child.label }))
                        }
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                          childActive
                            ? "bg-[#f5ede8] font-medium text-[#c96442]"
                            : "text-[#4d4c48] hover:bg-[#f0ece4] hover:text-[#141413]",
                        )}
                      >
                        <child.icon
                          className={cn("h-3.5 w-3.5 shrink-0", childActive && "text-[#c96442]")}
                        />
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Bottom: notification + user ──────────────────────────────────── */}
      <div className="mt-4 space-y-2">
        {/* Notification */}
        <div className="relative">
          {collapsed ? (
            <div className="group relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  setUserOpen(false);
                }}
                className="relative mx-auto flex h-10 w-10 items-center justify-center rounded-xl text-[#4d4c48] transition-colors hover:bg-[#f0ece4] hover:text-[#141413]"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#c96442]" />
                )}
              </button>
              <span className="pointer-events-none absolute top-1/2 left-full z-50 ml-3 -translate-y-1/2 rounded-lg bg-[#141413] px-2.5 py-1.5 text-xs whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                通知{unreadCount > 0 ? `（${unreadCount}）` : ""}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setNotifOpen(!notifOpen);
                setUserOpen(false);
              }}
              className="relative flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#4d4c48] transition-colors hover:bg-[#f0ece4] hover:text-[#141413]"
            >
              <Bell className="h-4 w-4" />
              通知
              {unreadCount > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c96442] px-1.5 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          {notifOpen && (
            <div className="absolute bottom-full left-0 z-50 mb-2 w-80 rounded-2xl border border-[#e8e6dc] bg-white shadow-[0_20px_60px_-20px_rgba(77,76,72,0.2)]">
              <div className="flex items-center justify-between border-b border-[#e8e6dc] px-4 py-3">
                <span className="text-sm font-semibold text-[#141413]">通知</span>
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs text-[#c96442] hover:underline"
                >
                  全部已读
                </button>
              </div>
              <div className="divide-y divide-[#f0ece4]">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 text-sm",
                      n.unread && "bg-[#fdf9f5]",
                    )}
                  >
                    <span className="text-base">{n.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[#141413]">{n.text}</p>
                      <p className="mt-0.5 text-xs text-[#87867f]">{n.time}</p>
                    </div>
                    {n.unread && (
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c96442]" />
                    )}
                  </div>
                ))}
              </div>
              <div className="border-t border-[#e8e6dc] px-4 py-2.5">
                <button type="button" className="text-xs text-[#4d4c48] hover:text-[#141413]">
                  查看全部通知 →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User */}
        <div className="relative">
          {collapsed ? (
            <div className="group relative">
              <button
                type="button"
                onClick={() => {
                  setUserOpen(!userOpen);
                  setNotifOpen(false);
                }}
                className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-[#f0ece4]"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#c96442] text-[11px] font-semibold text-white">
                  {WORKSPACE_DEMO_USER.initial}
                </div>
              </button>
              <span className="pointer-events-none absolute top-1/2 left-full z-50 ml-3 -translate-y-1/2 rounded-lg bg-[#141413] px-2.5 py-1.5 text-xs whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                {WORKSPACE_DEMO_USER.name}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setUserOpen(!userOpen);
                setNotifOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 transition-colors hover:bg-[#f0ece4]"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#c96442] text-[11px] font-semibold text-white">
                {WORKSPACE_DEMO_USER.initial}
              </div>
              <span className="text-sm text-[#4d4c48]">{WORKSPACE_DEMO_USER.name}</span>
              <ChevronDown className="ml-auto h-3.5 w-3.5 text-[#87867f]" />
            </button>
          )}

          {userOpen && (
            <div className="absolute bottom-full left-0 z-50 mb-2 w-48 rounded-2xl border border-[#e8e6dc] bg-white shadow-[0_20px_60px_-20px_rgba(77,76,72,0.2)]">
              <div className="border-b border-[#f0ece4] px-3 py-2.5">
                <p className="text-sm font-medium text-[#141413]">{WORKSPACE_DEMO_USER.name}</p>
                <p className="text-xs text-[#87867f]">{WORKSPACE_DEMO_USER.email}</p>
              </div>
              <div className="p-1.5">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[#4d4c48] hover:bg-[#f5f4ed]"
                >
                  <User className="h-3.5 w-3.5" />
                  账户设置
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[#4d4c48] hover:bg-[#f5f4ed]"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  退出登录
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
