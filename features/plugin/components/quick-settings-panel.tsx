"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { Activity, BarChart3, Check, ChevronDown, Clock3, DollarSign, MessageCircle, Pencil, Play, ThumbsUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { SocialPlatformLogo } from "@/features/plugin/components/social-platform-logo";
import { formatComments, formatLikes, parseMetricToNumber } from "@/features/plugin/lib/synthetic";
import { getSuggestedCpmUsd, parseCpmAmount } from "@/features/plugin/lib/format";
import {
  getCountryFlag,
  getRegionTierForCountry,
  getRegionTierLabel,
  inferCountryFromLocale,
  type getCreatorMetricSnapshot,
} from "@/features/plugin/lib/creator-helpers";
import {
  COUNTRY_OPTIONS,
  CURRENCY_OPTIONS,
  CURRENCY_SYMBOLS,
  REGION_TIER_OPTIONS,
} from "@/features/plugin/data/countries";
import { SIDEBAR_CARD_RADIUS } from "@/features/plugin/lib/style-constants";
import {
  DEFAULT_HOVER_METRIC_MODES,
  HOVER_CARD_MAX_METRICS,
  SCRAPE_COUNT_OPTIONS,
  SOCIAL_PLATFORM_OPTIONS,
} from "@/features/plugin/data/sidebar-config";
import type {
  CreatorProfile,
  HoverMetricKey,
  InlineDataKey,
  MetricAggregation,
  RegionTierKey,
  SocialPlatformKey,
} from "@/features/plugin/types";

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
  playMedianMultiple,
  onChangePlayMedianMultiple,
  selectedPlatform,
  onChangePlatform,
  selectedHoverMetricKeys,
  onChangeHoverMetricKeys,
  hoverMetricModes,
  onChangeHoverMetricModes,
  onRecordQuickSettingsChange,
  pluginStatus,
  onTogglePluginStatus,
  onOpenWeb,
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
  playMedianMultiple: number;
  onChangePlayMedianMultiple: (value: number) => void;
  selectedPlatform: SocialPlatformKey;
  onChangePlatform: (platform: SocialPlatformKey) => void;
  selectedHoverMetricKeys: HoverMetricKey[];
  onChangeHoverMetricKeys: (keys: HoverMetricKey[]) => void;
  hoverMetricModes: Record<HoverMetricKey, MetricAggregation>;
  onChangeHoverMetricModes: (modes: Record<HoverMetricKey, MetricAggregation>) => void;
  onRecordQuickSettingsChange: (message: string) => void;
  pluginStatus: "working" | "idle";
  onTogglePluginStatus: () => void;
  onOpenWeb: () => void;
}) {
  const [selectedCountry, setSelectedCountry] = useState(location.country);
  const [regionTier, setRegionTier] = useState<RegionTierKey>(getRegionTierForCountry(location.country));
  const [cpmAmount, setCpmAmount] = useState(parseCpmAmount(creatorMetrics.cpm));
  const [currencyUnit, setCurrencyUnit] = useState<(typeof CURRENCY_OPTIONS)[number]>("USD");
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [draftPlatform, setDraftPlatform] = useState<SocialPlatformKey>(selectedPlatform);
  const [draftCountry, setDraftCountry] = useState(location.country);
  const [draftRegionTier, setDraftRegionTier] = useState<RegionTierKey>(getRegionTierForCountry(location.country));
  const [draftCpmAmount, setDraftCpmAmount] = useState(parseCpmAmount(creatorMetrics.cpm));
  const [draftCurrencyUnit, setDraftCurrencyUnit] = useState<(typeof CURRENCY_OPTIONS)[number]>("USD");

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
  const selectedCountryFlag = getCountryFlag(selectedCountry);
  const draftCountryFlag = getCountryFlag(draftCountry);
  const quotaTotal = 1200;
  const quotaUsed = 376;
  const quotaRemaining = quotaTotal - quotaUsed;
  const quotaRemainingPct = Math.round((quotaRemaining / quotaTotal) * 100);

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
    onChangeHoverMetricKeys((() => {
      const current = selectedHoverMetricKeys;
      if (current.includes(key)) {
        return current.filter((item) => item !== key);
      }
      if (current.length >= HOVER_CARD_MAX_METRICS) {
        showHoverLimitToast();
        return current;
      }
      return [...current, key];
    })());
  };

  const toggleInlineDataKey = (key: InlineDataKey) => {
    onChangeInlineDataKeys(
      inlineDataKeys.includes(key)
        ? inlineDataKeys.filter((item) => item !== key)
        : [...inlineDataKeys, key]
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
    icon: ComponentType<{ className?: string }>;
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
      value: resolvedHoverMetricModes.plays === "median" ? creatorMetrics.medianPlays : creatorMetrics.averagePlays,
      modeLabels: ["中位", "平均"],
    },
    {
      key: "likes",
      icon: ThumbsUp,
      label: `${resolvedHoverMetricModes.likes === "median" ? "中位" : "平均"}点赞量`,
      value: resolvedHoverMetricModes.likes === "median" ? creatorMetrics.medianLikes : averageLikes,
      modeLabels: ["中位", "平均"],
    },
    {
      key: "comments",
      icon: MessageCircle,
      label: `${resolvedHoverMetricModes.comments === "median" ? "中位" : "平均"}评论量`,
      value: resolvedHoverMetricModes.comments === "median" ? creatorMetrics.medianComments : averageComments,
      modeLabels: ["中位", "平均"],
    },
    {
      key: "engagementOrViews",
      icon: Activity,
      label: "互动率",
      value: creatorMetrics.engagementRate,
    },
  ];

  const inlineDataOptions: Array<{ key: InlineDataKey; label: string; icon: ComponentType<{ className?: string }> }> = [
    { key: "plays", label: "播放", icon: Play },
    { key: "likes", label: "点赞", icon: ThumbsUp },
    { key: "comments", label: "评论", icon: MessageCircle },
    { key: "engagement", label: "互动率", icon: Activity },
    { key: "publishedAt", label: "发布时间", icon: Clock3 },
  ];

  return (
    <div className="space-y-3">
      <div className={`${SIDEBAR_CARD_RADIUS} overflow-hidden border border-[#e8e6dc] bg-white`}>
        <div className="flex items-center justify-between border-b border-[#efede6] px-3 py-2.5">
          <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#141413]">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#141413] text-[13px] font-semibold text-white">♪</span>
            社媒与 CPM
          </div>
          <button
            type="button"
            onClick={isEditingSettings ? saveSettingsEdit : beginEditSettings}
            aria-label={isEditingSettings ? "确认保存设置" : "编辑设置"}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#e8e6dc] bg-white text-[#6b6a64] transition-colors hover:border-[#d1cfc5] hover:text-[#141413]"
          >
            {isEditingSettings ? <Check className="h-3.5 w-3.5 text-[#c96442]" /> : <Pencil className="h-3.5 w-3.5" />}
          </button>
        </div>

        <div className="space-y-3 px-3 py-3">
          <div>
            <div className="mb-1.5 text-xs font-medium text-zinc-500">社媒识别</div>
            <div className="relative">
              <select
                value={draftPlatform}
                onChange={(event) => setDraftPlatform(event.target.value as SocialPlatformKey)}
                disabled={!isEditingSettings}
                className={cn(
                  "h-9 w-full appearance-none rounded-full border border-[#e8e6dc] bg-[#faf9f5] px-3 pl-9 pr-8 text-sm font-semibold text-[#141413] outline-none transition-colors focus:border-[#c96442]/35",
                  !isEditingSettings && "cursor-not-allowed opacity-60"
                )}
              >
                {SOCIAL_PLATFORM_OPTIONS.map((item) => (
                  <option key={item.key} value={item.key} className="bg-white text-[#141413]">
                    {item.label}
                  </option>
                ))}
              </select>
              <SocialPlatformLogo platform={draftPlatform} className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#87867f]" />
            </div>
          </div>

          <div className="grid grid-cols-[1.05fr_0.95fr] gap-2">
            <div>
              <div className="mb-1.5 text-xs font-medium text-zinc-500">国家与地区</div>
              <div className="relative">
                <select
                  value={draftCountry}
                  onChange={(event) => setDraftCountryWithTier(event.target.value)}
                  disabled={!isEditingSettings}
                  className={cn(
                    "h-9 w-full appearance-none rounded-full border border-[#e8e6dc] bg-[#faf9f5] px-3 pl-9 pr-8 text-sm text-[#141413] outline-none transition-colors focus:border-[#c96442]/35",
                    !isEditingSettings && "cursor-not-allowed opacity-60"
                  )}
                >
                  {COUNTRY_OPTIONS.map((item) => (
                    <option key={item.name} value={item.name} className="bg-white text-[#141413]">
                      {item.name}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm">
                  {draftCountryFlag}
                </span>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#87867f]" />
              </div>
            </div>

            <div>
              <div className="mb-1.5 text-xs font-medium text-zinc-500">地区</div>
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
                    "h-9 w-full appearance-none rounded-full border border-[#e8e6dc] bg-[#faf9f5] px-3 pr-8 text-sm text-[#141413] outline-none transition-colors focus:border-[#c96442]/35",
                    !isEditingSettings && "cursor-not-allowed opacity-60"
                  )}
                >
                  {REGION_TIER_OPTIONS.map((item) => (
                    <option key={item.key} value={item.key} className="bg-white text-[#141413]">
                      {item.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#87867f]" />
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-xs font-medium text-zinc-500">CPM 设定</div>
            <div className="grid grid-cols-[1fr_92px] gap-2">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#87867f]">
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
                    "h-9 w-full rounded-full border border-[#e8e6dc] bg-[#faf9f5] px-3 pl-7 text-sm font-semibold text-[#141413] outline-none transition-colors focus:border-[#c96442]/35",
                    !isEditingSettings && "cursor-not-allowed opacity-60"
                  )}
                />
              </div>
              <div className="relative">
                <select
                  value={draftCurrencyUnit}
                  onChange={(event) => setDraftCurrencyUnit(event.target.value as (typeof CURRENCY_OPTIONS)[number])}
                  disabled={!isEditingSettings}
                  className={cn(
                    "h-9 w-full appearance-none rounded-full border border-[#e8e6dc] bg-[#faf9f5] px-3 pr-7 text-sm font-semibold text-[#141413] outline-none transition-colors focus:border-[#c96442]/35",
                    !isEditingSettings && "cursor-not-allowed opacity-60"
                  )}
                >
                  {CURRENCY_OPTIONS.map((item) => (
                    <option key={item} value={item} className="bg-white text-[#141413]">
                      {item}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#87867f]" />
              </div>
            </div>
            <div className="mt-1.5 inline-flex rounded-full bg-[#f5f4ed] px-2 py-1 text-[11px] font-medium text-[#87867f]">
              {draftCountryFlag} {draftCountry || "未指定"} · {getRegionTierLabel(draftRegionTier)} · CPM {CURRENCY_SYMBOLS[draftCurrencyUnit]}{draftCpmAmount || "0"}
            </div>
          </div>
        </div>
      </div>

      <div className={`${SIDEBAR_CARD_RADIUS} relative overflow-hidden border border-[#e8e6dc] bg-white`}>
        {/* 超限 toast */}
        <div
          aria-live="polite"
          className={cn(
            "pointer-events-none absolute inset-x-3 top-[42px] z-30 flex justify-center transition-all duration-200",
            hoverLimitToast ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
          )}
        >
          <span className="rounded-[14px] bg-[#141413] px-3.5 py-2 text-[12px] font-medium leading-[1.45] text-white shadow-[0_8px_24px_-8px_rgba(20,20,19,0.45)]">
            请关闭一个选项
          </span>
        </div>

        <div className="flex items-center justify-between border-b border-[#efede6] px-3 py-2.5">
          <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#141413]">
            <BarChart3 className="h-4 w-4 text-[#c96442]" />
            数据显示
          </div>
          <span className="rounded-full bg-[#f5f4ed] px-2 py-1 text-[11px] font-semibold text-[#87867f]">
            悬浮卡 {selectedHoverMetricKeys.length}/{hoverMetricOptions.length}
          </span>
        </div>

        <div className="space-y-3 px-3 py-3">
          <div>
            <div className="mb-2 text-xs font-medium text-zinc-500">悬浮卡片显示</div>
            <div className="space-y-2">
              {hoverMetricOptions.map((item) => {
                const Icon = item.icon;
                const active = selectedHoverMetricKeys.includes(item.key);
                return (
                  <div
                    key={item.key}
                    className={cn(
                      "rounded-[16px] border px-2.5 py-2 transition-colors",
                      active ? "border-[#ead8cf] bg-[#fffaf7]" : "border-[#e8e6dc] bg-[#faf9f5]"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={active}
                        onClick={() => toggleHoverMetric(item.key)}
                        className={cn(
                          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                          active ? "bg-[#c96442]" : "bg-[#d8d4c8]"
                        )}
                      >
                        <span
                          className={cn(
                            "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                            active && "translate-x-4"
                          )}
                        />
                      </button>
                      <Icon className={cn("h-3.5 w-3.5 shrink-0", active ? "text-[#c96442]" : "text-[#9b9a93]")} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-[#141413]">{item.label}</div>
                        <div className="mt-0.5 text-[11px] text-[#87867f]">{item.value}</div>
                      </div>
                      {item.modeLabels ? (
                        <div className="inline-flex rounded-full border border-[#e8e6dc] bg-white p-0.5">
                          {(["median", "average"] as MetricAggregation[]).map((mode, index) => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => setMetricMode(item.key, mode)}
                              className={cn(
                                "h-6 rounded-full px-2 text-[10.5px] font-semibold transition-colors",
                                resolvedHoverMetricModes[item.key] === mode
                                  ? "bg-[#141413] text-white"
                                  : "text-[#87867f] hover:text-[#4d4c48]"
                              )}
                            >
                              {item.modeLabels?.[index]}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[18px] border border-[#e8e6dc] bg-[#faf9f5] p-2.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-xs font-medium text-zinc-500">社媒内嵌数据</div>
              <div className="inline-flex items-center gap-1 text-[11px] font-medium text-[#87867f]">
                <span>数据透视</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={dataCheckOn}
                  aria-label="数据透视开关"
                  onClick={onToggleDataCheck}
                  className={cn(
                    "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                    dataCheckOn ? "bg-[#c96442]" : "bg-[#d8d4c8]"
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                      dataCheckOn && "translate-x-4"
                    )}
                  />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {inlineDataOptions.map((item) => {
                const Icon = item.icon;
                const active = inlineDataKeys.includes(item.key);
                return (
                  <button
                    key={item.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleInlineDataKey(item.key)}
                    className={cn(
                      "flex h-9 items-center justify-between rounded-[14px] border px-2.5 text-xs font-semibold transition-all active:scale-[0.98]",
                      active
                        ? "border-[#ead8cf] bg-white text-[#141413]"
                        : "border-[#e4e1d7] bg-[#f0ece4] text-[#87867f]"
                    )}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Icon className={cn("h-3.5 w-3.5", active ? "text-[#c96442]" : "text-[#9b9a93]")} />
                      {item.label}
                    </span>
                    {active ? <Check className="h-3.5 w-3.5 text-[#c96442]" /> : null}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 rounded-[14px] border border-[#e8e6dc] bg-white px-2.5 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-zinc-500">播放中位数倍数</span>
                <span className="rounded-full bg-[#141413] px-2 py-0.5 text-[11px] font-semibold text-white">
                  {playMedianMultiple.toFixed(1)}X
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={playMedianMultiple}
                onChange={(event) => onChangePlayMedianMultiple(Number(event.target.value))}
                className="mt-2 w-full accent-[#c96442]"
              />
              <div className="mt-1 flex justify-between text-[10.5px] text-[#b0aea6]">
                <span>保守</span>
                <span>激进</span>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {SCRAPE_COUNT_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onChangeScrapeCount(option)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all active:scale-[0.98]",
                    scrapeCount === option
                      ? "border-[#c96442]/35 bg-[#fff7f1] text-[#c96442]"
                      : "border-[#e8e6dc] bg-white text-[#87867f] hover:text-[#4d4c48]"
                  )}
                >
                  最近 {option} 条
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={`${SIDEBAR_CARD_RADIUS} overflow-hidden border border-[#e8e6dc] bg-white`}>
        <div className="flex items-center justify-between border-b border-[#efede6] px-3 py-2.5">
          <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#141413]">
            <Activity className="h-4 w-4 text-[#c96442]" />
            额度与状态
          </div>
          <button
            type="button"
            onClick={onTogglePluginStatus}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold transition-colors",
              pluginStatus === "working"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-[#f0ece4] text-[#87867f]"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                pluginStatus === "working" ? "bg-emerald-500" : "bg-[#b0aea6]"
              )}
            />
            {pluginStatus === "working" ? "工作中" : "闲置"}
          </button>
        </div>

        <div className="px-3 py-3">
          <div className="flex items-center gap-3">
            <div
              className="relative h-[86px] w-[86px] shrink-0 rounded-full p-2"
              style={{
                background: `conic-gradient(#2f9e7e 0 ${quotaRemainingPct}%, #e8e6dc ${quotaRemainingPct}% 100%)`,
              }}
              aria-label={`剩余额度 ${quotaRemainingPct}%`}
            >
              <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white text-center">
                <div className="text-lg font-semibold leading-none text-[#141413]">{quotaRemainingPct}%</div>
                <div className="mt-1 text-[10px] text-[#87867f]">剩余</div>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-[#87867f]">剩余额度</span>
                <span className="font-semibold text-[#141413]">{quotaRemaining}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#e8e6dc]">
                <div
                  className="h-full rounded-full bg-[#2f9e7e]"
                  style={{ width: `${quotaRemainingPct}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                <span className="text-[#87867f]">已使用</span>
                <span className="font-semibold text-[#4d4c48]">{quotaUsed}</span>
              </div>
              <div className="mt-2 text-[11px] leading-5 text-[#87867f]">
                总额度 {quotaTotal}，有颜色部分代表剩余，无颜色部分代表已使用。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
