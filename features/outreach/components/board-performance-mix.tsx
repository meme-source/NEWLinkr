"use client";

// §3.3 投放表现 — "投放达人结构"两块卡片：
//   1) 类别分布：按达人主类拆 投放数 / 累计曝光 / 平均 CPE
//   2) 量级统计：按粉丝量分桶（头部 / 腰部 / 尾部）拆 投放数 / 累计曝光 / 总花费
// 2026-05-11 与 投放表现 mock 1:1 对齐：
//   - 卡片 border-radius 12 (rounded-lg)
//   - 标题区使用 section-label + h3 双层结构 (CATEGORY / TIER)
//   - 类别分布 bar 填 orange (--orange #ff4f00)，量级 dot 沿用 coral 家族
//   - 量级卡的"花费占比"caption 改为单行（caption · 总花费 $X）放条上方
//   - 量级 tier-row 改为 4 列 grid (name 1.3fr | 投放 | 曝光 | CPE)，与 mock 同形

import {
  CATEGORY_LABEL,
  engOf,
  fmtCount,
  fmtMoney,
  TIER_META,
  TIER_ORDER,
  tierOf,
  type CreatorTier,
} from "@/features/outreach/components/board-performance-shared";
import type { Placement } from "@/features/outreach/data/board-placements";
import type { CreatorCategory } from "@/types/api";

interface CategoryRow {
  category: CreatorCategory;
  count: number;
  views: number;
  spend: number;
  eng: number;
}

export function CategoryBreakdownCard({ placements }: { placements: Placement[] }) {
  const rows = aggregateByCategory(placements);
  const totalCount = placements.length;
  const maxViews = Math.max(1, ...rows.map((r) => r.views));

  return (
    <div className="flex h-full flex-col rounded-lg border border-[#c5c0b1] bg-[#fffefb] px-[22px] py-[18px]">
      <div className="mb-[24px]">
        <div className="text-[11px] font-medium tracking-[0.12em] text-[#939084] uppercase">
          CATEGORY
        </div>
        <h3 className="mt-1.5 text-[17px] font-semibold tracking-tight text-[#201515]">类别分布</h3>
      </div>
      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-1 flex-col gap-[22px]">
          {rows.map((r) => {
            const cpe = r.eng > 0 ? r.spend / r.eng : 0;
            const sharePct = totalCount > 0 ? Math.round((r.count / totalCount) * 100) : 0;
            const widthPct = (r.views / maxViews) * 100;
            return (
              <div key={r.category}>
                <div className="mb-2 flex items-center justify-between text-[13px]">
                  <div className="flex items-center gap-2.5">
                    <span className="font-medium text-[#201515]">{CATEGORY_LABEL[r.category]}</span>
                    <span className="text-[12px] text-[#939084] tabular-nums">
                      {r.count} 条 · {sharePct}%
                    </span>
                  </div>
                  <span className="text-[12px] text-[#36342e] tabular-nums">
                    CPE {fmtMoney(cpe, 3)}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-[3px] bg-[#eceae3]">
                  <div
                    className="h-full rounded-[3px] bg-[#ff4f00]"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#939084] tabular-nums">
                  <span>曝光 {fmtCount(r.views)}</span>
                  <span>花费 {fmtMoney(r.spend, 0)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface TierRow {
  tier: CreatorTier;
  count: number;
  views: number;
  spend: number;
  eng: number;
}

export function TierBreakdownCard({ placements }: { placements: Placement[] }) {
  const rows = aggregateByTier(placements);
  const totalCount = placements.length;
  const totalSpend = rows.reduce((s, r) => s + r.spend, 0);

  return (
    <div className="flex h-full flex-col rounded-lg border border-[#c5c0b1] bg-[#fffefb] px-[22px] py-[18px]">
      <div className="mb-[18px]">
        <div className="text-[11px] font-medium tracking-[0.12em] text-[#939084] uppercase">
          TIER
        </div>
        <h3 className="mt-1.5 text-[17px] font-semibold tracking-tight text-[#201515]">量级统计</h3>
      </div>
      {totalCount === 0 ? (
        <EmptyState />
      ) : (
        <>
          <SpendShareBar rows={rows} totalSpend={totalSpend} />
          <div className="flex flex-1 flex-col gap-[14px]">
            {rows.map((r) => {
              const meta = TIER_META[r.tier];
              const cpe = r.eng > 0 ? r.spend / r.eng : 0;
              const countShare = totalCount > 0 ? Math.round((r.count / totalCount) * 100) : 0;
              return (
                <div
                  key={r.tier}
                  className="grid grid-cols-[1.3fr_1fr_1fr_1fr] items-center gap-3 rounded-lg border border-[#c5c0b1] bg-[#fffefb] px-4 py-3.5 transition-colors hover:border-[#b5b2aa]"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="h-[7px] w-[7px] shrink-0 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium whitespace-nowrap text-[#201515]">
                        {meta.label}
                      </div>
                      <div className="mt-0.5 text-[10.5px] whitespace-nowrap text-[#939084] tabular-nums">
                        {meta.range} 粉丝
                      </div>
                    </div>
                  </div>
                  <TierMetric label="投放" value={`${r.count} 条 · ${countShare}%`} />
                  <TierMetric label="曝光" value={fmtCount(r.views)} />
                  <TierMetric label="CPE" value={r.eng > 0 ? fmtMoney(cpe, 3) : "—"} />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function TierMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="mb-[3px] text-[10px] text-[#939084]">{label}</div>
      <div className="text-[12.5px] font-medium whitespace-nowrap text-[#201515] tabular-nums">
        {value}
      </div>
    </div>
  );
}

function SpendShareBar({ rows, totalSpend }: { rows: TierRow[]; totalSpend: number }) {
  if (totalSpend <= 0) return null;
  return (
    <div className="mb-5">
      <div className="mb-3.5 flex items-center gap-1.5 text-[12px] text-[#939084]">
        <span>花费占比 · 总花费</span>
        <strong className="font-medium text-[#201515] tabular-nums">
          {fmtMoney(totalSpend, 0)}
        </strong>
      </div>
      <div className="flex h-1.5 w-full gap-px overflow-hidden rounded-[3px]">
        {rows.map((r) => {
          const pct = (r.spend / totalSpend) * 100;
          if (pct <= 0) return null;
          return (
            <div
              key={r.tier}
              style={{ width: `${pct}%`, backgroundColor: TIER_META[r.tier].color }}
              title={`${TIER_META[r.tier].label} ${fmtMoney(r.spend, 0)}（${pct.toFixed(0)}%）`}
            />
          );
        })}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-[#eceae3] bg-[#fffdf9] py-10 text-[11px] text-[#939084]">
      暂无投放数据
    </div>
  );
}

function aggregateByCategory(placements: Placement[]): CategoryRow[] {
  const buckets = new Map<CreatorCategory, CategoryRow>();
  for (const p of placements) {
    const row = buckets.get(p.creatorCategory) ?? {
      category: p.creatorCategory,
      count: 0,
      views: 0,
      spend: 0,
      eng: 0,
    };
    buckets.set(p.creatorCategory, {
      ...row,
      count: row.count + 1,
      views: row.views + p.views,
      spend: row.spend + p.spendUsd,
      eng: row.eng + engOf(p),
    });
  }
  return Array.from(buckets.values()).sort((a, b) => b.count - a.count || b.views - a.views);
}

function aggregateByTier(placements: Placement[]): TierRow[] {
  const empty: Record<CreatorTier, TierRow> = {
    head: { tier: "head", count: 0, views: 0, spend: 0, eng: 0 },
    mid: { tier: "mid", count: 0, views: 0, spend: 0, eng: 0 },
    tail: { tier: "tail", count: 0, views: 0, spend: 0, eng: 0 },
  };
  for (const p of placements) {
    const t = tierOf(p.creatorFollowers);
    const row = empty[t];
    empty[t] = {
      ...row,
      count: row.count + 1,
      views: row.views + p.views,
      spend: row.spend + p.spendUsd,
      eng: row.eng + engOf(p),
    };
  }
  return TIER_ORDER.map((t) => empty[t]);
}
