"use client";

import { motion } from "framer-motion";
import { Eye, Heart, Star, X } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import type { Creator, VideoPost } from "./mock-data";

interface Props {
  creator: Creator;
  status: "pending" | "saved" | "skipped";
  onSave: (id: string) => void;
  onSkip: (id: string) => void;
  onOpenProfile: (creator: Creator) => void;
}

const BRAND = "#ff4f00";

function VideoTile({ video }: { video: VideoPost }) {
  return (
    <div className="group relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-zinc-100">
      <Image
        src={`https://picsum.photos/seed/${video.thumbSeed}/300/400`}
        alt={video.caption}
        fill
        sizes="120px"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        unoptimized
      />

      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent via-40% to-black/85"
      />

      {video.isCollab && (
        <div
          className="absolute top-1.5 left-1.5 flex items-center gap-0.5 rounded-md bg-zinc-700/85 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-md"
          title="合作案例"
        >
          <Star size={8} fill="white" strokeWidth={0} />
          AD
        </div>
      )}

      <div className="absolute top-1.5 right-1.5 rounded-md bg-zinc-700/85 px-1.5 py-0.5 text-[9px] font-semibold text-white backdrop-blur-md">
        {video.duration}
      </div>

      <div className="absolute right-1.5 bottom-1.5 left-1.5">
        <div className="text-[13px] leading-tight font-extrabold tracking-tight text-white">
          ER {video.er}
        </div>
        <div className="mt-1 flex items-center gap-2 text-[10px] font-medium text-white/95">
          <span className="flex items-center gap-0.5">
            <Eye size={9} strokeWidth={2.4} />
            {video.views}
          </span>
          <span className="flex items-center gap-0.5">
            <Heart size={9} strokeWidth={2.4} />
            {video.likes}
          </span>
        </div>
      </div>
    </div>
  );
}

export function CompositeCreatorCard({ creator, status, onSave, onSkip, onOpenProfile }: Props) {
  const isSaved = status === "saved";
  const isSkipped = status === "skipped";

  const tiles = creator.videos.slice(0, 3);
  while (tiles.length < 3) tiles.push(creator.videos[tiles.length % creator.videos.length]);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: isSkipped ? 0.45 : 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.8 }}
      className="flex h-full flex-col overflow-hidden rounded-lg bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)] ring-1 ring-black/5 transition-shadow hover:shadow-[0_2px_4px_rgba(0,0,0,0.04),0_12px_36px_-12px_rgba(0,0,0,0.12)]"
    >
      <div className="flex flex-1 flex-col px-5 pt-5 pb-4">
        <header className="flex items-start gap-3">
          <Button
            unstyled
            type="button"
            onClick={() => onOpenProfile(creator)}
            className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full ring-2 ring-white transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)]"
            style={{ ["--brand" as string]: BRAND }}
            aria-label={`查看 ${creator.displayName} 资料`}
          >
            <Image
              src={`https://i.pravatar.cc/96?img=${creator.avatarSeed}`}
              alt={creator.displayName}
              fill
              sizes="48px"
              className="object-cover"
              unoptimized
            />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <Button
                unstyled
                type="button"
                onClick={() => onOpenProfile(creator)}
                className="-m-1 min-w-0 flex-1 rounded-md p-1 text-left transition-colors hover:bg-zinc-50 focus:outline-none"
              >
                <h3 className="truncate text-[16px] leading-tight font-bold tracking-tight text-zinc-900">
                  {creator.displayName}
                </h3>
                <div className="mt-0.5 truncate text-[12px] font-normal text-zinc-400">
                  {creator.handle}
                </div>
              </Button>
              <div className="flex flex-shrink-0 items-center gap-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-pink-50">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5 text-zinc-900"
                    fill="currentColor"
                  >
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.69a8.16 8.16 0 0 0 4.77 1.52V6.78a4.85 4.85 0 0 1-1.84-.09z" />
                  </svg>
                </div>
                <div
                  className="rounded-md px-2 py-0.5 text-[11.5px] font-extrabold whitespace-nowrap tabular-nums"
                  style={{ backgroundColor: "rgba(255,79,0,0.1)", color: BRAND }}
                >
                  ER {creator.er}
                </div>
              </div>
            </div>
            <div className="mt-1.5 flex items-center gap-3 text-[11.5px] tracking-tight text-zinc-500">
              <span className="inline-flex items-center gap-1">
                <Eye size={11} strokeWidth={2.2} />
                {creator.followers}
              </span>
              <span className="inline-flex items-center gap-1">
                <Heart size={11} strokeWidth={2.2} />
                {creator.medianViews}
              </span>
            </div>
          </div>
        </header>

        <div className="mt-5 flex items-center gap-1.5">
          <span className="text-[12px]" style={{ color: BRAND }}>
            ✦
          </span>
          <span className="text-[12px] font-semibold tracking-tight" style={{ color: BRAND }}>
            AI 推荐
          </span>
        </div>
        {/* Reason text gets the soft warm panel; the "AI 推荐" label sits
            outside it (Linkr DESIGN.md §6.5.2 Soft Surface idiom — tinted
            background hugs only the body content, not the label). Fixed
            2-line slot keeps every card the same height in a row. */}
        <p
          className="mt-2 line-clamp-2 rounded-[8px] bg-[#F9F4F1] px-3 py-1.5 text-[13.5px] leading-relaxed font-medium text-zinc-900"
          style={{ minHeight: "calc(2 * 1.6em + 12px)" }}
        >
          {creator.reasons[0]}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {tiles.map((v, i) => (
            <VideoTile key={`${v.id}-${i}`} video={v} />
          ))}
        </div>

        {/* Pin the risk row to the bottom of the card body so the action bar
            below always lines up across siblings. mt-auto pushes us against
            the bottom regardless of the reason line count. */}
        <p
          className="mt-auto flex items-start gap-1.5 pt-4 text-[12px] leading-relaxed text-zinc-500"
          style={{ minHeight: "calc(2 * 1.55em + 1rem)" }}
        >
          <span aria-hidden>💡</span>
          <span className="line-clamp-2">
            {creator.risk ?? "爆款集中在测评类，建议 brief 贴近真实使用场景"}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-2 border-t border-zinc-100">
        <Button
          unstyled
          type="button"
          onClick={() => onSkip(creator.id)}
          className="group flex h-12 items-center justify-center gap-1.5 border-r border-zinc-100 text-[13px] font-semibold tracking-wide text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600"
          aria-label="Skip"
        >
          <X size={14} strokeWidth={2.5} className="transition-transform group-hover:rotate-90" />
          {isSkipped ? "已跳过" : "NO"}
        </Button>
        {/* Save button — three states:
            · default (unclicked): outline heart + same neutral gray (text-zinc-500)
              as the NO button so the two actions read as a balanced pair
            · hover: subtle brand tint to telegraph the click target
            · saved (clicked): filled heart + solid brand background.
            Heart icon is shared with the drawer header so the favorite
            affordance reads the same across surfaces. */}
        <Button
          unstyled
          type="button"
          onClick={() => onSave(creator.id)}
          className={
            isSaved
              ? "flex h-12 items-center justify-center gap-1.5 text-[13px] font-semibold tracking-wide text-white transition-colors"
              : "group flex h-12 items-center justify-center gap-1.5 text-[13px] font-semibold tracking-wide text-zinc-500 transition-colors hover:bg-[rgba(255,79,0,0.06)] hover:text-[color:var(--brand)]"
          }
          style={isSaved ? { backgroundColor: BRAND } : { ["--brand" as string]: BRAND }}
          aria-label={isSaved ? "已收藏" : "收藏"}
          aria-pressed={isSaved}
        >
          <Heart size={14} strokeWidth={2.2} fill={isSaved ? "white" : "none"} />
          {isSaved ? "已收藏" : "收藏"}
        </Button>
      </div>
    </motion.article>
  );
}
