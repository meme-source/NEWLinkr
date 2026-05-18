"use client";

import { useState } from "react";

import type { AudienceProfile } from "@/types/api";

import { CHART } from "./chart-palette";

type Bucket = AudienceProfile["ageBuckets"][number];

// 年龄分布柱状图：每段年龄都给出男女双柱。
// hover 单根柱子时，柱身放大 + 顶上浮提示 "X% 的女性 · 18-24 岁"。
export function AgeCard({
  buckets,
  age17PlusShare,
}: {
  buckets: AudienceProfile["ageBuckets"];
  age17PlusShare: number;
}) {
  const max = Math.max(0.001, ...buckets.flatMap((b) => [b.female, b.male]));
  return (
    <div className="rounded-lg border border-[#c5c0b1] bg-[#fffefb] p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[13px] font-semibold text-[#201515]">年龄统计</p>
        <p className="text-[10px] text-[#939084]">
          大于 17 年龄
          <span className="ml-1 font-medium text-[#36342e]">
            {(age17PlusShare * 100).toFixed(1)}%
          </span>
        </p>
      </div>

      <div className="mt-3 flex items-center gap-3 text-[11px]">
        <Legend dot={CHART.primary} label="女性" />
        <Legend dot={CHART.dark} label="男性" />
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {buckets.map((bucket) => (
          <BucketColumn key={bucket.range} bucket={bucket} max={max} />
        ))}
      </div>
    </div>
  );
}

function BucketColumn({ bucket, max }: { bucket: Bucket; max: number }) {
  const [hover, setHover] = useState<"female" | "male" | null>(null);
  const fHeight = (bucket.female / max) * 100;
  const mHeight = (bucket.male / max) * 100;
  const fmt = (v: number) => `${(v * 100).toFixed(1)}%`;
  return (
    <div className="relative flex flex-col items-center gap-1">
      <div className="flex h-28 w-full flex-col items-stretch justify-end">
        <div className="mb-1 flex flex-col items-center gap-px text-[9px] leading-tight tabular-nums">
          <span style={{ color: CHART.primary }}>{fmt(bucket.female)}</span>
          <span style={{ color: CHART.dark }}>{fmt(bucket.male)}</span>
        </div>
        <div className="flex h-full items-end justify-center gap-1">
          <Bar
            pct={fHeight}
            color={CHART.primary}
            isHover={hover === "female"}
            onHover={(v) => setHover(v ? "female" : null)}
          />
          <Bar
            pct={mHeight}
            color={CHART.dark}
            isHover={hover === "male"}
            onHover={(v) => setHover(v ? "male" : null)}
          />
        </div>
      </div>
      <p className="text-[10px] text-[#939084]">{bucket.range}</p>
      {hover ? (
        <div
          role="tooltip"
          className="pointer-events-none absolute -top-1 left-1/2 z-20 -translate-x-1/2 -translate-y-full rounded-md bg-[#201515] px-2 py-1 text-[10px] font-medium whitespace-nowrap text-white shadow-md"
        >
          {hover === "female" ? fmt(bucket.female) : fmt(bucket.male)} 的
          {hover === "female" ? "女性" : "男性"}
          <span className="ml-1 text-[#c5c0b1]">· {bucket.range} 岁</span>
        </div>
      ) : null}
    </div>
  );
}

function Bar({
  pct,
  color,
  isHover,
  onHover,
}: {
  pct: number;
  color: string;
  isHover: boolean;
  onHover: (v: boolean) => void;
}) {
  return (
    <div
      className="flex h-full w-2.5 cursor-pointer flex-col justify-end"
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <div
        className="w-full rounded-t-md transition-transform duration-150 motion-reduce:transition-none"
        style={{
          height: `${Math.max(2, pct)}%`,
          minHeight: 4,
          background: color,
          transform: isHover ? "scale(1.35)" : "scale(1)",
          transformOrigin: "50% 100%",
        }}
      />
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-2 w-2 rounded-full" style={{ background: dot }} />
      <span className="text-[#36342e]">{label}</span>
    </span>
  );
}
