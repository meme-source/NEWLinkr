"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import {
  BarChart2,
  Bell,
  ChevronDown,
  Compass,
  CreditCard,
  FileText,
  Inbox,
  Library,
  Link2,
  LogOut,
  Mail,
  Settings,
  Settings2,
  User,
  Users,
} from "lucide-react";

import { WorkspaceProjectBar } from "@/components/workspace/project-bar";
import { WorkspaceProjectProvider } from "@/components/workspace/project-context";
import { CreatorProfileProvider } from "@/components/ui/creator-profile-context";
import { cn } from "@/lib/utils";

// ── Custom sidebar toggle icons ────────────────────────────────────────────────
function ReleaseMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <rect x="5" y="3.75" width="14" height="16.5" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 8.25L13.75 12L9 15.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.75 8.25V15.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CollapseMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10 6.75V17.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M15.25 8.5L11.75 12L15.25 15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Nav structure ──────────────────────────────────────────────────────────────
type NavChild = { label: string; href: string; icon: React.ElementType };
type NavItem = { label: string; href: string; icon: React.ElementType; children?: NavChild[] };

const NAV_ITEMS: NavItem[] = [
  { label: "博主发现", href: "/workspace/discovery", icon: Compass },
  { label: "博主库",   href: "/workspace/library",   icon: Library },
  {
    label: "建联中心", href: "/workspace/outreach", icon: Mail,
    children: [
      { label: "建联面板", href: "/workspace/outreach?tab=mail-mgmt",     icon: BarChart2 },
      { label: "收件箱",   href: "/workspace/outreach?tab=inbox",         icon: Inbox },
      { label: "邮件模板", href: "/workspace/outreach?tab=templates",     icon: FileText },
      { label: "邮箱设置", href: "/workspace/outreach?tab=email-settings",icon: Settings2 },
    ],
  },
  {
    label: "设置", href: "/workspace/settings", icon: Settings,
    children: [
      { label: "项目管理",   href: "/workspace/settings?tab=project",      icon: Settings2 },
      { label: "账户与计费", href: "/workspace/settings?tab=billing",      icon: CreditCard },
      { label: "集成与授权", href: "/workspace/settings?tab=integrations", icon: Link2 },
      { label: "团队管理",   href: "/workspace/settings?tab=team",         icon: Users },
    ],
  },
];

const NOTIFICATIONS = [
  { id: 1, icon: "📧", text: "@skincare_sam 回复了你的邮件",    time: "2 小时前", unread: true },
  { id: 2, icon: "📈", text: "投放帖子 #38291 播放突破 50 万", time: "5 小时前", unread: true },
  { id: 3, icon: "⚠️", text: "帖子 #38105 48 小时数据异常",    time: "昨天",     unread: true },
  { id: 4, icon: "📥", text: "插件同步了 3 个新博主，待评估",  time: "昨天",     unread: false },
];

export default function WorkspaceDemoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [notifOpen, setNotifOpen]     = useState(false);
  const [userOpen,  setUserOpen]      = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [collapsed, setCollapsed]     = useState(false);
  const mainScrollRef = useRef<HTMLElement>(null);
  // Track which expandable sections are open
  const [expanded, setExpanded]       = useState<Set<string>>(new Set(["建联中心", "投放追踪", "设置"]));
  // Track the last-clicked child label within each section so it stays highlighted
  const [activeChild, setActiveChild] = useState<Record<string, string>>({});

  const unreadCount = notifications.filter(n => n.unread).length;
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, unread: false })));

  const toggleSection = (label: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
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

    if ((!hasVerticalDelta || !canScrollVertically) && (!hasHorizontalDelta || !canScrollHorizontally)) {
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
    <WorkspaceProjectProvider>
      <CreatorProfileProvider>
      <div className="h-screen w-screen overflow-hidden bg-[#f5f4ed]">
        <div className="flex h-full min-h-0 w-full">
          {/* ── Left SaaS sidebar ─────────────────────────────────────────────── */}
          <aside
            onWheelCapture={handleSidebarWheel}
            className={cn(
              "z-40 flex h-full shrink-0 flex-col border-r border-[#e8e6dc] bg-[#faf9f5] py-5 transition-all duration-200",
              collapsed ? "w-14 px-2" : "w-56 px-4"
            )}
          >
          {/* Brand + collapse toggle */}
          <div className={cn("mb-6 flex items-center", collapsed ? "justify-center" : "justify-between px-1")}>
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
                    <Image src="/2linkr-logo.png" alt="2Linkr" fill sizes="32px" className="object-contain" />
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
          <nav className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden">
            {NAV_ITEMS.map(item => {
              const hasChildren = !!item.children?.length;
              const isExpanded  = expanded.has(item.label);
              // Parent is "active" if pathname matches exactly (leaf) or starts with href (section root)
              const parentActive = pathname === item.href || pathname.startsWith(item.href + "/");
              // Section with children: active when on that section's page
              const anyChildActive = hasChildren && pathname === item.href;

              if (collapsed) {
                // Collapsed: just icon + tooltip, no children
                return (
                  <div key={item.href} className="relative group">
                    <Link
                      href={item.href}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl mx-auto transition-colors",
                        parentActive || anyChildActive
                          ? "bg-[#f5ede8] text-[#c96442]"
                          : "text-[#4d4c48] hover:bg-[#f0ece4] hover:text-[#141413]"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                    </Link>
                    <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-[#141413] px-2.5 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
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
                        : "text-[#4d4c48] hover:bg-[#f0ece4] hover:text-[#141413]"
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
                        : "text-[#4d4c48] hover:bg-[#f0ece4] hover:text-[#141413]"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 shrink-0", anyChildActive && "text-[#c96442]")} />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown className={cn(
                      "h-3.5 w-3.5 shrink-0 text-[#87867f] transition-transform duration-150",
                      isExpanded && "rotate-180"
                    )} />
                  </button>

                  {isExpanded && (
                    <div className="ml-[22px] mt-0.5 mb-1 border-l border-[#e8e6dc] pl-3 space-y-0.5">
                      {item.children!.map(child => {
                        const childActive =
                          anyChildActive &&
                          (activeChild[item.label] ?? item.children![0].label) === child.label;
                        return (
                          <Link
                            key={child.label}
                            href={child.href}
                            onClick={() => setActiveChild(prev => ({ ...prev, [item.label]: child.label }))}
                            className={cn(
                              "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                              childActive
                                ? "bg-[#f5ede8] font-medium text-[#c96442]"
                                : "text-[#4d4c48] hover:bg-[#f0ece4] hover:text-[#141413]"
                            )}
                          >
                            <child.icon className={cn("h-3.5 w-3.5 shrink-0", childActive && "text-[#c96442]")} />
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
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => { setNotifOpen(v => !v); setUserOpen(false); }}
                    className="relative flex h-10 w-10 items-center justify-center rounded-xl mx-auto text-[#4d4c48] transition-colors hover:bg-[#f0ece4] hover:text-[#141413]"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#c96442]" />}
                  </button>
                  <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-[#141413] px-2.5 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                    通知{unreadCount > 0 ? `（${unreadCount}）` : ""}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setNotifOpen(v => !v); setUserOpen(false); }}
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
                    <button type="button" onClick={markAllRead} className="text-xs text-[#c96442] hover:underline">全部已读</button>
                  </div>
                  <div className="divide-y divide-[#f0ece4]">
                    {notifications.map(n => (
                      <div key={n.id} className={cn("flex items-start gap-3 px-4 py-3 text-sm", n.unread && "bg-[#fdf9f5]")}>
                        <span className="text-base">{n.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[#141413]">{n.text}</p>
                          <p className="mt-0.5 text-xs text-[#87867f]">{n.time}</p>
                        </div>
                        {n.unread && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c96442]" />}
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-[#e8e6dc] px-4 py-2.5">
                    <button type="button" className="text-xs text-[#4d4c48] hover:text-[#141413]">查看全部通知 →</button>
                  </div>
                </div>
              )}
            </div>

            {/* User */}
            <div className="relative">
              {collapsed ? (
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => { setUserOpen(v => !v); setNotifOpen(false); }}
                    className="flex h-10 w-10 items-center justify-center rounded-xl mx-auto transition-colors hover:bg-[#f0ece4]"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#c96442] text-[11px] font-semibold text-white">李</div>
                  </button>
                  <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-[#141413] px-2.5 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">李明</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setUserOpen(v => !v); setNotifOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 transition-colors hover:bg-[#f0ece4]"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#c96442] text-[11px] font-semibold text-white">李</div>
                  <span className="text-sm text-[#4d4c48]">李明</span>
                  <ChevronDown className="ml-auto h-3.5 w-3.5 text-[#87867f]" />
                </button>
              )}

              {userOpen && (
                <div className="absolute bottom-full left-0 z-50 mb-2 w-48 rounded-2xl border border-[#e8e6dc] bg-white shadow-[0_20px_60px_-20px_rgba(77,76,72,0.2)]">
                  <div className="border-b border-[#f0ece4] px-3 py-2.5">
                    <p className="text-sm font-medium text-[#141413]">李明</p>
                    <p className="text-xs text-[#87867f]">liming@mybrand.com</p>
                  </div>
                  <div className="p-1.5">
                    <button type="button" className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[#4d4c48] hover:bg-[#f5f4ed]"><User className="h-3.5 w-3.5" />账户设置</button>
                    <button type="button" className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[#4d4c48] hover:bg-[#f5f4ed]"><LogOut className="h-3.5 w-3.5" />退出登录</button>
                  </div>
                </div>
              )}
            </div>
          </div>
          </aside>

          {/* ── Main content ───────────────────────────────────────────────────── */}
          <main ref={mainScrollRef} className="min-h-0 min-w-0 flex-1 overflow-y-auto px-6 py-8">
            {pathname !== "/workspace/discovery" ? (
              <WorkspaceProjectBar pathname={pathname} />
            ) : null}
            {children}
          </main>

          {(notifOpen || userOpen) && (
            <div className="fixed inset-0 z-30" onClick={() => { setNotifOpen(false); setUserOpen(false); }} />
          )}
        </div>
      </div>
      </CreatorProfileProvider>
    </WorkspaceProjectProvider>
  );
}
