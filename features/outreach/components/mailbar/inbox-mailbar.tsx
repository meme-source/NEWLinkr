"use client";

import { CheckCircle2, Mail, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { MailAccount } from "@/features/outreach/components/mailbar/use-mail-settings";

interface InboxMailbarProps {
  account: MailAccount;
  onOpenSettings: () => void;
}

// 收件箱框顶部的窄条：账号 + 连接状态 + 「设置」按钮。
// 实际设置 UI 在 <EmailSettingsDrawer /> 中；本组件只负责展示与触发。
// 取代旧的「点击向下展开」交互（视觉上把收件箱挤没了）。
export function InboxMailbar({ account, onOpenSettings }: InboxMailbarProps) {
  return (
    <div className="flex items-center gap-2 border-b border-[#c5c0b1] bg-[#fffefb] px-4 py-2.5">
      <Mail className="h-4 w-4 shrink-0 text-[#36342e]" aria-hidden="true" />
      <span className="truncate text-sm font-medium text-[#201515]">
        {account.connected ? account.email : "未连接发件邮箱"}
      </span>

      {account.connected ? (
        <>
          <span className="shrink-0 rounded-full bg-[#eceae3] px-2 py-0.5 text-[11px] font-medium text-[#36342e]">
            {account.provider}
          </span>
          <span className="flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
            <CheckCircle2 className="h-3 w-3" />
            已连接
          </span>
        </>
      ) : null}

      <Button
        unstyled
        type="button"
        onClick={onOpenSettings}
        aria-label="邮箱设置"
        className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-md border border-[#c5c0b1] bg-[#fffefb] px-3 text-[13px] font-medium text-[#36342e] transition-colors hover:border-[#939084] hover:bg-[#eceae3] hover:text-[#201515] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#ff4f00]"
      >
        <Settings className="h-3.5 w-3.5 text-[#939084]" aria-hidden="true" />
        设置
      </Button>
    </div>
  );
}
