import type { AudienceProfile, Creator } from "@/types/api";

import { computeAudiencePrice, flagOf, formatUsd } from "./pricing";

// 数据概览：4 格摘要，给出受众分析里最值得一眼看到的几个数字。
// 1. 预估报价（按受众分布折算）
// 2. 最多受众地区
// 3. 最多受众性别
// 4. 最多受众年龄
export function OverviewCard({ creator, profile }: { creator: Creator; profile: AudienceProfile }) {
  const { total } = computeAudiencePrice(creator, profile.regions);

  const topRegion = [...profile.regions].sort((a, b) => b.share - a.share)[0];

  const female = profile.gender.female;
  const male = profile.gender.male;
  const topGenderIsFemale = female >= male;
  const topGenderShare = topGenderIsFemale ? female : male;

  const topAge = [...profile.ageBuckets].sort((a, b) => b.female + b.male - (a.female + a.male))[0];
  const topAgeShare = topAge ? topAge.female + topAge.male : 0;

  return (
    <div className="rounded-lg border border-[#c5c0b1] bg-[#fffefb] p-4">
      <p className="text-[13px] font-semibold text-[#201515]">数据概览</p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile
          label="预估报价"
          accent="text-[#ff4f00]"
          value={formatUsd(total)}
          sub="按受众分布折算"
        />
        <StatTile
          label="最多受众地区"
          value={
            topRegion ? (
              <span className="inline-flex items-center gap-1">
                <span aria-hidden>{flagOf(topRegion.code)}</span>
                <span>{topRegion.name}</span>
              </span>
            ) : (
              "—"
            )
          }
          sub={topRegion ? `${(topRegion.share * 100).toFixed(1)}%` : ""}
        />
        <StatTile
          label="最多受众性别"
          value={topGenderIsFemale ? "女性" : "男性"}
          accent={topGenderIsFemale ? "text-[#ff4f00]" : "text-[#3a3431]"}
          sub={`${(topGenderShare * 100).toFixed(1)}%`}
        />
        <StatTile
          label="最多受众年龄"
          value={topAge ? `${topAge.range} 岁` : "—"}
          sub={topAge ? `${(topAgeShare * 100).toFixed(1)}%` : ""}
        />
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  sub,
  accent = "text-[#201515]",
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg bg-[#fdf6ee] p-2.5">
      <p className="text-[10px] text-[#939084]">{label}</p>
      <p className={`mt-1 text-[15px] font-bold tabular-nums ${accent}`}>{value}</p>
      {sub ? <p className="mt-0.5 text-[10px] text-[#939084] tabular-nums">{sub}</p> : null}
    </div>
  );
}
