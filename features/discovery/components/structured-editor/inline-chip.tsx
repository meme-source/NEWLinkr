"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { T } from "../../data/tokens";

/**
 * Inline chip — visually distinct from the bottom pill chips (those are 999px
 * radius "people-attribute" filters). Inline chips are action-bound and live
 * inside the editor sentence, so they use a soft 8px square radius per
 * v2 mock §3.1.
 */
export interface InlineChipProps {
  label: string;
  /** Marks user-customized state — e.g. brandMode === 'manual' && brands.length > 0. */
  active: boolean;
  /** Optional title attribute — used to surface the full multi-select list on hover. */
  title?: string;
  /** Popover width in px (clamped to the editor host width). */
  popoverWidth?: number;
  /**
   * When true, the popover stretches to fill the editor host width (minus
   * margins) instead of using a fixed `popoverWidth`. Used by content-rich
   * popovers (e.g. brand multi-select) that need to expose more horizontal
   * room than they're tall — keeps the panel inside the agent console.
   */
  popoverFillHost?: boolean;
  /** Anchor the popover horizontally relative to the trigger. Default: left-aligned. */
  popoverAlign?: "left" | "center";
  renderPopover: (close: () => void) => ReactNode;
}

export function InlineChip({
  label,
  active,
  title,
  popoverWidth = 320,
  popoverFillHost = false,
  popoverAlign = "left",
  renderPopover,
}: InlineChipProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const [popSize, setPopSize] = useState<{ width: number; maxHeight: number } | null>(null);

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

  // Anchor the popover to the chip and clamp to the editor host so it can't
  // escape the agent console on narrow widths. Same behavior as ChipBar.
  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const trigger = triggerRef.current;
      const pop = popRef.current;
      if (!trigger || !pop) return;
      const triggerRect = trigger.getBoundingClientRect();
      const margin = 8;

      const host = trigger.closest("[data-editor-bounds]") as HTMLElement | null;
      const hostRect = host
        ? host.getBoundingClientRect()
        : { left: margin, right: window.innerWidth - margin };
      const hostLeft = hostRect.left + margin;
      const hostRight = hostRect.right - margin;
      const hostWidth = Math.max(220, hostRight - hostLeft);
      const finalWidth = popoverFillHost ? hostWidth : Math.min(popoverWidth, hostWidth);

      // Horizontal placement — left-align by default, but center on the
      // trigger when requested (gives equal room when the chip is mid-line
      // and the popover content is wide).
      let left =
        popoverAlign === "center"
          ? triggerRect.left + triggerRect.width / 2 - finalWidth / 2
          : triggerRect.left;
      if (left + finalWidth > hostRight) left = hostRight - finalWidth;
      if (left < hostLeft) left = hostLeft;

      // Vertical placement — prefer below the chip, flip above when below
      // would overflow the viewport. We also expose a maxHeight so the
      // popover can scroll its overflow instead of being clipped (fallback
      // for surfaces taller than the available room either way).
      const spaceBelow = window.innerHeight - triggerRect.bottom - margin * 2;
      const spaceAbove = triggerRect.top - margin * 2;
      const popH = pop.offsetHeight || 280;
      const placeBelow = popH <= spaceBelow || spaceBelow >= spaceAbove;
      const top = placeBelow
        ? triggerRect.bottom + margin
        : Math.max(margin, triggerRect.top - Math.min(popH, spaceAbove) - margin);
      const maxHeight = Math.max(160, placeBelow ? spaceBelow : spaceAbove);

      setPopSize({ width: finalWidth, maxHeight });
      setPos({ left, top });
    }
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, popoverWidth, popoverFillHost, popoverAlign]);

  const portalTarget = typeof document !== "undefined" ? document.body : null;

  // Three-state visual per spec §3.1: default / active(customized) / open.
  const borderColor = open ? T.terracotta : active ? T.terracotta : T.borderLight;
  const background = active && !open ? "rgba(255,79,0,0.06)" : "white";
  const labelColor = active ? T.terracotta : T.charcoal;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        title={title}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mx-[2px] inline-flex items-center gap-1 rounded-[8px] border px-[10px] py-[3px] align-baseline text-[14px] leading-[1.5] transition-colors hover:bg-[--hover-bg]"
        style={{
          ["--hover-bg" as string]: T.ivory,
          backgroundColor: background,
          borderColor,
          color: labelColor,
        }}
      >
        <span>{label}</span>
        <ChevronDown
          size={11}
          strokeWidth={2.4}
          style={{ color: active ? T.terracotta : T.stone }}
          aria-hidden
        />
      </button>
      {open && portalTarget
        ? createPortal(
            <div
              ref={popRef}
              className="bg-background fixed z-50 flex flex-col overflow-hidden rounded-[14px] border shadow-[0_18px_44px_-26px_rgba(20,20,19,0.32)]"
              style={{
                borderColor: T.border,
                width: popSize?.width ?? popoverWidth,
                maxHeight: popSize?.maxHeight,
                left: pos?.left ?? -9999,
                top: pos?.top ?? -9999,
                visibility: pos ? "visible" : "hidden",
              }}
            >
              {renderPopover(() => setOpen(false))}
            </div>,
            portalTarget,
          )
        : null}
    </>
  );
}
