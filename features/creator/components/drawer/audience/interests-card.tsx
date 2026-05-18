import type { AudienceProfile } from "@/types/api";

import { CHART } from "./chart-palette";
import { SegmentedDonut } from "./segmented-donut";

// 5 色循环：纯暖色单家族，由亮到暗 / 由饱和到中性，避免冷暖混搭的违和感。
const INTEREST_PALETTE = [CHART.primary, CHART.dark, CHART.coral, CHART.graphite, CHART.sand];

// 兴趣与情感：左侧 donut + 右侧分类列表。donut 复用 SegmentedDonut，
// hover 时该扇区外扩并提示 "35% 的喜剧"。
export function InterestsCard({ interests }: { interests: AudienceProfile["interests"] }) {
  if (interests.length === 0) return null;
  const segments = interests.map((interest, idx) => ({
    key: `${interest.name}-${idx}`,
    label: interest.name,
    value: interest.share,
    color: INTEREST_PALETTE[idx % INTEREST_PALETTE.length],
    description: interest.description,
  }));

  return (
    <div className="rounded-lg border border-[#c5c0b1] bg-[#fffefb] p-4">
      <p className="text-[13px] font-semibold text-[#201515]">兴趣与情感</p>
      <div className="mt-3 grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
        <div className="mx-auto">
          <SegmentedDonut
            size={140}
            segments={segments.map(({ key, label, value, color }) => ({
              key,
              label,
              value,
              color,
            }))}
            formatTooltip={(seg) => `${(seg.value * 100).toFixed(1)}% 的${seg.label}`}
          />
        </div>

        <ul className="space-y-2">
          {segments.map((s) => (
            <li key={s.key} className="flex items-start gap-2 text-[12px]">
              <span
                className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ background: s.color }}
              />
              <span className="w-14 shrink-0 font-medium text-[#201515]">{s.label}</span>
              <span className="min-w-0 flex-1 text-[#939084]">{s.description}</span>
              <span className="shrink-0 text-[#36342e] tabular-nums">
                {(s.value * 100).toFixed(0)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
