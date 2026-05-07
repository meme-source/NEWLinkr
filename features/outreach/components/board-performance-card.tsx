"use client";

import Image from "next/image";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bookmark,
  FolderOpen,
  Heart,
  Instagram,
  MessageCircle,
  Minus,
  Music2,
  Send,
} from "lucide-react";
import { useState } from "react";

import { useCreatorProfile } from "@/features/creator/components/creator-profile-context";
import {
  CATEGORY_LABEL,
  cpeOf,
  cpmOf,
  dailyDelta,
  fmtCount,
  fmtMoney,
  PAUSED_BADGE,
  PAUSED_DOT,
  STATUS_BADGE,
  STATUS_DOT,
} from "@/features/outreach/components/board-performance-shared";
import { PlacementActionsMenu } from "@/features/outreach/components/placement-actions-menu";
import { PlacementTrendChart } from "@/features/outreach/components/placement-trend-chart";
import type { Placement, PlacementPlatform } from "@/features/outreach/data/board-placements";
import { useOutreachState } from "@/features/outreach/components/outreach-state-context";
import { cn } from "@/lib/utils";

// §3.3 单条投放的快照卡片。
// 2026-05-07 改版（v2）：
//   - 状态徽章只读：增长中 / 稳定中 / 下降中 由数据监测自动给出
//   - 用户主动行为收进右下角 ⋯ 菜单：暂停 / 原帖 / 删除
//   - 暂停后徽章覆盖显示"已暂停"
//   - trend 段不再嵌内框，与卡片其余行左右贴齐
interface Props {
  placement: Placement;
  // 仅在"全部项目"视图下传入；单项目视图下省略，避免重复噪音。
  projectName?: string;
}

const PLATFORM_ICON_MAP: Record<PlacementPlatform, React.ComponentType<{ className?: string }>> = {
  TikTok: Music2,
  Instagram,
  Xiaohongshu: Music2,
};

const PROFILE_PLATFORM_MAP: Record<PlacementPlatform, "tiktok" | "instagram" | undefined> = {
  TikTok: "tiktok",
  Instagram: "instagram",
  Xiaohongshu: undefined,
};

export function PlacementCard({ placement: p, projectName }: Props) {
  const [trendRange, setTrendRange] = useState<"7d" | "30d">("7d");
  const { isPlacementPaused, togglePlacementPaused, setPlacementDeleted } = useOutreachState();
  const { openCreatorProfile } = useCreatorProfile();

  const paused = isPlacementPaused(p.id);
  const trend = trendRange === "7d" ? p.viewsTrend7d : p.viewsTrend30d;
  const delta = dailyDelta(trend);
  const PlatformIcon = PLATFORM_ICON_MAP[p.platform];
  // 暂停时图表/标识统一切灰；保持 7d / 30d 切换可用，但视觉上"冻结"。
  const accentColor = paused ? PAUSED_DOT : STATUS_DOT[p.status];

  const openProfile = () => {
    // 抽屉内 useCreatorPlacements(handle) 会自动按 handle 取齐 mock + 用户录入
    // 的 placement，并过滤软删，无需在调用方拼装。
    openCreatorProfile({
      handle: p.creatorHandle,
      fallback: {
        name: p.creatorName,
        avatar: p.creatorAvatarUrl,
        platform: PROFILE_PLATFORM_MAP[p.platform],
        followers: p.creatorFollowers,
        engagementRate: p.er,
        category: p.creatorCategory,
      },
    });
  };

  return (
    <article
      className={cn(
        "group flex flex-col rounded-2xl border bg-[#fffefb] p-4 transition-colors",
        paused ? "border-[#eceae3] opacity-90" : "border-[#c5c0b1] hover:border-[#b5b2aa]",
      )}
    >
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          onClick={openProfile}
          className="shrink-0 rounded-full ring-2 ring-[#fff7f4] transition-shadow hover:ring-[#ffd9c8]"
          aria-label={`查看 ${p.creatorHandle} 资料`}
        >
          <Image
            src={p.creatorAvatarUrl}
            alt={p.creatorName}
            width={36}
            height={36}
            className="h-9 w-9 rounded-full bg-[#fff7f4] object-cover"
            unoptimized
          />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={openProfile}
              className="truncate text-[13px] font-semibold text-[#201515] transition-colors hover:text-[#ff4f00]"
            >
              {p.creatorHandle}
            </button>
            <span
              className="inline-flex items-center gap-0.5 rounded-md bg-[#eceae3] px-1.5 py-0.5 text-[10px] text-[#36342e]"
              title={p.platform}
            >
              <PlatformIcon className="h-3 w-3" aria-hidden />
              {p.platform}
            </span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-[#939084] tabular-nums">
            <span>{fmtCount(p.creatorFollowers)} 粉丝</span>
            <span aria-hidden>·</span>
            <span className="rounded-md bg-[#fff7f4] px-1.5 py-0.5 text-[10px] font-medium text-[#ff4f00]">
              {CATEGORY_LABEL[p.creatorCategory]}
            </span>
            {projectName ? (
              <span
                className="inline-flex max-w-[12rem] items-center gap-1 rounded-md border border-[#eceae3] bg-[#fffefb] px-1.5 py-0.5 text-[10px] font-medium text-[#36342e]"
                title={`所属项目：${projectName}`}
              >
                <FolderOpen className="h-3 w-3 shrink-0" aria-hidden />
                <span className="truncate">{projectName}</span>
              </span>
            ) : null}
          </div>
        </div>
        <StatusBadge status={p.status} paused={paused} />
      </div>

      <TrendBlock
        trend={trend}
        delta={delta}
        accentColor={accentColor}
        paused={paused}
        range={trendRange}
        onRangeChange={setTrendRange}
        views={p.views}
      />

      <dl className="mt-3 grid grid-cols-4 gap-2 border-t border-[#eceae3] pt-3 text-[11px]">
        <Stat label="曝光" value={fmtCount(p.views)} />
        <Stat label="ER" value={`${p.er.toFixed(1)}%`} />
        <Stat label="CPM" value={fmtMoney(cpmOf(p), 2)} />
        <Stat label="CPE" value={fmtMoney(cpeOf(p), 3)} />
      </dl>

      <div className="mt-2 flex items-center gap-3 text-[10px] text-[#939084] tabular-nums">
        <EngagementChip Icon={Heart} value={p.likes} label="点赞" />
        <EngagementChip Icon={MessageCircle} value={p.comments} label="评论" />
        <EngagementChip Icon={Send} value={p.shares} label="分享" />
        <EngagementChip Icon={Bookmark} value={p.favorites} label="收藏" />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-[#eceae3] pt-2 text-[10px] text-[#939084]">
        <span>
          发布 {p.postedAt} · 费用 {fmtMoney(p.spendUsd, 0)}
        </span>
        <PlacementActionsMenu
          paused={paused}
          onTogglePaused={() => togglePlacementPaused(p.id)}
          postUrl={p.postUrl}
          onDelete={() => setPlacementDeleted(p.id)}
        />
      </div>
    </article>
  );
}

// 状态徽章 —— 只读。优先显示用户主动暂停状态，否则显示数据监测出的自动状态。
function StatusBadge({ status, paused }: { status: Placement["status"]; paused: boolean }) {
  const cls = paused ? PAUSED_BADGE : STATUS_BADGE[status];
  const dot = paused ? PAUSED_DOT : STATUS_DOT[status];
  const label = paused ? "已暂停" : status;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        cls,
      )}
    >
      <span
        aria-hidden
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: dot }}
      />
      {label}
    </span>
  );
}

interface TrendBlockProps {
  trend: number[];
  delta: number;
  accentColor: string;
  paused: boolean;
  range: "7d" | "30d";
  onRangeChange: (next: "7d" | "30d") => void;
  views: number;
}

function TrendBlock({
  trend,
  delta,
  accentColor,
  paused,
  range,
  onRangeChange,
  views,
}: TrendBlockProps) {
  const DeltaIcon = delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : Minus;
  const deltaTone = paused
    ? "text-[#939084]"
    : delta > 0
      ? "text-[#3a8c5b]"
      : delta < 0
        ? "text-[#ff4f00]"
        : "text-[#939084]";

  return (
    <div className="mt-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[20px] font-semibold tracking-tight text-[#201515] tabular-nums">
              {fmtCount(views)}
            </span>
            <span className="text-[10px] text-[#939084]">总播放</span>
          </div>
          <div
            className={cn(
              "mt-0.5 inline-flex items-center gap-0.5 text-[10px] tabular-nums",
              deltaTone,
            )}
          >
            <DeltaIcon className="h-3 w-3" aria-hidden />
            <span>
              {delta === 0
                ? `—${delta.toFixed(0)}/日`
                : `${delta > 0 ? "+" : ""}${fmtCount(Math.abs(delta))}/日`}
            </span>
          </div>
        </div>
        <RangeToggle range={range} onRangeChange={onRangeChange} />
      </div>
      <PlacementTrendChart
        data={trend}
        color={accentColor}
        haloColor={accentColor}
        height={56}
        className="mt-2"
      />
    </div>
  );
}

function RangeToggle({
  range,
  onRangeChange,
}: {
  range: "7d" | "30d";
  onRangeChange: (next: "7d" | "30d") => void;
}) {
  return (
    <div className="flex shrink-0 items-center rounded-full bg-[#eceae3] p-0.5 text-[10px]">
      {(["7d", "30d"] as const).map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onRangeChange(opt)}
          className={cn(
            "rounded-full px-2 py-0.5 transition-colors",
            range === opt ? "bg-[#ff4f00] text-[#fffefb]" : "text-[#939084] hover:text-[#36342e]",
          )}
        >
          {opt === "7d" ? "7天" : "30天"}
        </button>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] text-[#939084]">{label}</dt>
      <dd className="mt-0.5 font-semibold text-[#201515] tabular-nums">{value}</dd>
    </div>
  );
}

function EngagementChip({
  Icon,
  value,
  label,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1" title={label}>
      <Icon className="h-3 w-3" aria-hidden />
      {fmtCount(value)}
    </span>
  );
}
