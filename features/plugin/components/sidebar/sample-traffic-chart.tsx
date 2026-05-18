"use client";

import { useMemo, useState } from "react";
import type { CreatorProfile } from "@/features/plugin/types";
import { parseMetricToNumber } from "./shared";
import { tileTone, type TileTone } from "./current-tab-ui";

interface SamplePoint {
  id: string;
  plays: number;
  likes: number;
  comments: number;
  daysAgo: number;
}

interface Diagnostics {
  flopRate: number;
  hitRate: number;
  normalRange: string;
  stabilityText: string;
}

// 仅走 Linkr 暖色系：橙 / 暖近黑 / 暖中灰 / 沙色，不引入冷蓝、草绿、玫红。
const PLAYS_COLOR = "#ff4f00";
const LIKES_COLOR = "#3a3431";
const COMMENTS_COLOR = "#7a6e5c";

export function SampleTrafficChart({
  creator,
  scrapeCount,
  diagnostics,
}: {
  creator: CreatorProfile;
  scrapeCount: number;
  diagnostics: Diagnostics;
}) {
  const samples = useMemo(() => generateSamples(creator, scrapeCount), [creator, scrapeCount]);

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-3 gap-1.5">
        <DiagnosticTile label="扑街率" value={`${diagnostics.flopRate}%`} tone="neutral" />
        <DiagnosticTile label="常态区间" value={diagnostics.normalRange} tone="neutral" />
        <DiagnosticTile label="爆款率" value={`${diagnostics.hitRate}%`} tone="highlight" />
      </div>

      <MiniTrafficChart samples={samples} />

      <p className="text-[11px] leading-[1.55] text-[#54514a]">{diagnostics.stabilityText}</p>
    </div>
  );
}

function DiagnosticTile({ label, value, tone }: { label: string; value: string; tone: TileTone }) {
  const t = tileTone(tone);
  return (
    <div className={`rounded-lg px-2 py-2 text-center ${t.card}`}>
      <div className={`text-[10.5px] ${t.label}`}>{label}</div>
      <div className={`mt-0.5 text-sm font-semibold tabular-nums ${t.value}`}>{value}</div>
    </div>
  );
}

function MiniTrafficChart({ samples }: { samples: SamplePoint[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (samples.length === 0) return null;

  const width = 360;
  const height = 150;
  const pad = { top: 18, right: 12, bottom: 22, left: 12 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const playsMax = niceCeil(Math.max(...samples.map((s) => s.plays), 1));
  const engagementMax = niceCeil(Math.max(...samples.map((s) => s.likes + s.comments), 1));
  const slot = innerW / samples.length;
  const barW = Math.max(3, Math.min(12, slot * 0.42));

  const yPlays = (v: number) => pad.top + innerH - (v / playsMax) * innerH;
  const xCenter = (i: number) => pad.left + slot * i + slot / 2;

  const linePoints = samples.map((p, i) => ({ x: xCenter(i), y: yPlays(p.plays) }));
  const linePath = smoothPath(linePoints);
  const baselineY = pad.top + innerH;
  const areaPath =
    linePoints.length > 0
      ? `${linePath} L${linePoints[linePoints.length - 1].x},${baselineY} L${linePoints[0].x},${baselineY} Z`
      : "";

  const hovered = hoverIndex !== null ? samples[hoverIndex] : null;
  const tooltipX = hoverIndex !== null ? xCenter(hoverIndex) : 0;
  const tooltipBoxW = 124;
  const tooltipLeft = Math.min(
    Math.max(tooltipX - tooltipBoxW / 2, pad.left),
    width - pad.right - tooltipBoxW,
  );

  return (
    <div className="relative rounded-[8px] border border-[#eceae3] bg-[#fffefb] px-2 py-2">
      <div className="mb-1 flex items-center justify-between gap-2 px-1">
        <span className="text-[10.5px] font-semibold tracking-wide text-[#54514a]">
          近 {samples.length} 条流量
        </span>
        <div className="flex items-center gap-2 text-[10px] text-[#54514a]">
          <Legend color={PLAYS_COLOR} shape="line" label="播放" />
          <Legend color={LIKES_COLOR} shape="bar" label="点赞" />
          <Legend color={COMMENTS_COLOR} shape="bar" label="评论" />
        </div>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="近期流量表现迷你图"
        className="w-full"
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id="miniPlaysArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PLAYS_COLOR} stopOpacity="0.22" />
            <stop offset="100%" stopColor={PLAYS_COLOR} stopOpacity="0" />
          </linearGradient>
        </defs>

        <line x1={pad.left} x2={width - pad.right} y1={baselineY} y2={baselineY} stroke="#eceae3" />

        {samples.map((p, i) => {
          const cx = xCenter(i);
          const x = cx - barW / 2;
          const likesH = (p.likes / engagementMax) * innerH * 0.85;
          const commentsH = (p.comments / engagementMax) * innerH * 0.85;
          const yLikes = baselineY - likesH;
          const yComments = yLikes - commentsH;
          const active = i === hoverIndex;
          return (
            <g key={p.id} opacity={hoverIndex === null || active ? 1 : 0.45}>
              <rect x={x} y={yLikes} width={barW} height={likesH} fill={LIKES_COLOR} rx={1.5} />
              <rect
                x={x}
                y={yComments}
                width={barW}
                height={commentsH}
                fill={COMMENTS_COLOR}
                rx={1.5}
              />
            </g>
          );
        })}

        {areaPath && <path d={areaPath} fill="url(#miniPlaysArea)" />}
        <path d={linePath} fill="none" stroke={PLAYS_COLOR} strokeWidth={1.6} />
        {samples.map((p, i) => (
          <circle
            key={`pt-${p.id}`}
            cx={xCenter(i)}
            cy={yPlays(p.plays)}
            r={hoverIndex === i ? 3.2 : 1.8}
            fill={PLAYS_COLOR}
            stroke="#fffefb"
            strokeWidth={hoverIndex === i ? 1.6 : 0}
          />
        ))}

        {hoverIndex !== null && (
          <line
            x1={tooltipX}
            x2={tooltipX}
            y1={pad.top}
            y2={baselineY}
            stroke="#c5c0b1"
            strokeDasharray="2 3"
            strokeWidth={1}
          />
        )}

        {samples.map((p, i) => (
          <rect
            key={`hit-${p.id}`}
            x={pad.left + slot * i}
            y={pad.top}
            width={slot}
            height={innerH}
            fill="transparent"
            onMouseEnter={() => setHoverIndex(i)}
            onFocus={() => setHoverIndex(i)}
            onBlur={() => setHoverIndex(null)}
            tabIndex={0}
            role="presentation"
          />
        ))}
      </svg>

      {hovered && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute top-1 rounded-[8px] border border-[#c5c0b1] bg-[#fffefb] px-2 py-1.5 text-[10.5px] leading-[1.35] text-[#201515] shadow-[0_6px_18px_-12px_rgba(20,20,19,0.35)]"
          style={{
            left: `${(tooltipLeft / width) * 100}%`,
            width: `${(tooltipBoxW / width) * 100}%`,
          }}
        >
          <p className="text-[10px] text-[#54514a]">{hovered.daysAgo} 天前</p>
          <p className="mt-0.5 flex items-center justify-between gap-2">
            <span className="text-[#36342e]">播放</span>
            <span className="font-semibold tabular-nums" style={{ color: PLAYS_COLOR }}>
              {fmtCompact(hovered.plays)}
            </span>
          </p>
          <p className="mt-0.5 flex items-center justify-between gap-2">
            <span className="text-[#36342e]">点赞</span>
            <span className="font-semibold tabular-nums" style={{ color: LIKES_COLOR }}>
              {fmtCompact(hovered.likes)}
            </span>
          </p>
          <p className="mt-0.5 flex items-center justify-between gap-2">
            <span className="text-[#36342e]">评论</span>
            <span className="font-semibold tabular-nums" style={{ color: COMMENTS_COLOR }}>
              {fmtCompact(hovered.comments)}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

function Legend({ color, shape, label }: { color: string; shape: "line" | "bar"; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      {shape === "bar" ? (
        <span className="inline-block h-2 w-2 rounded-[2px]" style={{ background: color }} />
      ) : (
        <span className="inline-block h-[2px] w-3 rounded-full" style={{ background: color }} />
      )}
      <span>{label}</span>
    </span>
  );
}

function generateSamples(creator: CreatorProfile, count: number): SamplePoint[] {
  const rand = mulberry32(hashSeed(creator.id));
  const erPct = Number.parseFloat(creator.er.replace("%", ""));
  const baseEr = Number.isFinite(erPct) ? erPct : 4;
  const basePlays = parseMetricToNumber(creator.totalPlays ?? "4.8M") || 4_800_000;

  const out: SamplePoint[] = [];
  for (let i = 0; i < count; i += 1) {
    const roll = rand();
    const swing =
      roll < 0.18 ? 2.6 + rand() * 1.4 : roll < 0.32 ? 0.18 + rand() * 0.22 : 0.55 + rand() * 0.95;
    const plays = Math.max(50_000, Math.round(basePlays * swing));
    const engagementRate = (baseEr * (0.7 + rand() * 0.7)) / 100;
    const likes = Math.max(100, Math.round(plays * engagementRate * (0.65 + rand() * 0.3)));
    const comments = Math.max(20, Math.round(likes * (0.04 + rand() * 0.08)));
    out.push({
      id: `${creator.id}-mini-${i}`,
      plays,
      likes,
      comments,
      daysAgo: 1 + Math.floor(rand() * 30),
    });
  }
  return out.sort((a, b) => b.daysAgo - a.daysAgo);
}

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash;
}

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const exp = Math.floor(Math.log10(value));
  const base = Math.pow(10, exp);
  const norm = value / base;
  const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return nice * base;
}

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}
