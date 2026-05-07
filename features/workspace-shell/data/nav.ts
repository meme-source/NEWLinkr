// Sidebar navigation tree for the workspace shell.
// Adding a new top-level page: insert here, then create a route under
// app/(workspace)/workspace/<slug>/page.tsx.

import {
  BarChart3,
  Compass,
  CreditCard,
  FileText,
  FolderKanban,
  Gauge,
  Inbox,
  Library,
  Settings,
  Users,
} from "lucide-react";

export type NavChild = { label: string; href: string; icon: React.ElementType };
export type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  children?: NavChild[];
};

export const WORKSPACE_NAV_ITEMS: NavItem[] = [
  { label: "博主发现", href: "/workspace/discovery", icon: Compass },
  { label: "博主库", href: "/workspace/library", icon: Library },
  {
    label: "项目管理",
    href: "/workspace/outreach",
    icon: FolderKanban,
    children: [
      { label: "追踪看板", href: "/workspace/outreach?tab=board", icon: BarChart3 },
      { label: "收件箱", href: "/workspace/outreach?tab=inbox", icon: Inbox },
      { label: "邮件模板", href: "/workspace/outreach?tab=templates", icon: FileText },
    ],
  },
  {
    label: "设置",
    href: "/workspace/settings",
    icon: Settings,
    children: [
      { label: "CPM 设置", href: "/workspace/settings?tab=cpm", icon: Gauge },
      { label: "账户与计费", href: "/workspace/settings?tab=billing", icon: CreditCard },
      { label: "团队管理", href: "/workspace/settings?tab=team", icon: Users },
    ],
  },
];
