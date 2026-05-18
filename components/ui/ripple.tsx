"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * MD3-inspired press ripple.
 *
 * The whole effect lives on `<span>` elements this module owns, so it never
 * collides with a host button's own Tailwind classes (transition / transform /
 * radius). That makes it safe to drop onto any of the project's existing
 * native-button stylings without a visual regression.
 */
const PRESS_GROW_MS = 450;
const MINIMUM_PRESS_MS = 300;
const INITIAL_ORIGIN_SCALE = 0.2;
const PADDING = 10;
const SOFT_EDGE_MIN_SIZE = 75;
const SOFT_EDGE_RATIO = 0.35;
const TOUCH_DELAY_MS = 150;
const EASE_STANDARD = "cubic-bezier(0.2, 0, 0, 1)";

type RipplePhase = "inactive" | "touch-delay" | "holding" | "waiting-for-click";

export interface MaterialRipple {
  surfaceRef: React.RefObject<HTMLSpanElement | null>;
  waveRef: React.RefObject<HTMLSpanElement | null>;
  pressed: boolean;
  handlers: {
    onPointerDown: (event: React.PointerEvent) => void;
    onPointerUp: (event: React.PointerEvent) => void;
    onPointerLeave: (event: React.PointerEvent) => void;
    onPointerCancel: (event: React.PointerEvent) => void;
    onClick: () => void;
  };
}

/**
 * Drives the MD3 press-ripple state machine for a single interactive surface.
 * Pass `disabled` to keep it fully inert.
 */
export function useMaterialRipple(disabled = false): MaterialRipple {
  const [pressed, setPressed] = React.useState(false);

  const surfaceRef = React.useRef<HTMLSpanElement | null>(null);
  const waveRef = React.useRef<HTMLSpanElement | null>(null);

  const phaseRef = React.useRef<RipplePhase>("inactive");
  const startEventRef = React.useRef<React.PointerEvent | null>(null);
  const growthRef = React.useRef<Animation | null>(null);
  const initialSizeRef = React.useRef(0);
  const scaleRef = React.useRef(1);

  React.useEffect(() => {
    return () => {
      growthRef.current?.cancel();
    };
  }, []);

  const isTouch = (event: React.PointerEvent) => event.pointerType === "touch";

  const shouldReact = (event: React.PointerEvent): boolean => {
    if (disabled || !event.isPrimary) return false;
    if (startEventRef.current && startEventRef.current.pointerId !== event.pointerId) {
      return false;
    }
    if (event.type === "pointercancel") return true;
    if (event.type === "pointerleave") return !isTouch(event);
    return isTouch(event) || event.buttons === 1;
  };

  const measureSurface = () => {
    const surface = surfaceRef.current;
    if (!surface) return;
    const { width, height } = surface.getBoundingClientRect();
    const maxDimension = Math.max(width, height);
    const softEdge = Math.max(SOFT_EDGE_RATIO * maxDimension, SOFT_EDGE_MIN_SIZE);
    const initialSize = Math.floor(maxDimension * INITIAL_ORIGIN_SCALE) || 1;
    const hypotenuse = Math.sqrt(width ** 2 + height ** 2);
    const maxRadius = hypotenuse + PADDING;
    initialSizeRef.current = initialSize;
    scaleRef.current = (maxRadius + softEdge) / initialSize;
  };

  const resolveCoordinates = (event?: React.PointerEvent) => {
    const surface = surfaceRef.current;
    const size = initialSizeRef.current;
    if (!surface) {
      return { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } };
    }
    const rect = surface.getBoundingClientRect();
    const end = { x: (rect.width - size) / 2, y: (rect.height - size) / 2 };
    const origin = event
      ? { x: event.clientX - rect.left, y: event.clientY - rect.top }
      : { x: rect.width / 2, y: rect.height / 2 };
    return {
      start: { x: origin.x - size / 2, y: origin.y - size / 2 },
      end,
    };
  };

  const startPress = (event?: React.PointerEvent) => {
    setPressed(true);
    const wave = waveRef.current;
    if (!wave) return;
    growthRef.current?.cancel();
    measureSurface();
    const { start, end } = resolveCoordinates(event);
    const size = `${initialSizeRef.current}px`;
    growthRef.current = wave.animate(
      {
        width: [size, size],
        height: [size, size],
        transform: [
          `translate(${start.x}px, ${start.y}px) scale(1)`,
          `translate(${end.x}px, ${end.y}px) scale(${scaleRef.current})`,
        ],
      },
      { duration: PRESS_GROW_MS, easing: EASE_STANDARD, fill: "forwards" },
    );
  };

  const endPress = async () => {
    startEventRef.current = null;
    phaseRef.current = "inactive";
    const animation = growthRef.current;
    const elapsed =
      animation && typeof animation.currentTime === "number"
        ? animation.currentTime
        : Number.POSITIVE_INFINITY;
    if (elapsed < MINIMUM_PRESS_MS) {
      await new Promise<void>((resolve) => {
        window.setTimeout(() => resolve(), MINIMUM_PRESS_MS - elapsed);
      });
    }
    if (growthRef.current !== animation) return;
    setPressed(false);
  };

  const onPointerDown = (event: React.PointerEvent) => {
    if (!shouldReact(event)) return;
    startEventRef.current = event;
    if (!isTouch(event)) {
      phaseRef.current = "waiting-for-click";
      startPress(event);
      return;
    }
    phaseRef.current = "touch-delay";
    window.setTimeout(() => {
      if (phaseRef.current !== "touch-delay") return;
      phaseRef.current = "holding";
      startPress(event);
    }, TOUCH_DELAY_MS);
  };

  const onPointerUp = (event: React.PointerEvent) => {
    if (!shouldReact(event)) return;
    if (phaseRef.current === "holding") {
      phaseRef.current = "waiting-for-click";
      return;
    }
    if (phaseRef.current === "touch-delay") {
      phaseRef.current = "waiting-for-click";
      startPress(startEventRef.current ?? undefined);
    }
  };

  const cancelPress = (event: React.PointerEvent) => {
    if (!shouldReact(event)) return;
    if (phaseRef.current !== "inactive") {
      void endPress();
    }
  };

  const onClick = () => {
    if (disabled) return;
    if (phaseRef.current === "waiting-for-click") {
      void endPress();
      return;
    }
    if (phaseRef.current === "inactive") {
      // Keyboard / programmatic activation — ripple from the centre.
      startPress();
      void endPress();
    }
  };

  return {
    surfaceRef,
    waveRef,
    pressed,
    handlers: {
      onPointerDown,
      onPointerUp,
      onPointerLeave: cancelPress,
      onPointerCancel: cancelPress,
      onClick,
    },
  };
}

interface RippleProps {
  pressed: boolean;
  surfaceRef: React.RefObject<HTMLSpanElement | null>;
  waveRef: React.RefObject<HTMLSpanElement | null>;
}

/**
 * Press-tint palette — Linkr's warm cream-and-orange family, never a dead gray.
 * Fixed colours (not `currentColor`), so a gray-text button does not get a gray
 * ripple. The wave reads as a soft pink on light surfaces and as a warm cream
 * lift on the dark / orange ones.
 */
const RIPPLE_CORE = "#fff4ee"; // pale cream-pink — radial centre
const RIPPLE_EDGE = "#ffd2c2"; // soft peach — radial body
const RIPPLE_WASH = "#ffe2d6"; // flat state-layer tint

/**
 * Renders the ripple layer. Sits at `-z-10` inside an `isolate`d host, so it
 * paints above the host's own background but below its content.
 */
export function Ripple({ pressed, surfaceRef, waveRef }: RippleProps) {
  return (
    <span
      ref={surfaceRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]"
    >
      <span
        className={cn(
          "absolute inset-0 transition-opacity duration-200 ease-linear",
          pressed ? "opacity-[0.05]" : "opacity-0",
        )}
        style={{ backgroundColor: RIPPLE_WASH }}
      />
      <span
        ref={waveRef}
        className="absolute top-0 left-0 rounded-full"
        style={{
          background: `radial-gradient(closest-side, ${RIPPLE_CORE} 0%, ${RIPPLE_EDGE} max(calc(100% - 70px), 60%), transparent 100%)`,
          opacity: pressed ? 0.2 : 0,
          transition: `opacity ${pressed ? 105 : 375}ms linear`,
        }}
      />
    </span>
  );
}
