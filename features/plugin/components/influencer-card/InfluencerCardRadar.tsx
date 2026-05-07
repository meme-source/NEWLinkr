"use client";

import { ACCENT, BORDER, SURFACE, TEXT, TYPE } from "./tokens";
import type { InfluencerCardRadarAxis } from "./types";

interface InfluencerCardRadarProps {
  axes: InfluencerCardRadarAxis[];
}

const SIZE = 200;
const CENTER = SIZE / 2;
const RADIUS = 60;
const LABEL_RADIUS = 82;
const RING_LEVELS = [0.25, 0.5, 0.75, 1];

function clamp(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function angleFor(index: number, total: number): number {
  return (-90 + (360 / total) * index) * (Math.PI / 180);
}

function polygonPoints(axes: InfluencerCardRadarAxis[], scale: number): string {
  return axes
    .map((axis, idx) => {
      const angle = angleFor(idx, axes.length);
      const r = RADIUS * scale * (clamp(axis.value) / 100);
      const x = CENTER + Math.cos(angle) * r;
      const y = CENTER + Math.sin(angle) * r;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function baselinePoints(axes: InfluencerCardRadarAxis[], scale: number): string {
  return axes
    .map((_, idx) => {
      const angle = angleFor(idx, axes.length);
      const x = CENTER + Math.cos(angle) * RADIUS * scale;
      const y = CENTER + Math.sin(angle) * RADIUS * scale;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function formatScore(value: number): string {
  // Convert 0-100 score into the 5-point scale shown on the design (e.g. 92 → 4.6).
  const fivePoint = (clamp(value) / 100) * 5;
  return fivePoint.toFixed(1);
}

export function InfluencerCardRadar({ axes }: InfluencerCardRadarProps) {
  if (axes.length < 3) return null;

  return (
    <div
      className="flex w-full flex-col rounded-[8px]"
      style={{
        background: SURFACE.white,
        border: "1px solid #c5c0b1",
      }}
    >
      <div className="px-3 pt-2">
        <p
          style={{
            color: TEXT.heading,
            fontSize: TYPE.radarHeading.size,
            lineHeight: `${TYPE.radarHeading.lineHeight}px`,
            fontWeight: TYPE.radarHeading.weight,
            letterSpacing: TYPE.radarHeading.tracking,
          }}
        >
          深度分析 <span style={{ color: TEXT.axisLabel, fontWeight: 400 }}>(5.0 分制)</span>
        </p>
      </div>

      <div className="flex justify-center px-3 pt-1">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          width="100%"
          height={SIZE}
          className="overflow-visible"
          style={{ maxWidth: SIZE }}
          aria-hidden="true"
        >
          {RING_LEVELS.map((scale) => (
            <polygon
              key={scale}
              points={baselinePoints(axes, scale)}
              fill="none"
              stroke={BORDER.dashed}
              strokeDasharray="2 2"
              strokeWidth={1}
            />
          ))}
          {axes.map((_, idx) => {
            const angle = angleFor(idx, axes.length);
            return (
              <line
                key={idx}
                x1={CENTER}
                y1={CENTER}
                x2={CENTER + Math.cos(angle) * RADIUS}
                y2={CENTER + Math.sin(angle) * RADIUS}
                stroke={BORDER.dashed}
                strokeDasharray="2 2"
                strokeWidth={1}
              />
            );
          })}
          <polygon
            points={polygonPoints(axes, 1)}
            fill={ACCENT.terracottaSoft}
            stroke={ACCENT.terracotta}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          {axes.map((axis, idx) => {
            const angle = angleFor(idx, axes.length);
            const x = CENTER + Math.cos(angle) * LABEL_RADIUS;
            const y = CENTER + Math.sin(angle) * LABEL_RADIUS;
            const anchor = Math.abs(x - CENTER) < 4 ? "middle" : x < CENTER ? "end" : "start";
            return (
              <g key={axis.subject}>
                <text
                  x={x}
                  y={y - 4}
                  textAnchor={anchor}
                  dominantBaseline="middle"
                  fill={axis.color ?? TEXT.axisLabel}
                  fontSize={TYPE.axisLabel.size}
                  fontWeight={TYPE.axisLabel.weight}
                >
                  {axis.subject}
                </text>
                <text
                  x={x}
                  y={y + 6}
                  textAnchor={anchor}
                  dominantBaseline="middle"
                  fill={TEXT.axisValue}
                  fontSize={TYPE.axisValue.size}
                  fontWeight={TYPE.axisValue.weight}
                >
                  {formatScore(axis.value)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex items-center justify-center gap-4 pb-3">
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block h-px w-4"
            style={{ borderTop: `1px dashed ${BORDER.dashed}` }}
          />
          <span
            style={{
              color: TEXT.axisLabel,
              fontSize: TYPE.legend.size,
              lineHeight: `${TYPE.legend.lineHeight}px`,
              letterSpacing: TYPE.legend.tracking,
            }}
          >
            满分基准
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block h-[9px] w-[9px] rounded-full"
            style={{ background: ACCENT.terracotta }}
          />
          <span
            style={{
              color: TEXT.axisLabel,
              fontSize: TYPE.legend.size,
              lineHeight: `${TYPE.legend.lineHeight}px`,
              letterSpacing: TYPE.legend.tracking,
            }}
          >
            该候选人
          </span>
        </div>
      </div>
    </div>
  );
}
