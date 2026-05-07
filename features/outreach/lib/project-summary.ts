// §3.1 跨项目派生指标 — 由项目概览卡片和项目抽屉共用。
// 计算结果只是把两份 mock 数据按 projectId 切片汇总，因此调用是 O(N+M)；
// 真接入后端时把这里的数据源换成 service 层即可。
//
// 2026-05-07 扩展：除了原本的"建联 + 投放"汇总，新增三类派生：
//   ① 投放质量小结：平均互动率 + 7 天趋势分布（增长 / 稳定 / 下降）
//   ② 拒绝数：用于抽屉里的复盘指标
//   ③ getProjectUpcoming：本周内的发布 / 跟进 / "其他"事件，供卡片"待办"格
//      和抽屉"即将发生"模块使用。

import { CALENDAR_EVENTS } from "@/features/outreach/data/calendar-events";
import { PLACEMENTS } from "@/features/outreach/data/board-placements";
import { OUTREACH_CREATORS } from "@/features/outreach/data/outreach-creators";

export interface ProjectSummary {
  outreachTotal: number;
  outreachSent: number;
  outreachSuccess: number;
  outreachRejected: number;
  placementCount: number;
  placementExposureViews: number;
  placementSpendUsd: number;
  // 投放质量
  placementAvgEr: number;
  placementGrowthCount: number;
  placementStableCount: number;
  placementDeclineCount: number;
}

export const EMPTY_PROJECT_SUMMARY: ProjectSummary = {
  outreachTotal: 0,
  outreachSent: 0,
  outreachSuccess: 0,
  outreachRejected: 0,
  placementCount: 0,
  placementExposureViews: 0,
  placementSpendUsd: 0,
  placementAvgEr: 0,
  placementGrowthCount: 0,
  placementStableCount: 0,
  placementDeclineCount: 0,
};

export function summarizeProject(projectId: string): ProjectSummary {
  const outreach = OUTREACH_CREATORS.filter((c) => c.projectId === projectId);
  const placements = PLACEMENTS.filter((p) => p.projectId === projectId);
  const placementCount = placements.length;
  const erTotal = placements.reduce((s, p) => s + p.er, 0);
  return {
    outreachTotal: outreach.length,
    // 已建联 = 已经发出过邮件的（任何 queued 之后的状态）。
    outreachSent: outreach.filter((c) => c.status !== "queued" && c.status !== "pending").length,
    // 建联成功 = 进入合作或之后阶段（合作中 / 已完成 / 暂停中）。
    outreachSuccess: outreach.filter(
      (c) => c.status === "collaborating" || c.status === "completed" || c.status === "paused",
    ).length,
    outreachRejected: outreach.filter((c) => c.status === "rejected").length,
    placementCount,
    placementExposureViews: placements.reduce((s, p) => s + p.views, 0),
    placementSpendUsd: placements.reduce((s, p) => s + p.spendUsd, 0),
    placementAvgEr: placementCount > 0 ? erTotal / placementCount : 0,
    placementGrowthCount: placements.filter((p) => p.status === "增长中").length,
    placementStableCount: placements.filter((p) => p.status === "稳定中").length,
    placementDeclineCount: placements.filter((p) => p.status === "下降中").length,
  };
}

export function fmtViews(n: number): string {
  if (n >= 1e6) {
    const v = n / 1e6;
    return `${v >= 10 ? v.toFixed(0) : v.toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (n >= 1e3) {
    const v = n / 1e3;
    return `${v >= 10 ? v.toFixed(0) : v.toFixed(1).replace(/\.0$/, "")}K`;
  }
  return String(Math.round(n));
}

// §3.1 预算消耗派生 — 把字符串预算转成数字 + 计算用量比例。
// 预算字段是用户输入的字符串（可能为空 / 非数字），所以这里返回一个有 `valid`
// 的 union，让消费方有机会回落到 "未设置" 文案。
// 业务判断：>=100 超支；>=80 临界；其他正常。
export type BudgetTone = "ok" | "warn" | "over";

export type BudgetUsage =
  | { valid: false }
  | {
      valid: true;
      budgetUsd: number;
      spentUsd: number;
      remainUsd: number;
      // 0–999 之间的整数百分比（>100 表示超支）
      ratioPct: number;
      tone: BudgetTone;
    };

export function deriveBudgetUsage(budgetAmount: string, spentUsd: number): BudgetUsage {
  const trimmed = budgetAmount.trim();
  if (!trimmed) return { valid: false };
  const budgetUsd = Number(trimmed);
  if (!Number.isFinite(budgetUsd) || budgetUsd <= 0) return { valid: false };
  const ratio = spentUsd / budgetUsd;
  const ratioPct = Math.max(0, Math.min(999, Math.round(ratio * 100)));
  const tone: BudgetTone = ratioPct >= 100 ? "over" : ratioPct >= 80 ? "warn" : "ok";
  return {
    valid: true,
    budgetUsd,
    spentUsd,
    remainUsd: Math.max(0, budgetUsd - spentUsd),
    ratioPct,
    tone,
  };
}

// §3.1 项目时间健康度 — 抽屉"时间健康度"卡片用。
//   elapsedDays / totalDays：从 startDate 到 today 占整段的比例
//   timeRatioPct：进度条
//   status："未开始" | "进行中" | "已结束"
//   tone：建联进度 vs 时间进度的快速对比
export interface ProjectTimeHealth {
  hasRange: boolean;
  totalDays: number;
  elapsedDays: number;
  remainDays: number;
  timeRatioPct: number;
  outreachRatioPct: number;
  // 业务对比：建联 vs 时间
  pace: "ahead" | "ontrack" | "behind" | "unknown";
  paceLabel: string;
}

export function deriveProjectTimeHealth(args: {
  startDate: string;
  endDate: string;
  outreachSent: number;
  outreachTarget: number | null;
  outreachTotal: number;
  refDate?: Date;
}): ProjectTimeHealth {
  const ref = args.refDate ?? new Date();
  const today = new Date(ref);
  today.setHours(0, 0, 0, 0);

  const start = parseIsoDate(args.startDate);
  const end = parseIsoDate(args.endDate);

  if (!start || !end || end.getTime() <= start.getTime()) {
    const denom =
      args.outreachTarget && args.outreachTarget > 0 ? args.outreachTarget : args.outreachTotal;
    const outreachRatioPct =
      denom > 0 ? Math.min(100, Math.round((args.outreachSent / denom) * 100)) : 0;
    return {
      hasRange: false,
      totalDays: 0,
      elapsedDays: 0,
      remainDays: 0,
      timeRatioPct: 0,
      outreachRatioPct,
      pace: "unknown",
      paceLabel: "时间未设置",
    };
  }

  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000));
  const elapsed = Math.round((today.getTime() - start.getTime()) / 86_400_000);
  const elapsedDays = Math.max(0, Math.min(totalDays, elapsed));
  const remainDays = Math.max(0, totalDays - elapsedDays);
  const timeRatioPct = Math.round((elapsedDays / totalDays) * 100);

  const denom =
    args.outreachTarget && args.outreachTarget > 0 ? args.outreachTarget : args.outreachTotal;
  const outreachRatioPct =
    denom > 0 ? Math.min(100, Math.round((args.outreachSent / denom) * 100)) : 0;

  let pace: ProjectTimeHealth["pace"] = "unknown";
  let paceLabel = "暂无对比";
  if (denom > 0) {
    const gap = outreachRatioPct - timeRatioPct;
    if (gap >= 10) {
      pace = "ahead";
      paceLabel = `领先时间进度 ${gap}%`;
    } else if (gap <= -10) {
      pace = "behind";
      paceLabel = `落后时间进度 ${Math.abs(gap)}%`;
    } else {
      pace = "ontrack";
      paceLabel = "与时间进度同步";
    }
  }

  return {
    hasRange: true,
    totalDays,
    elapsedDays,
    remainDays,
    timeRatioPct,
    outreachRatioPct,
    pace,
    paceLabel,
  };
}

function parseIsoDate(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

// §3.1 即将发生（本周）— 项目卡片"本周待办"格 + 抽屉"即将发生"模块共用。
// 三类来源：
//   1) outreach.scheduledPublishAt → "publish"（达人档期）
//   2) outreach.nextFollowUpAt     → "followup"（跟进提醒）
//   3) CALENDAR_EVENTS（projectId 命中）→ "other"
// 全部转成统一的 UpcomingItem，按日期升序输出。
export type UpcomingKind = "publish" | "followup" | "other";

export interface UpcomingItem {
  kind: UpcomingKind;
  date: string;
  daysUntil: number;
  // publish / followup 的"主语"是博主，other 用 event title。
  label: string;
  subLabel?: string;
}

export interface ProjectUpcoming {
  publishCount: number;
  followupCount: number;
  eventCount: number;
  totalCount: number;
  items: UpcomingItem[];
}

export function getProjectUpcoming(projectId: string, refDate: Date = new Date()): ProjectUpcoming {
  const today = new Date(refDate);
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 7);

  const items: UpcomingItem[] = [];

  for (const c of OUTREACH_CREATORS) {
    if (c.projectId !== projectId) continue;
    if (c.scheduledPublishAt) {
      const d = parseIsoDate(c.scheduledPublishAt);
      if (d && d.getTime() >= today.getTime() && d.getTime() <= horizon.getTime()) {
        items.push({
          kind: "publish",
          date: c.scheduledPublishAt,
          daysUntil: diffDays(d, today),
          label: c.name,
          subLabel: c.handle,
        });
      }
    }
    if (c.nextFollowUpAt) {
      const d = parseIsoDate(c.nextFollowUpAt);
      if (d && d.getTime() >= today.getTime() && d.getTime() <= horizon.getTime()) {
        items.push({
          kind: "followup",
          date: c.nextFollowUpAt,
          daysUntil: diffDays(d, today),
          label: c.name,
          subLabel: c.handle,
        });
      }
    }
  }

  for (const evt of CALENDAR_EVENTS) {
    if (evt.projectId !== projectId) continue;
    const d = parseIsoDate(evt.date);
    if (!d) continue;
    if (d.getTime() < today.getTime() || d.getTime() > horizon.getTime()) continue;
    items.push({
      kind: "other",
      date: evt.date,
      daysUntil: diffDays(d, today),
      label: evt.title,
      subLabel: evt.notes,
    });
  }

  items.sort((a, b) => a.date.localeCompare(b.date));

  const publishCount = items.filter((i) => i.kind === "publish").length;
  const followupCount = items.filter((i) => i.kind === "followup").length;
  const eventCount = items.filter((i) => i.kind === "other").length;

  return {
    publishCount,
    followupCount,
    eventCount,
    totalCount: items.length,
    items,
  };
}

function diffDays(target: Date, ref: Date): number {
  return Math.round((target.getTime() - ref.getTime()) / 86_400_000);
}

export function formatUpcomingDay(daysUntil: number): string {
  if (daysUntil <= 0) return "今天";
  if (daysUntil === 1) return "明天";
  return `${daysUntil} 天后`;
}
