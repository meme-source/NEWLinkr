"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Check,
  ChevronDown,
  Clock3,
  MessageCircle,
  Pencil,
  Play,
  Radio,
  ThumbsUp,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  COUNTRY_OPTIONS,
  CURRENCY_OPTIONS,
  CURRENCY_SYMBOLS,
  REGION_TIER_OPTIONS,
} from "@/features/plugin/data/countries";
import type {
  CreatorProfile,
  HoverMetricKey,
  InlineDataKey,
  MetricAggregation,
  RegionTierKey,
  SocialPlatformKey,
} from "@/features/plugin/types";
import type { TiktokVideoCategory } from "@/features/plugin/components/tiktok-video-tile/types";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_HOVER_METRIC_MODES,
  HOVER_CARD_MAX_METRICS,
  SIDEBAR_CARD_RADIUS,
  SOCIAL_PLATFORM_OPTIONS,
  formatComments,
  formatLikes,
  getCountryFlag,
  getCreatorMetricSnapshot,
  getRegionTierForCountry,
  getRegionTierLabel,
  getSuggestedCpmUsd,
  inferCountryFromLocale,
  parseCpmAmount,
  parseMetricToNumber,
} from "./shared";
import { SocialPlatformLogo } from "./SocialPlatformLogo";
import { QuickDataDisplayCard } from "./QuickDataDisplayCard";

export function QuickSettingsPanel({
  creator,
  location,
  creatorMetrics,
  dataCheckOn,
  onToggleDataCheck,
  scrapeCount,
  onChangeScrapeCount,
  inlineDataKeys,
  onChangeInlineDataKeys,
  selectedPlatform,
  onChangePlatform,
  selectedHoverMetricKeys,
  onChangeHoverMetricKeys,
  hoverMetricModes,
  onChangeHoverMetricModes,
  onRecordQuickSettingsChange,
  pluginStatus,
  onTogglePluginStatus,
  enabledBadgeCategories,
  onToggleBadgeCategory,
}: {
  creator: CreatorProfile;
  location: { country: string; flag: string };
  creatorMetrics: ReturnType<typeof getCreatorMetricSnapshot>;
  dataCheckOn: boolean;
  onToggleDataCheck: () => void;
  scrapeCount: number;
  onChangeScrapeCount: (n: number) => void;
  inlineDataKeys: InlineDataKey[];
  onChangeInlineDataKeys: (keys: InlineDataKey[]) => void;
  selectedPlatform: SocialPlatformKey;
  onChangePlatform: (platform: SocialPlatformKey) => void;
  selectedHoverMetricKeys: HoverMetricKey[];
  onChangeHoverMetricKeys: (keys: HoverMetricKey[]) => void;
  hoverMetricModes: Record<HoverMetricKey, MetricAggregation>;
  onChangeHoverMetricModes: (modes: Record<HoverMetricKey, MetricAggregation>) => void;
  onRecordQuickSettingsChange: (message: string) => void;
  pluginStatus: "working" | "idle";
  onTogglePluginStatus: () => void;
  enabledBadgeCategories: ReadonlySet<TiktokVideoCategory>;
  onToggleBadgeCategory: (category: TiktokVideoCategory) => void;
}) {
  const [selectedCountry, setSelectedCountry] = useState(location.country);
  const [regionTier, setRegionTier] = useState<RegionTierKey>(
    getRegionTierForCountry(location.country),
  );
  const [cpmAmount, setCpmAmount] = useState(parseCpmAmount(creatorMetrics.cpm));
  const [currencyUnit, setCurrencyUnit] = useState<(typeof CURRENCY_OPTIONS)[number]>("USD");
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [draftPlatform, setDraftPlatform] = useState<SocialPlatformKey>(selectedPlatform);
  const [draftCountry, setDraftCountry] = useState(location.country);
  const [draftRegionTier, setDraftRegionTier] = useState<RegionTierKey>(
    getRegionTierForCountry(location.country),
  );
  const [draftCpmAmount, setDraftCpmAmount] = useState(parseCpmAmount(creatorMetrics.cpm));
  const [draftCurrencyUnit, setDraftCurrencyUnit] =
    useState<(typeof CURRENCY_OPTIONS)[number]>("USD");

  useEffect(() => {
    const browserCountry =
      typeof window !== "undefined"
        ? inferCountryFromLocale(window.navigator.languages?.[0] ?? window.navigator.language)
        : null;
    const nextCountry = browserCountry ?? location.country;
    const nextTier = getRegionTierForCountry(nextCountry);
    setSelectedCountry(nextCountry);
    setRegionTier(nextTier);
    setCurrencyUnit("USD");
    setCpmAmount(getSuggestedCpmUsd(nextCountry, nextTier));
  }, [creator.id, location.country]);

  const currencySymbol = CURRENCY_SYMBOLS[currencyUnit];
  const draftCurrencySymbol = CURRENCY_SYMBOLS[draftCurrencyUnit];
  const draftCountryFlag = getCountryFlag(draftCountry);
  const quotaPlanName = "专业版";
  const quotaRenewDate = "2026-06-12";
  const quotaTotal = 1200;
  const quotaUsed = 376;
  const quotaRemaining = quotaTotal - quotaUsed;
  const quotaUsedPct = Math.round((quotaUsed / quotaTotal) * 100);

  const setDraftCountryWithTier = (value: string) => {
    const nextTier = getRegionTierForCountry(value);
    setDraftCountry(value);
    setDraftRegionTier(nextTier);
    setDraftCurrencyUnit("USD");
    setDraftCpmAmount(getSuggestedCpmUsd(value, nextTier));
  };

  const hasSettingsChanged =
    draftPlatform !== selectedPlatform ||
    draftCountry !== selectedCountry ||
    draftRegionTier !== regionTier ||
    draftCpmAmount !== cpmAmount ||
    draftCurrencyUnit !== currencyUnit;

  const beginEditSettings = () => {
    setDraftPlatform(selectedPlatform);
    setDraftCountry(selectedCountry);
    setDraftRegionTier(regionTier);
    setDraftCpmAmount(cpmAmount);
    setDraftCurrencyUnit(currencyUnit);
    setIsEditingSettings(true);
  };

  const saveSettingsEdit = () => {
    if (hasSettingsChanged) {
      const confirmed = window.confirm("已修改设置，点击确定后保存本次修改。");
      if (!confirmed) {
        return;
      }
    }
    setSelectedCountry(draftCountry);
    setRegionTier(draftRegionTier);
    setCpmAmount(draftCpmAmount);
    setCurrencyUnit(draftCurrencyUnit);
    onChangePlatform(draftPlatform);
    setIsEditingSettings(false);
    if (hasSettingsChanged) {
      const summary = `已记录预览设置修改：${SOCIAL_PLATFORM_OPTIONS.find((item) => item.key === draftPlatform)?.label ?? "TikTok"} · ${draftCountry} · ${getRegionTierLabel(draftRegionTier)} · CPM ${CURRENCY_SYMBOLS[draftCurrencyUnit]}${draftCpmAmount || "0"}`;
      onRecordQuickSettingsChange(summary);
    }
  };

  const [hoverLimitToast, setHoverLimitToast] = useState(false);
  const hoverLimitToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showHoverLimitToast = () => {
    if (hoverLimitToastTimerRef.current) {
      clearTimeout(hoverLimitToastTimerRef.current);
    }
    setHoverLimitToast(true);
    hoverLimitToastTimerRef.current = setTimeout(() => {
      setHoverLimitToast(false);
    }, 2200);
  };

  const toggleHoverMetric = (key: HoverMetricKey) => {
    onChangeHoverMetricKeys(
      (() => {
        const current = selectedHoverMetricKeys;
        if (current.includes(key)) return current.filter((item) => item !== key);
        if (current.length >= HOVER_CARD_MAX_METRICS) {
          showHoverLimitToast();
          return current;
        }
        return [...current, key];
      })(),
    );
  };

  const toggleInlineDataKey = (key: InlineDataKey) => {
    onChangeInlineDataKeys(
      inlineDataKeys.includes(key)
        ? inlineDataKeys.filter((item) => item !== key)
        : [...inlineDataKeys, key],
    );
  };

  const setMetricMode = (key: HoverMetricKey, mode: MetricAggregation) => {
    onChangeHoverMetricModes({ ...hoverMetricModes, [key]: mode });
  };

  const resolvedHoverMetricModes: Record<HoverMetricKey, MetricAggregation> = {
    ...DEFAULT_HOVER_METRIC_MODES,
    ...hoverMetricModes,
  };

  const averageLikes = formatLikes(parseMetricToNumber(creator.likes) * 1.08);
  const averageComments = formatComments(parseMetricToNumber(creatorMetrics.medianComments) * 1.16);
  const hoverMetricOptions: Array<{
    key: HoverMetricKey;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    modeLabels?: [string, string];
  }> = [
    {
      key: "rate",
      icon: DollarSign,
      label: "预估价格",
      value: `${currencySymbol}${cpmAmount || "0"} CPM`,
    },
    {
      key: "plays",
      icon: Play,
      label: `${resolvedHoverMetricModes.plays === "median" ? "中位" : "平均"}观看量`,
      value:
        resolvedHoverMetricModes.plays === "median"
          ? creatorMetrics.medianPlays
          : creatorMetrics.averagePlays,
      modeLabels: ["中位", "平均"],
    },
    {
      key: "likes",
      icon: ThumbsUp,
      label: `${resolvedHoverMetricModes.likes === "median" ? "中位" : "平均"}点赞量`,
      value:
        resolvedHoverMetricModes.likes === "median" ? creatorMetrics.medianLikes : averageLikes,
      modeLabels: ["中位", "平均"],
    },
    {
      key: "comments",
      icon: MessageCircle,
      label: `${resolvedHoverMetricModes.comments === "median" ? "中位" : "平均"}评论量`,
      value:
        resolvedHoverMetricModes.comments === "median"
          ? creatorMetrics.medianComments
          : averageComments,
      modeLabels: ["中位", "平均"],
    },
    {
      key: "engagementOrViews",
      icon: Activity,
      label: "互动率",
      value: creatorMetrics.engagementRate,
    },
  ];

  const inlineDataOptions: Array<{
    key: InlineDataKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { key: "plays", label: "播放", icon: Play },
    { key: "likes", label: "点赞", icon: ThumbsUp },
    { key: "comments", label: "评论", icon: MessageCircle },
    { key: "engagement", label: "互动率", icon: Activity },
    { key: "publishedAt", label: "发布时间", icon: Clock3 },
  ];

  return (
    <div className="space-y-3">
      <div
        className={`${SIDEBAR_CARD_RADIUS} overflow-hidden border border-[#c5c0b1] bg-[#fffefb]`}
      >
        <div className="flex items-center justify-between border-b border-[#eceae3] px-3 py-2">
          <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#201515]">
            <Radio className="h-4 w-4 text-[#ff4f00]" />
            社媒与 CPM
          </div>
          <Button
            unstyled
            type="button"
            onClick={isEditingSettings ? saveSettingsEdit : beginEditSettings}
            aria-label={isEditingSettings ? "确认保存设置" : "编辑设置"}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#c5c0b1] bg-[#fffefb] text-[#36342e] transition-colors hover:border-[#c5c0b1] hover:text-[#201515]"
          >
            {isEditingSettings ? (
              <Check className="h-3.5 w-3.5 text-[#ff4f00]" />
            ) : (
              <Pencil className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>

        <div className="space-y-2.5 px-3 py-2.5">
          <div>
            <div className="mb-1 text-xs font-medium text-zinc-500">社媒识别</div>
            <div className="relative">
              <select
                value={draftPlatform}
                onChange={(event) => setDraftPlatform(event.target.value as SocialPlatformKey)}
                disabled={!isEditingSettings}
                className={cn(
                  "h-8 w-full appearance-none rounded-[8px] border border-[#c5c0b1] bg-[#fffdf9] px-3 pr-8 pl-9 text-sm font-semibold text-[#201515] transition-colors outline-none focus:border-[#ff4f00]/35",
                  !isEditingSettings && "cursor-not-allowed opacity-60",
                )}
              >
                {SOCIAL_PLATFORM_OPTIONS.map((item) => (
                  <option key={item.key} value={item.key} className="bg-[#fffefb] text-[#201515]">
                    {item.label}
                  </option>
                ))}
              </select>
              <SocialPlatformLogo
                platform={draftPlatform}
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
              />
              <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 text-[#939084]" />
            </div>
          </div>

          <div className="grid grid-cols-[1.05fr_0.95fr] gap-2">
            <div>
              <div className="mb-1 text-xs font-medium text-zinc-500">国家与地区</div>
              <div className="relative">
                <select
                  value={draftCountry}
                  onChange={(event) => setDraftCountryWithTier(event.target.value)}
                  disabled={!isEditingSettings}
                  className={cn(
                    "h-8 w-full appearance-none rounded-[8px] border border-[#c5c0b1] bg-[#fffdf9] px-3 pr-8 pl-9 text-sm text-[#201515] transition-colors outline-none focus:border-[#ff4f00]/35",
                    !isEditingSettings && "cursor-not-allowed opacity-60",
                  )}
                >
                  {COUNTRY_OPTIONS.map((item) => (
                    <option
                      key={item.name}
                      value={item.name}
                      className="bg-[#fffefb] text-[#201515]"
                    >
                      {item.name}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                  {draftCountryFlag}
                </span>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 text-[#939084]" />
              </div>
            </div>

            <div>
              <div className="mb-1 text-xs font-medium text-zinc-500">地区</div>
              <div className="relative">
                <select
                  value={draftRegionTier}
                  onChange={(event) => {
                    const nextTier = event.target.value as RegionTierKey;
                    setDraftRegionTier(nextTier);
                    setDraftCurrencyUnit("USD");
                    setDraftCpmAmount(getSuggestedCpmUsd(draftCountry, nextTier));
                  }}
                  disabled={!isEditingSettings}
                  className={cn(
                    "h-8 w-full appearance-none rounded-[8px] border border-[#c5c0b1] bg-[#fffdf9] px-3 pr-8 text-sm text-[#201515] transition-colors outline-none focus:border-[#ff4f00]/35",
                    !isEditingSettings && "cursor-not-allowed opacity-60",
                  )}
                >
                  {REGION_TIER_OPTIONS.map((item) => (
                    <option key={item.key} value={item.key} className="bg-[#fffefb] text-[#201515]">
                      {item.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 text-[#939084]" />
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1 text-xs font-medium text-zinc-500">CPM 设定</div>
            <div className="grid grid-cols-[1fr_92px] gap-2">
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-semibold text-[#939084]">
                  {draftCurrencySymbol}
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={draftCpmAmount}
                  onChange={(event) => setDraftCpmAmount(event.target.value)}
                  disabled={!isEditingSettings}
                  className={cn(
                    "h-8 w-full rounded-[8px] border border-[#c5c0b1] bg-[#fffdf9] px-3 pl-7 text-sm font-semibold text-[#201515] transition-colors outline-none focus:border-[#ff4f00]/35",
                    !isEditingSettings && "cursor-not-allowed opacity-60",
                  )}
                />
              </div>
              <div className="relative">
                <select
                  value={draftCurrencyUnit}
                  onChange={(event) =>
                    setDraftCurrencyUnit(event.target.value as (typeof CURRENCY_OPTIONS)[number])
                  }
                  disabled={!isEditingSettings}
                  className={cn(
                    "h-8 w-full appearance-none rounded-[8px] border border-[#c5c0b1] bg-[#fffdf9] px-3 pr-7 text-sm font-semibold text-[#201515] transition-colors outline-none focus:border-[#ff4f00]/35",
                    !isEditingSettings && "cursor-not-allowed opacity-60",
                  )}
                >
                  {CURRENCY_OPTIONS.map((item) => (
                    <option key={item} value={item} className="bg-[#fffefb] text-[#201515]">
                      {item}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-[#939084]" />
              </div>
            </div>
            <div className="mt-1.5 inline-flex rounded-[8px] bg-[#eceae3] px-2 py-1 text-[11px] font-medium text-[#939084]">
              {draftCountryFlag} {draftCountry || "未指定"} · {getRegionTierLabel(draftRegionTier)}{" "}
              · CPM {CURRENCY_SYMBOLS[draftCurrencyUnit]}
              {draftCpmAmount || "0"}
            </div>
          </div>
        </div>
      </div>

      <QuickDataDisplayCard
        hoverLimitToast={hoverLimitToast}
        hoverMetricOptions={hoverMetricOptions}
        selectedHoverMetricKeys={selectedHoverMetricKeys}
        toggleHoverMetric={toggleHoverMetric}
        resolvedHoverMetricModes={resolvedHoverMetricModes}
        setMetricMode={setMetricMode}
        dataCheckOn={dataCheckOn}
        onToggleDataCheck={onToggleDataCheck}
        scrapeCount={scrapeCount}
        onChangeScrapeCount={onChangeScrapeCount}
        inlineDataKeys={inlineDataKeys}
        toggleInlineDataKey={toggleInlineDataKey}
        inlineDataOptions={inlineDataOptions}
        enabledBadgeCategories={enabledBadgeCategories}
        toggleBadgeCategory={onToggleBadgeCategory}
      />

      <div
        className={`${SIDEBAR_CARD_RADIUS} overflow-hidden border border-[#c5c0b1] bg-[#fffefb]`}
      >
        <div className="flex items-center justify-between border-b border-[#eceae3] px-3 py-2">
          <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#201515]">
            <Activity className="h-4 w-4 text-[#ff4f00]" />
            额度与状态
          </div>
          <Button
            unstyled
            type="button"
            onClick={onTogglePluginStatus}
            className={cn(
              "inline-flex items-center gap-1 rounded-[8px] px-2 py-1 text-[11px] font-semibold transition-colors",
              pluginStatus === "working"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-[#eceae3] text-[#939084]",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                pluginStatus === "working" ? "bg-emerald-500" : "bg-[#939084]",
              )}
            />
            {pluginStatus === "working" ? "工作中" : "闲置"}
          </Button>
        </div>

        <div className="space-y-2 px-3 py-2.5">
          <div className="flex items-baseline justify-between">
            <div className="text-[13px] font-semibold text-[#201515]">
              已用 {quotaUsed}
              <span className="ml-0.5 text-[11px] font-medium text-[#939084]">
                / 总额度 {quotaTotal} 次
              </span>
            </div>
            <div className="text-[11px] font-semibold text-[#2f9e7e]">剩余 {quotaRemaining} 次</div>
          </div>
          <div
            role="img"
            aria-label={`已用 ${quotaUsed} 次，共 ${quotaTotal} 次`}
            className="h-2 w-full overflow-hidden rounded-full bg-[#eceae3]"
          >
            <div
              className="h-full rounded-full bg-[#ff4f00]"
              style={{ width: `${quotaUsedPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#939084]">
            <span className="font-medium text-[#36342e]">{quotaPlanName}</span>
            <span>有效期至 {quotaRenewDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
