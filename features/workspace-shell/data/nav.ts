// Sidebar navigation tree for the workspace shell.
// Adding a new top-level page: insert here, then create a route under
// app/(workspace)/workspace/<slug>/page.tsx.

import {
  BarChart2,
  Compass,
  CreditCard,
  FileText,
  Inbox,
  Library,
  Link2,
  Mail,
  Settings,
  Settings2,
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
    label: "建联中心",
    href: "/workspace/outreach",
    icon: Mail,
    children: [
      { label: "建联面板", href: "/workspace/outreach?tab=mail-mgmt", icon: BarChart2 },
      { label: "收件箱", href: "/workspace/outreach?tab=inbox", icon: Inbox },
      { label: "邮件模板", href: "/workspace/outreach?tab=templates", icon: FileText },
      { label: "邮箱设置", href: "/workspace/outreach?tab=email-settings", icon: Settings2 },
    ],
  },
  {
    label: "设置",
    href: "/workspace/settings",
    icon: Settings,
    children: [
      { label: "项目管理", href: "/workspace/settings?tab=project", icon: Settings2 },
      { label: "账户与计费", href: "/workspace/settings?tab=billing", icon: CreditCard },
      { label: "集成与授权", href: "/workspace/settings?tab=integrations", icon: Link2 },
      { label: "团队管理", href: "/workspace/settings?tab=team", icon: Users },
    ],
  },
];
