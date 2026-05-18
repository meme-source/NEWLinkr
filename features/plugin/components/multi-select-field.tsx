"use client";

import { type MouseEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";

interface MultiSelectFieldProps {
  label: string;
  // The "no filter" sentinel label, e.g. 全球 / 全部语言. Shown as the trigger
  // text when nothing specific is picked, and as a clear-all row in the menu.
  allLabel: string;
  // Specific options — excludes allLabel.
  options: string[];
  // Currently picked specifics. An empty array means allLabel ("不限").
  values: string[];
  onChange: (next: string[]) => void;
}

interface MenuPosition {
  top: number;
  left: number;
  width: number;
}

// Multi-select dropdown for the plugin sidebar's 找相似 / 找平替 filters.
// Replaces the single-value native <select>: 地区 and 语言 may now each carry
// several picks. The menu portals to <body> so it escapes the sidebar card's
// `overflow-hidden` clip (mirrors CollaborationStatusCell's approach).
export function MultiSelectField({
  label,
  allLabel,
  options,
  values,
  onChange,
}: MultiSelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<MenuPosition | null>(null);
  // Hover tooltip — surfaces the full pick list when the trigger collapses it
  // to a "美国 +2" summary. Native `title` is unreliable inside the plugin /
  // extension preview, so we render our own portaled box.
  const [tipPos, setTipPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Position the menu under the trigger; reposition on resize/scroll.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const update = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  // ESC closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const toggle = (option: string) => {
    const set = new Set(values);
    if (set.has(option)) set.delete(option);
    else set.add(option);
    onChange([...set]);
  };

  const summary =
    values.length === 0
      ? allLabel
      : values.length === 1
        ? values[0]
        : `${values[0]} +${values.length - 1}`;

  // Tooltip only adds information once the summary hides picks (2+ selected).
  const showTooltip = (event: MouseEvent<HTMLButtonElement>) => {
    if (values.length <= 1) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setTipPos({ top: rect.top - 6, left: rect.left });
  };

  return (
    <div className="block">
      <span className="mb-1 block text-[9.5px] font-semibold tracking-[0.12em] text-[#939084] uppercase">
        {label}
      </span>
      <Button
        unstyled
        ref={triggerRef}
        type="button"
        onClick={() => {
          setTipPos(null);
          setOpen((v) => !v);
        }}
        onMouseEnter={showTooltip}
        onMouseLeave={() => setTipPos(null)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center gap-1 py-1 text-left text-[13px] font-semibold text-[#201515] transition-colors hover:text-[#ff4f00]"
      >
        <span className="min-w-0 flex-1 truncate">{summary}</span>
        <ChevronDown className="h-3 w-3 shrink-0 text-[#939084]" />
      </Button>
      {tipPos &&
        !open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="tooltip"
            style={{ top: tipPos.top, left: tipPos.left }}
            className="fixed z-[1002] max-w-[240px] -translate-y-full rounded-lg border border-[#c5c0b1] bg-[#fffefb] px-2 py-1 text-[11px] leading-snug text-[#36342e] shadow-lg shadow-[rgba(20,20,19,0.12)]"
          >
            {values.join("、")}
          </div>,
          document.body,
        )}
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[1000]"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            {menuPos && (
              <div
                role="listbox"
                aria-multiselectable="true"
                aria-label={label}
                style={{
                  top: menuPos.top,
                  left: menuPos.left,
                  minWidth: Math.max(menuPos.width, 140),
                }}
                className="hide-scrollbar fixed z-[1001] max-h-[220px] overflow-y-auto rounded-[8px] border border-[#c5c0b1] bg-[#fffefb] py-1 shadow-lg shadow-[rgba(20,20,19,0.12)]"
              >
                <OptionRow
                  label={allLabel}
                  selected={values.length === 0}
                  onClick={() => onChange([])}
                />
                {options.map((option) => (
                  <OptionRow
                    key={option}
                    label={option}
                    selected={values.includes(option)}
                    onClick={() => toggle(option)}
                  />
                ))}
              </div>
            )}
          </>,
          document.body,
        )}
    </div>
  );
}

function OptionRow({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      unstyled
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[12px] transition-colors ${
        selected ? "text-[#ff4f00]" : "text-[#36342e] hover:bg-[#fffdf9]"
      }`}
    >
      <span
        aria-hidden
        className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border"
        style={{
          backgroundColor: selected ? "#ff4f00" : "transparent",
          borderColor: selected ? "#ff4f00" : "#c5c0b1",
          color: "white",
        }}
      >
        {selected ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : null}
      </span>
      <span className="truncate">{label}</span>
    </Button>
  );
}
