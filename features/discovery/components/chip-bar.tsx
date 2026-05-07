"use client";

import { ChevronDown, Globe2, TrendingUp, UsersRound } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ChatChips, ViewsStep } from "../chat-types";
import {
  COUNTRY_OPTIONS,
  FOLLOWER_OPTIONS,
  LANGUAGE_OPTIONS,
  PLATFORM_OPTIONS,
  VIEWS_STEPS,
  geoLabel,
  viewsLabel,
} from "../data/chat-chips";
import { T } from "../data/tokens";
import { PlatformIcon } from "./platform-icons";

interface ChipBarProps {
  chips: ChatChips;
  onChange: (next: ChatChips) => void;
}

// ── Platform segmented pills ─────────────────────────────────────────────────
function PlatformSegment({ chips, onChange }: ChipBarProps) {
  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-full p-0.5"
      style={{ backgroundColor: T.parchment }}
    >
      {PLATFORM_OPTIONS.map((p) => {
        const selected = chips.platform === p.id;
        const disabled = !p.available;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              if (disabled) return;
              onChange({ ...chips, platform: p.id });
            }}
            disabled={disabled}
            title={disabled ? `${p.label}（v2 上线）` : p.label}
            aria-label={p.label}
            aria-pressed={selected}
            className="relative inline-flex h-7 w-9 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              backgroundColor: selected ? "white" : "transparent",
              boxShadow: selected ? "0 1px 2px rgba(20,20,19,0.08)" : undefined,
              color: selected ? T.terracotta : T.stone,
            }}
          >
            <PlatformIcon id={p.id} colored={selected} size={15} />
          </button>
        );
      })}
    </div>
  );
}

// ── Generic chip shell with popover ──────────────────────────────────────────
interface ChipShellProps {
  prefix: string;
  label: string;
  active: boolean;
  icon: ReactNode;
  children: ReactNode;
  width?: number;
}

function ChipShell({ prefix, label, active, icon, children, width = 240 }: ChipShellProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(event: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", handle);
    return () => window.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[12px] transition-colors"
        style={{
          backgroundColor: open || active ? "white" : "white",
          borderColor: open ? T.terracotta : T.border,
          color: T.charcoal,
        }}
      >
        <span style={{ color: T.stone }} className="inline-flex">
          {icon}
        </span>
        <span style={{ color: T.stone }}>{prefix}</span>
        <span style={{ color: active ? T.nearBlack : T.charcoal, fontWeight: 500 }}>{label}</span>
        <ChevronDown size={12} style={{ color: T.stone }} aria-hidden />
      </button>
      {open ? (
        <div
          className="absolute bottom-[calc(100%+8px)] left-0 z-30 overflow-hidden rounded-[14px] border bg-[#fffefb]"
          style={{ borderColor: T.border, width }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

// ── Geo popover (country + language) ─────────────────────────────────────────
function GeoPopover({ chips, onChange }: ChipBarProps) {
  return (
    <div className="grid grid-cols-2 divide-x" style={{ borderColor: T.borderLight }}>
      <div className="max-h-64 overflow-y-auto py-1">
        <p
          className="px-3 pt-2 pb-1 text-[10.5px] font-semibold tracking-[0.06em] uppercase"
          style={{ color: T.stone }}
        >
          国家
        </p>
        {COUNTRY_OPTIONS.map((c) => {
          const active = c.id === chips.country;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange({ ...chips, country: c.id })}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12.5px]"
              style={{
                backgroundColor: active ? T.ivory : "transparent",
                color: active ? T.terracotta : T.nearBlack,
              }}
            >
              <span>{c.flag}</span>
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>
      <div className="max-h-64 overflow-y-auto py-1" style={{ borderColor: T.borderLight }}>
        <p
          className="px-3 pt-2 pb-1 text-[10.5px] font-semibold tracking-[0.06em] uppercase"
          style={{ color: T.stone }}
        >
          语言
        </p>
        {LANGUAGE_OPTIONS.map((l) => {
          const active = l === chips.language;
          return (
            <button
              key={l}
              type="button"
              onClick={() => onChange({ ...chips, language: l })}
              className="flex w-full items-center px-3 py-1.5 text-left text-[12.5px]"
              style={{
                backgroundColor: active ? T.ivory : "transparent",
                color: active ? T.terracotta : T.nearBlack,
              }}
            >
              {l === "any" ? "任意语言" : l}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Followers popover ────────────────────────────────────────────────────────
function FollowerPopover({ chips, onChange }: ChipBarProps) {
  return (
    <div className="py-1">
      {FOLLOWER_OPTIONS.map((f) => {
        const active = f.id === chips.follower;
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onChange({ ...chips, follower: f.id })}
            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[12.5px]"
            style={{
              backgroundColor: active ? T.ivory : "transparent",
              color: active ? T.terracotta : T.nearBlack,
            }}
          >
            <span className="font-medium">{f.label}</span>
            {f.range ? (
              <span className="text-[11px]" style={{ color: T.stone }}>
                {f.range}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

// ── Views slider popover ─────────────────────────────────────────────────────
function ViewsPopover({ chips, onChange }: ChipBarProps) {
  const current = VIEWS_STEPS.find((v) => v.step === chips.viewsStep) ?? VIEWS_STEPS[0];
  const max = VIEWS_STEPS.length - 1;
  const pct = (chips.viewsStep / max) * 100;
  return (
    <div className="px-4 pt-3 pb-4">
      <div className="flex items-baseline justify-between">
        <p className="text-[11px]" style={{ color: T.stone }}>
          中位播放阈值
        </p>
        <p className="text-[14px] font-semibold" style={{ color: T.nearBlack }}>
          {current.label}
        </p>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={chips.viewsStep}
        onChange={(e) => onChange({ ...chips, viewsStep: Number(e.target.value) as ViewsStep })}
        aria-label="播放阈值"
        className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full"
        style={{
          background: `linear-gradient(to right, ${T.terracotta} 0%, ${T.terracotta} ${pct}%, ${T.borderLight} ${pct}%, ${T.borderLight} 100%)`,
        }}
      />
      <div className="mt-2 flex justify-between text-[10.5px]" style={{ color: T.stone }}>
        {VIEWS_STEPS.map((v) => (
          <span
            key={v.step}
            className="flex-1 text-center"
            style={{
              color: v.step === chips.viewsStep ? T.terracotta : T.stone,
              fontWeight: v.step === chips.viewsStep ? 600 : 400,
            }}
          >
            {v.short}
          </span>
        ))}
      </div>
      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: white;
          border: 2px solid ${T.terracotta};
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(20, 20, 19, 0.16);
        }
        input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: white;
          border: 2px solid ${T.terracotta};
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

// ── Bar ──────────────────────────────────────────────────────────────────────
export function ChipBar({ chips, onChange }: ChipBarProps) {
  const geo = geoLabel(chips.country, chips.language);
  const followerActive = chips.follower !== "any";
  const followerLabelText = followerActive
    ? (FOLLOWER_OPTIONS.find((f) => f.id === chips.follower)?.label ?? "不限")
    : "不限";
  const viewsActive = chips.viewsStep !== 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <PlatformSegment chips={chips} onChange={onChange} />
      <ChipShell
        prefix="国/语"
        label={geo}
        active={chips.country !== "global" || chips.language !== "any"}
        icon={<Globe2 size={13} />}
        width={360}
      >
        <GeoPopover chips={chips} onChange={onChange} />
      </ChipShell>
      <ChipShell
        prefix="粉丝"
        label={followerLabelText}
        active={followerActive}
        icon={<UsersRound size={13} />}
        width={200}
      >
        <FollowerPopover chips={chips} onChange={onChange} />
      </ChipShell>
      <ChipShell
        prefix="播放"
        label={viewsLabel(chips.viewsStep)}
        active={viewsActive}
        icon={<TrendingUp size={13} />}
        width={300}
      >
        <ViewsPopover chips={chips} onChange={onChange} />
      </ChipShell>
    </div>
  );
}
