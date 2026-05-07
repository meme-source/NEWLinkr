"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, CircleHelp } from "lucide-react";

import { ACCENT, BORDER, SURFACE, TEXT, TYPE } from "./tokens";
import {
  SCRAPE_COUNT_OPTIONS,
  type CoverCount,
  type InfluencerCardSampleConfig,
  type ScrapeCount,
} from "./types";

interface InfluencerCardFilterBarProps {
  sample: InfluencerCardSampleConfig;
  onChangeScrapeCount?: (next: ScrapeCount) => void;
  /** Retained for backwards compatibility — the cover-count dropdown was
   *  removed per the floating-creator-card reference image. */
  onChangeCoverCount?: (next: CoverCount) => void;
  onTogglePerspective?: () => void;
}

interface DropdownPillProps<T extends number> {
  label: string;
  value: T;
  options: readonly T[];
  formatOption: (value: T) => string;
  onChange?: (next: T) => void;
  flex?: boolean;
}

function DropdownPill<T extends number>({
  label,
  value,
  options,
  formatOption,
  onChange,
  flex,
}: DropdownPillProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={`relative ${flex ? "min-w-0 flex-1" : "shrink-0"}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-7 w-full items-center gap-1 rounded-full px-[11px] py-[5px] transition-colors hover:bg-[#eceae3]"
        style={{
          background: SURFACE.pill,
          border: `1px solid ${BORDER.pill}`,
        }}
      >
        <span
          className="flex-1 truncate text-center"
          style={{
            color: TEXT.tertiary,
            fontSize: TYPE.pillText.size,
            lineHeight: `${TYPE.pillText.lineHeight}px`,
            fontWeight: TYPE.pillText.weight,
          }}
        >
          {label}
        </span>
        <ChevronDown
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          size={16}
          strokeWidth={1.75}
          color={TEXT.tertiary}
        />
      </button>
      {open ? (
        <div
          role="listbox"
          className="absolute top-full left-0 z-30 mt-1 w-[112px] overflow-hidden rounded-[8px] bg-[#fffefb]"
          style={{ border: `1px solid ${BORDER.pill}` }}
        >
          {options.map((opt) => {
            const selected = opt === value;
            return (
              <button
                key={opt}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange?.(opt);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between px-3 py-1.5 transition-colors hover:bg-[#eceae3]"
                style={{
                  color: selected ? ACCENT.terracotta : TEXT.tertiary,
                  fontSize: TYPE.pillText.size,
                  lineHeight: `${TYPE.pillText.lineHeight}px`,
                  fontWeight: selected ? 600 : TYPE.pillText.weight,
                }}
              >
                <span>{formatOption(opt)}</span>
                {selected ? <Check size={12} strokeWidth={2.5} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

interface ToggleProps {
  on: boolean;
  onClick?: () => void;
}

function Toggle({ on, onClick }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="透视开关"
      onClick={onClick}
      className="relative h-[18px] w-8 shrink-0 rounded-full transition-colors"
      style={{
        background: on ? ACCENT.terracotta : SURFACE.toggleTrack,
      }}
    >
      <span
        className="absolute top-[2px] h-[14px] w-[14px] rounded-full transition-all"
        style={{
          left: on ? "16px" : "2px",
          background: "#fffefb",
          border: "1px solid #c5c0b1",
        }}
      />
    </button>
  );
}

export function InfluencerCardFilterBar({
  sample,
  onChangeScrapeCount,
  onTogglePerspective,
}: InfluencerCardFilterBarProps) {
  // Per the floating-creator-card reference image: a single sample-count pill
  // ("最近 N 条") on the left, "数据透视 ? toggle" on the right. The cover-count
  // dropdown and the "样本设置" leading label have both been retired — callers
  // can still pass `onChangeCoverCount`, it is just unused.
  return (
    <div className="flex items-center justify-between gap-2 px-3 pt-2 pb-2">
      <DropdownPill
        label={`最近 ${sample.scrapeCount} 条`}
        value={sample.scrapeCount}
        options={SCRAPE_COUNT_OPTIONS}
        formatOption={(n) => `最近 ${n} 条`}
        onChange={onChangeScrapeCount}
      />
      <div className="flex shrink-0 items-center gap-1.5">
        <span
          style={{
            color: TEXT.filterLabel,
            fontSize: TYPE.filterLabel.size,
            lineHeight: `${TYPE.filterLabel.lineHeight}px`,
            fontWeight: TYPE.filterLabel.weight,
          }}
        >
          数据透视
        </span>
        <span className="group/help relative inline-flex">
          <CircleHelp className="h-3.5 w-3.5 cursor-help text-[#b8b6ad] transition-colors hover:text-[#939084]" />
          <span
            role="tooltip"
            className="pointer-events-none absolute top-full right-0 z-40 mt-1.5 w-56 rounded-[10px] border border-[#c5c0b1] bg-[#fffefb] px-2.5 py-2 text-[11px] leading-[1.55] text-[#36342e] opacity-0 shadow-[0_12px_30px_-18px_rgba(77,76,72,0.35)] transition-opacity group-hover/help:opacity-100"
          >
            开启数据透视后，会叠加播放量、平均播放与互动率，并按平均播放量排序前 N 条视频。
          </span>
        </span>
        <Toggle on={sample.perspective} onClick={onTogglePerspective} />
      </div>
    </div>
  );
}
