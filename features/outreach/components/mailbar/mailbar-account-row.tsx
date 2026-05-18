"use client";

import { useState } from "react";
import { CheckCircle2, Mail, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { MailAccount } from "@/features/outreach/components/mailbar/use-mail-settings";

interface MailbarAccountRowProps {
  account: MailAccount;
  onConnect: () => void;
  onDisconnect: () => void;
}

// §3.6.2 (refactor): 展开态里的「Gmail 绑定」行 — 比旧版 EmailSettingsCard 紧凑，
// 不再独占整张大卡片，只在邮箱设置展开时出现。
export function MailbarAccountRow({ account, onConnect, onDisconnect }: MailbarAccountRowProps) {
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  if (!account.connected) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-[#c5c0b1] bg-[#fffdf9] px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-[#939084]">
          <Mail className="h-4 w-4" />
          尚未绑定发件邮箱
        </div>
        <Button
          unstyled
          type="button"
          onClick={onConnect}
          className="flex items-center gap-1.5 rounded-lg bg-[#201515] px-3.5 py-1.5 text-xs font-medium text-[#fffefb] hover:bg-[#36342e]"
        >
          <Mail className="h-3.5 w-3.5" />
          连接 Gmail
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-[#c5c0b1] bg-[#fffdf9] px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <Mail className="h-4 w-4 shrink-0 text-[#939084]" />
          <span className="truncate text-sm font-medium text-[#201515]">{account.email}</span>
          <span className="shrink-0 rounded-full bg-[#eceae3] px-1.5 py-0.5 text-[10px] text-[#36342e]">
            {account.provider}
          </span>
          <span className="flex shrink-0 items-center gap-1 text-[11px] text-emerald-600">
            <CheckCircle2 className="h-3 w-3" />
            已连接
          </span>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <Button
            unstyled
            type="button"
            className="rounded-md border border-[#c5c0b1] px-2.5 py-1 text-[11px] text-[#36342e] hover:bg-[#eceae3]"
          >
            重新授权
          </Button>
          <Button
            unstyled
            type="button"
            onClick={() => setConfirmDisconnect(true)}
            className="rounded-md border border-red-200 px-2.5 py-1 text-[11px] text-red-600 hover:bg-red-50"
          >
            断开
          </Button>
        </div>
      </div>

      {confirmDisconnect ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-100 bg-red-50 px-4 py-2.5 text-xs">
          <span className="text-red-700">断开后进行中的发件任务将暂停。确认？</span>
          <div className="flex gap-1.5">
            <Button
              unstyled
              type="button"
              onClick={() => {
                onDisconnect();
                setConfirmDisconnect(false);
              }}
              className="rounded-md bg-red-500 px-3 py-1 text-[11px] font-medium text-[#fffefb] hover:bg-red-600"
            >
              确认断开
            </Button>
            <Button
              unstyled
              type="button"
              onClick={() => setConfirmDisconnect(false)}
              className="rounded-md border border-[#c5c0b1] bg-[#fffefb] px-3 py-1 text-[11px] text-[#36342e] hover:bg-[#eceae3]"
            >
              取消
            </Button>
          </div>
        </div>
      ) : null}

      <Button
        unstyled
        type="button"
        className="flex items-center gap-1 text-[11px] text-[#ff4f00] hover:underline"
      >
        <Plus className="h-3 w-3" />
        绑定新邮箱
      </Button>
    </div>
  );
}
