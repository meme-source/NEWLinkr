"use client";

import { Check, ChevronDown, Globe2, MailCheck, RotateCcw, UsersRound } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import type { ChatChips, CountryCode, NumRange } from "../chat-types";
import {
  COUNTRY_OPTIONS,
  DEFAULT_RANGE,
  LANGUAGE_OPTIONS,
  PLATFORM_OPTIONS,
  geoLabel,
  summarizeRange,
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
          <Button
            unstyled
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
          </Button>
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
      <Button
        unstyled
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
      </Button>
      {open && portalTarget
        ? createPortal(
            <div
              ref={popRef}
              className="bg-background fixed z-50 overflow-hidden rounded-lg border shadow-[0_18px_44px_-26px_rgba(20,20,19,0.32)]"
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
        <Button
          unstyled
          type="button"
          onClick={apply}
          className="rounded-full px-3.5 py-1 text-[12px] font-medium text-white transition-[filter] hover:brightness-110 active:scale-[0.98]"
          style={{ backgroundColor: T.terracotta }}
        >
          应用
        </Button>
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
      <Button
        unstyled
        type="button"
        onClick={onAction}
        className="text-[11px] underline-offset-2 hover:underline"
        style={{ color: T.stone }}
      >
        {actionLabel}
      </Button>
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
    <Button
      unstyled
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
    </Button>
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
    <Button
      unstyled
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
    </Button>
  );
}

// ── Range popover (粉丝 × 均播) ───────────────────────────────────────────────
// Single follower range + single avg-views range. Multiple ranges are
// intentionally not supported: a brief filter that overlays "Nano 5K–20K OR
// Micro 50K–200K" mixes two different audience hypotheses and produces
// confusing scoring downstream — users who want that should run two queries.
// Defaults to "≥1K" on both axes (DEFAULT_RANGE); fully clearable to 不限.
interface RangePopoverProps extends ChipBarProps {
  onApply: () => void;
}

function RangePopover({ chips, onChange, onApply }: RangePopoverProps) {
  const [followers, setFollowers] = useState<NumRange>(chips.followers);
  const [views, setViews] = useState<NumRange>(chips.views);

  const resetDefaults = () => {
    setFollowers({ ...DEFAULT_RANGE });
    setViews({ ...DEFAULT_RANGE });
  };

  const apply = () => {
    onChange({ ...chips, followers, views });
    onApply();
  };

  const summary = `粉丝 ${summarizeRange(followers)} · 平均播放量 ${summarizeRange(views)}`;

  return (
    <div>
      <ColHeader title="粉丝量 · 平均播放量" actionLabel="重置默认" onAction={resetDefaults} />

      <div className="space-y-2.5 px-3 py-3">
        <RangeRow label="粉丝量" value={followers} onChange={setFollowers} />
        <RangeRow label="平均播放量" value={views} onChange={setViews} />
      </div>

      <div
        className="flex items-center justify-between gap-3 border-t px-3 py-2 text-[11.5px]"
        style={{ borderColor: T.borderLight, color: T.charcoal }}
      >
        <span className="min-w-0 flex-1 truncate">
          将筛选 · <span style={{ color: T.nearBlack, fontWeight: 500 }}>{summary}</span>
        </span>
        <Button
          unstyled
          type="button"
          onClick={apply}
          className="rounded-full px-3.5 py-1 text-[12px] font-medium text-white transition-[filter] hover:brightness-110 active:scale-[0.98]"
          style={{ backgroundColor: T.terracotta }}
        >
          应用
        </Button>
      </div>
    </div>
  );
}

function RangeRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: NumRange;
  onChange: (next: NumRange) => void;
}) {
  return (
    <div className="flex items-center gap-2 text-[12px]">
      <span
        className="w-20 shrink-0 text-[11px] font-semibold tracking-[0.04em] uppercase"
        style={{ color: T.stone }}
      >
        {label}
      </span>
      <RangeInput
        value={value.min}
        onChange={(v) => onChange({ ...value, min: v })}
        ariaLabel={`${label} 下限`}
      />
      <span className="shrink-0 text-[11px]" aria-hidden style={{ color: T.stone }}>
        –
      </span>
      <RangeInput
        value={value.max}
        onChange={(v) => onChange({ ...value, max: v })}
        ariaLabel={`${label} 上限`}
      />
      <Button
        unstyled
        type="button"
        onClick={() => onChange({ min: null, max: null })}
        title="清空该行"
        aria-label={`清空${label}`}
        className="ml-auto inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full hover:bg-[--hover]"
        style={{ ["--hover" as string]: T.parchment, color: T.stone }}
      >
        <RotateCcw size={11} aria-hidden />
      </Button>
    </div>
  );
}

function RangeInput({
  value,
  onChange,
  ariaLabel,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  ariaLabel: string;
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      value={value === null ? "" : String(value)}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^\d]/g, "");
        onChange(raw === "" ? null : Number(raw));
      }}
      placeholder="不限"
      aria-label={ariaLabel}
      className="min-w-0 flex-1 rounded-md border px-2 py-1 text-center tabular-nums focus:outline-none"
      style={{
        borderColor: T.border,
        color: value === null ? T.stone : T.nearBlack,
        backgroundColor: "white",
      }}
    />
  );
}

// ── 「仅可建联」开关 ──────────────────────────────────────────────────────────
// v3 §4.4：以 chip 形式而不是 popover 形式呈现 —— 单一布尔开关，点击即翻转。
// 开启态视觉上和其他 active chip 对齐（terracotta 边框 + near-black 文字），
// 关闭态保留 chip 容器但用 stone 文字 + ✕ 提示「未启用此过滤」。
function ContactableChip({ chips, onChange }: ChipBarProps) {
  const active = chips.contactableOnly;
  const label = active ? "仅可建联" : "含未验证";
  return (
    <Button
      unstyled
      type="button"
      onClick={() => onChange({ ...chips, contactableOnly: !active })}
      aria-pressed={active}
      title={
        active ? "已过滤掉无邮箱 / 30 天未发布 / 已被 No 的达人" : "保留全部候选（包括未验证邮箱）"
      }
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[12px] transition-colors"
      style={{
        backgroundColor: "white",
        borderColor: active ? T.terracotta : T.border,
        color: T.charcoal,
      }}
    >
      <span style={{ color: active ? T.terracotta : T.stone }} className="inline-flex">
        <MailCheck size={13} />
      </span>
      <span style={{ color: T.stone }}>建联</span>
      <span style={{ color: active ? T.nearBlack : T.charcoal, fontWeight: 500 }}>{label}</span>
    </Button>
  );
}

// ── Bar ──────────────────────────────────────────────────────────────────────
export function ChipBar({ chips, onChange }: ChipBarProps) {
  const geo = geoLabel(chips.countries, chips.languages);
  const geoActive = chips.countries.length > 0 || chips.languages.length > 0;

  const followersActive = chips.followers.min !== null || chips.followers.max !== null;
  const viewsActive = chips.views.min !== null || chips.views.max !== null;
  const rangeActive = followersActive || viewsActive;
  const rangeLabel = `粉丝 ${summarizeRange(chips.followers)} · 均播 ${summarizeRange(chips.views)}`;

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
        prefix="粉丝·均播"
        label={rangeLabel}
        active={rangeActive}
        icon={<UsersRound size={13} />}
        width={300}
        renderContent={(close) => (
          <RangePopover chips={chips} onChange={onChange} onApply={close} />
        )}
      />
      <ContactableChip chips={chips} onChange={onChange} />
    </div>
  );
}
