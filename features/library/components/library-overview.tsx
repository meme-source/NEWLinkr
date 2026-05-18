"use client";

import { useState } from "react";
import { HelpCircle, RefreshCw } from "lucide-react";
import type { Creator, Rating } from "@/types/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { dominantStatus } from "@/lib/creator";
import { RATING_LABELS } from "./rating-stars";

interface Props {
  creators: Creator[];
  // 可选的"刷新"动作；当前 Phase 0 mock 阶段无副作用，仅占位。
  onRefresh?: () => void;
}

const TOOLTIPS = {
  total: "本月新增 = 当月被加入博主库的博主数量",
  rating: "仅统计已完成合作的博主：3 星=优秀 / 2 星=良好 / 1 星=普通",
  sent: "已经向其发送过建联邮件的博主数量",
  replied: "已回复过我方邮件的博主数量",
} as const;

export function LibraryOverview({ creators, onRefresh }: Props) {
  const summary = summarize(creators);

  return (
    <section
      className="rounded-lg border border-[#c5c0b1] bg-[#fffefb] px-5 py-4"
      aria-label="数据总览"
    >
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#ff4f00]" />
          <h2 className="text-[14px] font-semibold text-[#201515]">数据总览</h2>
        </div>
        <Button
          unstyled
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[12px] text-[#939084] transition-colors hover:bg-[#fffdf9] hover:text-[#36342e]"
        >
          <RefreshCw className="h-3 w-3" />
          同步网红库数据
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="博主总数" tip={TOOLTIPS.total}>
          <CardValueRow value={summary.total}>
            <Pill>
              本月新增{" "}
              <span className="font-semibold text-[#ff4f00]">+{summary.addedThisMonth}</span>
            </Pill>
          </CardValueRow>
        </Card>

        <Card label="博主评级" tip={TOOLTIPS.rating}>
          <CardValueRow value={summary.ratedTotal}>
            {summary.ratedTotal === 0 ? (
              <Pill>
                <span className="text-[#939084]">暂无完成评级</span>
              </Pill>
            ) : (
              (Object.entries(summary.byRating) as [string, number][])
                .map(([k, v]) => [Number(k) as Rating, v] as const)
                .sort((a, b) => b[0] - a[0])
                .map(([tier, count]) => (
                  <Pill key={tier}>
                    <span className="text-[#36342e]">{RATING_LABELS[tier]}</span>
                    <span className="font-semibold text-[#201515]">{count}</span>
                  </Pill>
                ))
            )}
          </CardValueRow>
        </Card>

        <Card label="已发送邮件" tip={TOOLTIPS.sent}>
          <CardValueRow value={summary.sentCount}>
            <Pill>
              发送率 <span className="font-semibold text-[#201515]">{summary.sendRate}%</span>
            </Pill>
          </CardValueRow>
        </Card>

        <Card label="已回复邮件" tip={TOOLTIPS.replied}>
          <CardValueRow value={summary.repliedCount}>
            <Pill>
              回复率 <span className="font-semibold text-[#201515]">{summary.replyRate}%</span>
            </Pill>
          </CardValueRow>
        </Card>
      </div>
    </section>
  );
}

function Card({ label, tip, children }: { label: string; tip: string; children: React.ReactNode }) {
  const [hover, setHover] = useState(false);
  return (
    // 软米色背景替代描边，hover 时背景轻微加深 + 微微抬升，保留交互反馈但不再有线框。
    <div className="group relative flex flex-col rounded-lg bg-[#F9F4F1] px-5 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F2EBE5] hover:shadow-[0_1px_2px_rgba(20,20,19,0.04),0_6px_18px_-8px_rgba(20,20,19,0.10)]">
      <div className="flex items-center gap-1.5">
        <p className="text-[12px] font-medium tracking-wide text-[#939084]">{label}</p>
        <Button
          unstyled
          type="button"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onFocus={() => setHover(true)}
          onBlur={() => setHover(false)}
          aria-label={`${label}说明`}
          className="text-[#bdb9ac] transition-colors hover:text-[#36342e]"
        >
          <HelpCircle className="h-3 w-3" />
        </Button>
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
      {children}
    </div>
  );
}

function CardValueRow({ value, children }: { value: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
      <span className="text-[28px] leading-none font-semibold tracking-tight text-[#201515] tabular-nums">
        {value}
      </span>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    // pill 改为纯白底，避开新卡片背景 #F9F4F1（两者太接近会糊在一起）。
    <span className="inline-flex items-center gap-1 rounded-md bg-white/85 px-2 py-1 text-[12px] text-[#36342e]">
      {children}
    </span>
  );
}

interface Summary {
  total: number;
  addedThisMonth: number;
  // 仅统计 dominantStatus === "completed" 的博主——评级是合作完成后的复盘。
  ratedTotal: number;
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
  let ratedTotal = 0;
  let addedThisMonth = 0;
  // sentCount = 已发送过建联邮件的博主数；replyRate 仍以"已发送"为分母。
  let sentCount = 0;
  let repliedCount = 0;

  for (const c of creators) {
    if (dominantStatus(c) === "completed") {
      byRating[c.rating] += 1;
      ratedTotal += 1;
    }

    const added = parseDate(c.addedAt);
    if (added && added >= monthStart) addedThisMonth += 1;

    if (c.lastContactAt) sentCount += 1;
    if (c.lastResponseAt) repliedCount += 1;
  }

  return {
    total: creators.length,
    addedThisMonth,
    ratedTotal,
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
