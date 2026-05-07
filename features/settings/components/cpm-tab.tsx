"use client";

import { useCallback, useMemo, useState } from "react";

import { PricingSection } from "@/features/settings/components/cpm/pricing-section";
import { RegionSection } from "@/features/settings/components/cpm/region-section";
import {
  DEFAULT_PRICES,
  type Platform,
  type TierCountries,
} from "@/features/settings/components/cpm/types";
import {
  CPM_CURRENCY_OPTIONS,
  DEFAULT_TIER_COUNTRIES,
  type CpmCurrency,
  type CpmTier,
} from "@/features/settings/data/cpm-countries";

// §3.6.3 CPM 设置 — 单页布局：报价矩阵在上，地区分类管理在下，
// 国家添加支持中文搜索补全（输入"土耳"→推荐"土耳其"）。
export function CpmTab() {
  const [currency, setCurrency] = useState<CpmCurrency>("USD");
  const [prices, setPrices] = useState<Record<Platform, Record<CpmTier, number>>>(DEFAULT_PRICES);
  const [tierCountries, setTierCountries] = useState<TierCountries>(DEFAULT_TIER_COUNTRIES);

  const updatePrice = useCallback((platform: Platform, tier: CpmTier, value: number) => {
    setPrices((prev) => ({
      ...prev,
      [platform]: { ...prev[platform], [tier]: value },
    }));
  }, []);

  const addCountry = useCallback((tier: CpmTier, country: string) => {
    setTierCountries((prev) => {
      const next: TierCountries = {
        developed: prev.developed.filter((c) => c !== country),
        developing: prev.developing.filter((c) => c !== country),
        underdeveloped: prev.underdeveloped.filter((c) => c !== country),
      };
      next[tier] = [...next[tier], country];
      return next;
    });
  }, []);

  const removeCountry = useCallback((tier: CpmTier, country: string) => {
    setTierCountries((prev) => ({
      ...prev,
      [tier]: prev[tier].filter((c) => c !== country),
    }));
  }, []);

  const symbol = useMemo(
    () => CPM_CURRENCY_OPTIONS.find((c) => c.code === currency)?.symbol ?? "$",
    [currency],
  );

  return (
    <div className="space-y-6">
      <p className="text-xs leading-relaxed text-[#939084]">
        博主来自哪个国家并不重要，真正决定报价的是他的受众主要在哪里。下方的报价矩阵与地区分类共同作用——分类决定每个国家落入哪一档，矩阵决定该档在不同平台的
        CPM。
      </p>

      <PricingSection
        currency={currency}
        symbol={symbol}
        onCurrencyChange={setCurrency}
        prices={prices}
        onPriceChange={updatePrice}
      />

      <RegionSection tierCountries={tierCountries} onAdd={addCountry} onRemove={removeCountry} />

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          className="rounded-xl border border-[#c5c0b1] bg-[#fffefb] px-4 py-2 text-sm text-[#36342e] transition-colors hover:bg-[#eceae3]"
        >
          重置为系统默认
        </button>
        <button
          type="button"
          className="rounded-xl bg-[#201515] px-5 py-2 text-sm font-medium text-[#fffefb] shadow-sm transition-colors hover:bg-[#36342e]"
        >
          保存
        </button>
      </div>
    </div>
  );
}
