import type { AudienceProfile, RegionTier } from "@/types/api";

import { flagOf, TIER_LABEL, TIER_STYLE } from "./pricing";

// 受众地区分布：分级 chip 总览 + 各国占比条。颜色与 pricing.ts 的 TIER_STYLE 复用，
// 保证 RegionCard / PriceEstimateCard / OverviewCard 三处档位色一致。
export function RegionCard({ regions }: { regions: AudienceProfile["regions"] }) {
  const totals: Record<RegionTier, number> = { T1: 0, T2: 0, T3: 0 };
  for (const r of regions) totals[r.tier] += r.share;

  return (
    <div className="rounded-lg border border-[#c5c0b1] bg-[#fffefb] p-4">
      <p className="text-[13px] font-semibold text-[#201515]">地区</p>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {(Object.keys(TIER_STYLE) as RegionTier[]).map((tier) => {
          const style = TIER_STYLE[tier];
          const pct = (totals[tier] * 100).toFixed(2);
          return (
            <div key={tier} className={`rounded-lg p-3 text-center ${style.chipBg}`}>
              <p className={`text-[16px] font-bold tabular-nums ${style.chipText}`}>{pct}%</p>
              <p className={`mt-0.5 inline-flex items-center gap-1 text-[10px] ${style.chipText}`}>
                <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[9px] font-medium">
                  {tier}
                </span>
                <span>{TIER_LABEL[tier]}</span>
              </p>
            </div>
          );
        })}
      </div>

      <ul className="mt-4 space-y-2">
        {regions.map((r) => {
          const style = TIER_STYLE[r.tier];
          return (
            <li key={r.code} className="space-y-1">
              <div className="flex items-baseline justify-between text-[12px]">
                <span className="inline-flex items-center gap-1.5 text-[#201515]">
                  <span aria-hidden>{flagOf(r.code)}</span>
                  <span>{r.name}</span>
                  <span
                    className={`rounded-full px-1.5 py-0 text-[9px] ${style.chipBg} ${style.chipText}`}
                  >
                    {r.tier}
                  </span>
                </span>
                <span className="text-[#36342e] tabular-nums">{(r.share * 100).toFixed(2)}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#eceae3]">
                <div
                  className={`h-full rounded-full ${style.pill}`}
                  style={{ width: `${Math.max(2, r.share * 100)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
