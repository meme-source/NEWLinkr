"use client";

import {
  cpeOf,
  fmtCount,
  fmtMoney,
  TIER_META,
  TIER_ORDER,
  tierOf,
} from "@/features/outreach/components/board-performance-shared";
import type { Placement } from "@/features/outreach/data/board-placements";

// §3.3 散点图：CPE × 曝光，对数双轴。右上 = 高曝光低 CPE = 想要的投放。
//   横轴 log10(views) ∈ [4, 6]（10K → 1M）
//   纵轴 log10(CPE)   ∈ [-2, 0]（$0.01 → $1，反向显示，CPE 越低越靠上）
//   点大小 = sqrt(spend) / 5（spend 在 $180-620 区间，半径 4-8px 之间）
//   2026-05: TikTok-only 阶段，配色不再按平台区分，改为按"量级"分层
//   （头部 / 腰部 / 尾部）。异常状态加外环高亮。
const W = 520;
const H = 280;
const PAD = { l: 52, r: 16, t: 16, b: 36 };
const INNER_W = W - PAD.l - PAD.r;
const INNER_H = H - PAD.t - PAD.b;
const X_MIN = 4;
const X_MAX = 6;
const Y_MIN = -2;
const Y_MAX = 0;

const X_TICKS = [
  { v: 1e4, label: "10K" },
  { v: 1e5, label: "100K" },
  { v: 1e6, label: "1M" },
];
const Y_TICKS = [
  { v: 0.01, label: "$0.01" },
  { v: 0.1, label: "$0.10" },
  { v: 1, label: "$1.00" },
];

function xPos(views: number): number {
  const lv = Math.log10(Math.max(views, 1));
  return PAD.l + ((lv - X_MIN) / (X_MAX - X_MIN)) * INNER_W;
}

function yPos(cpe: number): number {
  const lc = Math.log10(Math.max(cpe, 0.001));
  return PAD.t + (1 - (lc - Y_MIN) / (Y_MAX - Y_MIN)) * INNER_H;
}

function rOf(spend: number): number {
  return 4 + Math.min(8, Math.sqrt(spend) / 5);
}

export function BoardPerformanceScatter({ placements }: { placements: Placement[] }) {
  return (
    <div className="rounded-2xl border border-[#c5c0b1] bg-[#fffefb] p-5">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <div className="text-xs font-medium tracking-wider text-[#939084] uppercase">
            CPE × 曝光
          </div>
          <p className="mt-1 text-[11px] text-[#939084]">
            右上 = 曝光高且单互动成本低 · 左下需复核
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-[#939084]">
          {TIER_ORDER.map((t) => (
            <span key={t} className="flex items-center gap-1">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: TIER_META[t].color }}
              />
              {TIER_META[t].label}
            </span>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="CPE × 曝光散点图">
        {Y_TICKS.map((t) => {
          const y = yPos(t.v);
          return (
            <g key={`gy-${t.v}`}>
              <line
                x1={PAD.l}
                x2={W - PAD.r}
                y1={y}
                y2={y}
                stroke="#eceae3"
                strokeDasharray="3 3"
              />
              <text x={PAD.l - 8} y={y + 3} textAnchor="end" fontSize="10" fill="#939084">
                {t.label}
              </text>
            </g>
          );
        })}
        {X_TICKS.map((t) => {
          const x = xPos(t.v);
          return (
            <g key={`gx-${t.v}`}>
              <line
                x1={x}
                x2={x}
                y1={PAD.t}
                y2={H - PAD.b}
                stroke="#eceae3"
                strokeDasharray="3 3"
              />
              <text x={x} y={H - PAD.b + 16} textAnchor="middle" fontSize="10" fill="#939084">
                {t.label}
              </text>
            </g>
          );
        })}
        <text
          x={PAD.l - 40}
          y={PAD.t + INNER_H / 2}
          fontSize="10"
          fill="#939084"
          textAnchor="middle"
          transform={`rotate(-90 ${PAD.l - 40} ${PAD.t + INNER_H / 2})`}
        >
          CPE ↓
        </text>
        <text x={PAD.l + INNER_W / 2} y={H - 4} fontSize="10" fill="#939084" textAnchor="middle">
          曝光 →
        </text>

        {placements.map((p) => {
          const x = xPos(p.views);
          const y = yPos(cpeOf(p));
          const r = rOf(p.spendUsd);
          const color = TIER_META[tierOf(p.creatorFollowers)].color;
          const needsReview = p.status === "下降中";
          return (
            <g key={p.id}>
              {needsReview ? (
                <circle cx={x} cy={y} r={r + 4} fill="none" stroke="#ff4f00" strokeWidth="1" />
              ) : null}
              <circle cx={x} cy={y} r={r} fill={color} fillOpacity={0.85}>
                <title>
                  {p.creatorHandle} · {fmtCount(p.views)} 曝光 · {fmtMoney(cpeOf(p), 3)} CPE
                </title>
              </circle>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
