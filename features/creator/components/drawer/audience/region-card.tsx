import type { AudienceProfile, RegionTier } from "@/types/api";

const TIER_STYLE: Record<RegionTier, { label: string; bg: string; fg: string; bar: string }> = {
  T1: {
    label: "发达",
    bg: "bg-[#e6f0ff]",
    fg: "text-[#2f6bff]",
    bar: "bg-[#2f6bff]",
  },
  T2: {
    label: "发展中",
    bg: "bg-[#dff5ec]",
    fg: "text-[#13a07a]",
    bar: "bg-[#13a07a]",
  },
  T3: {
    label: "欠发达",
    bg: "bg-[#fde9d3]",
    fg: "text-[#e08e1f]",
    bar: "bg-[#e08e1f]",
  },
};

// 受众地区分布：分级 chip 总览 + 各国占比条。
export function RegionCard({ regions }: { regions: AudienceProfile["regions"] }) {
  const totals: Record<RegionTier, number> = { T1: 0, T2: 0, T3: 0 };
  for (const r of regions) totals[r.tier] += r.share;

  return (
    <div className="rounded-2xl border border-[#c5c0b1] bg-[#fffefb] p-4">
      <p className="text-[13px] font-semibold text-[#201515]">地区</p>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {(Object.keys(TIER_STYLE) as RegionTier[]).map((tier) => {
          const style = TIER_STYLE[tier];
          const pct = (totals[tier] * 100).toFixed(2);
          return (
            <div key={tier} className={`rounded-2xl p-3 text-center ${style.bg}`}>
              <p className={`text-[16px] font-bold tabular-nums ${style.fg}`}>{pct}%</p>
              <p className={`mt-0.5 inline-flex items-center gap-1 text-[10px] ${style.fg}`}>
                <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[9px] font-medium">
                  {tier}
                </span>
                <span>{style.label}</span>
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
                  <span className={`rounded-full px-1.5 py-0 text-[9px] ${style.bg} ${style.fg}`}>
                    {r.tier}
                  </span>
                </span>
                <span className="text-[#36342e] tabular-nums">{(r.share * 100).toFixed(2)}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#eceae3]">
                <div
                  className={`h-full rounded-full ${style.bar}`}
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

// ISO alpha-2 → flag emoji。仅用于 UI 展示，不参与逻辑。
function flagOf(code: string): string {
  const upper = code.toUpperCase();
  if (upper.length !== 2) return "🏳️";
  const codePoints = [...upper].map((c) => 0x1f1e6 + (c.charCodeAt(0) - 65));
  return String.fromCodePoint(...codePoints);
}
