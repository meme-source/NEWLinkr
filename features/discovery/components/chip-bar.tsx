"use client";

import { Check, ChevronDown, Globe2, TrendingUp, UsersRound } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { ChatChips, CountryCode, ViewsStep } from "../chat-types";
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
            aria-disabled={disabled}
            title={disabled ? undefined : p.label}
            aria-label={disabled ? `${p.label}：即将开放，敬请期待` : p.label}
            aria-pressed={selected}
            className={`group relative inline-flex h-7 w-9 items-center justify-center rounded-full transition-colors ${
              disabled ? "cursor-default" : ""
            }`}
            style={{
              backgroundColor: selected ? "white" : "transparent",
              boxShadow: selected ? "0 1px 2px rgba(20,20,19,0.08)" : undefined,
              color: selected ? T.terracotta : T.stone,
            }}
          >
            <span className={disabled ? "opacity-50" : undefined}>
              <PlatformIcon id={p.id} colored={selected} size={15} />
            </span>
            {disabled ? (
              <span
                role="tooltip"
                className="pointer-events-none absolute bottom-[calc(100%+7px)] left-1/2 z-40 -translate-x-1/2 rounded-full px-2 py-1 text-[11px] font-medium whitespace-nowrap text-white opacity-0 shadow-[0_10px_24px_-14px_rgba(20,20,19,0.52)] transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                style={{ backgroundColor: T.nearBlack }}
              >
                即将开放，敬请期待
              </span>
            ) : null}
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
  children?: ReactNode;
  // Use renderContent when the popover content needs to imperatively close
  // itself (e.g. a two-step Apply flow).
  renderContent?: (close: () => void) => ReactNode;
  width?: number;
}

function ChipShell({
  prefix,
  label,
  active,
  icon,
  children,
  renderContent,
  width = 240,
}: ChipShellProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  // Close on outside click — must check both the trigger and the portaled
  // popover (the popover lives outside the trigger's DOM subtree).
  useEffect(() => {
    if (!open) return;
    function handle(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (popRef.current?.contains(target)) return;
      setOpen(false);
    }
    window.addEventListener("mousedown", handle);
    return () => window.removeEventListener("mousedown", handle);
  }, [open]);

  // Position the popover above the trigger, constrained to the chip-bar's
  // bounding container (so it can't escape the agent console aside or any
  // other host with a fixed width). Re-runs on scroll/resize while open.
  const [popSize, setPopSize] = useState<{ width: number } | null>(null);
  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const trigger = triggerRef.current;
      const pop = popRef.current;
      if (!trigger || !pop) return;
      const triggerRect = trigger.getBoundingClientRect();
      const margin = 8;

      // Find the nearest host that defines our horizontal bounds. Falls back
      // to the viewport if no marker is set.
      const host = trigger.closest("[data-chip-bounds]") as HTMLElement | null;
      const hostRect = host
        ? host.getBoundingClientRect()
        : { left: margin, right: window.innerWidth - margin };
      const hostLeft = hostRect.left + margin;
      const hostRight = hostRect.right - margin;
      const hostWidth = Math.max(220, hostRight - hostLeft);
      const finalWidth = Math.min(width, hostWidth);

      let left = triggerRect.left;
      if (left + finalWidth > hostRight) left = hostRight - finalWidth;
      if (left < hostLeft) left = hostLeft;

      const popH = pop.offsetHeight || 320;
      const top = triggerRect.top - popH - margin;
      setPopSize({ width: finalWidth });
      setPos({ left, top: Math.max(margin, top) });
    }
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, width]);

  // SSR guard — portal target only exists in the browser. The popover is only
  // mounted when `open` is true, and `open` flips via a click handler, so by
  // then we are guaranteed to be in the browser.
  const portalTarget = typeof document !== "undefined" ? document.body : null;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
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
      {open && portalTarget
        ? createPortal(
            <div
              ref={popRef}
              className="bg-background fixed z-50 overflow-hidden rounded-[14px] border shadow-[0_18px_44px_-26px_rgba(20,20,19,0.32)]"
              style={{
                borderColor: T.border,
                width: popSize?.width ?? width,
                left: pos?.left ?? -9999,
                top: pos?.top ?? -9999,
                visibility: pos ? "visible" : "hidden",
              }}
            >
              {renderContent ? renderContent(() => setOpen(false)) : children}
            </div>,
            portalTarget,
          )
        : null}
    </div>
  );
}

// ── Geo popover (country ∩ language, both multi-select, two-step apply) ──────
function GeoPopover({ chips, onChange, onApply }: ChipBarProps & { onApply: () => void }) {
  // Draft state — edits stay local until 「应用」commits them. Closing the
  // popover without applying drops the draft.
  const [draftCountries, setDraftCountries] = useState<CountryCode[]>(chips.countries);
  const [draftLanguages, setDraftLanguages] = useState<string[]>(chips.languages);

  const toggleCountry = (id: CountryCode) => {
    setDraftCountries((prev) => {
      const set = new Set(prev);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return [...set];
    });
  };
  const toggleLanguage = (label: string) => {
    setDraftLanguages((prev) => {
      const set = new Set(prev);
      if (set.has(label)) set.delete(label);
      else set.add(label);
      return [...set];
    });
  };
  const clearCountries = () => setDraftCountries([]);
  const clearLanguages = () => setDraftLanguages([]);

  const allCountriesSelected = draftCountries.length === COUNTRY_OPTIONS.length;
  const allLanguagesSelected = draftLanguages.length === LANGUAGE_OPTIONS.length;

  const apply = () => {
    onChange({ ...chips, countries: draftCountries, languages: draftLanguages });
    onApply();
  };

  // Cap the language scroll area to the country column's natural height so the
  // popover collapses to the shorter of the two lists. (7 rows × 28px ≈ 196px.)
  const LIST_MAX = 196;

  return (
    <div>
      <div className="flex items-stretch divide-x" style={{ borderColor: T.borderLight }}>
        <div className="flex w-1/2 flex-col">
          <ColHeader
            title="国家"
            actionLabel={allCountriesSelected ? "清空" : "全选"}
            onAction={
              allCountriesSelected
                ? clearCountries
                : () => setDraftCountries(COUNTRY_OPTIONS.map((c) => c.id))
            }
          />
          <div className="hide-scrollbar overflow-y-auto py-1" style={{ maxHeight: LIST_MAX }}>
            <AnyRow
              icon="🌐"
              label="全球"
              hint="未指定"
              active={draftCountries.length === 0}
              onClick={clearCountries}
            />
            {COUNTRY_OPTIONS.map((c) => {
              const selected = draftCountries.includes(c.id);
              return (
                <CheckRow
                  key={c.id}
                  selected={selected}
                  onClick={() => toggleCountry(c.id)}
                  leading={<span>{c.flag}</span>}
                  label={c.label}
                />
              );
            })}
          </div>
        </div>
        <div className="flex w-1/2 flex-col">
          <ColHeader
            title="语言"
            actionLabel={allLanguagesSelected ? "清空" : "全选"}
            onAction={
              allLanguagesSelected ? clearLanguages : () => setDraftLanguages([...LANGUAGE_OPTIONS])
            }
          />
          <div className="hide-scrollbar overflow-y-auto py-1" style={{ maxHeight: LIST_MAX }}>
            <AnyRow
              icon="·"
              label="任意语言"
              hint="未指定"
              active={draftLanguages.length === 0}
              onClick={clearLanguages}
            />
            {LANGUAGE_OPTIONS.map((l) => {
              const selected = draftLanguages.includes(l);
              return (
                <CheckRow key={l} selected={selected} onClick={() => toggleLanguage(l)} label={l} />
              );
            })}
          </div>
        </div>
      </div>

      <div
        className="flex items-center justify-between gap-3 border-t px-3 py-2 text-[11.5px]"
        style={{ borderColor: T.borderLight, color: T.charcoal }}
      >
        <span>
          将筛选 ·{" "}
          <span style={{ color: T.nearBlack, fontWeight: 500 }}>
            {comboSummary(draftCountries, draftLanguages)}
          </span>
        </span>
        <button
          type="button"
          onClick={apply}
          className="rounded-full px-3.5 py-1 text-[12px] font-medium text-white transition-[filter] hover:brightness-110 active:scale-[0.98]"
          style={{ backgroundColor: T.terracotta }}
        >
          应用
        </button>
      </div>
    </div>
  );
}

function comboSummary(countries: CountryCode[], languages: string[]): string {
  const c = countries.length === 0 ? "全球" : `${countries.length} 国`;
  const l = languages.length === 0 ? "任意语言" : `${languages.length} 语`;
  return `${c} ∩ ${l}`;
}

function ColHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between border-b px-3 py-1.5"
      style={{ borderColor: T.borderLight }}
    >
      <span
        className="text-[10.5px] font-semibold tracking-[0.06em] uppercase"
        style={{ color: T.stone }}
      >
        {title}
      </span>
      <button
        type="button"
        onClick={onAction}
        className="text-[11px] underline-offset-2 hover:underline"
        style={{ color: T.stone }}
      >
        {actionLabel}
      </button>
    </div>
  );
}

function CheckRow({
  selected,
  onClick,
  leading,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  leading?: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="checkbox"
      aria-checked={selected}
      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12.5px] transition-colors hover:bg-[--hover]"
      style={{
        ["--hover" as string]: T.parchment,
        color: selected ? T.terracotta : T.nearBlack,
      }}
    >
      <span
        aria-hidden
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border"
        style={{
          backgroundColor: selected ? T.terracotta : "transparent",
          borderColor: selected ? T.terracotta : T.border,
          color: "white",
        }}
      >
        {selected ? <Check size={11} strokeWidth={3} /> : null}
      </span>
      {leading ? <span className="shrink-0">{leading}</span> : null}
      <span className="truncate">{label}</span>
    </button>
  );
}

function AnyRow({
  icon,
  label,
  hint,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  hint: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 border-b px-3 py-1.5 text-left text-[12.5px]"
      style={{
        backgroundColor: active ? T.ivory : "transparent",
        borderColor: T.borderLight,
        color: active ? T.terracotta : T.nearBlack,
      }}
    >
      <span
        aria-hidden
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: active ? T.terracotta : T.border }}
      />
      <span>{icon}</span>
      <span className="flex-1">{label}</span>
      <span className="text-[10.5px]" style={{ color: T.stone }}>
        {hint}
      </span>
    </button>
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
  const geo = geoLabel(chips.countries, chips.languages);
  const geoActive = chips.countries.length > 0 || chips.languages.length > 0;
  const followerActive = chips.follower !== "any";
  const followerLabelText = followerActive
    ? (FOLLOWER_OPTIONS.find((f) => f.id === chips.follower)?.label ?? "不限")
    : "不限";
  const viewsActive = chips.viewsStep !== 0;

  return (
    <div data-chip-bounds className="flex flex-wrap items-center gap-2">
      <PlatformSegment chips={chips} onChange={onChange} />
      <ChipShell
        prefix="国/语"
        label={geo}
        active={geoActive}
        icon={<Globe2 size={13} />}
        width={400}
        renderContent={(close) => <GeoPopover chips={chips} onChange={onChange} onApply={close} />}
      />
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
