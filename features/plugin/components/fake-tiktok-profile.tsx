import { Heart, MessageCircle, Play, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { CreatorAvatar } from "@/features/plugin/components/creator-avatar";
import { HoverStat } from "@/features/plugin/components/hover-stat";
import {
  formatComments,
  formatDuration,
  formatLikes,
  formatPlays,
  generateSyntheticVideos,
  parseMetricToNumber,
  type SyntheticVideo,
  type VideoCategory,
} from "@/features/plugin/lib/synthetic";
import { getMedianNumber } from "@/features/plugin/lib/format";
import type { CreatorProfile, InlineDataKey } from "@/features/plugin/types";

export function FakeTiktokProfile({
  creator,
  dataCheckOn,
  scrapeCount,
  inlineDataKeys,
  playMedianMultiple,
}: {
  creator: CreatorProfile;
  dataCheckOn: boolean;
  scrapeCount: number;
  inlineDataKeys: InlineDataKey[];
  playMedianMultiple: number;
}) {
  const allVideos = generateSyntheticVideos(creator, Math.max(18, scrapeCount));
  const averagePlays =
    allVideos.reduce((sum, video) => sum + video.plays, 0) / Math.max(allVideos.length, 1);
  const medianPlays = getMedianNumber(allVideos.map((video) => video.plays));
  const flopThreshold = Math.max(0.35, 1 / Math.max(playMedianMultiple, 1));
  const hasInlineData = (key: InlineDataKey) => inlineDataKeys.includes(key);
  const getPlayMedianRatio = (video: SyntheticVideo) =>
    medianPlays > 0 ? video.plays / medianPlays : 1;
  // Rank by plays descending while using the creator's average plays as the comparison baseline.
  const rankedByPlays = [...allVideos].sort((a, b) => b.plays - a.plays);
  const rankMap = new Map<string, number>(rankedByPlays.map((v, i) => [v.id, i + 1]));
  // Display in rank order (top N by play count vs. average)
  const displayVideos = rankedByPlays.slice(0, scrapeCount);
  const totalPlaysNumber = parseMetricToNumber(creator.totalPlays ?? creator.followers ?? "0");
  const creatorErNumber = parseFloat(creator.er.replace("%", "")) || 0;

  return (
    <section className="mx-auto max-w-[980px] px-4 pb-10 pt-6 sm:px-8">
      <div className="flex items-start gap-4">
        <CreatorAvatar creator={creator} className="h-18 w-18 border border-[#e8e6dc]" labelClassName="text-3xl" />
        <div className="min-w-0 flex-1">
          <div className="break-words text-2xl font-semibold">{creator.handle}</div>
          <div className="mt-1 break-words text-sm text-[#5e5d59]">{creator.name}</div>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-[#5e5d59]">
            <HoverStat>{creator.followers} 粉丝</HoverStat>
            <HoverStat>{creator.likes} 获赞</HoverStat>
            <HoverStat>{creator.videos} 视频</HoverStat>
            <HoverStat>ER {creator.er}</HoverStat>
          </div>
          <div className="mt-3 max-w-2xl break-words text-sm leading-6 text-[#5e5d59]">
            {creator.bio}
          </div>
          <div className="mt-4 flex gap-3">
            <button className="rounded-xl bg-[#c96442] px-6 py-2 text-sm font-medium text-[#faf9f5] transition-colors hover:bg-[#d97757]">
              关注
            </button>
            <button className="rounded-xl border border-[#e8e6dc] bg-white px-6 py-2 text-sm font-medium text-[#4d4c48] transition-colors hover:bg-[#f5f4ed]">
              发消息
            </button>
          </div>
        </div>
      </div>

      {dataCheckOn ? (
        <div className="mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-[#bfd0ff] bg-[#eef2ff] px-4 py-3 text-sm">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-[#4f6bff]" />
              <span className="font-semibold text-[#2d3d99]">数据透视模式已开启</span>
              <span className="text-[#5e6fb0]">· 按平均播放量排序前 {scrapeCount} 条</span>
              <span className="text-[#5e6fb0]">· 爆量阈值 {playMedianMultiple.toFixed(1)}X</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#2d3d99]">
              {hasInlineData("plays") ? (
                <>
                  <span className="rounded-full bg-white/70 px-2.5 py-1">
                    总播放 <span className="font-semibold">{formatPlays(totalPlaysNumber)}</span>
                  </span>
                  <span className="rounded-full bg-white/70 px-2.5 py-1">
                    平均播放 <span className="font-semibold">{formatPlays(averagePlays)}</span>
                  </span>
                </>
              ) : null}
              {hasInlineData("engagement") ? (
                <span className="rounded-full bg-white/70 px-2.5 py-1">
                  互动率 <span className="font-semibold">{creatorErNumber.toFixed(1)}%</span>
                </span>
              ) : null}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {displayVideos.map((video) => {
              const rank = rankMap.get(video.id) ?? 0;
              const playMedianRatio = getPlayMedianRatio(video);
              return (
                <div
                  key={video.id}
                  className="relative aspect-[3/4] overflow-hidden rounded-[14px] bg-[linear-gradient(180deg,#7f9bff_0%,#6680f5_55%,#5269e0_100%)] text-white shadow-[0_12px_28px_-18px_rgba(60,82,196,0.55)] transition-transform duration-150 hover:-translate-y-0.5"
                >
                  {/* top row: speed + duration */}
                  <div className="absolute left-0 right-0 top-0 flex items-start justify-between px-3 pt-2.5 text-[11px] font-semibold opacity-95">
                    <span>{playMedianRatio.toFixed(1)}X</span>
                    <span>{formatDuration(video.durationSec)}</span>
                  </div>
                  {/* days */}
                  {hasInlineData("publishedAt") ? (
                    <div className="absolute left-0 right-0 top-7 text-center text-[11px] opacity-85">
                      {video.days} days
                    </div>
                  ) : null}
                  {/* center: rank + plays */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-[20px] font-semibold tracking-tight text-white/80">
                      #{rank}
                    </div>
                    {hasInlineData("plays") ? (
                      <div className="mt-1 text-[30px] font-bold leading-none tracking-tight">
                        {formatPlays(video.plays)}
                      </div>
                    ) : null}
                  </div>
                  {/* bottom: ER + stats */}
                  <div className="absolute inset-x-0 bottom-0 px-3 pb-2.5">
                    {hasInlineData("engagement") ? (
                      <div className="text-[11px] font-semibold opacity-95">
                        ER <span className="text-white">{video.erPct.toFixed(1)}%</span>
                      </div>
                    ) : null}
                    <div className="mt-1 flex items-center gap-2 text-[10.5px] opacity-95">
                      {hasInlineData("plays") ? (
                        <span className="inline-flex items-center gap-0.5">
                          <Play className="h-2.5 w-2.5" fill="currentColor" />
                          {formatPlays(video.plays)}
                        </span>
                      ) : null}
                      {hasInlineData("likes") ? (
                        <span className="inline-flex items-center gap-0.5">
                          <Heart className="h-2.5 w-2.5" />
                          {formatLikes(video.likes)}
                        </span>
                      ) : null}
                      {hasInlineData("comments") ? (
                        <span className="inline-flex items-center gap-0.5">
                          <MessageCircle className="h-2.5 w-2.5" />
                          {formatComments(video.comments)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
      <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {allVideos.slice(0, 9).map((video) => {
          const ratio = getPlayMedianRatio(video);
          const autoCategory: VideoCategory =
            video.category === "paid"
              ? "paid"
              : ratio >= playMedianMultiple
                ? "viral"
                : ratio <= flopThreshold
                  ? "flop"
                  : "normal";
          const cardGradient =
            autoCategory === "viral"
              ? "bg-[linear-gradient(180deg,#ff8a8a_0%,#ef4444_55%,#c92c2c_100%)]"
              : autoCategory === "flop"
                ? "bg-[linear-gradient(180deg,#7f9bff_0%,#4f6bff_55%,#2d4dd1_100%)]"
                : autoCategory === "paid"
                  ? "bg-[linear-gradient(180deg,#6dd58c_0%,#22c55e_55%,#148a3f_100%)]"
                  : "bg-[linear-gradient(180deg,#a1a6b5_0%,#7a8194_55%,#5b6275_100%)]";
          return (
            <div
              key={video.id}
              className={cn(
                "group relative aspect-[3/4] overflow-hidden rounded-[14px] text-white shadow-[0_12px_28px_-18px_rgba(60,82,196,0.45)] transition-transform duration-150 hover:-translate-y-0.5",
                cardGradient
              )}
            >
              {/* top row: speed + duration */}
              <div className="absolute left-0 right-0 top-0 z-10 flex items-start justify-between px-3 pt-2.5 text-[11px] font-semibold opacity-95">
                {/* speed with hover tooltip legend */}
                <span className="group/speed relative cursor-help">
                  <span className="underline decoration-dotted underline-offset-2">
                    {ratio.toFixed(1)}X
                  </span>
                  <span className="pointer-events-none invisible absolute left-0 top-full z-20 mt-1.5 w-[180px] rounded-lg bg-black/85 px-2.5 py-2 text-left text-[10.5px] font-normal leading-[1.45] text-white opacity-0 shadow-lg transition-[opacity,visibility] duration-150 group-hover/speed:visible group-hover/speed:opacity-100">
                    <span className="block font-semibold">
                      This post views ÷ Average views
                    </span>
                    <span className="mt-1 block">
                      <span className="text-[#ff8a8a]">Red:</span> viral
                    </span>
                    <span className="block">
                      <span className="text-[#9fb5ff]">Blue:</span> flop
                    </span>
                    <span className="block">
                      <span className="text-[#8ae3a2]">Green:</span> paid partnership
                    </span>
                  </span>
                </span>
                <span>{formatDuration(video.durationSec)}</span>
              </div>
              {/* hours ago */}
              <div className="absolute left-0 right-0 top-7 text-center text-[11px] opacity-85">
                {video.hoursAgo} hours
              </div>
              {/* bottom: ER + stats */}
              <div className="absolute inset-x-0 bottom-0 px-3 pb-2.5">
                <div className="text-[11px] font-semibold opacity-95">
                  ER <span className="text-white">{video.erPct.toFixed(1)}%</span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-[10.5px] opacity-95">
                  <span className="inline-flex items-center gap-0.5">
                    <Play className="h-2.5 w-2.5" fill="currentColor" />
                    {formatPlays(video.plays)}
                  </span>
                  <span className="inline-flex items-center gap-0.5">
                    <Heart className="h-2.5 w-2.5" />
                    {formatLikes(video.likes)}
                  </span>
                  <span className="inline-flex items-center gap-0.5">
                    <MessageCircle className="h-2.5 w-2.5" />
                    {formatComments(video.comments)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </section>
  );
}
