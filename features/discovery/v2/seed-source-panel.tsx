"use client";

// 「相似来源」叠加面板：本次找相似 session 的核心上下文。
//
// 视觉定位（按用户反馈调整）：
//   - 不是悬浮卡片，而是 section header —— 用一条横线把"标题区"与"计数区"分开，
//     再用一条把"计数区"与下方候选区分开，表达一级标题 → 二级计数 的层级。
//   - 无外边框、无圆角包裹、无阴影。靠分隔线与字号差体现结构。
//
// 元素布局：
//   ┌─────────────────────────────────────────────────────────┐
//   │ 相似来源   [avatar stack]            导出 │ 结束       │  ← 一级
//   │ ───────────────────────────────────────────────────────│
//   │    待筛选 14            ·         已收藏 3              │  ← 二级
//   │ ───────────────────────────────────────────────────────│
//   └─────────────────────────────────────────────────────────┘
//
// 这是纯展示组件：seeds / 计数 / 导出可不可用都是入参。Web 与插件共用同一个 UI。

import { motion, AnimatePresence } from "framer-motion";
import { Download, Square, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { SeedDescriptor } from "./lib/seed-pool";

const BRAND = "#ff4f00";

interface Props {
  seeds: readonly SeedDescriptor[];
  pendingCount: number;
  savedCount: number;
  onRemoveSeed: (id: string) => void;
  onEndSession: () => void;
  onExport: () => void;
  /** True → render 导出 button。插件 / web 都默认开；调用方传 false 可隐藏。 */
  canExport?: boolean;
}

const MAX_VISIBLE_AVATARS = 3;

export function SeedSourcePanel({
  seeds,
  pendingCount,
  savedCount,
  onRemoveSeed,
  onEndSession,
  onExport,
  canExport = true,
}: Props) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!popoverOpen) return;
    const onClick = (event: globalThis.MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (popoverRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setPopoverOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPopoverOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [popoverOpen]);

  const visibleSeeds = seeds.slice(0, MAX_VISIBLE_AVATARS);
  const overflow = Math.max(0, seeds.length - MAX_VISIBLE_AVATARS);

  return (
    <section aria-label="相似来源" className="relative">
      {/* 一级 —— 标题 + 头像堆 + 操作。横线下沉到下方计数区上沿。 */}
      <header className="flex items-center justify-between gap-3 pb-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="text-[12px] font-semibold tracking-[-0.005em] text-[#201515]">
            相似来源
          </div>
          {seeds.length > 0 ? (
            <Button
              unstyled
              ref={triggerRef}
              type="button"
              onClick={() => setPopoverOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={popoverOpen}
              aria-label={`查看 ${seeds.length} 位种子博主`}
              className="group relative flex items-center transition-transform active:scale-95"
            >
              <AvatarStack seeds={visibleSeeds} overflow={overflow} />
            </Button>
          ) : (
            <span className="text-[11px] text-[#b8b4a8]">未选择种子</span>
          )}
        </div>

        {/* 顺序：导出 在左、结束 在右 —— 按用户要求，主操作（结束本次 session）
            放在视觉路径终点；导出是离开前的辅助动作，放在左侧。 */}
        <div className="flex shrink-0 items-center gap-1.5">
          {canExport ? (
            <Button
              unstyled
              type="button"
              onClick={onExport}
              title="导出当前候选 / 已收藏"
              className="inline-flex items-center gap-1 rounded-full border border-[#eceae3] bg-transparent px-2.5 py-1 text-[11px] font-medium text-[#36342e] transition-colors hover:border-[#c5c0b1] hover:bg-[#fafaf6]"
            >
              <Download className="h-3 w-3" strokeWidth={2.2} aria-hidden />
              导出
            </Button>
          ) : null}
          <Button
            unstyled
            type="button"
            onClick={onEndSession}
            title="结束本次找相似"
            className="inline-flex items-center gap-1 rounded-full border border-[#eceae3] bg-transparent px-2.5 py-1 text-[11px] font-medium text-[#b00020] transition-colors hover:border-[#b00020] hover:bg-[#fdf2f2]"
          >
            <Square className="h-2.5 w-2.5 fill-current" strokeWidth={0} aria-hidden />
            结束
          </Button>
        </div>
      </header>

      {/* 一级/二级 分隔线 */}
      <div className="h-px w-full bg-[#eceae3]" aria-hidden />

      {/* 二级 —— 计数器。两个数字本身就是反馈，左右对称、中间一条竖向小分隔。 */}
      <div className="flex items-center justify-between px-1 py-2">
        <Counter label="待筛选" value={pendingCount} highlight={false} />
        <div className="h-5 w-px bg-[#eceae3]" aria-hidden />
        <Counter label="已收藏" value={savedCount} highlight={savedCount > 0} />
      </div>

      {/* 二级/下方候选区 分隔线 */}
      <div className="h-px w-full bg-[#eceae3]" aria-hidden />

      <AnimatePresence>
        {popoverOpen ? (
          <motion.div
            ref={popoverRef}
            role="menu"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 z-50 mt-1 max-w-[260px] rounded-lg border border-[#eceae3] bg-white p-1.5"
            style={{ boxShadow: "0 12px 32px rgba(32,21,21,0.12)" }}
          >
            <ul className="flex flex-col gap-0.5">
              {seeds.map((seed, idx) => (
                <li key={seed.id} className="group flex items-center gap-2 rounded-md px-2 py-1.5">
                  <SeedAvatar seed={seed} size={20} index={idx} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-medium text-[#201515]">
                      {seed.handle}
                    </div>
                    <div className="truncate text-[11px] text-[#939084]">{seed.name}</div>
                  </div>
                  {seeds.length > 1 ? (
                    <Button
                      unstyled
                      type="button"
                      onClick={() => onRemoveSeed(seed.id)}
                      aria-label={`移除种子 ${seed.handle}`}
                      className="rounded-full p-1 text-[#b8b4a8] transition-colors hover:bg-[#fdf2f2] hover:text-[#b00020]"
                    >
                      <X className="h-3 w-3" strokeWidth={2.2} aria-hidden />
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function Counter({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight: boolean;
}) {
  return (
    <div className="flex flex-1 items-baseline justify-center gap-1.5">
      <span className="text-[10.5px] font-medium tracking-[0.04em] text-[#939084]">{label}</span>
      <motion.span
        key={value}
        initial={{ opacity: 0, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="text-[18px] leading-none font-bold tabular-nums"
        style={{ color: highlight ? BRAND : "#201515" }}
      >
        {value}
      </motion.span>
    </div>
  );
}

function AvatarStack({ seeds, overflow }: { seeds: readonly SeedDescriptor[]; overflow: number }) {
  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {seeds.map((seed, idx) => (
          <motion.div
            key={seed.id}
            initial={{ opacity: 0, scale: 0.6, x: -6 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.04 }}
            style={{ zIndex: seeds.length - idx }}
          >
            <SeedAvatar seed={seed} size={22} index={idx} ringed />
          </motion.div>
        ))}
      </div>
      {overflow > 0 ? (
        <span
          className="ml-1.5 inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full border border-[#eceae3] bg-[#fafaf6] px-1 text-[10px] font-semibold text-[#5d5a52]"
          aria-label={`还有 ${overflow} 位种子博主`}
        >
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}

function SeedAvatar({
  seed,
  size,
  index,
  ringed = false,
}: {
  seed: SeedDescriptor;
  size: number;
  index: number;
  ringed?: boolean;
}) {
  const initials = (seed.handle.replace(/^@/, "")[0] ?? "?").toUpperCase();
  const palette = AVATAR_PALETTES[index % AVATAR_PALETTES.length];
  if (seed.avatarUrl) {
    return (
      <div
        className={
          ringed
            ? "relative overflow-hidden rounded-full ring-2 ring-white"
            : "relative overflow-hidden rounded-full"
        }
        style={{ width: size, height: size }}
      >
        <Image
          src={seed.avatarUrl}
          alt={seed.name}
          fill
          sizes={`${size}px`}
          className="object-cover"
          unoptimized
        />
      </div>
    );
  }
  return (
    <div
      aria-hidden="true"
      className={
        ringed
          ? "flex items-center justify-center rounded-full font-semibold text-white ring-2 ring-white"
          : "flex items-center justify-center rounded-full font-semibold text-white"
      }
      style={{
        width: size,
        height: size,
        background: palette,
        fontSize: Math.max(9, size * 0.42),
        lineHeight: 1,
      }}
    >
      {initials}
    </div>
  );
}

const AVATAR_PALETTES = [
  "linear-gradient(135deg,#ff7a45 0%,#ff4f00 100%)",
  "linear-gradient(135deg,#6b7c5f 0%,#36342e 100%)",
  "linear-gradient(135deg,#c9a87a 0%,#7a5c3a 100%)",
  "linear-gradient(135deg,#3d8a5a 0%,#2f5d3f 100%)",
];
