"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { MockPost } from "./mock-posts";

import { Button } from "@/components/ui/button";

interface PostSwitcherProps {
  posts: MockPost[];
  currentId: string;
  onSwitch: (postId: string) => void;
}

/**
 * PostSwitcher — 模拟"用户滑到下一条 TikTok 帖子"的交互。
 *
 * 真产品里浏览器扩展通过 DOM 变化检测当前帖子切换；mock 阶段用 dropdown 替代，
 * 让用户能手动切换并观察 sidebar 内容跟随刷新。
 */
export function PostSwitcher({ posts, currentId, onSwitch }: PostSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", handle);
    return () => window.removeEventListener("mousedown", handle);
  }, [open]);

  const current = posts.find((p) => p.id === currentId) ?? posts[0];

  return (
    <div className="relative inline-flex" ref={ref}>
      <Button
        unstyled
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-[11.5px] text-white/85 backdrop-blur-sm transition-colors hover:bg-white/20"
      >
        <span className="opacity-60">当前帖子：</span>
        <span className="font-medium text-white">{current.handle}</span>
        <ChevronDown size={12} strokeWidth={2.2} aria-hidden />
      </Button>
      {open ? (
        <div
          className="absolute top-[calc(100%+6px)] left-0 z-20 w-[280px] overflow-hidden rounded-[8px] border bg-[#fffefb] shadow-[0_18px_44px_-22px_rgba(20,20,19,0.55)]"
          style={{ borderColor: "#c5c0b1" }}
        >
          {posts.map((p) => {
            const active = p.id === currentId;
            return (
              <Button
                unstyled
                key={p.id}
                type="button"
                onClick={() => {
                  onSwitch(p.id);
                  setOpen(false);
                }}
                className="flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-[#fffdf9]"
                style={{
                  backgroundColor: active ? "rgba(255, 79, 0, 0.06)" : "transparent",
                }}
              >
                <div
                  className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: active ? "#ff4f00" : "#c5c0b1" }}
                />
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[12.5px] font-medium"
                    style={{ color: active ? "#ff4f00" : "#201515" }}
                  >
                    {p.handle}
                  </div>
                  <div
                    className="mt-0.5 truncate text-[11px] leading-[1.45]"
                    style={{ color: "#939084" }}
                  >
                    {p.caption}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
