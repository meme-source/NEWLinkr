import type { AudienceProfile } from "@/types/api";

import { CHART } from "./chart-palette";
import { InfoTooltip } from "./info-tooltip";
import { SegmentedDonut } from "./segmented-donut";

// 性别分布：用共享 SegmentedDonut（SVG）渲染，hover 时该扇区外径外扩并浮出
// 提示 "78% 的女性"；中心图例保持静态。
export function GenderCard({ gender }: { gender: AudienceProfile["gender"] }) {
  const femalePercent = Math.round(gender.female * 1000) / 10;
  const malePercent = Math.round(gender.male * 1000) / 10;
  return (
    <div className="flex h-full flex-col rounded-lg border border-[#c5c0b1] bg-[#fffefb] p-4">
      <p className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#201515]">
        性别
        <InfoTooltip text="基于网红受众特征 / 区域特点 / 粉丝特点，通过机器算法不断优化估算而得。" />
      </p>
      <div className="flex flex-1 items-center justify-center pt-3">
        <SegmentedDonut
          size={140}
          segments={[
            { key: "female", label: "女性", value: gender.female, color: CHART.primary },
            { key: "male", label: "男性", value: gender.male, color: CHART.dark },
          ]}
          formatTooltip={(seg) => `${(seg.value * 100).toFixed(1)}% 的${seg.label}`}
          center={
            <div className="flex flex-col items-center justify-center gap-0.5 leading-tight">
              <CenterRow color={CHART.primary} value={femalePercent} label="女性" />
              <CenterRow color={CHART.dark} value={malePercent} label="男性" />
            </div>
          }
        />
      </div>
    </div>
  );
}

function CenterRow({ color, value, label }: { color: string; value: number; label: string }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="text-[16px] font-bold tabular-nums" style={{ color }}>
        {value}%
      </span>
      <span className="text-[11px] text-[#36342e]">{label}</span>
    </span>
  );
}
