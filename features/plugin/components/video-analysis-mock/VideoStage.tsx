"use client";

import { MoreHorizontal, Play, Search, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * VideoStage — 模拟 TikTok 网页版的视频中央区。互动按钮 / caption / 评论入口
 * 都在右侧 CommentsPanel 里，所以这里只保留 dark 渐变底图 + 顶部搜索栏 + 中央
 * 播放按钮 + 底部进度条 + 右上 ··· 菜单，跟 TikTok 网页播放页的真实结构对齐。
 *
 * 视觉故意保留 dark — 视频本身是暗的，Linkr 工具浮在左侧黑边里。
 *
 * **不需要任何 .mp4 / .jpg 视频素材文件**。底图用纯 CSS 三层 radial-gradient
 * 模拟手机竖屏视频的暗调氛围。要换真实视频/图片：把第一个渐变 div 的
 * `background` 换成 `url('/your-video-cover.jpg') center/cover` 即可。
 */
export function VideoStage() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0a0a0a]">
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(120% 80% at 30% 35%, #2a1f1a 0%, #14100e 45%, #050505 100%)",
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(40% 25% at 70% 25%, rgba(255, 200, 140, 0.18) 0%, transparent 70%)",
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(35% 25% at 30% 70%, rgba(160, 140, 255, 0.12) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      {/* 顶部 — 搜索栏 + 右上 ··· 菜单（TikTok 网页结构） */}
      <div className="absolute top-3 right-3 left-3 z-10 flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-[12.5px] text-white/80 backdrop-blur-sm">
          <Search size={13} aria-hidden />
          <span>查找相关内容</span>
        </div>
        <Button
          unstyled
          type="button"
          aria-label="更多"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/12 text-white/85 backdrop-blur-sm hover:bg-white/18"
        >
          <MoreHorizontal size={16} />
        </Button>
      </div>

      {/* 中心 — 播放按钮 */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <Button
          unstyled
          type="button"
          aria-label="播放"
          className="pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm transition-colors hover:bg-black/60"
        >
          <Play size={26} fill="white" stroke="white" className="ml-1" />
        </Button>
      </div>

      {/* 占位 caption（小字，置左下；真 caption 在右侧 CommentsPanel） */}
      <div className="absolute bottom-12 left-4 z-10 text-[11.5px] text-white/85">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold">@jessie.y.lee</span>
        </div>
        <div className="mt-1 max-w-[68%] leading-[1.45] text-white/75">
          157cm / 5&apos;2&quot; · 52kg / 115lbs · Korean
        </div>
      </div>

      {/* 底部 — 进度条 + 时间码 + 声音 */}
      <div className="absolute right-3 bottom-3 left-3 z-10">
        <div className="flex items-center gap-2 text-[11px] text-white/85">
          <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/20">
            <div className="h-full w-[60%] rounded-full bg-white/80" />
          </div>
          <span className="tabular-nums">00:06 / 00:08</span>
          <Volume2 size={13} aria-hidden />
        </div>
      </div>
    </div>
  );
}
