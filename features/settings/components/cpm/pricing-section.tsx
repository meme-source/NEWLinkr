"use client";

import { Info } from "lucide-react";

import { CurrencySelect } from "@/features/settings/components/cpm/currency-select";
import {
  PLATFORMS,
  REGION_ROWS,
  type Platform,
  type PlatformCfg,
} from "@/features/settings/components/cpm/types";
import type { CpmCurrency, CpmTier } from "@/features/settings/data/cpm-countries";
import { cn } from "@/lib/utils";

interface PricingSectionProps {
  currency: CpmCurrency;
  symbol: string;
  onCurrencyChange: (c: CpmCurrency) => void;
  prices: Record<Platform, Record<CpmTier, number>>;
  onPriceChange: (platform: Platform, tier: CpmTier, value: number) => void;
}

export function PricingSection({
  currency,
  symbol,
  onCurrencyChange,
  prices,
  onPriceChange,
}: PricingSectionProps) {
  return (
    <section
      className="relative overflow-hidden rounded-lg border border-[#c5c0b1] p-6 ring-1 ring-white/70 ring-inset"
      style={{
        backgroundImage: "linear-gradient(135deg, #fffdf9 0%, #fffdf9 60%, #f5f2ea 100%)",
      }}
    >
      <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-[#ff4f00]/10 blur-3xl" />

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#fffefb] px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.12em] text-[#ff4f00] uppercase ring-1 ring-[#ff4f00]/25 ring-inset">
              CPM
            </span>
            <h3 className="text-sm font-semibold text-[#201515]">价格设置</h3>
          </div>
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-[#36342e]">
            <Info className="h-3 w-3 text-[#ff4f00]" />
            <span>同一个国家不能同时归入多个分类。修改下方「地区分类管理」时会自动同步迁移。</span>
          </p>
        </div>
        <CurrencySelect value={currency} onChange={onCurrencyChange} />
      </div>

      <div className="relative mt-5 grid gap-4 md:grid-cols-3">
        {PLATFORMS.map((p) => (
          <PlatformPriceCard
            key={p.key}
            platform={p}
            symbol={symbol}
            tierPrices={prices[p.key]}
            onChange={(tier, val) => onPriceChange(p.key, tier, val)}
          />
        ))}
      </div>
    </section>
  );
}

interface PlatformPriceCardProps {
  platform: PlatformCfg;
  symbol: string;
  tierPrices: Record<CpmTier, number>;
  onChange: (tier: CpmTier, value: number) => void;
}

function PlatformPriceCard({ platform, symbol, tierPrices, onChange }: PlatformPriceCardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border bg-[#fffefb] shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_1px_2px_rgba(32,21,21,0.04)]",
        platform.enabled ? "border-[#c5c0b1]" : "border-dashed border-[#c5c0b1] opacity-75",
      )}
    >
      <div className={cn("h-1.5", platform.ribbon)} />
      <div className="px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[#201515]">{platform.label}</div>
            <div className="mt-0.5 truncate text-[10.5px] text-[#939084]">{platform.blurb}</div>
          </div>
          {!platform.enabled ? (
            <span className="shrink-0 rounded-full bg-[#eceae3] px-2 py-0.5 text-[10px] text-[#939084]">
              即将开放
            </span>
          ) : null}
        </div>
        <div className="mt-4 space-y-3">
          {REGION_ROWS.map((r) => (
            <div key={r.tier}>
              <div className="mb-1 flex items-center gap-1.5 text-[11px] text-[#36342e]">
                <span className={cn("h-1.5 w-1.5 rounded-full", r.dot)} />
                <span>{r.label}</span>
              </div>
              <div
                className={cn(
                  "flex items-center gap-1 rounded-lg border bg-[#fffdf9] px-2 py-1.5 transition-colors",
                  platform.enabled
                    ? "border-[#c5c0b1] focus-within:border-[#ff4f00]/50 focus-within:bg-[#fffefb]"
                    : "border-[#c5c0b1]/60",
                )}
              >
                <span className="text-[12px] text-[#939084]">{symbol}</span>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={tierPrices[r.tier]}
                  onChange={(e) => onChange(r.tier, Number(e.target.value))}
                  disabled={!platform.enabled}
                  className={cn(
                    "w-full bg-transparent text-sm font-medium text-[#201515] tabular-nums focus:outline-none",
                    !platform.enabled && "cursor-not-allowed text-[#939084]",
                  )}
                />
                <span className="text-[10px] text-[#939084]">/ CPM</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
