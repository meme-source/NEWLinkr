"use client";

// §3.3 投放漏斗 ——
// 2026-05-06 重新切边界：建联段（待建联→已发送→合作中→已完成）由
// "建联进度"页里的 ProgressFunnel 负责；本页的漏斗只画"投放后"那段：
//   合作中 → 已投放 → 累计曝光
// 因此本组件不再需要 sentCount。

interface BoardFunnelProps {
  successCount: number;
  placedCount: number;
  totalExposureViews: number;
}

function formatExposure(n: number): string {
  if (n >= 1e6) {
    const v = n / 1e6;
    return `${v >= 10 ? v.toFixed(0) : v.toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (n >= 1e3) {
    const v = n / 1e3;
    return `${v >= 10 ? v.toFixed(0) : v.toFixed(1).replace(/\.0$/, "")}K`;
  }
  return String(Math.round(n));
}

export function BoardFunnel({ successCount, placedCount, totalExposureViews }: BoardFunnelProps) {
  const placementRate = successCount > 0 ? Math.round((placedCount / successCount) * 100) : 0;
  const totalExposure = totalExposureViews > 0 ? formatExposure(totalExposureViews) : "—";
  const avgExposure = placedCount > 0 ? formatExposure(totalExposureViews / placedCount) : "—";

  const stages = [
    { label: "合作中", value: String(successCount), width: 100, bg: "#ef4444", fg: "#fffdf9" },
    { label: "已投放", value: String(placedCount), width: 70, bg: "#ff4f00", fg: "#fffdf9" },
    { label: "累计曝光", value: totalExposure, width: 50, bg: "#201515", fg: "#fffdf9" },
  ];

  const transitions = [
    { caption: "投放率", value: `${placementRate}%` },
    { caption: "平均", value: `${avgExposure}/篇` },
  ];

  return (
    <div className="flex h-full flex-col rounded-2xl border border-[#c5c0b1] bg-[#fffefb] p-5">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <div className="text-xs font-medium tracking-wider text-[#939084] uppercase">
            投放漏斗
          </div>
          <div className="mt-1 text-[11px] text-[#939084]">合作中 → 已投放 → 累计曝光</div>
        </div>
        <div className="flex items-baseline gap-1.5 rounded-full border border-[#fff7f4] bg-[#fffdf9] px-3 py-1">
          <span className="text-[10px] tracking-wide text-[#939084]">投放率</span>
          <span className="text-sm font-semibold text-[#ff4f00] tabular-nums">
            {placementRate}%
          </span>
        </div>
      </div>

      <div className="mx-auto w-full max-w-md">
        {stages.map((stage, idx) => {
          const isLast = idx === stages.length - 1;
          const transition = transitions[idx];
          return (
            <div key={stage.label}>
              <div
                className="mx-auto flex items-center justify-between gap-4 rounded-xl px-4 py-2.5 transition-[width] duration-300"
                style={{
                  width: `${stage.width}%`,
                  backgroundColor: stage.bg,
                  color: stage.fg,
                }}
              >
                <span className="text-[11px] font-medium tracking-wide opacity-90">
                  {stage.label}
                </span>
                <span className="text-base font-semibold tabular-nums">{stage.value}</span>
              </div>
              {!isLast && transition ? (
                <div className="flex items-center gap-2 px-1 py-1.5">
                  <div className="h-px flex-1 bg-[#c5c0b1]" />
                  <span className="text-[10px] tracking-wide text-[#939084]">
                    {transition.caption}
                  </span>
                  <span className="text-[11px] font-semibold text-[#36342e] tabular-nums">
                    {transition.value}
                  </span>
                  <div className="h-px flex-1 bg-[#c5c0b1]" />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
