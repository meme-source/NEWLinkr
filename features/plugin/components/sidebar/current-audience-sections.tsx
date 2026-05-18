"use client";

import type { AudienceProfile, RegionTier } from "@/types/api";

import { CURRENT_PALETTE, Section, tileTone, type TileTone } from "./current-tab-ui";
import {
  type AudiencePrice,
  formatUsd,
  formatViews,
  regionFlag,
  TIER_ACCENT,
  TIER_LABEL,
} from "./current-audience-data";

// 数据概览：4 格摘要，对应 Web OverviewCard 的 预估报价 / 最多地区 / 性别 / 年龄。
// 预估报价取「受众地区折算总价」，与 PriceEstimateSection 同一来源。
export function OverviewSection({
  priceLabel,
  profile,
}: {
  priceLabel: string;
  profile: AudienceProfile;
}) {
  const topRegion = [...profile.regions].sort((a, b) => b.share - a.share)[0];
  const femaleLeads = profile.gender.female >= profile.gender.male;
  const topGenderShare = femaleLeads ? profile.gender.female : profile.gender.male;
  const topAge = [...profile.ageBuckets].sort((a, b) => b.female + b.male - (a.female + a.male))[0];

  return (
    <Section title="数据概览">
      <div className="grid grid-cols-2 gap-1.5">
        <OverviewTile label="预估报价" value={priceLabel} tone="highlight" />
        <OverviewTile
          label="最多受众地区"
          value={topRegion ? `${regionFlag(topRegion.code)} ${topRegion.name}` : "—"}
          sub={topRegion ? `${(topRegion.share * 100).toFixed(1)}%` : undefined}
          tone="neutral"
        />
        <OverviewTile
          label="最多受众性别"
          value={femaleLeads ? "女性" : "男性"}
          sub={`${(topGenderShare * 100).toFixed(1)}%`}
          tone="neutral"
        />
        <OverviewTile
          label="最多受众年龄"
          value={topAge ? `${topAge.range} 岁` : "—"}
          sub={topAge ? `${((topAge.female + topAge.male) * 100).toFixed(1)}%` : undefined}
          tone="neutral"
        />
      </div>
    </Section>
  );
}

function OverviewTile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone: TileTone;
}) {
  const t = tileTone(tone);
  return (
    <div className={`rounded-[8px] px-2.5 py-2 ${t.card}`}>
      <p className={`text-[10.5px] ${t.label}`}>{label}</p>
      <div className="mt-0.5 flex items-baseline justify-between gap-1.5">
        <p className={`truncate text-[13px] font-semibold ${t.value}`} title={value}>
          {value}
        </p>
        {sub ? (
          <span className={`shrink-0 text-[10px] tabular-nums ${t.label}`}>占 {sub}</span>
        ) : null}
      </div>
    </div>
  );
}

// 性别：女性 / 男性占比横向分段条（女性=主色，男性=暖近黑），同 Web GenderCard 口径。
export function GenderSection({ gender }: { gender: AudienceProfile["gender"] }) {
  const female = Math.round(gender.female * 1000) / 10;
  const male = Math.round(gender.male * 1000) / 10;
  return (
    <Section title="性别">
      <div className="rounded-[8px] border border-[#eceae3] bg-[#fffefb] px-3 py-3">
        <div className="flex h-3.5 overflow-hidden rounded-full">
          <div style={{ width: `${female}%`, background: CURRENT_PALETTE.primary }} />
          <div style={{ width: `${male}%`, background: CURRENT_PALETTE.dark }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11.5px]">
          <GenderLegend color={CURRENT_PALETTE.primary} label="女性" pct={female} />
          <GenderLegend color={CURRENT_PALETTE.dark} label="男性" pct={male} />
        </div>
      </div>
    </Section>
  );
}

function GenderLegend({ color, label, pct }: { color: string; label: string; pct: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[#36342e]">
      <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
      <span className="font-semibold text-[#201515] tabular-nums">{pct}%</span>
    </span>
  );
}

// 年龄统计：7 段年龄各给女 / 男双柱，同 Web AgeCard 口径。
export function AgeSection({
  buckets,
  age17PlusShare,
}: {
  buckets: AudienceProfile["ageBuckets"];
  age17PlusShare: number;
}) {
  const max = Math.max(0.001, ...buckets.flatMap((b) => [b.female, b.male]));
  return (
    <Section title="年龄统计">
      <div className="rounded-[8px] border border-[#eceae3] bg-[#fffefb] px-3 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-[10.5px]">
            <GenderLegendDot color={CURRENT_PALETTE.primary} label="女性" />
            <GenderLegendDot color={CURRENT_PALETTE.dark} label="男性" />
          </div>
          <p className="text-[10px] text-[#939084]">
            17+ 占比
            <span className="ml-1 font-medium text-[#36342e] tabular-nums">
              {(age17PlusShare * 100).toFixed(1)}%
            </span>
          </p>
        </div>
        <div className="mt-3 flex items-end justify-between gap-1">
          {buckets.map((bucket) => (
            <div key={bucket.range} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-20 w-full items-end justify-center gap-[3px]">
                <AgeBar pct={(bucket.female / max) * 100} color={CURRENT_PALETTE.primary} />
                <AgeBar pct={(bucket.male / max) * 100} color={CURRENT_PALETTE.dark} />
              </div>
              <span className="text-[8.5px] text-[#939084]">{bucket.range}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

function AgeBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div
      className="w-2 rounded-t-[3px]"
      style={{ height: `${Math.max(3, pct)}%`, background: color }}
    />
  );
}

function GenderLegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[#36342e]">
      <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

// 地区：T1/T2/T3 分级占比 + 各国占比条，同 Web RegionCard 口径。
export function RegionSection({ regions }: { regions: AudienceProfile["regions"] }) {
  const tierTotals: Record<RegionTier, number> = { T1: 0, T2: 0, T3: 0 };
  for (const region of regions) tierTotals[region.tier] += region.share;
  const sorted = [...regions].sort((a, b) => b.share - a.share).slice(0, 5);

  return (
    <Section title="地区">
      <div className="space-y-2.5">
        <div className="grid grid-cols-3 gap-1.5">
          {(["T1", "T2", "T3"] as RegionTier[]).map((tier) => (
            <div key={tier} className="rounded-lg bg-[#eceae3] px-2 py-2 text-center">
              <p
                className="text-[14px] font-bold tabular-nums"
                style={{ color: TIER_ACCENT[tier] }}
              >
                {(tierTotals[tier] * 100).toFixed(1)}%
              </p>
              <p className="text-[9.5px] text-[#939084]">{TIER_LABEL[tier]}</p>
            </div>
          ))}
        </div>
        <ul className="space-y-1.5 rounded-[8px] border border-[#eceae3] bg-[#fffefb] px-3 py-2.5">
          {sorted.map((region) => (
            <li key={region.code} className="space-y-1">
              <div className="flex items-baseline justify-between text-[11.5px]">
                <span className="inline-flex items-center gap-1 text-[#201515]">
                  <span aria-hidden>{regionFlag(region.code)}</span>
                  {region.name}
                </span>
                <span className="text-[#36342e] tabular-nums">
                  {(region.share * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#eceae3]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(2, region.share * 100)}%`,
                    background: TIER_ACCENT[region.tier],
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

// 根据受众分布预估报价：总价 + 各 tier 折算明细，同 Web PriceEstimateCard 口径。
export function PriceEstimateSection({ price }: { price: AudiencePrice }) {
  return (
    <Section title="根据受众分布预估报价">
      <div className="rounded-[8px] border border-[#eceae3] bg-[#fffefb] px-3 py-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[22px] font-bold text-[#ff4f00] tabular-nums">
            {formatUsd(price.total)}
          </p>
          <p className="text-[10px] text-[#939084]">
            博主所在地档位
            <span className="ml-1 font-medium text-[#36342e]">{price.bloggerTier}</span>
          </p>
        </div>
        <p className="mt-0.5 text-[10.5px] text-[#54514a]">
          中位播放 {formatViews(price.medianViews)} · 按受众地区分布折算
        </p>
        <ul className="mt-2.5 space-y-1.5">
          {price.lines.map((line) => (
            <li
              key={line.tier}
              className="flex items-center justify-between gap-2 text-[11px] tabular-nums"
            >
              <span className="text-[#36342e]">
                {TIER_LABEL[line.tier]} {(line.share * 100).toFixed(1)}% × {formatUsd(line.cpm)}
                <span className="text-[#939084]"> CPM</span>
              </span>
              <span className="font-semibold" style={{ color: TIER_ACCENT[line.tier] }}>
                {formatUsd(line.value)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
