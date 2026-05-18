"use client";

import Image from "next/image";
import { Heart, RefreshCw, X } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { RatingStars, RATING_LABELS } from "@/features/library/components/rating-stars";
import { dominantStatus, regionDisplay } from "@/lib/creator";
import { useCreatorOverrides } from "@/features/creator/components/creator-overrides-context";
import type { CollaborationStatus, Creator, Rating } from "@/types/api";
import { cn } from "@/lib/utils";

import { HeaderActions } from "./header-actions";
import { HeaderProjectChips } from "./header-project-chips";

interface Props {
  creator: Creator;
  onClose: () => void;
  onChangeCollaborationStatus?: (
    creatorId: string,
    projectId: string,
    next: CollaborationStatus,
  ) => void;
  onFavoriteToggle?: (favorited: boolean) => void;
  onToast?: (msg: string) => void;
}

export function DrawerHeader({
  creator,
  onClose,
  onChangeCollaborationStatus,
  onFavoriteToggle,
  onToast,
}: Props) {
  const region = regionDisplay(creator.region);
  const [favorited, setFavorited] = useState(creator.favorited);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState(creator.lastRefreshedAt);
  const isCompleted = dominantStatus(creator) === "completed";

  const { setCreatorRating } = useCreatorOverrides();
  // creator.rating 已经过 override 合并，所以星级直接读它即可。
  const rating = creator.rating;

  const handleRatingChange = useCallback(
    (next: Rating) => {
      setCreatorRating(creator.id, next);
      onToast?.(`已更新评级为「${RATING_LABELS[next]}」`);
    },
    [creator.id, onToast, setCreatorRating],
  );

  const handleFavoriteClick = useCallback(() => {
    setFavorited((prev) => {
      const next = !prev;
      onFavoriteToggle?.(next);
      return next;
    });
  }, [onFavoriteToggle]);

  const handleRefresh = useCallback(() => {
    if (refreshing) return;
    setRefreshing(true);
    // TODO Phase 2：调用 /api/creators/:id/refresh，回写 lastRefreshedAt。
    window.setTimeout(() => {
      setRefreshedAt(new Date().toISOString());
      setRefreshing(false);
    }, 900);
  }, [refreshing]);

  return (
    <div className="space-y-3 border-b border-[#c5c0b1] bg-[rgba(250,249,245,0.92)] px-6 py-4 backdrop-blur">
      {/* Row 1：头像 / handle / 收藏 / 关闭 */}
      <div className="flex items-start gap-3">
        {creator.avatar ? (
          <Image
            src={creator.avatar}
            alt={creator.name}
            width={56}
            height={56}
            className="h-14 w-14 rounded-full bg-[#fff7f4] object-cover ring-2 ring-white"
            unoptimized
          />
        ) : (
          <div className="h-14 w-14 rounded-full bg-[#fff7f4] ring-2 ring-white" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[18px] font-bold text-[#201515]">{creator.handle}</h2>
            <Button
              unstyled
              type="button"
              onClick={handleFavoriteClick}
              aria-label={favorited ? "取消收藏" : "收藏"}
              aria-pressed={favorited}
              className={cn(
                "inline-flex h-7 w-7 items-center justify-center rounded-full border transition-colors",
                favorited
                  ? "border-[#ff4f00] bg-[#fff7f4] text-[#ff4f00]"
                  : "border-[#c5c0b1] text-[#939084] hover:border-[#ff4f00] hover:text-[#ff4f00]",
              )}
            >
              <Heart className={cn("h-3.5 w-3.5", favorited && "fill-current")} />
            </Button>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[#36342e]">
            <span className="inline-flex items-center gap-1">
              <span aria-hidden>{region.flag}</span>
              {region.name && <span>{region.name}</span>}
            </span>
            <span aria-hidden>·</span>
            <span>{fmtFollowers(creator.followers)} 粉丝</span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#939084]">
            <span>评级</span>
            {isCompleted ? (
              <>
                <RatingStars
                  value={rating}
                  size="sm"
                  onChange={handleRatingChange}
                  ariaLabel="编辑评级"
                />
                <span className="text-[11px] text-[#36342e]">{RATING_LABELS[rating]}</span>
              </>
            ) : (
              <span className="text-[11px] text-[#bdb9ac]" title="合作完成后可评级">
                合作完成后可评级
              </span>
            )}
          </div>
        </div>
        <Button
          unstyled
          type="button"
          onClick={onClose}
          className="rounded-full border border-[#c5c0b1] p-1.5 text-[#939084] transition-colors hover:bg-[#fffefb]"
          aria-label="关闭"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Row 2：项目 chip 组（含状态下拉，单一来源） */}
      <HeaderProjectChips
        creator={creator}
        onChangeCollaborationStatus={onChangeCollaborationStatus}
        onToast={onToast}
      />

      {/* Row 3：操作按钮 + 数据刷新 */}
      <HeaderActions
        creator={creator}
        rightSlot={
          <div className="ml-auto flex items-center gap-2 text-[11px] text-[#939084]">
            <span className="tabular-nums">
              {refreshedAt ? `${fmtRefreshedAt(refreshedAt)} 更新` : "尚未刷新"}
            </span>
            <Button
              unstyled
              type="button"
              onClick={handleRefresh}
              aria-label="刷新博主数据"
              title="刷新博主数据"
              className={cn(
                "inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#c5c0b1] bg-[#fffefb] text-[#36342e] transition-colors hover:border-[#ff4f00] hover:text-[#ff4f00]",
                refreshing && "border-[#ff4f00] text-[#ff4f00]",
              )}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            </Button>
          </div>
        }
      />
    </div>
  );
}

function fmtFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtRefreshedAt(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
