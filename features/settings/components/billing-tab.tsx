"use client";

import { AlertTriangle, Check, Compass, Download, Mail, Radar, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BILLING_HISTORY, USAGE_ICON_MAP, USAGE_QUOTA } from "@/features/settings/data/billing";
import { cn } from "@/lib/utils";

// §3.6.5 账户与计费. The legacy footer with three global buttons (联系客服 /
// 帮助文档 / 功能建议) has been removed — those entrypoints now live in the
// header user dropdown's "产品反馈" menu.
export function BillingTab() {
  return (
    <div className="w-full space-y-4">
      <div
        className="relative overflow-hidden rounded-lg p-6 ring-1 ring-white/70 ring-inset"
        style={{
          backgroundImage: "linear-gradient(135deg, #fffdf9 0%, #fffdf9 55%, #eceae3 100%)",
        }}
      >
        <div className="pointer-events-none absolute -top-24 -right-20 h-56 w-56 rounded-full bg-[#ff4f00]/12 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-[#c5c0b1]/60 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />

        <div className="relative flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-full bg-[#fffefb]/70 px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-[#ff4f00] uppercase ring-1 ring-[#ff4f00]/25 backdrop-blur ring-inset">
                <Sparkles className="h-3 w-3" />
                PRO
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-[#36342e]">
                <span className="relative inline-flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/40" />
                  <span className="relative inline-flex h-full w-full rounded-full bg-emerald-500" />
                </span>
                生效中
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-[40px] leading-none font-semibold tracking-tight text-[#201515] tabular-nums">
                $99
              </span>
              <span className="text-sm text-[#939084]">/ 月</span>
            </div>
            <p className="mt-1.5 text-xs text-[#939084]">到期日 · 2026-05-14</p>

            <div className="mt-5 h-px w-full bg-gradient-to-r from-[#b5b2aa]/40 via-[#b5b2aa]/20 to-transparent" />

            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
              {[
                { icon: Compass, label: "博主发现" },
                { icon: Mail, label: "邮件建联" },
                { icon: Radar, label: "投放追踪" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-[12px] text-[#36342e]">
                  <Icon className="h-3.5 w-3.5 text-[#ff4f00]" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2">
            <Button
              unstyled
              type="button"
              className="rounded-lg bg-[#201515] px-5 py-2.5 text-sm font-medium text-[#fffefb] transition-colors hover:bg-[#201515]"
            >
              升级套餐
            </Button>
            <Button
              unstyled
              type="button"
              className="rounded-lg border border-[#c5c0b1] bg-[#fffefb]/60 px-5 py-2.5 text-sm text-[#36342e] backdrop-blur transition-colors hover:bg-[#fffefb] hover:text-[#ff4f00]"
            >
              取消订阅
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[#c5c0b1] bg-[#fffefb] p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-[#201515]">本月用量</h3>
            <p className="mt-1 text-xs text-[#939084]">按当前计费周期展示功能使用情况</p>
          </div>
          <span className="rounded-full border border-[#c5c0b1] bg-[#fffdf9] px-2.5 py-1 text-[10px] text-[#939084]">
            周期截至 2026-05-14
          </span>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
          {USAGE_QUOTA.map((u) => {
            const pct = Math.round((u.used / u.quota) * 100);
            const isWarn = pct >= 80;
            const Icon = USAGE_ICON_MAP[u.icon];
            return (
              <div key={u.label}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-[#939084]" />
                  <span className="text-xs text-[#36342e]">{u.label}</span>
                  <span className="ml-auto text-xs text-[#201515] tabular-nums">
                    <span className="font-medium">{u.used}</span>
                    <span className="text-[#939084]">
                      {" "}
                      / {u.quota} {u.unit}
                    </span>
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2.5">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#eceae3]">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        isWarn ? "bg-[#ff4f00]" : "bg-[#ff4f00]",
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span
                    className={cn(
                      "w-10 text-right text-[11px] font-medium tabular-nums",
                      isWarn ? "text-[#ff4f00]" : "text-[#939084]",
                    )}
                  >
                    {pct}%
                  </span>
                </div>
                {isWarn && (
                  <p className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-[#ff4f00]">
                    <AlertTriangle className="h-3 w-3" />
                    即将用尽
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-[#c5c0b1] bg-[#fffefb] p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-[#201515]">购买记录</h3>
          <Button
            unstyled
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-[#c5c0b1] bg-[#fffefb] px-3 py-1.5 text-xs text-[#36342e] transition-colors hover:bg-[#eceae3]"
          >
            <Download className="h-3.5 w-3.5" />
            导出
          </Button>
        </div>

        <div className="grid grid-cols-[100px_1fr_90px_108px_68px] gap-3 border-b border-[#c5c0b1] pb-2 text-[11px] font-medium tracking-wide text-[#939084] uppercase">
          <span>日期</span>
          <span>项目</span>
          <span className="text-right">金额</span>
          <span>状态</span>
          <span className="text-right">发票</span>
        </div>
        {BILLING_HISTORY.map((b, i) => (
          <div
            key={b.date}
            className={cn(
              "grid grid-cols-[100px_1fr_90px_108px_68px] items-center gap-3 py-3 text-sm transition-colors hover:bg-[#fffdf9]",
              i < BILLING_HISTORY.length - 1 && "border-b border-[#eceae3]",
            )}
          >
            <span className="text-[#939084] tabular-nums">{b.date}</span>
            <span className="text-[#36342e]">{b.item}</span>
            <span className="text-right font-medium text-[#201515] tabular-nums">{b.amount}</span>
            <span className="flex items-center gap-1 text-xs font-medium text-[#36342e]">
              <Check className="h-3 w-3" />
              {b.status}
            </span>
            <Button
              unstyled
              type="button"
              className="flex items-center justify-end gap-1 text-xs text-[#939084] transition-colors hover:text-[#ff4f00]"
            >
              <Download className="h-3 w-3" />
              下载
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
