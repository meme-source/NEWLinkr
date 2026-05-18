"use client";

import { useState } from "react";

export interface DonutSegment {
  key: string;
  label: string;
  // 0-1 占比；多段之和无需严格 = 1，组件内部按 sum 归一。
  value: number;
  color: string;
}

interface Props {
  segments: DonutSegment[];
  size?: number;
  // 环宽占外径的比例，越小环越细。
  thickness?: number;
  // 圆环中心的内容（图例 / 总计 / 默认描述等）。
  center?: React.ReactNode;
  // 默认 tooltip 文本：例如 "78% 的女性"。
  formatTooltip?: (seg: DonutSegment) => string;
}

// Linkr 通用环状图：SVG 路径绘制，hover 时该扇区外径外扩，
// 顶部浮一条 dark chip tooltip 显示具体数值。
// 替代之前 conic-gradient 实现，因为 gradient 无法做分段 hover。
export function SegmentedDonut({
  segments,
  size = 144,
  thickness = 0.22,
  center,
  formatTooltip,
}: Props) {
  const [hoverKey, setHoverKey] = useState<string | null>(null);

  const cx = size / 2;
  const cy = size / 2;
  // 留一点 padding 给 hover 外扩，避免被裁。
  const rOuter = size / 2 - 6;
  const rOuterHover = rOuter + 5;
  const rInner = rOuter * (1 - thickness);

  const total = segments.reduce((acc, s) => acc + s.value, 0) || 1;
  let cursor = 0;
  const arcs = segments.map((s) => {
    const startDeg = (cursor / total) * 360;
    cursor += s.value;
    const endDeg = (cursor / total) * 360;
    return { ...s, startDeg, endDeg };
  });

  const hovered = arcs.find((a) => a.key === hoverKey) ?? null;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="overflow-visible" role="img">
        {arcs.map((arc) => {
          const isHover = hoverKey === arc.key;
          const r = isHover ? rOuterHover : rOuter;
          return (
            <path
              key={arc.key}
              d={annularPath(cx, cy, r, rInner, arc.startDeg, arc.endDeg)}
              fill={arc.color}
              className="cursor-pointer transition-all duration-150 outline-none motion-reduce:transition-none"
              onMouseEnter={() => setHoverKey(arc.key)}
              onMouseLeave={() => setHoverKey((k) => (k === arc.key ? null : k))}
              tabIndex={0}
              aria-label={`${arc.label} ${(arc.value * 100).toFixed(1)}%`}
              onFocus={() => setHoverKey(arc.key)}
              onBlur={() => setHoverKey((k) => (k === arc.key ? null : k))}
            />
          );
        })}
      </svg>
      {center ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {center}
        </div>
      ) : null}
      {hovered ? (
        <div
          role="tooltip"
          className="pointer-events-none absolute -top-2 left-1/2 z-20 -translate-x-1/2 -translate-y-full rounded-md bg-[#201515] px-2 py-1 text-[10px] font-medium whitespace-nowrap text-white shadow-md"
        >
          {formatTooltip
            ? formatTooltip(hovered)
            : `${(hovered.value * 100).toFixed(1)}% ${hovered.label}`}
        </div>
      ) : null}
    </div>
  );
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function annularPath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startDeg: number,
  endDeg: number,
): string {
  const sweep = endDeg - startDeg;
  // 单段占满整圈时，分两段画规避起止点重合带来的 NaN。
  if (sweep >= 359.999) {
    return [
      `M ${cx + rOuter} ${cy}`,
      `A ${rOuter} ${rOuter} 0 1 1 ${cx - rOuter} ${cy}`,
      `A ${rOuter} ${rOuter} 0 1 1 ${cx + rOuter} ${cy}`,
      `M ${cx + rInner} ${cy}`,
      `A ${rInner} ${rInner} 0 1 0 ${cx - rInner} ${cy}`,
      `A ${rInner} ${rInner} 0 1 0 ${cx + rInner} ${cy}`,
      "Z",
    ].join(" ");
  }
  const startO = polar(cx, cy, rOuter, startDeg);
  const endO = polar(cx, cy, rOuter, endDeg);
  const startI = polar(cx, cy, rInner, startDeg);
  const endI = polar(cx, cy, rInner, endDeg);
  const largeArc = sweep > 180 ? 1 : 0;
  return [
    `M ${startO.x} ${startO.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${endO.x} ${endO.y}`,
    `L ${endI.x} ${endI.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${startI.x} ${startI.y}`,
    "Z",
  ].join(" ");
}
