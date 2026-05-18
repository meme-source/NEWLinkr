"use client";

import { ArrowDownRight, ArrowUpRight, ExternalLink, Lock, Minus, Radar } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PlacementTrendChart } from "@/features/outreach/components/placement-trend-chart";

import type { MockPost } from "./mock-posts";

/**
 * SinglePostTrackingTab —— 「单帖追踪」tab 内容。
 *
 * 投放监控数据默认锁住：先显示一个 paywall —— 「投放追踪」按钮后挂锁图标 +
 * 标注扣费积分。用户点击后填「投放追踪」卡片并扣费，placement 解锁，监控数据
 * （借鉴 Web 投放卡片：大数字 + 日均增量 + 趋势小图 + 指标网格）才回填显示。
 */
export function SinglePostTrackingTab({
  post,
  unlocked,
  cost,
  remaining,
  onOpenTracking,
}: {
  post: MockPost;
  // placement 是否已解锁（= 用户已完成投放追踪卡片并扣费）。
  unlocked: boolean;
  // 解锁需消耗的积分。
  cost: number;
  // 当前剩余积分 —— 不足时锁定 CTA 置灰。
  remaining: number;
  onOpenTracking: () => void;
}) {
  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-2">
        <Radar size={13} strokeWidth={2.2} style={{ color: "#ff4f00" }} aria-hidden />
        <h3 className="text-[13px] font-semibold" style={{ color: "#201515" }}>
          投放效果监控
        </h3>
      </div>
      {unlocked ? (
        <UnlockedTracking post={post} onOpenTracking={onOpenTracking} />
      ) : (
        <LockedTracking cost={cost} remaining={remaining} onOpenTracking={onOpenTracking} />
      )}
    </div>
  );
}

// ─── 锁住态：扣费前的 paywall ───────────────────────────────────────────

function LockedTracking({
  cost,
  remaining,
  onOpenTracking,
}: {
  cost: number;
  remaining: number;
  onOpenTracking: () => void;
}) {
  const insufficient = remaining < cost;
  return (
    <div
      className="mt-3 flex flex-col items-center gap-2.5 rounded-[8px] px-4 py-6 text-center"
      style={{ backgroundColor: "#fffdf9", border: "1px dashed #c5c0b1" }}
    >
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: "rgba(255, 79, 0, 0.10)" }}
      >
        <Lock size={15} strokeWidth={2.2} style={{ color: "#ff4f00" }} aria-hidden />
      </div>
      <div className="text-[12px] font-semibold" style={{ color: "#201515" }}>
        投放监控数据未解锁
      </div>
      <div className="text-[11px] leading-[1.55]" style={{ color: "#939084" }}>
        填写「投放追踪」卡片并扣费后，本帖的曝光趋势与互动指标将实时回填。
      </div>
      <Button
        unstyled
        type="button"
        onClick={onOpenTracking}
        disabled={insufficient}
        className="mt-1 inline-flex items-center gap-1.5 rounded-[6px] px-3.5 py-2 text-[12px] font-semibold text-[#fffefb] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        style={{ backgroundColor: "#ff4f00" }}
      >
        <Lock size={12} strokeWidth={2.4} aria-hidden />
        <span className="tabular-nums">
          {insufficient ? `余额不足（需 ${cost} 积分）` : `消耗 ${cost} 积分解锁`}
        </span>
      </Button>
    </div>
  );
}

// ─── 解锁态：借鉴 Web 投放卡片的监控视图 ───────────────────────────────

function UnlockedTracking({
  post,
  onOpenTracking,
}: {
  post: MockPost;
  onOpenTracking: () => void;
}) {
  const trend = post.viewsTrend7d;
  const delta = trend.length >= 2 ? (trend[trend.length - 1]! - trend[0]!) / (trend.length - 1) : 0;
  const DeltaIcon = delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : Minus;
  const deltaTone = delta > 0 ? "#3a8c5b" : delta < 0 ? "#ff4f00" : "#939084";

  return (
    <>
      {post.placementTags.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {post.placementTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
              style={{ backgroundColor: "#eceae3", color: "#36342e", border: "1px solid #c5c0b1" }}
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {/* 趋势块 —— 借鉴 Web 投放卡片 TrendBlock */}
      <div
        className="mt-3 rounded-[8px] px-3 pt-3 pb-1"
        style={{ backgroundColor: "#fffdf9", border: "1px solid #eceae3" }}
      >
        <div className="flex items-baseline gap-1.5">
          <span
            className="text-[22px] font-semibold tracking-tight tabular-nums"
            style={{ color: "#201515" }}
          >
            {post.metrics.plays}
          </span>
          <span className="text-[10.5px]" style={{ color: "#939084" }}>
            总播放
          </span>
        </div>
        <div
          className="mt-0.5 inline-flex items-center gap-0.5 text-[10.5px] tabular-nums"
          style={{ color: deltaTone }}
        >
          <DeltaIcon className="h-3 w-3" aria-hidden />
          <span>
            {delta === 0
              ? "持平 / 日"
              : `${delta > 0 ? "+" : "-"}${formatCount(Math.abs(delta))} / 日`}
          </span>
        </div>
        <PlacementTrendChart
          data={trend}
          color="#ff4f00"
          haloColor="#ff4f00"
          height={52}
          className="mt-1"
        />
      </div>

      {/* 指标网格 */}
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        <Metric label="观看" value={post.metrics.plays} />
        <Metric label="ER" value={post.metrics.er} />
        <Metric label="收藏" value={post.metrics.saves} />
        <Metric label="评论" value={post.metrics.comments} />
        <Metric label="分享" value={post.metrics.shares} />
      </div>

      {/* 已解锁 —— 二级按钮可重新配置追踪 */}
      <Button
        unstyled
        type="button"
        onClick={onOpenTracking}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-[6px] py-2 text-[12px] font-semibold transition-opacity hover:opacity-85"
        style={{ backgroundColor: "#fffdf9", color: "#36342e", border: "1px solid #c5c0b1" }}
      >
        调整投放追踪设置
      </Button>

      {/* 深链到 Web 追踪看板 */}
      <a
        href={`/workspace/outreach?tab=board&view=performance#placement-${post.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-[6px] py-2 text-[12px] font-semibold transition-opacity hover:opacity-85"
        style={{ backgroundColor: "#fffdf9", color: "#ff4f00", border: "1px solid #ff4f00" }}
      >
        <ExternalLink size={13} strokeWidth={2.4} aria-hidden />
        在投放后台看完整数据
      </a>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] px-2 py-2 text-center" style={{ backgroundColor: "#eceae3" }}>
      <div className="text-[10px]" style={{ color: "#939084" }}>
        {label}
      </div>
      <div className="mt-0.5 text-[14px] font-semibold tabular-nums" style={{ color: "#201515" }}>
        {value}
      </div>
    </div>
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}
