"use client";

import { cn } from "@/lib/utils";

const SIZE_PRESETS = {
  sm: {
    track: "h-5 w-9",
    viewBox: "0 0 36 20",
    cxA: 10,
    cxB: 26,
    cy: 10,
    r: 6,
    travel: 8,
  },
  md: {
    track: "h-[26px] w-[44px]",
    viewBox: "0 0 44 26",
    cxA: 13,
    cxB: 31,
    cy: 13,
    r: 9,
    travel: 10,
  },
  lg: {
    track: "h-8 w-[52px]",
    viewBox: "0 0 52 32",
    cxA: 16,
    cxB: 36,
    cy: 16,
    r: 10,
    travel: 12,
  },
} as const;

type ToggleSize = keyof typeof SIZE_PRESETS;

interface ToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  size?: ToggleSize;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

export function Toggle({
  checked,
  onCheckedChange,
  size = "lg",
  disabled,
  className,
  "aria-label": ariaLabel,
}: ToggleProps) {
  const preset = SIZE_PRESETS[size];
  const dropCx = preset.cxB - 1;

  return (
    <label
      className={cn(
        "relative inline-block shrink-0 cursor-pointer",
        preset.track,
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
      style={{
        transform: "translateZ(0)",
        backfaceVisibility: "hidden",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
        disabled={disabled}
        aria-label={ariaLabel}
        className={cn(
          "block h-full w-full cursor-pointer appearance-none rounded-full transition-colors duration-500 outline-none",
          checked ? "bg-[#ff4f00]" : "bg-[#c5c0b1] hover:bg-[#b5b2aa]",
          disabled && "cursor-not-allowed",
        )}
      />
      <svg
        viewBox={preset.viewBox}
        filter="url(#linkr-toggle-goo)"
        className="pointer-events-none absolute inset-0 fill-white"
      >
        <circle
          cx={preset.cxA}
          cy={preset.cy}
          r={preset.r}
          className="transform-gpu transition-transform duration-500"
          style={{
            transformOrigin: `${preset.cxA}px ${preset.cy}px`,
            transform: `translateX(${checked ? `${preset.travel}px` : "0px"}) scale(${checked ? 0 : 1})`,
          }}
        />
        <circle
          cx={preset.cxB}
          cy={preset.cy}
          r={preset.r}
          className="transform-gpu transition-transform duration-500"
          style={{
            transformOrigin: `${preset.cxB}px ${preset.cy}px`,
            transform: `translateX(${checked ? "0px" : `${-preset.travel}px`}) scale(${checked ? 1 : 0})`,
          }}
        />
        {checked ? (
          <circle
            cx={dropCx}
            cy={-1}
            r={2.5}
            className="transform-gpu transition-transform duration-700"
          />
        ) : null}
      </svg>
    </label>
  );
}

export function GooeyFilter() {
  return (
    <svg aria-hidden focusable="false" className="pointer-events-none fixed h-0 w-0">
      <defs>
        <filter id="linkr-toggle-goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  );
}
