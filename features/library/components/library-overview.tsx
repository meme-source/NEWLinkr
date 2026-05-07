"use client";

import { useState } from "react";
import { HelpCircle, RefreshCw } from "lucide-react";
import type { Creator, Rating } from "@/types/api";
import { cn } from "@/lib/utils";
import { RATING_LABELS } from "./rating-stars";

interface Props {
  creators: Creator[];
  // 可选的"刷新"动作；当前 Phase 0 mock 阶段无副作用，仅占位。
  onRefresh?: () => void;
}

const TOOLTIPS = {
  total: "本月新增 = 当月被加入博主库的博主数量",
  rating: "用户主观评级分布：3 星=优秀 / 2 星=良好 / 1 星=普通",
  sent: "已经向其发送过建联邮件的博主数量",
  replied: "已回复过我方邮件的博主数量",
} as const;

export function LibraryOverview({ creators, onRefresh }: Props) {
  const summary = summarize(creators);

  return (
    <section
      className="rounded-2xl border border-[#c5c0b1] bg-[#fffefb] px-5 py-4"
      aria-label="数据总览"
    >
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#ff4f00]" />
          <h2 className="text-[14px] font-semibold text-[#201515]">数据总览</h2>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[12px] text-[#939084] transition-colors hover:bg-[#fffdf9] hover:text-[#36342e]"
        >
          <RefreshCw className="h-3 w-3" />
          同步网红库数据
        </button>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="博主总数" tip={TOOLTIPS.total}>
          <div className="text-[28px] font-bold text-[#201515]">{summary.total}</div>
          <div className="text-[12px] text-[#939084]">
            本月新增 <span className="font-medium text-[#ff4f00]">+{summary.addedThisMonth}</span>
          </div>
        </Card>

        <Card label="博主评级" tip={TOOLTIPS.rating}>
          <div className="text-[28px] font-bold text-[#201515]">{summary.total}</div>
          <div className="flex items-center gap-2 text-[12px] text-[#939084]">
            {(Object.entries(summary.byRating) as [string, number][])
              .map(([k, v]) => [Number(k) as Rating, v] as const)
              .sort((a, b) => b[0] - a[0])
              .map(([tier, count]) => (
                <span key={tier} className="inline-flex items-center gap-1">
                  <span className="font-medium text-[#36342e]">{RATING_LABELS[tier]}</span>
                  <span>{count}</span>
                </span>
              ))}
          </div>
        </Card>

        <Card label="已发送邮件" tip={TOOLTIPS.sent}>
          <div className="text-[28px] font-bold text-[#201515]">{summary.sentCount}</div>
          <div className="text-[12px] text-[#939084]">
            发送率: <span className="font-medium text-[#36342e]">{summary.sendRate}%</span>
          </div>
        </Card>

        <Card label="已回复邮件" tip={TOOLTIPS.replied}>
          <div className="text-[28px] font-bold text-[#201515]">{summary.repliedCount}</div>
          <div className="text-[12px] text-[#939084]">
            回复率: <span className="font-medium text-[#36342e]">{summary.replyRate}%</span>
          </div>
        </Card>
      </div>
    </section>
  );
}

function Card({ label, tip, children }: { label: string; tip: string; children: React.ReactNode }) {
  const [hover, setHover] = useState(false);
  return (
    <div className="relative rounded-xl border border-transparent bg-[#eceae3] px-4 py-3 transition-colors hover:border-[#c5c0b1]">
      <div className="flex items-center gap-1.5">
        <p className="text-[12px] text-[#939084]">{label}</p>
        <button
          type="button"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onFocus={() => setHover(true)}
          onBlur={() => setHover(false)}
          aria-label={`${label}说明`}
          className="text-[#939084] transition-colors hover:text-[#36342e]"
        >
          <HelpCircle className="h-3 w-3" />
        </button>
        {hover && (
          <span
            role="tooltip"
            className={cn(
              "pointer-events-none absolute -top-2 left-2 z-20 -translate-y-full rounded-lg",
              "bg-[#201515] px-2.5 py-1.5 text-[11px] whitespace-nowrap text-[#fffefb]",
            )}
          >
            {tip}
          </span>
        )}
      </div>
      <div className="mt-1 space-y-1">{children}</div>
    </div>
  );
}

interface Summary {
  total: number;
  addedThisMonth: number;
  byRating: Record<Rating, number>;
  sentCount: number;
  sendRate: number;
  repliedCount: number;
  replyRate: number;
}

function summarize(creators: Creator[]): Summary {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const byRating: Record<Rating, number> = { 1: 0, 2: 0, 3: 0 };
  let addedThisMonth = 0;
  // sentCount = 已发送过建联邮件的博主数；replyRate 仍以"已发送"为分母。
  let sentCount = 0;
  let repliedCount = 0;

  for (const c of creators) {
    byRating[c.rating] += 1;

    const added = parseDate(c.addedAt);
    if (added && added >= monthStart) addedThisMonth += 1;

    if (c.lastContactAt) sentCount += 1;
    if (c.lastResponseAt) repliedCount += 1;
  }

  return {
    total: creators.length,
    addedThisMonth,
    byRating,
    sentCount,
    sendRate: rate(sentCount, creators.length),
    repliedCount,
    replyRate: rate(repliedCount, sentCount),
  };
}

function parseDate(iso: string): Date | null {
  const t = new Date(iso);
  return Number.isNaN(t.getTime()) ? null : t;
}

function rate(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}
