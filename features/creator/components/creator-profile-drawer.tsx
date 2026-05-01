"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  Bell,
  Bookmark,
  ChevronDown,
  FileText,
  Heart,
  Mail,
  RefreshCw,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface CreatorProfileInput {
  name: string;
  handle: string;
  avatarUrl: string;
  region: string;
  language?: string;
  category?: string;
  verified?: boolean;
  platform?: "youtube" | "tiktok" | "instagram";
  followers: string;
  er: string;
  tags?: string[];
}

interface Props {
  creator: CreatorProfileInput | null;
  onClose: () => void;
}

// ── Design tokens (match workspace) ───────────────────────────────────────────
const C = {
  ivory: "#faf9f5",
  parchment: "#f5f4ed",
  surface: "#fffdf9",
  ink: "#141413",
  charcoal: "#4d4c48",
  stone: "#87867f",
  terracotta: "#c96442",
  terracottaSoft: "#fdf5f0",
  border: "#e8e6dc",
  borderLight: "#f0ece4",
  emerald: "#7a8a6a",
  amber: "#c98a42",
  sky: "#5b7a8a",
};

type TabId = "overview" | "audience" | "content" | "brand";
const TABS: { id: TabId; label: string; Icon: typeof BarChart3 }[] = [
  { id: "overview", label: "数据总览", Icon: BarChart3 },
  { id: "audience", label: "受众数据", Icon: Heart },
  { id: "content", label: "内容数据", Icon: FileText },
  { id: "brand", label: "品牌数据", Icon: Star },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="h-2 w-2 rounded-full" style={{ background: C.terracotta }} />
      <h3 className="text-[15px] font-semibold" style={{ color: C.ink }}>
        {children}
      </h3>
    </div>
  );
}

function StatBlock({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "good" | "warn" | "mid";
}) {
  const toneColor =
    tone === "good"
      ? "text-emerald-600"
      : tone === "warn"
        ? "text-amber-600"
        : tone === "mid"
          ? "text-[#87867f]"
          : "text-[#141413]";
  return (
    <div className="min-w-0 flex-1">
      <p className="mb-1 text-[11px]" style={{ color: C.stone }}>
        {label}
      </p>
      <p className={cn("text-[22px] leading-none font-bold", toneColor)}>{value}</p>
      {sub && (
        <p className="mt-1 text-[10px]" style={{ color: C.stone }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "ok" | "warn";
}) {
  const map = {
    neutral: { bg: C.parchment, fg: C.charcoal, bd: C.border },
    accent: { bg: C.terracottaSoft, fg: C.terracotta, bd: "#f0dccd" },
    ok: { bg: "#eef3ea", fg: C.emerald, bd: "#d8e2d0" },
    warn: { bg: "#fbf1e1", fg: C.amber, bd: "#ecdcc0" },
  } as const;
  const t = map[tone];
  return (
    <span
      className="rounded-full border px-2 py-0.5 text-[11px]"
      style={{ background: t.bg, color: t.fg, borderColor: t.bd }}
    >
      {children}
    </span>
  );
}

function ScoreBadge({ score, label }: { score: number; label: string }) {
  const tone = score >= 4 ? "ok" : score >= 2.5 ? "warn" : "neutral";
  const color = tone === "ok" ? C.emerald : tone === "warn" ? C.amber : C.stone;
  return (
    <div
      className="flex items-center justify-between border-b py-2.5 last:border-b-0"
      style={{ borderColor: C.borderLight }}
    >
      <span className="text-[13px]" style={{ color: C.charcoal }}>
        {label}
      </span>
      <div className="flex items-center gap-3">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: n <= Math.round(score) ? color : C.border }}
            />
          ))}
        </div>
        <span className="w-10 text-right text-[11px] font-medium" style={{ color }}>
          {score >= 4 ? "优秀" : score >= 2.5 ? "中等" : "较差"}
        </span>
      </div>
    </div>
  );
}

function PlatformBadge({ platform }: { platform: "youtube" | "tiktok" | "instagram" }) {
  const map = {
    youtube: { label: "YouTube", bg: "#fff0ef", fg: "#e53e3e" },
    tiktok: { label: "TikTok", bg: "#141413", fg: "#ffffff" },
    instagram: { label: "Instagram", bg: "#fdf0f5", fg: "#c0387a" },
  } as const;
  const p = map[platform];
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
      style={{ background: p.bg, color: p.fg }}
    >
      {p.label}
      <ChevronDown className="h-3 w-3" />
    </button>
  );
}

// ── Fake growth chart (SVG) ───────────────────────────────────────────────────
function GrowthChart() {
  const pts = [
    0, 0, 0.02, 0.15, 0.2, 0.2, 0.38, 0.42, 0.42, 0.42, 0.42, 0.42, 0.43, 0.43, 0.43, 0.43, 0.43,
    0.43, 0.43, 0.43, 0.43,
  ];
  const w = 640,
    h = 140,
    maxY = 0.5;
  const path = pts
    .map((v, i) => {
      const x = (i / (pts.length - 1)) * w;
      const y = h - (v / maxY) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h + 30}`} className="h-40 w-full">
      <defs>
        <linearGradient id="cpg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={C.terracotta} stopOpacity="0.22" />
          <stop offset="100%" stopColor={C.terracotta} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#cpg)" />
      <path d={path} fill="none" stroke={C.terracotta} strokeWidth="2" />
      {[6, 7].map((i) => (
        <rect
          key={i}
          x={(i / (pts.length - 1)) * w - 3}
          y={h - 18}
          width="6"
          height="18"
          rx="1.5"
          fill={C.terracotta}
          opacity="0.75"
        />
      ))}
    </svg>
  );
}

function RadarChart() {
  const cx = 80,
    cy = 80,
    r = 60;
  const labels = ["粉丝增长", "粉丝可信度", "互动率", "频道质量", "创作频率"];
  const values = [0.2, 0.25, 0.35, 0.22, 0.18];
  const pts = values
    .map((v, i) => {
      const ang = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      const x = cx + Math.cos(ang) * r * v;
      const y = cy + Math.sin(ang) * r * v;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 160 160" className="h-40 w-40">
      {[0.25, 0.5, 0.75, 1].map((s) => (
        <polygon
          key={s}
          points={[0, 1, 2, 3, 4]
            .map((i) => {
              const ang = (Math.PI * 2 * i) / 5 - Math.PI / 2;
              return `${(cx + Math.cos(ang) * r * s).toFixed(1)},${(cy + Math.sin(ang) * r * s).toFixed(1)}`;
            })
            .join(" ")}
          fill="none"
          stroke={C.border}
          strokeWidth="1"
        />
      ))}
      {labels.map((l, i) => {
        const ang = (Math.PI * 2 * i) / 5 - Math.PI / 2;
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={(cx + Math.cos(ang) * r).toFixed(1)}
            y2={(cy + Math.sin(ang) * r).toFixed(1)}
            stroke={C.border}
            strokeWidth="1"
          />
        );
      })}
      <polygon
        points={pts}
        fill={C.terracotta}
        fillOpacity="0.25"
        stroke={C.terracotta}
        strokeWidth="1.5"
      />
      {labels.map((l, i) => {
        const ang = (Math.PI * 2 * i) / 5 - Math.PI / 2;
        const lx = cx + Math.cos(ang) * (r + 12);
        const ly = cy + Math.sin(ang) * (r + 12);
        return (
          <text
            key={l}
            x={lx}
            y={ly}
            fontSize="8.5"
            fill={C.stone}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {l}
          </text>
        );
      })}
    </svg>
  );
}

// ── Tab content ───────────────────────────────────────────────────────────────
function OverviewTab() {
  return (
    <div className="space-y-6">
      {/* 基本数据 */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <SectionTitle>基本数据</SectionTitle>
          <button
            className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px]"
            style={{ borderColor: C.border, color: C.charcoal }}
          >
            近10个内容 <ChevronDown className="h-3 w-3" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            {
              label: "平均观看量",
              value: "6505.42万",
              pill: "优秀" as const,
              sub: "长视频 6560.66万 · Shorts 6481.74万",
            },
            {
              label: "互动率",
              value: "2.32%",
              pill: "中等" as const,
              sub: "长视频 2.99%  Shorts 2.03%",
            },
            { label: "内容数量", value: "10", pill: "优秀" as const, sub: "长视频 3  Shorts 7" },
            {
              label: "观看量/粉丝量",
              value: "13.67%",
              pill: "良好" as const,
              sub: "中位数 59.55%",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border bg-white p-3"
              style={{ borderColor: C.border }}
            >
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-[11px]" style={{ color: C.stone }}>
                  {s.label}
                </p>
                <Pill tone={s.pill === "优秀" ? "ok" : s.pill === "中等" ? "warn" : "accent"}>
                  {s.pill}
                </Pill>
              </div>
              <p className="text-[20px] font-bold" style={{ color: C.ink }}>
                {s.value}
              </p>
              <p className="mt-1 text-[10px] leading-4" style={{ color: C.stone }}>
                {s.sub}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 增长数据 */}
      <section>
        <SectionTitle>增长数据</SectionTitle>
        <div className="mb-3 grid grid-cols-3 gap-3">
          {[
            { label: "粉丝量", value: "476,000,000" },
            { label: "观看量", value: "117,525,262,086" },
            { label: "视频", value: "963" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border bg-white p-3"
              style={{ borderColor: C.border }}
            >
              <p className="mb-1 text-[11px]" style={{ color: C.stone }}>
                {s.label}
              </p>
              <p className="text-[16px] font-semibold" style={{ color: C.ink }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border bg-white p-4" style={{ borderColor: C.border }}>
          <div className="mb-2 flex items-center gap-4 text-[12px]">
            <span className="font-medium" style={{ color: C.terracotta }}>
              粉丝量增长
            </span>
            <span style={{ color: C.stone }}>播放量增长</span>
            <span style={{ color: C.stone }}>发布量增长</span>
          </div>
          <GrowthChart />
        </div>
      </section>

      {/* 频道质量 */}
      <section>
        <SectionTitle>频道质量</SectionTitle>
        <div className="rounded-2xl border bg-white p-4" style={{ borderColor: C.border }}>
          <div className="grid grid-cols-[160px_1fr] items-center gap-5">
            <div className="flex flex-col items-center">
              <p className="text-[11px]" style={{ color: C.stone }}>
                Nox评分
              </p>
              <p className="mt-1 text-3xl font-bold" style={{ color: C.ink }}>
                0
                <span className="text-base" style={{ color: C.stone }}>
                  /5
                </span>
              </p>
              <Pill tone="warn">较差</Pill>
            </div>
            <div className="flex items-start gap-4">
              <RadarChart />
              <div className="flex-1">
                {["粉丝增长", "创作频率", "频道质量", "互动率", "粉丝可信度"].map((l) => (
                  <ScoreBadge key={l} score={1} label={l} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 合作倾向 */}
      <section>
        <SectionTitle>合作倾向</SectionTitle>
        <div className="rounded-2xl border bg-white p-4" style={{ borderColor: C.border }}>
          <div className="mb-3 flex items-center gap-3">
            <span className="text-3xl font-bold" style={{ color: C.terracotta }}>
              7
              <span className="text-base" style={{ color: C.stone }}>
                /10
              </span>
            </span>
            <div>
              <p className="text-[13px] font-medium" style={{ color: C.ink }}>
                及格 · 通常活跃，有一定合作意向
              </p>
              <p className="text-[11px]" style={{ color: C.stone }}>
                范围从 0 到 10，分数越高，合作倾向性越强
              </p>
            </div>
          </div>
          <div
            className="flex flex-wrap gap-1.5 border-t pt-3"
            style={{ borderColor: C.borderLight }}
          >
            {[
              "4-14天有内容更新",
              "近90天内更新20+内容",
              "有联系方式",
              "半年内回复过邀约邮件",
              "0-3天有内容更新",
              "邀约回复率较低",
            ].map((t) => (
              <Pill key={t} tone="accent">
                {t}
              </Pill>
            ))}
          </div>
        </div>
      </section>

      {/* 合作价格和CPM */}
      <section>
        <SectionTitle>合作价格和CPM</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border bg-white p-4" style={{ borderColor: C.border }}>
            <p className="mb-1 text-[11px]" style={{ color: C.stone }}>
              CPM
            </p>
            <p className="text-2xl font-bold" style={{ color: C.ink }}>
              $ 21
            </p>
            <p className="mt-1 text-[10px]" style={{ color: C.stone }}>
              该网红的区域CPM $18 - $24
            </p>
          </div>
          <div className="rounded-2xl border bg-white p-4" style={{ borderColor: C.border }}>
            <p className="mb-1 text-[11px]" style={{ color: C.stone }}>
              植入视频
            </p>
            <p className="text-2xl font-bold" style={{ color: C.ink }}>
              $ 178.28万 - $ 237.81万
            </p>
            <p className="mt-1 text-[10px]" style={{ color: C.stone }}>
              预估合作价格
            </p>
          </div>
        </div>
      </section>

      {/* 粉丝量排名 */}
      <section>
        <SectionTitle>频道粉丝量排名</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "粉丝量 世界排名", value: "1", sub: "前 1%" },
            { label: "粉丝量 美国 排名", value: "1", sub: "前 1%" },
          ].map((r) => (
            <div
              key={r.label}
              className="rounded-2xl border bg-white p-4"
              style={{ borderColor: C.border }}
            >
              <p className="text-[12px]" style={{ color: C.charcoal }}>
                {r.label}
              </p>
              <p className="mt-1 text-2xl font-bold" style={{ color: C.ink }}>
                {r.value}
                <span className="ml-2 text-[11px] font-normal" style={{ color: C.stone }}>
                  {r.sub}
                </span>
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function AudienceTab() {
  return (
    <div className="space-y-6">
      <section>
        <SectionTitle>基本数据</SectionTitle>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "粉丝可信度", value: "4.25/5", pill: "优秀" as const },
            { label: "最多受众区域", value: "美国", pill: null },
            { label: "最多受众性别", value: "男性 57.4%", pill: null },
            { label: "最多受众年龄", value: "13-17  35.4%", pill: null },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border bg-white p-3"
              style={{ borderColor: C.border }}
            >
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-[11px]" style={{ color: C.stone }}>
                  {s.label}
                </p>
                {s.pill && <Pill tone="ok">{s.pill}</Pill>}
              </div>
              <p className="text-[16px] font-semibold" style={{ color: C.ink }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>受众特征</SectionTitle>
        <div
          className="space-y-3 rounded-2xl border bg-white p-4"
          style={{ borderColor: C.border }}
        >
          <div>
            <p className="mb-2 text-[12px]" style={{ color: C.charcoal }}>
              受众区域
            </p>
            <div
              className="flex h-2.5 overflow-hidden rounded-full"
              style={{ background: C.parchment }}
            >
              <div style={{ width: "73.5%", background: C.terracotta }} />
              <div style={{ width: "12.1%", background: C.amber }} />
              <div style={{ width: "6.6%", background: C.emerald }} />
              <div style={{ width: "5.3%", background: C.sky }} />
              <div style={{ width: "2.5%", background: "#8a6ac9" }} />
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-[10px]" style={{ color: C.charcoal }}>
              <span>🇺🇸 美国 73.5%</span>
              <span>🇬🇧 英国 12.1%</span>
              <span>🇨🇦 加拿大 6.6%</span>
              <span>🇦🇺 澳大利亚 5.3%</span>
              <span>🇮🇳 印度 2.5%</span>
            </div>
          </div>
          <div>
            <p className="mb-2 text-[12px]" style={{ color: C.charcoal }}>
              受众语言
            </p>
            <div className="h-2.5 rounded-full" style={{ background: C.terracotta }} />
            <p className="mt-2 text-[10px]" style={{ color: C.charcoal }}>
              英语 100%
            </p>
          </div>
        </div>
      </section>

      <section>
        <SectionTitle>年龄和性别</SectionTitle>
        <div className="grid grid-cols-[200px_1fr] gap-3">
          <div
            className="flex flex-col items-center rounded-2xl border bg-white p-4"
            style={{ borderColor: C.border }}
          >
            <p className="mb-3 text-[11px]" style={{ color: C.stone }}>
              性别
            </p>
            <svg viewBox="0 0 100 100" className="h-28 w-28">
              <circle cx="50" cy="50" r="40" fill="none" stroke={C.parchment} strokeWidth="14" />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={C.terracotta}
                strokeWidth="14"
                strokeDasharray={`${2 * Math.PI * 40 * 0.574} ${2 * Math.PI * 40}`}
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="mt-3 flex gap-3 text-[11px]">
              <span style={{ color: C.terracotta }}>● 男性 57.4%</span>
              <span style={{ color: C.amber }}>● 女性 42.6%</span>
            </div>
          </div>
          <div className="rounded-2xl border bg-white p-4" style={{ borderColor: C.border }}>
            <p className="mb-3 text-[11px]" style={{ color: C.stone }}>
              年龄统计
            </p>
            <div className="flex h-32 items-end gap-4 px-2">
              {[
                { age: "13-17", m: 8.8, f: 6.7 },
                { age: "18-24", m: 25.1, f: 19.5 },
                { age: "25-34", m: 16.6, f: 4.4 },
                { age: "35-44", m: 8.6, f: 1.7 },
                { age: "45-54", m: 5.1, f: 0.6 },
                { age: "55-64", m: 2.4, f: 0.2 },
                { age: "65+", m: 0.3, f: 0 },
              ].map((b) => (
                <div key={b.age} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-24 items-end gap-0.5">
                    <div
                      className="w-3 rounded-t"
                      style={{ height: `${b.m * 3.5}%`, background: C.terracotta }}
                    />
                    <div
                      className="w-3 rounded-t"
                      style={{ height: `${b.f * 3.5}%`, background: C.amber }}
                    />
                  </div>
                  <span className="text-[9px]" style={{ color: C.stone }}>
                    {b.age}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <SectionTitle>营销分析</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <div
            className="space-y-3 rounded-2xl border bg-white p-4"
            style={{ borderColor: C.border }}
          >
            <div>
              <div className="mb-1 flex items-center justify-between text-[12px]">
                <span style={{ color: C.charcoal }}>正向反馈的受众</span>
                <span className="font-semibold" style={{ color: C.ink }}>
                  76%
                </span>
              </div>
              <div
                className="h-1.5 overflow-hidden rounded-full"
                style={{ background: C.parchment }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: "76%", background: C.terracotta }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-[12px]">
                <span style={{ color: C.charcoal }}>推广内容感兴趣的受众</span>
                <span className="font-semibold" style={{ color: C.ink }}>
                  73%
                </span>
              </div>
              <div
                className="h-1.5 overflow-hidden rounded-full"
                style={{ background: C.parchment }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: "73%", background: C.terracotta }}
                />
              </div>
            </div>
          </div>
          <div
            className="space-y-3 rounded-2xl border bg-white p-4"
            style={{ borderColor: C.border }}
          >
            <div className="flex items-center justify-between text-[12px]">
              <div>
                <p style={{ color: C.charcoal }}>推广吸引度</p>
                <p className="text-[10px]" style={{ color: C.stone }}>
                  吸引指数 3
                </p>
              </div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className="h-3.5 w-3.5"
                    fill={n <= 3 ? C.amber : "none"}
                    stroke={C.amber}
                    strokeWidth={1.5}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <div>
                <p style={{ color: C.charcoal }}>推广专业度</p>
                <p className="text-[10px]" style={{ color: C.stone }}>
                  专业指数 5
                </p>
              </div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className="h-3.5 w-3.5"
                    fill={C.amber}
                    stroke={C.amber}
                    strokeWidth={1.5}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <SectionTitle>粉丝可信度</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border bg-white p-4" style={{ borderColor: C.border }}>
            <p className="mb-3 text-[11px]" style={{ color: C.stone }}>
              受众类型
            </p>
            {[
              { label: "普通粉", pct: 80.8, color: C.terracotta },
              { label: "可疑粉", pct: 11.3, color: C.amber },
              { label: "网红粉", pct: 4.6, color: C.sky },
              { label: "僵尸粉", pct: 3.3, color: C.stone },
            ].map((r) => (
              <div key={r.label} className="mb-2">
                <div className="mb-1 flex items-center justify-between text-[11px]">
                  <span style={{ color: C.charcoal }}>{r.label}</span>
                  <span style={{ color: C.ink }}>{r.pct}%</span>
                </div>
                <div
                  className="h-1.5 overflow-hidden rounded-full"
                  style={{ background: C.parchment }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${r.pct}%`, background: r.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div
            className="flex flex-col items-center justify-center rounded-2xl border bg-white p-4"
            style={{ borderColor: C.border }}
          >
            <p className="mb-2 text-[11px]" style={{ color: C.stone }}>
              真实受众
            </p>
            <svg viewBox="0 0 100 100" className="h-24 w-24">
              <circle cx="50" cy="50" r="40" fill="none" stroke={C.parchment} strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={C.emerald}
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 40 * 0.853} ${2 * Math.PI * 40}`}
                transform="rotate(-90 50 50)"
              />
              <text
                x="50"
                y="50"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="15"
                fontWeight="700"
                fill={C.ink}
              >
                85.3%
              </text>
              <text x="50" y="66" textAnchor="middle" fontSize="7" fill={C.emerald}>
                优秀
              </text>
            </svg>
            <p className="mt-2 text-center text-[10px]" style={{ color: C.stone }}>
              相似规模网红的平均等级数值 81.3%-83.3%
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function ContentTab() {
  return (
    <div className="space-y-6">
      <section>
        <SectionTitle>基本数据</SectionTitle>
        <div className="grid grid-cols-4 gap-3">
          {[
            { l: "互动率", v: "2.32%", p: "中等" as const },
            { l: "观看量/粉丝量", v: "13.67%", p: "良好" as const },
            { l: "点赞数/观看量", v: "2.26%", p: "中等" as const },
            { l: "评论数/观看量", v: "0.06%", p: "中等" as const },
          ].map((s) => (
            <div
              key={s.l}
              className="rounded-2xl border bg-white p-3"
              style={{ borderColor: C.border }}
            >
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-[11px]" style={{ color: C.stone }}>
                  {s.l}
                </p>
                <Pill tone={s.p === "良好" ? "accent" : "warn"}>{s.p}</Pill>
              </div>
              <p className="text-[18px] font-bold" style={{ color: C.ink }}>
                {s.v}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>发布分析</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border bg-white p-4" style={{ borderColor: C.border }}>
            <p className="mb-3 text-[12px]" style={{ color: C.charcoal }}>
              发布频率
            </p>
            <div className="mb-3 grid grid-cols-2 gap-3 text-[12px]">
              <div>
                <span className="font-semibold" style={{ color: C.ink }}>
                  2
                </span>{" "}
                <span style={{ color: C.stone }}>每周发布</span>
              </div>
              <div>
                <span className="font-semibold" style={{ color: C.ink }}>
                  9
                </span>{" "}
                <span style={{ color: C.stone }}>每月发布</span>
              </div>
            </div>
            <div className="flex h-28 items-end gap-2 px-1">
              {[
                { d: "一", v: 8.9 },
                { d: "二", v: 3.6 },
                { d: "三", v: 19.6 },
                { d: "四", v: 5.4 },
                { d: "五", v: 5.4 },
                { d: "六", v: 32.1 },
                { d: "日", v: 25 },
              ].map((b) => (
                <div key={b.d} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[9px]" style={{ color: C.stone }}>
                    {b.v}%
                  </span>
                  <div
                    className="w-full rounded-t"
                    style={{ height: `${b.v * 2.5}%`, background: C.terracotta, minHeight: "4px" }}
                  />
                  <span className="text-[9px]" style={{ color: C.stone }}>
                    星期{b.d}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border bg-white p-4" style={{ borderColor: C.border }}>
            <p className="mb-3 text-[12px]" style={{ color: C.charcoal }}>
              最近 30 天 CPM 与数据透视
            </p>
            <div className="grid grid-cols-2 gap-2 text-center">
              {[
                { l: "CPM", v: "$21" },
                { l: "中位评论量", v: "1.15万" },
                { l: "总浏览量", v: "104.91亿" },
                { l: "总点赞量", v: "2.25亿" },
              ].map((s) => (
                <div
                  key={s.l}
                  className="rounded-xl border p-2"
                  style={{ borderColor: C.borderLight, background: C.ivory }}
                >
                  <p className="text-[18px] font-bold" style={{ color: C.ink }}>
                    {s.v}
                  </p>
                  <p className="text-[10px]" style={{ color: C.stone }}>
                    {s.l}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <SectionTitle>频道标签</SectionTitle>
        <div className="rounded-2xl border bg-white p-4" style={{ borderColor: C.border }}>
          <div className="flex flex-wrap justify-center gap-2 py-4">
            {[
              { t: "entertainment", size: 28 },
              { t: "lifestyle", size: 20 },
              { t: "tv shows", size: 16 },
              { t: "food", size: 14 },
              { t: "vehicle", size: 14 },
              { t: "hobby", size: 12 },
            ].map((tag) => (
              <span
                key={tag.t}
                className="font-medium"
                style={{ fontSize: tag.size, color: C.terracotta }}
              >
                #{tag.t}
              </span>
            ))}
          </div>
          <div className="space-y-1.5 border-t pt-3" style={{ borderColor: C.borderLight }}>
            {[
              { t: "#entertainment", pct: 40.5 },
              { t: "#lifestyle", pct: 29 },
              { t: "#tv shows", pct: 10.9 },
              { t: "#hobby", pct: 6.5 },
              { t: "#food", pct: 6.6 },
            ].map((r) => (
              <div key={r.t}>
                <div className="flex items-center justify-between text-[11px]">
                  <span style={{ color: C.charcoal }}>{r.t}</span>
                  <span style={{ color: C.ink }}>{r.pct}%</span>
                </div>
                <div
                  className="mt-0.5 h-1 overflow-hidden rounded-full"
                  style={{ background: C.parchment }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${r.pct * 2}%`, background: C.terracotta }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <SectionTitle>内容数据</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          {[7, 12, 21].map((i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl border"
              style={{ borderColor: C.border }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://picsum.photos/seed/content-${i}/400/300`}
                alt=""
                className="h-28 w-full object-cover"
              />
              <div className="p-2 text-[10px]" style={{ color: C.stone }}>
                <p style={{ color: C.ink }}>▶ 6200万 · ♥ 150万</p>
                <p>ER 2.4%</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function BrandTab() {
  return (
    <div className="space-y-4">
      <SectionTitle>品牌提及</SectionTitle>
      <div className="rounded-2xl border bg-white p-4" style={{ borderColor: C.border }}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[13px] font-medium" style={{ color: C.ink }}>
            提及品牌
          </p>
          <div className="flex gap-2">
            <button
              className="rounded-full border px-2.5 py-1 text-[11px]"
              style={{ borderColor: C.border, color: C.charcoal }}
            >
              选择推广类型 <ChevronDown className="ml-1 inline h-3 w-3" />
            </button>
            <input
              placeholder="按品牌名搜索"
              className="rounded-full border px-3 py-1 text-[11px]"
              style={{ borderColor: C.border }}
            />
          </div>
        </div>
        <div
          className="grid grid-cols-6 gap-2 border-b py-2 text-[11px] font-medium"
          style={{ color: C.stone, borderColor: C.borderLight }}
        >
          <span>品牌</span>
          <span>推广</span>
          <span>互动率</span>
          <span>总观看量</span>
          <span>上次视频时间</span>
          <span>预算</span>
        </div>
        <div className="py-12 text-center text-[12px]" style={{ color: C.stone }}>
          暂无品牌提及数据
        </div>
      </div>
    </div>
  );
}

// ── Main drawer ───────────────────────────────────────────────────────────────
export function CreatorProfileDrawer({ creator, onClose }: Props) {
  const [tab, setTab] = useState<TabId>("overview");

  useEffect(() => {
    if (!creator) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [creator, onClose]);

  return (
    <AnimatePresence>
      {creator && (
        <>
          <motion.div
            key="bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(20,20,19,0.22)", backdropFilter: "blur(3px)" }}
            onClick={onClose}
          />
          <motion.aside
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 260 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-[min(820px,95vw)] overflow-y-auto"
            style={{ background: C.ivory, boxShadow: "-30px 0 80px -40px rgba(20,20,19,0.35)" }}
          >
            {/* Header */}
            <header
              className="sticky top-0 z-10 border-b px-6 py-4"
              style={{
                background: "rgba(250,249,245,0.92)",
                backdropFilter: "blur(10px)",
                borderColor: C.border,
              }}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px]" style={{ color: C.stone }}>
                  <RefreshCw className="h-3 w-3" />
                  <span>更新时间：2026-04-23 00:00:40</span>
                  <button
                    className="ml-1 rounded-full px-2 py-0.5 text-[10px]"
                    style={{ background: C.terracottaSoft, color: C.terracotta }}
                  >
                    刷新
                  </button>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full border p-1.5 transition-colors hover:bg-white"
                  style={{ borderColor: C.border, color: C.stone }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-start gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={creator.avatarUrl}
                  alt={creator.name}
                  className="h-16 w-16 rounded-full object-cover shadow-sm ring-2 ring-white"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[20px] font-bold" style={{ color: C.ink }}>
                      {creator.name}
                    </h2>
                    {creator.verified && (
                      <span className="rounded-full border border-blue-100 bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-600">
                        认证
                      </span>
                    )}
                    <Pill tone="accent">{creator.category ?? "娱乐"}</Pill>
                    <span className="text-sm" style={{ color: C.stone }}>
                      {creator.handle}
                    </span>
                  </div>
                  <div
                    className="mt-1 flex items-center gap-2 text-[12px]"
                    style={{ color: C.charcoal }}
                  >
                    <span>{creator.region}</span>
                    <span>·</span>
                    <span>{creator.language ?? "英语"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white"
                    style={{ background: C.terracotta }}
                  >
                    <Sparkles className="h-3.5 w-3.5" /> AI频道分析
                  </button>
                  {[Heart, Bookmark, FileText, Bell, Mail].map((Ic, i) => (
                    <button
                      key={i}
                      className="rounded-full border p-2 hover:bg-white"
                      style={{ borderColor: C.border, color: C.stone }}
                    >
                      <Ic className="h-3.5 w-3.5" />
                    </button>
                  ))}
                  <PlatformBadge platform={creator.platform ?? "youtube"} />
                </div>
              </div>

              {/* Top stats strip */}
              <div
                className="mt-4 grid grid-cols-5 gap-6 rounded-2xl border bg-white p-4"
                style={{ borderColor: C.border }}
              >
                <StatBlock label="粉丝量" value={creator.followers} />
                <StatBlock label="最近发布时间" value="1天前" tone="mid" />
                <StatBlock label="最近推广时间" value="4天前" tone="mid" />
                <StatBlock label="Nox评分" value="--" tone="mid" />
                <StatBlock label="合作倾向" value="7/10" tone="good" />
              </div>

              {/* Tabs */}
              <nav className="mt-4 flex items-center gap-1">
                {TABS.map((t) => {
                  const active = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                      )}
                      style={{
                        background: active ? C.terracottaSoft : "transparent",
                        color: active ? C.terracotta : C.charcoal,
                      }}
                    >
                      <t.Icon className="h-3.5 w-3.5" />
                      {t.label}
                    </button>
                  );
                })}
              </nav>
            </header>

            {/* Body */}
            <div className="px-6 py-6">
              {tab === "overview" && <OverviewTab />}
              {tab === "audience" && <AudienceTab />}
              {tab === "content" && <ContentTab />}
              {tab === "brand" && <BrandTab />}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
