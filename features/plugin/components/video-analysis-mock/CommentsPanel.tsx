"use client";

import { Bookmark, Forward, Heart, MessageCircle, Music2, Smile } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * CommentsPanel — TikTok 网页版视频右侧那一列（用户头像 / caption / 互动按钮 /
 * 评论输入框）的简化 mock。让 3 列布局完整，给左侧 Linkr 工具区一个完整的"我
 * 在看 TikTok"参照系。视觉跟 TT 自带样式接近 — light 卡片，不是 cream，不属于
 * Linkr DESIGN.md 管辖（这是 TT 的 UI 不是 Linkr 的）。
 */
export function CommentsPanel() {
  return (
    <aside className="flex h-full w-[360px] flex-col bg-white">
      {/* Header — 用户行 */}
      <div className="flex items-start justify-between border-b border-zinc-100 px-4 pt-4 pb-3">
        <div className="flex items-start gap-2">
          <div className="h-9 w-9 flex-shrink-0 rounded-full bg-gradient-to-br from-pink-300 via-orange-300 to-amber-300" />
          <div className="min-w-0">
            <div className="truncate text-[14px] font-semibold text-zinc-900">jessie.y.lee</div>
            <div className="mt-0.5 text-[11.5px] text-zinc-500">Jessie Yurim Lee · 1-15</div>
          </div>
        </div>
        <Button
          unstyled
          type="button"
          className="rounded-md bg-[#fe2c55] px-3 py-1 text-[12px] font-semibold text-white"
        >
          关注
        </Button>
      </div>

      {/* Caption */}
      <div className="px-4 pt-3">
        <p className="text-[13px] leading-[1.5] text-zinc-900">
          I&apos;m here to give you achievable and realistic goals 🦦{" "}
          <span className="text-[#1c70d1]">#gymgirl</span>{" "}
          <span className="text-[#1c70d1]">#workoutmotivation</span>{" "}
          <span className="text-[#1c70d1]">#petitegymgirl</span>{" "}
          <span className="text-[#1c70d1]">#gymmotivation💪</span>{" "}
          <span className="text-[#1c70d1]">#gymtok</span>
        </p>
        <Button unstyled type="button" className="mt-1.5 text-[12px] text-zinc-500">
          查看翻译
        </Button>
        <div className="mt-2 flex items-center gap-1.5 text-[12px] text-zinc-700">
          <Music2 size={12} aria-hidden />
          <span>original sound - baddietunes</span>
        </div>
      </div>

      {/* Interactions row */}
      <div className="mt-3 flex items-center gap-3 px-4">
        <InteractionRound icon={<Heart size={18} fill="currentColor" />} count="20.5K" />
        <InteractionRound icon={<MessageCircle size={18} fill="currentColor" />} count="249" />
        <InteractionRound icon={<Bookmark size={18} fill="currentColor" />} count="3722" />
        <InteractionRound icon={<Forward size={18} />} count="1,204" />
      </div>

      {/* Tabs */}
      <div className="mt-4 flex items-center gap-5 border-b border-zinc-100 px-4">
        <Button
          unstyled
          type="button"
          className="relative pb-2 text-[14px] font-semibold text-zinc-900"
        >
          评论 <span className="text-zinc-500">(249)</span>
          <span className="absolute right-0 bottom-[-1px] left-0 h-[2px] rounded-full bg-zinc-900" />
        </Button>
        <Button unstyled type="button" className="pb-2 text-[14px] text-zinc-500">
          创作者视频
        </Button>
      </div>

      {/* Comment list — 简化为 2 条 */}
      <div className="flex-1 overflow-y-auto px-4 pt-3">
        <CommentItem
          handle="rurusdigitaljournal"
          text="Me tooo omg !! I'm 5'2 50 kgs !"
          when="3-8"
          likes={9}
        />
        <CommentItem
          handle="anon83647"
          text="i'm 5'2'' and 115 and have a POOCH 😅"
          when="1-17"
          likes={4}
        />
      </div>

      {/* Comment input */}
      <div className="flex items-center gap-2 border-t border-zinc-100 px-3 py-2.5">
        <div className="h-7 w-7 flex-shrink-0 rounded-full bg-gradient-to-br from-amber-200 to-orange-300" />
        <div className="flex flex-1 items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5">
          <input
            placeholder="添加评论..."
            disabled
            className="flex-1 bg-transparent text-[12.5px] text-zinc-700 placeholder:text-zinc-400 focus:outline-none"
          />
          <Smile size={14} className="text-zinc-400" aria-hidden />
        </div>
      </div>
    </aside>
  );
}

function InteractionRound({ icon, count }: { icon: React.ReactNode; count: string }) {
  return (
    <Button unstyled type="button" className="flex flex-col items-center gap-0.5 text-zinc-700">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100">
        {icon}
      </span>
      <span className="text-[10.5px] font-medium text-zinc-600 tabular-nums">{count}</span>
    </Button>
  );
}

function CommentItem({
  handle,
  text,
  when,
  likes,
}: {
  handle: string;
  text: string;
  when: string;
  likes: number;
}) {
  return (
    <div className="mb-3 flex items-start gap-2">
      <div className="h-7 w-7 flex-shrink-0 rounded-full bg-zinc-200" />
      <div className="min-w-0 flex-1">
        <div className="text-[12px] text-zinc-500">{handle}</div>
        <div className="mt-0.5 text-[13px] leading-[1.45] text-zinc-900">{text}</div>
        <div className="mt-1 flex items-center gap-3 text-[11px] text-zinc-500">
          <span>{when}</span>
          <Button unstyled type="button">
            回复
          </Button>
          <span className="ml-auto flex items-center gap-1">
            <Heart size={11} />
            {likes}
          </span>
        </div>
      </div>
    </div>
  );
}
