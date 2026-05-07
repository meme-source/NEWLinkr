"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, Mail } from "lucide-react";

import { MailbarAccountRow } from "@/features/outreach/components/mailbar/mailbar-account-row";
import { MailbarDefaultsForm } from "@/features/outreach/components/mailbar/mailbar-defaults-form";
import { useMailSettings } from "@/features/outreach/components/mailbar/use-mail-settings";
import { cn } from "@/lib/utils";

// §3.6.2 (refactor): 「邮箱设置」从 /settings 挪进收件箱顶部。
// 默认折叠成单行（≈48px），不会持续占据阅读区；只有在
//   - 未连接邮箱
//   - 关键账号变量为空（my_name / brand_name）
//   - 用户主动点「设置 ▾」
// 三种情况下展开。保存后自动收起。
export function InboxMailbar() {
  const settings = useMailSettings();
  const { account, accountVars, hasMissingDefaults, setAccountConnected, updateAccountVar } =
    settings;

  const needsAttention = !account.connected || hasMissingDefaults;
  const [userExpanded, setUserExpanded] = useState(false);
  const [hasManuallyToggled, setHasManuallyToggled] = useState(false);
  const [toast, setToast] = useState(false);

  const expanded = hasManuallyToggled ? userExpanded : needsAttention;

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(false), 2000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const toggle = () => {
    setHasManuallyToggled(true);
    setUserExpanded((v) => !v);
  };

  const handleSave = () => {
    setToast(true);
    setHasManuallyToggled(true);
    setUserExpanded(false);
  };

  const summaryRight = account.connected
    ? [
        accountVars.my_name.trim() ? `发件人 ${accountVars.my_name}` : "未填发件人",
        accountVars.brand_name.trim() ? `品牌 ${accountVars.brand_name}` : "未填品牌",
        accountVars.signature.trim() ? "签名 已设置" : "签名 未设置",
      ].join(" · ")
    : "未连接发件邮箱";

  return (
    <section
      aria-label="邮箱设置"
      className="sticky top-0 z-10 overflow-hidden rounded-2xl border border-[#c5c0b1] bg-[#fffefb]"
    >
      {toast ? (
        <div className="flex items-center gap-1.5 border-b border-emerald-100 bg-emerald-50 px-4 py-1.5 text-xs text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          邮箱设置已保存
        </div>
      ) : null}

      <SummaryRow
        connected={account.connected}
        email={account.email}
        provider={account.provider}
        summary={summaryRight}
        expanded={expanded}
        onToggle={toggle}
      />

      {needsAttention && !expanded ? (
        <div className="flex items-center gap-1.5 border-t border-[#fff7f4] bg-[#fff7f4] px-4 py-1.5 text-[11px] text-[#ff4f00]">
          <AlertCircle className="h-3 w-3" />
          {!account.connected
            ? "建议先连接发件邮箱，再开始处理收件箱内容"
            : "请补全发件人姓名 / 品牌名，以便变量正确替换"}
        </div>
      ) : null}

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="space-y-4 border-t border-[#eceae3] px-4 py-4">
            <Section title="账号绑定">
              <MailbarAccountRow
                account={account}
                onConnect={() => setAccountConnected(true)}
                onDisconnect={() => setAccountConnected(false)}
              />
            </Section>
            <Section title="发件人信息 / 默认变量">
              <MailbarDefaultsForm values={accountVars} onChange={updateAccountVar} />
            </Section>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setHasManuallyToggled(true);
                  setUserExpanded(false);
                }}
                className="rounded-lg border border-[#c5c0b1] bg-[#fffefb] px-3.5 py-1.5 text-xs text-[#36342e] hover:bg-[#eceae3]"
              >
                收起
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-lg bg-[#201515] px-4 py-1.5 text-xs font-medium text-[#fffefb] hover:bg-[#36342e]"
              >
                保存设置
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface SummaryRowProps {
  connected: boolean;
  email: string;
  provider: string;
  summary: string;
  expanded: boolean;
  onToggle: () => void;
}

function SummaryRow({ connected, email, provider, summary, expanded, onToggle }: SummaryRowProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#fffdf9]"
      aria-expanded={expanded}
    >
      <Mail className={cn("h-4 w-4 shrink-0", connected ? "text-[#36342e]" : "text-[#ff4f00]")} />
      <div className="flex min-w-0 items-baseline gap-2">
        <span className="truncate text-sm font-medium text-[#201515]">
          {connected ? email : "未连接发件邮箱"}
        </span>
        {connected ? (
          <>
            <span className="shrink-0 rounded-full bg-[#eceae3] px-1.5 py-0.5 text-[10px] text-[#36342e]">
              {provider}
            </span>
            <span className="flex shrink-0 items-center gap-1 text-[10px] text-emerald-600">
              <CheckCircle2 className="h-3 w-3" />
              已连接
            </span>
          </>
        ) : null}
      </div>
      <span className="ml-auto flex min-w-0 items-center gap-2">
        <span className="hidden truncate text-[11px] text-[#939084] md:inline">{summary}</span>
        <span className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-[#36342e]">
          {expanded ? "收起" : "设置"}
          <ChevronDown
            className={cn("h-3 w-3 transition-transform", expanded ? "rotate-180" : "rotate-0")}
          />
        </span>
      </span>
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-medium tracking-wide text-[#939084] uppercase">{title}</p>
      {children}
    </div>
  );
}
