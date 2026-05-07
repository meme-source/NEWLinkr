"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { AccountTab } from "@/features/settings/components/account-tab";
import { BillingTab } from "@/features/settings/components/billing-tab";
import { CpmTab } from "@/features/settings/components/cpm-tab";
import { TeamTab } from "@/features/settings/components/team-tab";

// §3.6 Settings tabs. 邮箱设置已挪到收件箱顶部（features/outreach/components/mailbar）。
type TabKey = "account" | "cpm" | "billing" | "team";

const TAB_COMPONENTS: Record<TabKey, React.ComponentType> = {
  account: AccountTab,
  cpm: CpmTab,
  billing: BillingTab,
  team: TeamTab,
};

const TAB_TITLE: Record<TabKey, string> = {
  account: "账户设置",
  cpm: "CPM 设置",
  billing: "账户与计费",
  team: "团队管理",
};

const DEFAULT_TAB: TabKey = "cpm";

function isTabKey(value: string | null): value is TabKey {
  return value === "account" || value === "cpm" || value === "billing" || value === "team";
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const raw = searchParams.get("tab");
  // 旧的 ?tab=email 链接 fallback 到默认 tab，用户能看到正常页面，
  // 邮箱设置现在的入口在 收件箱 顶部。
  const tab: TabKey = isTabKey(raw) ? raw : DEFAULT_TAB;
  const TabContent = TAB_COMPONENTS[tab];
  return (
    <div className="space-y-5">
      <h1 className="text-base font-semibold text-[#201515]">设置 / {TAB_TITLE[tab]}</h1>
      <TabContent />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse rounded-xl bg-[#eceae3]" />
          <div className="h-64 animate-pulse rounded-2xl bg-[#eceae3]" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
