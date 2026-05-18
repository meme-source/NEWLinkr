"use client";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

import { CommentsPanel } from "./CommentsPanel";
import { VideoStage } from "./VideoStage";

/**
 * SinglePostPage —— 插件 demo 里「点开某条帖子」后的抖音单帖详情页 mock。
 *
 * 用户在博主主页点任意一条视频，主内容区从九宫格切成这个单帖页：居中是
 * 9:16 视频（VideoStage）+ TikTok 右侧评论列（CommentsPanel），跟抖音网页版
 * 打开单个视频的版式对齐。此时插件侧边栏由 plugin-path-demo 自动弹到
 * 「单帖 AI 分析」。
 *
 * VideoStage / CommentsPanel 与独立预览页 /mock-video 共用，是一套自洽的
 * TikTok 帖子 mock；不与博主主页的 activeCreator 强绑定（沿用 video-analysis-mock
 * 子系统一贯的数据解耦）。
 */
export function SinglePostPage({ onBack }: { onBack: () => void }) {
  return (
    <section className="relative flex min-h-[780px] items-center justify-center overflow-x-auto bg-[#0a0a0a] px-6 py-12">
      <div className="absolute top-4 left-4 z-20">
        <Button
          unstyled
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-[12.5px] font-medium text-white/85 backdrop-blur-sm transition-colors hover:bg-white/20"
        >
          <ArrowLeft size={14} aria-hidden />
          返回主页
        </Button>
      </div>

      <div className="flex gap-0">
        <div
          className="relative w-[400px] overflow-hidden rounded-l-[8px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]"
          style={{ aspectRatio: "9 / 16" }}
        >
          <VideoStage />
        </div>
        <div className="h-[711px] overflow-hidden rounded-r-[8px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
          <CommentsPanel />
        </div>
      </div>
    </section>
  );
}
