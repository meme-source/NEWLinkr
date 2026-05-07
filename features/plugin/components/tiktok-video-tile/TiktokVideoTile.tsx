import Image from "next/image";
import { Heart, MessageCircle, Play } from "lucide-react";

import { cn } from "@/lib/utils";

import { getVideoCoverUrl } from "./cover-pool";
import type { TiktokVideoCategory, TiktokVideoTileProps } from "./types";

const BADGE_STYLES: Record<
  TiktokVideoCategory,
  { className: string; suffix: "" | "-Paid" | "-Shop" }
> = {
  viral: { className: "bg-[#ff5a3d] text-[#fffefb]", suffix: "" },
  flop: { className: "bg-[#3a8dff] text-[#fffefb]", suffix: "" },
  paid: { className: "bg-[#1f6feb] text-[#fffefb]", suffix: "-Paid" },
  shop: { className: "bg-[#16a34a] text-[#fffefb]", suffix: "-Shop" },
  normal: { className: "bg-black/55 text-[#fffefb] backdrop-blur-sm", suffix: "" },
};

function formatPlays(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatLikes(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatComments(n: number): string {
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getBadgeTooltip(
  category: TiktokVideoCategory,
  viralThreshold: number,
  flopThreshold: number,
): string | null {
  switch (category) {
    case "viral":
      return `播放倍数 ≥ ${viralThreshold.toFixed(1)}x，表现远超日常中位数`;
    case "flop":
      return `播放倍数 ≤ ${flopThreshold.toFixed(1)}x，表现低于日常中位数`;
    case "paid":
      return "识别到平台商业合作标签";
    case "shop":
      return "识别到橱窗或商品挂车链接";
    default:
      return null;
  }
}

export function TiktokVideoTile({
  videoId,
  category,
  ratio,
  durationSec,
  ageLabel,
  erPct,
  plays,
  likes,
  comments,
  showStats = true,
  viralThreshold = 1.5,
  flopThreshold = 0.7,
}: TiktokVideoTileProps) {
  const badge = BADGE_STYLES[category];
  const coverUrl = getVideoCoverUrl(videoId);
  const tooltip = getBadgeTooltip(category, viralThreshold, flopThreshold);

  return (
    <div className="group relative aspect-[3/4] overflow-hidden rounded-[8px] border border-[#c5c0b1] bg-[#201515] text-[#fffefb] transition-transform duration-150 hover:-translate-y-0.5">
      <Image
        src={coverUrl}
        alt=""
        fill
        sizes="(min-width: 1024px) 220px, (min-width: 640px) 30vw, 50vw"
        className="object-cover"
        unoptimized
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/55 via-black/15 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

      <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between px-2.5 pt-2.5">
        <div className="group/badge relative">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-[3px] text-[11px] leading-none font-semibold",
              badge.className,
            )}
          >
            {ratio.toFixed(1)}X{badge.suffix}
          </span>
          {tooltip ? (
            <div
              role="tooltip"
              className="pointer-events-none absolute top-full left-0 z-20 mt-1.5 w-max max-w-[220px] rounded-md bg-[#201515]/95 px-2 py-1 text-[10.5px] leading-snug font-medium whitespace-normal text-[#fffefb] opacity-0 ring-1 ring-white/10 backdrop-blur-sm transition-opacity duration-150 group-hover/badge:opacity-100"
            >
              {tooltip}
            </div>
          ) : null}
        </div>
        <span className="text-[11px] font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">
          {formatDuration(durationSec)}
        </span>
      </div>

      <div className="absolute inset-x-0 top-9 z-10 text-center text-[11px] text-[#fffefb]/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">
        {ageLabel}
      </div>

      {showStats ? (
        <div className="absolute inset-x-0 bottom-0 z-10 px-3 pb-2.5">
          <div className="text-[11px] font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
            ER <span>{erPct.toFixed(1)}%</span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-[10.5px] text-[#fffefb]/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
            <span className="inline-flex items-center gap-0.5">
              <Play className="h-2.5 w-2.5" fill="currentColor" />
              {formatPlays(plays)}
            </span>
            <span className="inline-flex items-center gap-0.5">
              <Heart className="h-2.5 w-2.5" />
              {formatLikes(likes)}
            </span>
            <span className="inline-flex items-center gap-0.5">
              <MessageCircle className="h-2.5 w-2.5" />
              {formatComments(comments)}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
