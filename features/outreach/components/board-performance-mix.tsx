"use client";

// §3.3 投放表现 — "投放达人结构"两块卡片：
//   1) 类别分布：按达人主类拆 投放数 / 累计曝光 / 平均 CPE
//   2) 量级统计：按粉丝量分桶（头部 / 腰部 / 尾部）拆 投放数 / 累计曝光 / 总花费
// 两个卡片在 TikTok-only 阶段取代了原先的"平台对比"卡。

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
    <div className="flex h-full flex-col rounded-2xl border border-[#c5c0b1] bg-[#fffefb] p-5">
      <div className="mb-4">
        <div className="text-xs font-medium tracking-wider text-[#939084] uppercase">类别分布</div>
        <p className="mt-1 text-[11px] text-[#939084]">投放达人主类的投放数与产出</p>
      </div>
      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex-1 space-y-3.5">
          {rows.map((r) => {
            const cpe = r.eng > 0 ? r.spend / r.eng : 0;
            const sharePct = totalCount > 0 ? Math.round((r.count / totalCount) * 100) : 0;
            const widthPct = (r.views / maxViews) * 100;
            return (
              <div key={r.category}>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#201515]">{CATEGORY_LABEL[r.category]}</span>
                    <span className="text-[10px] text-[#939084] tabular-nums">
                      {r.count} 条 · {sharePct}%
                    </span>
                  </div>
                  <span className="text-[11px] text-[#36342e] tabular-nums">
                    CPE {fmtMoney(cpe, 3)}
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#eceae3]">
                  <div
                    className="h-full rounded-full bg-[#ff4f00]"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-[#939084] tabular-nums">
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
    <div className="flex h-full flex-col rounded-2xl border border-[#c5c0b1] bg-[#fffefb] p-5">
      <div className="mb-4">
        <div className="text-xs font-medium tracking-wider text-[#939084] uppercase">量级统计</div>
        <p className="mt-1 text-[11px] text-[#939084]">按达人粉丝量分桶的投放数与花费</p>
      </div>
      {totalCount === 0 ? (
        <EmptyState />
      ) : (
        <>
          <SpendShareBar rows={rows} totalSpend={totalSpend} />
          <div className="mt-4 flex-1 space-y-3">
            {rows.map((r) => {
              const meta = TIER_META[r.tier];
              const cpe = r.eng > 0 ? r.spend / r.eng : 0;
              const countShare = totalCount > 0 ? Math.round((r.count / totalCount) * 100) : 0;
              return (
                <div
                  key={r.tier}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#eceae3] bg-[#fffdf9] px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-[#201515]">{meta.label}</div>
                      <div className="text-[10px] text-[#939084] tabular-nums">{meta.range}</div>
                    </div>
                  </div>
                  <div className="grid shrink-0 grid-cols-3 gap-3 text-right text-[11px] tabular-nums">
                    <div>
                      <div className="text-[10px] text-[#939084]">投放</div>
                      <div className="font-semibold text-[#201515]">
                        {r.count}
                        <span className="ml-1 text-[10px] font-normal text-[#939084]">
                          {countShare}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#939084]">曝光</div>
                      <div className="font-semibold text-[#201515]">{fmtCount(r.views)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#939084]">CPE</div>
                      <div className="font-semibold text-[#201515]">
                        {r.eng > 0 ? fmtMoney(cpe, 3) : "—"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function SpendShareBar({ rows, totalSpend }: { rows: TierRow[]; totalSpend: number }) {
  if (totalSpend <= 0) return null;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[10px] text-[#939084]">
        <span>花费占比</span>
        <span className="tabular-nums">{fmtMoney(totalSpend, 0)} 总花费</span>
      </div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-[#eceae3]">
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
    <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-[#eceae3] bg-[#fffdf9] py-10 text-[11px] text-[#939084]">
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
