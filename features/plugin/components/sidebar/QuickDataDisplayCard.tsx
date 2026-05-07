"use client";

import { BarChart3, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HoverMetricKey, InlineDataKey, MetricAggregation } from "@/features/plugin/types";
import { SCRAPE_COUNT_OPTIONS, SIDEBAR_CARD_RADIUS } from "./shared";

export function QuickDataDisplayCard({
  hoverLimitToast,
  hoverMetricOptions,
  selectedHoverMetricKeys,
  toggleHoverMetric,
  resolvedHoverMetricModes,
  setMetricMode,
  dataCheckOn,
  onToggleDataCheck,
  scrapeCount,
  onChangeScrapeCount,
  inlineDataKeys,
  toggleInlineDataKey,
  inlineDataOptions,
}: {
  hoverLimitToast: boolean;
  hoverMetricOptions: Array<{
    key: HoverMetricKey;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    modeLabels?: [string, string];
  }>;
  selectedHoverMetricKeys: HoverMetricKey[];
  toggleHoverMetric: (key: HoverMetricKey) => void;
  resolvedHoverMetricModes: Record<HoverMetricKey, MetricAggregation>;
  setMetricMode: (key: HoverMetricKey, mode: MetricAggregation) => void;
  dataCheckOn: boolean;
  onToggleDataCheck: () => void;
  scrapeCount: number;
  onChangeScrapeCount: (n: number) => void;
  inlineDataKeys: InlineDataKey[];
  toggleInlineDataKey: (key: InlineDataKey) => void;
  inlineDataOptions: Array<{
    key: InlineDataKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
}) {
  return (
    <div
      className={`${SIDEBAR_CARD_RADIUS} relative overflow-hidden border border-[#c5c0b1] bg-[#fffefb]`}
    >
      <div
        aria-live="polite"
        className={cn(
          "pointer-events-none absolute inset-x-3 top-[42px] z-30 flex justify-center transition-all duration-200",
          hoverLimitToast ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0",
        )}
      >
        <span className="rounded-[14px] bg-[#201515] px-3.5 py-2 text-[12px] leading-[1.45] font-medium text-[#fffefb]">
          请关闭一个选项
        </span>
      </div>

      <div className="flex items-center justify-between border-b border-[#eceae3] px-3 py-2.5">
        <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#201515]">
          <BarChart3 className="h-4 w-4 text-[#ff4f00]" />
          数据显示
        </div>
        <span className="rounded-full bg-[#eceae3] px-2 py-1 text-[11px] font-semibold text-[#939084]">
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
                    active ? "border-[#b5b2aa] bg-[#fffefb]" : "border-[#c5c0b1] bg-[#fffdf9]",
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
                        active ? "bg-[#ff4f00]" : "bg-[#b5b2aa]",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-[#fffefb] transition-transform",
                          active && "translate-x-4",
                        )}
                      />
                    </button>
                    <Icon
                      className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        active ? "text-[#ff4f00]" : "text-[#939084]",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold text-[#201515]">
                        {item.label}
                      </div>
                      <div className="mt-0.5 text-[11px] text-[#939084]">{item.value}</div>
                    </div>
                    {item.modeLabels ? (
                      <div className="inline-flex rounded-full border border-[#c5c0b1] bg-[#fffefb] p-0.5">
                        {(["median", "average"] as MetricAggregation[]).map((mode, index) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setMetricMode(item.key, mode)}
                            className={cn(
                              "h-6 rounded-full px-2 text-[10.5px] font-semibold transition-colors",
                              resolvedHoverMetricModes[item.key] === mode
                                ? "bg-[#201515] text-[#fffefb]"
                                : "text-[#939084] hover:text-[#36342e]",
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

        <div className="rounded-[18px] border border-[#c5c0b1] bg-[#fffdf9] p-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-medium text-zinc-500">社媒内嵌数据</div>
            <div className="inline-flex items-center gap-1 text-[11px] font-medium text-[#939084]">
              <span>数据透视</span>
              <button
                type="button"
                role="switch"
                aria-checked={dataCheckOn}
                aria-label="数据透视开关"
                onClick={onToggleDataCheck}
                className={cn(
                  "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                  dataCheckOn ? "bg-[#ff4f00]" : "bg-[#b5b2aa]",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-[#fffefb] transition-transform",
                    dataCheckOn && "translate-x-4",
                  )}
                />
              </button>
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
                    ? "border-[#ff4f00]/35 bg-[#fff7f4] text-[#ff4f00]"
                    : "border-[#c5c0b1] bg-[#fffefb] text-[#939084] hover:text-[#36342e]",
                )}
              >
                最近 {option} 条
              </button>
            ))}
          </div>

          <div className="my-2.5 h-px bg-[#c5c0b1]" />

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
                      ? "border-[#b5b2aa] bg-[#fffefb] text-[#201515]"
                      : "border-[#c5c0b1] bg-[#eceae3] text-[#939084]",
                  )}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Icon
                      className={cn("h-3.5 w-3.5", active ? "text-[#ff4f00]" : "text-[#939084]")}
                    />
                    {item.label}
                  </span>
                  {active ? <Check className="h-3.5 w-3.5 text-[#ff4f00]" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
