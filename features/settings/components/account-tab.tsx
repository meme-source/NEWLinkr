"use client";

import { useCallback, useState } from "react";
import { Camera, Check, Globe2, KeyRound, Mail, ShieldCheck, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WORKSPACE_DEMO_USER } from "@/features/workspace-shell/data/demo-user";
import { cn } from "@/lib/utils";

// §3.6.x 账户设置 — 用户头像菜单点击"账户设置"以弹窗形式打开，
// 同一份表单也用于 /workspace/settings?tab=account 长页面。
// 后端 Phase 0 阶段未接入，所有表单仅做本地态展示。
type Language = "zh-CN" | "en-US" | "ja-JP";
type Timezone = "Asia/Shanghai" | "Asia/Tokyo" | "America/Los_Angeles" | "Europe/London";

const LANGUAGES: { value: Language; label: string }[] = [
  { value: "zh-CN", label: "简体中文" },
  { value: "en-US", label: "English" },
  { value: "ja-JP", label: "日本語" },
];

const TIMEZONES: { value: Timezone; label: string }[] = [
  { value: "Asia/Shanghai", label: "(GMT+8) 北京 / 上海" },
  { value: "Asia/Tokyo", label: "(GMT+9) 东京" },
  { value: "America/Los_Angeles", label: "(GMT-8) 洛杉矶" },
  { value: "Europe/London", label: "(GMT+0) 伦敦" },
];

type EmailPrefKey = "weekly" | "outreach" | "product";

const EMAIL_PREFS: { key: EmailPrefKey; label: string; desc: string }[] = [
  { key: "weekly", label: "周报摘要", desc: "每周一汇总本周博主动态、邮件回复、项目进展" },
  { key: "outreach", label: "建联回复提醒", desc: "博主回复邮件后第一时间通过邮件通知你" },
  { key: "product", label: "产品更新", desc: "Linkr 新功能、版本更新及最佳实践" },
];

// Design doc §5: inputs use 5px radius (Content tier).
const INPUT_CLASS =
  "w-full rounded-[5px] border border-[#c5c0b1] bg-[#fffefb] px-3 py-2 text-sm text-[#201515] placeholder:text-[#939084] transition-colors focus:border-[#ff4f00] focus:outline-none";

export type AccountForm = ReturnType<typeof useAccountForm>;

// 表单状态独立成 hook，让弹窗和长页面共享同一份内部结构。
// 弹窗会把保存条放进 dialog footer，因此必须能在 sections 之外触发 handleSave。
export function useAccountForm() {
  const [name, setName] = useState(WORKSPACE_DEMO_USER.name);
  const [displayName, setDisplayName] = useState(WORKSPACE_DEMO_USER.name);
  const [company, setCompany] = useState("My Brand Co., Ltd.");
  const [language, setLanguage] = useState<Language>("zh-CN");
  const [timezone, setTimezone] = useState<Timezone>("Asia/Shanghai");
  const [twoFactor, setTwoFactor] = useState(false);
  const [emailPrefs, setEmailPrefs] = useState<Record<EmailPrefKey, boolean>>({
    weekly: true,
    outreach: true,
    product: false,
  });
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const handleSave = useCallback(() => {
    // Phase 0: 仅本地展示。Phase 1 接 /api/users/me PATCH。
    setSavedAt(Date.now());
  }, []);

  const togglePref = useCallback((key: EmailPrefKey) => {
    setEmailPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return {
    name,
    setName,
    displayName,
    setDisplayName,
    company,
    setCompany,
    language,
    setLanguage,
    timezone,
    setTimezone,
    twoFactor,
    setTwoFactor,
    emailPrefs,
    togglePref,
    savedAt,
    handleSave,
  };
}

// 仅渲染四个区块；保存条由父组件控制（页面 sticky / 弹窗 footer）。
export function AccountSections({ form }: { form: AccountForm }) {
  const {
    name,
    setName,
    displayName,
    setDisplayName,
    company,
    setCompany,
    language,
    setLanguage,
    timezone,
    setTimezone,
    twoFactor,
    setTwoFactor,
    emailPrefs,
    togglePref,
  } = form;

  return (
    <div className="w-full space-y-4">
      {/* 个人资料 */}
      <section className="rounded-[5px] border border-[#c5c0b1] bg-[#fffefb] p-6">
        <header className="mb-5">
          <h3 className="text-sm font-semibold text-[#201515]">个人资料</h3>
          <p className="mt-1 text-xs text-[#939084]">
            头像、姓名与企业身份将出现在邮件签名与团队页面
          </p>
        </header>

        <div className="flex items-start gap-5 border-b border-[#eceae3] pb-5">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ff4f00] text-2xl font-semibold text-[#fffefb]">
              {WORKSPACE_DEMO_USER.initial}
            </div>
            <Button
              unstyled
              type="button"
              className="absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full border border-[#c5c0b1] bg-[#fffefb] text-[#36342e] transition-colors hover:bg-[#eceae3] hover:text-[#ff4f00]"
              title="更换头像"
            >
              <Camera className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#201515]">{name}</p>
            <p className="text-xs text-[#939084]">{WORKSPACE_DEMO_USER.email}</p>
            <p className="mt-2 text-[11px] text-[#939084]">
              支持 JPG、PNG，建议 400×400 px，最大 2MB
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <FormField label="姓名" hint="将显示在邮件签名中">
            <input value={name} onChange={(e) => setName(e.target.value)} className={INPUT_CLASS} />
          </FormField>
          <FormField label="显示名" hint="团队成员看到的名字">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={INPUT_CLASS}
            />
          </FormField>
          <FormField label="登录邮箱">
            <div className="flex items-center gap-2">
              <input
                value={WORKSPACE_DEMO_USER.email}
                disabled
                className={cn(INPUT_CLASS, "bg-[#fffdf9] text-[#939084]")}
              />
              <Button
                unstyled
                type="button"
                className="shrink-0 rounded-lg border border-[#c5c0b1] bg-[#fffefb] px-3 py-2 text-xs text-[#36342e] transition-colors hover:bg-[#eceae3]"
              >
                更换
              </Button>
            </div>
          </FormField>
          <FormField label="公司 / 品牌">
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className={INPUT_CLASS}
            />
          </FormField>
        </div>
      </section>

      {/* 安全 */}
      <section className="rounded-[5px] border border-[#c5c0b1] bg-[#fffefb] p-6">
        <header className="mb-5">
          <h3 className="text-sm font-semibold text-[#201515]">登录与安全</h3>
          <p className="mt-1 text-xs text-[#939084]">保护账户登录凭证</p>
        </header>

        <div className="space-y-3">
          <SecurityRow
            icon={KeyRound}
            title="登录密码"
            desc="上次更新于 2026-03-12 · 建议每 90 天更换一次"
            action="修改密码"
          />
          <SecurityRow
            icon={ShieldCheck}
            title="两步验证 (2FA)"
            desc={
              twoFactor
                ? "已启用 · 通过身份验证器 App 获取一次性验证码"
                : "未启用 · 强烈建议开启以增强账户安全"
            }
            action={twoFactor ? "管理" : "启用"}
            highlight={!twoFactor}
            onAction={() => setTwoFactor((v) => !v)}
          />
          <SecurityRow
            icon={Mail}
            title="登录设备"
            desc="共 2 台设备登录中 · 最近登录于今天 14:32 · macOS Chrome"
            action="查看"
          />
        </div>
      </section>

      {/* 偏好 */}
      <section className="rounded-[5px] border border-[#c5c0b1] bg-[#fffefb] p-6">
        <header className="mb-5">
          <h3 className="text-sm font-semibold text-[#201515]">偏好设置</h3>
          <p className="mt-1 text-xs text-[#939084]">界面语言、时区及邮件通知</p>
        </header>

        <div className="grid gap-4 border-b border-[#eceae3] pb-5 md:grid-cols-2">
          <FormField label="界面语言">
            <div className="relative">
              <Globe2 className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[#939084]" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className={cn(INPUT_CLASS, "appearance-none pl-9")}
              >
                {LANGUAGES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </FormField>
          <FormField label="时区">
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value as Timezone)}
              className={cn(INPUT_CLASS, "appearance-none")}
            >
              {TIMEZONES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="mt-5">
          <p className="mb-3 text-xs font-medium text-[#36342e]">邮件通知</p>
          <div className="space-y-2">
            {EMAIL_PREFS.map((p) => (
              <label
                key={p.key}
                className="flex cursor-pointer items-start gap-3 rounded-[5px] px-3 py-2.5 transition-colors hover:bg-[#fffdf9]"
              >
                <input
                  type="checkbox"
                  checked={emailPrefs[p.key]}
                  onChange={() => togglePref(p.key)}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#ff4f00]"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[#201515]">{p.label}</p>
                  <p className="mt-0.5 text-xs text-[#939084]">{p.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* 危险区 */}
      <section className="rounded-[5px] border border-[#c5c0b1] bg-[#fffefb] p-6">
        <header className="mb-4">
          <h3 className="text-sm font-semibold text-[#201515]">注销账户</h3>
          <p className="mt-1 text-xs text-[#939084]">
            删除后将清除所有项目、博主库和邮件历史。此操作不可恢复。
          </p>
        </header>
        <Button
          unstyled
          type="button"
          className="inline-flex items-center gap-1.5 rounded border border-[#ff4f00]/30 bg-[#fffefb] px-4 py-2 text-sm text-[#ff4f00] transition-colors hover:bg-[#ff4f00] hover:text-[#fffefb]"
        >
          <Trash2 className="h-3.5 w-3.5" />
          注销账户
        </Button>
      </section>
    </div>
  );
}

type AccountFooterProps = {
  form: AccountForm;
  // "sticky"：长页面用，浮在内容上方；"flat"：弹窗 footer 用，与对话框边缘齐平。
  variant: "sticky" | "flat";
  onCancel?: () => void;
};

export function AccountFooter({ form, variant, onCancel }: AccountFooterProps) {
  const containerCls =
    variant === "sticky"
      ? "sticky bottom-4 flex items-center justify-end gap-3 rounded-lg border border-[#c5c0b1] bg-[#fffefb] px-4 py-3 shadow-[0_4px_18px_-12px_rgba(32,21,21,0.18)]"
      : "flex shrink-0 items-center justify-end gap-3 border-t border-[#eceae3] bg-[#fffefb] px-5 py-3";

  return (
    <div className={containerCls}>
      {form.savedAt !== null && (
        <span className="flex items-center gap-1 text-xs text-emerald-600">
          <Check className="h-3.5 w-3.5" />
          已保存
        </span>
      )}
      <Button
        unstyled
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-[#c5c0b1] bg-[#fffefb] px-4 py-2 text-sm text-[#36342e] transition-colors hover:bg-[#eceae3]"
      >
        取消
      </Button>
      <Button
        unstyled
        type="button"
        onClick={form.handleSave}
        className="rounded-lg bg-[#201515] px-5 py-2 text-sm font-medium text-[#fffefb] transition-colors hover:bg-[#36342e]"
      >
        保存修改
      </Button>
    </div>
  );
}

// 长页面入口：组合 hook + sections + sticky footer。
export function AccountTab() {
  const form = useAccountForm();
  return (
    <div className="w-full space-y-4">
      <AccountSections form={form} />
      <AccountFooter form={form} variant="sticky" />
    </div>
  );
}

type FormFieldProps = {
  label: string;
  hint?: string;
  children: React.ReactNode;
};

function FormField({ label, hint, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-[#36342e]">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-[#939084]">{hint}</p>}
    </div>
  );
}

type SecurityRowProps = {
  icon: React.ElementType;
  title: string;
  desc: string;
  action: string;
  highlight?: boolean;
  onAction?: () => void;
};

function SecurityRow({
  icon: Icon,
  title,
  desc,
  action,
  highlight = false,
  onAction,
}: SecurityRowProps) {
  return (
    <div className="flex items-center gap-4 rounded-[5px] border border-[#eceae3] bg-[#fffdf9] px-4 py-3">
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
          highlight ? "bg-[#ff4f00]/10 text-[#ff4f00]" : "bg-[#eceae3] text-[#36342e]",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[#201515]">{title}</p>
        <p className="mt-0.5 text-xs text-[#939084]">{desc}</p>
      </div>
      <Button
        unstyled
        type="button"
        onClick={onAction}
        className={cn(
          "shrink-0 rounded-md border px-3.5 py-1.5 text-xs transition-colors",
          highlight
            ? "border-[#ff4f00] bg-[#ff4f00] text-[#fffefb] hover:bg-[#e64700]"
            : "border-[#c5c0b1] bg-[#fffefb] text-[#36342e] hover:bg-[#eceae3]",
        )}
      >
        {action}
      </Button>
    </div>
  );
}
