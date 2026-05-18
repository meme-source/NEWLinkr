"use client";

// §3.3 投放漏斗 ——
// 2026-05-11 与 docs/REAL-BRIEF-TESTS 投放表现 mock 1:1 对齐：
//   合作中（100%） → 已投放（78%） → 累计曝光（60%） 三层竖直 pill，
//   pill 之间放 ↓ + "投放密度 / 单条产出" 居中 caption。
// 颜色来自 board-performance-shared 中的 TIER coral 家族
// （F5C9B3 / D88A74 / 8C543F），与"量级统计"、散点图同源。

import { fmtCount } from "@/features/outreach/components/board-performance-shared";

interface BoardFunnelProps {
  successCount: number;
  placedCount: number;
  totalExposureViews: number;
}

function fmtDensity(n: number): string {
  if (n <= 0) return "0";
  if (n >= 10) return n.toFixed(0);
  return n.toFixed(1).replace(/\.0$/, "");
}

export function BoardFunnel({ successCount, placedCount, totalExposureViews }: BoardFunnelProps) {
  const density = successCount > 0 ? placedCount / successCount : 0;
  const perPost = placedCount > 0 ? totalExposureViews / placedCount : 0;

  const stages = [
    { label: "合作中", value: String(successCount), width: 100, bg: "#F5C9B3", fg: "#7C4632" },
    { label: "已投放", value: String(placedCount), width: 78, bg: "#D88A74", fg: "#fffefb" },
    {
      label: "累计曝光",
      value: totalExposureViews > 0 ? fmtCount(totalExposureViews) : "—",
      width: 60,
      bg: "#8C543F",
      fg: "#fffefb",
    },
  ];

  const captions = [
    {
      label: "投放密度",
      value: `${fmtDensity(density)} 条/人`,
      ratio: `${placedCount} / ${successCount}`,
    },
    {
      label: "单条产出",
      value: `${fmtCount(perPost)} / 篇`,
      ratio: `${fmtCount(totalExposureViews)} / ${placedCount}`,
    },
  ];

  return (
    <div className="flex h-full flex-col rounded-lg border border-[#c5c0b1] bg-[#fffefb] px-[22px] py-[18px]">
      <div className="mb-[18px]">
        <div className="text-[11px] font-medium tracking-[0.12em] text-[#939084] uppercase">
          FUNNEL
        </div>
        <h3 className="mt-1.5 text-[17px] font-semibold tracking-tight text-[#201515]">投放漏斗</h3>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-3.5">
        {stages.map((stage, idx) => {
          const caption = captions[idx];
          return (
            <div key={stage.label} className="contents">
              <div
                className="flex items-center justify-between gap-2.5 rounded-lg px-[22px] py-[18px]"
                style={{
                  width: `${stage.width}%`,
                  backgroundColor: stage.bg,
                  color: stage.fg,
                }}
              >
                <span className="text-[12.5px] font-semibold tracking-wide whitespace-nowrap">
                  {stage.label}
                </span>
                <span className="text-base font-bold tracking-tight tabular-nums">
                  {stage.value}
                </span>
              </div>
              {caption ? (
                <div className="flex flex-wrap items-center justify-center gap-[5px] text-[10.5px]">
                  <span className="font-semibold text-[#939084]">↓</span>
                  <span className="text-[#36342e]">{caption.label}</span>
                  <span className="text-[11.5px] font-bold text-[#201515] tabular-nums">
                    {caption.value}
                  </span>
                  <span className="text-[#939084] tabular-nums">· {caption.ratio}</span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
