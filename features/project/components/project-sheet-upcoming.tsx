"use client";

import { CalendarClock, Megaphone, BellRing, Sparkles } from "lucide-react";

import {
  formatUpcomingDay,
  getProjectUpcoming,
  type UpcomingItem,
  type UpcomingKind,
} from "@/features/outreach/lib/project-summary";
import { cn } from "@/lib/utils";

// §3.1 即将发生 —— 抽屉里把"下一周内会发生在该项目上的事"汇总成一条时间线。
// 三类来源（来自 getProjectUpcoming）：
//   publish  达人档期 → 博主名 + 发布日
//   followup 跟进提醒 → 博主名 + 跟进日
//   other    "其他"事件（项目复盘 / 临时安排）→ 事件标题
// 抽屉里限制 5 条；超过用"还有 X 条"兜底。链接进一步可在后续接入日程页 deeplink。

const MAX_ITEMS = 5;

const KIND_VISUAL: Record<
  UpcomingKind,
  { label: string; icon: typeof Megaphone; iconClass: string; chip: string }
> = {
  publish: {
    label: "发布",
    icon: Megaphone,
    iconClass: "text-[#ff4f00]",
    chip: "bg-[#fff7f4] text-[#ff4f00] ring-[#fff7f4]",
  },
  followup: {
    label: "跟进",
    icon: BellRing,
    iconClass: "text-[#36342e]",
    chip: "bg-[#eceae3] text-[#36342e] ring-[#c5c0b1]/60",
  },
  other: {
    label: "其他",
    icon: Sparkles,
    iconClass: "text-[#8a6f1f]",
    chip: "bg-[#fbf3df] text-[#8a6f1f] ring-[#f0e2bc]",
  },
};

export function ProjectSheetUpcomingSection({ projectId }: { projectId: string }) {
  const upcoming = getProjectUpcoming(projectId);
  const visible = upcoming.items.slice(0, MAX_ITEMS);
  const remain = Math.max(0, upcoming.items.length - visible.length);

  return (
    <section className="rounded-3xl border border-[#c5c0b1] bg-[#fffefb] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#201515]">
          <CalendarClock className="h-4 w-4 text-[#ff4f00]" />
          即将发生（本周）
        </div>
        <CountStrip
          publish={upcoming.publishCount}
          followup={upcoming.followupCount}
          other={upcoming.eventCount}
        />
      </div>

      {upcoming.items.length === 0 ? (
        <p className="mt-3 rounded-2xl bg-[#fffdf9] px-3 py-3 text-[11px] text-[#939084]">
          未来 7 天没有计划 —— 在日程页给该项目排发布或跟进吧。
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-[#eceae3] overflow-hidden rounded-2xl bg-[#fffdf9]">
          {visible.map((item, index) => (
            <UpcomingRow key={`${item.kind}-${item.date}-${index}`} item={item} />
          ))}
        </ul>
      )}

      {remain > 0 ? (
        <p className="mt-2 px-1 text-[10px] text-[#939084]">
          还有 {remain} 条 · 去日程页查看完整安排
        </p>
      ) : null}
    </section>
  );
}

function CountStrip({
  publish,
  followup,
  other,
}: {
  publish: number;
  followup: number;
  other: number;
}) {
  return (
    <div className="flex items-center gap-1.5 text-[10px]">
      <CountChip kind="publish" count={publish} />
      <CountChip kind="followup" count={followup} />
      <CountChip kind="other" count={other} />
    </div>
  );
}

function CountChip({ kind, count }: { kind: UpcomingKind; count: number }) {
  const visual = KIND_VISUAL[kind];
  const dim = count === 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 ring-1",
        dim ? "bg-[#eceae3] text-[#939084] ring-[#c5c0b1]/60" : visual.chip,
      )}
    >
      <span className="font-semibold tabular-nums">{count}</span>
      {visual.label}
    </span>
  );
}

function UpcomingRow({ item }: { item: UpcomingItem }) {
  const visual = KIND_VISUAL[item.kind];
  const Icon = visual.icon;
  return (
    <li className="flex items-start gap-3 px-3 py-2.5">
      <span
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#fffefb] ring-1",
          visual.chip
            .split(" ")
            .filter((c) => c.startsWith("ring-"))
            .join(" "),
        )}
      >
        <Icon className={cn("h-3.5 w-3.5", visual.iconClass)} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-xs font-medium text-[#201515]">{item.label}</span>
          <span className="shrink-0 text-[10px] text-[#939084] tabular-nums">
            {formatUpcomingDay(item.daysUntil)}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[10px] text-[#939084]">
          {item.subLabel ?? visual.label} · {item.date}
        </p>
      </div>
    </li>
  );
}
