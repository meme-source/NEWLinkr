"use client";

import { useMemo } from "react";
import { X } from "lucide-react";

import { AddCountryButton } from "@/features/settings/components/cpm/add-country-button";
import {
  REGION_ROWS,
  type RegionRow,
  type TierCountries,
} from "@/features/settings/components/cpm/types";
import { CPM_COUNTRY_DICT, type CpmTier } from "@/features/settings/data/cpm-countries";
import { cn } from "@/lib/utils";

interface RegionSectionProps {
  tierCountries: TierCountries;
  onAdd: (tier: CpmTier, country: string) => void;
  onRemove: (tier: CpmTier, country: string) => void;
}

export function RegionSection({ tierCountries, onAdd, onRemove }: RegionSectionProps) {
  const assignedMap = useMemo(() => {
    const map = new Map<string, CpmTier>();
    (Object.keys(tierCountries) as CpmTier[]).forEach((tier) => {
      tierCountries[tier].forEach((c) => map.set(c, tier));
    });
    return map;
  }, [tierCountries]);

  return (
    <section className="rounded-2xl border border-[#c5c0b1] bg-[#fffefb] p-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-[#201515]">地区分类管理</h3>
          <p className="mt-1 text-[11px] text-[#939084]">
            决定每个国家归入哪一档。一国仅可属于一个分类，跨档添加会自动迁移。
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {REGION_ROWS.map((r) => (
          <RegionTierCard
            key={r.tier}
            row={r}
            countries={tierCountries[r.tier]}
            assignedMap={assignedMap}
            onAdd={(name) => onAdd(r.tier, name)}
            onRemove={(name) => onRemove(r.tier, name)}
          />
        ))}
      </div>
    </section>
  );
}

interface RegionTierCardProps {
  row: RegionRow;
  countries: string[];
  assignedMap: Map<string, CpmTier>;
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
}

function RegionTierCard({ row, countries, assignedMap, onAdd, onRemove }: RegionTierCardProps) {
  return (
    <div className="rounded-2xl border border-[#c5c0b1] bg-[#fffdf9] p-4 transition-colors hover:bg-[#fffefb]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", row.dot)} />
          <span className="text-sm font-semibold text-[#201515]">{row.label}</span>
          <span className="rounded-full bg-[#eceae3] px-2 py-0.5 text-[10px] text-[#939084]">
            {countries.length} 国
          </span>
        </div>
        <span className="hidden text-[10.5px] text-[#939084] md:inline">{row.hint}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {countries.map((c) => {
          const meta = CPM_COUNTRY_DICT.find((x) => x.name === c);
          return (
            <span
              key={c}
              className="group inline-flex items-center gap-1 rounded-full border border-[#c5c0b1] bg-[#fffefb] py-1 pr-1 pl-2.5 text-[11px] text-[#36342e] transition-colors hover:border-[#ff4f00]/30 hover:text-[#201515]"
            >
              <span aria-hidden>{meta?.flag ?? "🏳️"}</span>
              <span>{c}</span>
              <button
                type="button"
                onClick={() => onRemove(c)}
                aria-label={`移除 ${c}`}
                className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[#939084] transition-colors hover:bg-[#ff4f00]/10 hover:text-[#ff4f00]"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          );
        })}
        <AddCountryButton currentTier={row.tier} assignedMap={assignedMap} onPick={onAdd} />
      </div>
    </div>
  );
}
