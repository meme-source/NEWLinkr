import type { ComponentType } from "react";
import { Download, Mail, Radar, Search, Users } from "lucide-react";

export const BILLING_HISTORY = [
  { date: "04-14", item: "Pro 月度续费", amount: "$99", status: "已支付" },
  { date: "03-14", item: "Pro 月度续费", amount: "$99", status: "已支付" },
  { date: "02-14", item: "首次订阅", amount: "$99", status: "已支付" },
];

export type UsageIconKey = "search" | "mail" | "download" | "radar" | "users";

export const USAGE_QUOTA: {
  label: string;
  used: number;
  quota: number;
  unit: string;
  icon: UsageIconKey;
}[] = [
  { label: "博主搜索", used: 1240, quota: 5000, unit: "次", icon: "search" },
  { label: "建联邮件发送", used: 380, quota: 2000, unit: "封", icon: "mail" },
  { label: "联系方式获取", used: 86, quota: 200, unit: "次", icon: "download" },
  { label: "投放追踪", used: 18, quota: 50, unit: "条", icon: "radar" },
  { label: "团队席位", used: 1, quota: 5, unit: "席", icon: "users" },
];

export const USAGE_ICON_MAP: Record<UsageIconKey, ComponentType<{ className?: string }>> = {
  search: Search,
  mail: Mail,
  download: Download,
  radar: Radar,
  users: Users,
};
