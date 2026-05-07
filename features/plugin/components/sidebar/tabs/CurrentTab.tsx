"use client";

import {
  Activity,
  BarChart3,
  Check,
  ChevronDown,
  CircleHelp,
  DollarSign,
  ExternalLink,
  Hash,
  Lock,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  AudienceHighlight,
  CreatorProfile,
  CurrentDetailTab as CurrentDetailTabKey,
  SidebarTab,
} from "@/features/plugin/types";
import { SCRAPE_COUNT_OPTIONS, SIDEBAR_CARD_RADIUS, getCreatorReview } from "../shared";
import { SidebarCollapsibleSection, SidebarContentTabButton } from "../primitives";
import { SidebarCreatorProfileCard } from "../SidebarCreatorProfileCard";
import { SidebarMetricInline } from "../primitives";
import { TopicWordCloud } from "../TopicWordCloud";
import { AudienceHighlightBar } from "../primitives";

const AUDIENCE_UNLOCK_COST = 2;

type CurrentTabMetricItem = {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
};

export function CurrentTab({
  creator,
  email,
  location,
  creatorType,
  isSaved,
  onToggleSave,
  onOpenEmailSidebar,
  tags,
  onAddTag,
  onRemoveTag,
  currentDetailTab,
  onChangeCurrentDetailTab,
  coreMetricsOpen,
  onToggleCoreMetrics,
  scrapeCount,
  onChangeScrapeCount,
  metricsRangeMenuOpen,
  onToggleMetricsRangeMenu,
  creatorCpm,
  dataCheckOn,
  onToggleDataCheck,
  sidebarMetricItems,
  aiReviewOpen,
  onToggleAiReview,
  diagnostics,
  diagnosticsOpen,
  onToggleDiagnostics,
  topicsOpen,
  onToggleTopics,
  isAudienceUnlocked,
  audienceHighlights,
  onUnlockAudience,
  onOpenWorkspaceAudience,
  onSelectSidebarTab,
}: {
  creator: CreatorProfile;
  email: string;
  location: { flag: string; country: string };
  creatorType: string;
  isSaved: boolean;
  onToggleSave: () => void;
  onOpenEmailSidebar: () => void;
  tags: string[];
  onAddTag: (label: string) => void;
  onRemoveTag: (label: string) => void;
  currentDetailTab: CurrentDetailTabKey;
  onChangeCurrentDetailTab: (tab: CurrentDetailTabKey) => void;
  coreMetricsOpen: boolean;
  onToggleCoreMetrics: () => void;
  scrapeCount: number;
  onChangeScrapeCount: (n: number) => void;
  metricsRangeMenuOpen: boolean;
  onToggleMetricsRangeMenu: () => void;
  creatorCpm: string;
  dataCheckOn: boolean;
  onToggleDataCheck: () => void;
  sidebarMetricItems: CurrentTabMetricItem[];
  aiReviewOpen: boolean;
  onToggleAiReview: () => void;
  diagnostics: {
    flopRate: number;
    hitRate: number;
    normalRange: string;
    stabilityText: string;
  };
  diagnosticsOpen: boolean;
  onToggleDiagnostics: () => void;
  topicsOpen: boolean;
  onToggleTopics: () => void;
  isAudienceUnlocked: boolean;
  audienceHighlights: AudienceHighlight[];
  onUnlockAudience: () => void;
  onOpenWorkspaceAudience: () => void;
  // unused but kept for API parity with original
  onSelectSidebarTab: (tab: SidebarTab) => void;
}) {
  void onSelectSidebarTab;

  return (
    <div className="space-y-4">
      <SidebarCreatorProfileCard
        creator={creator}
        email={email}
        location={location}
        creatorType={creatorType}
        isSaved={isSaved}
        onToggleSave={onToggleSave}
        onOpenEmailSidebar={onOpenEmailSidebar}
        tags={tags}
        onAddTag={onAddTag}
        onRemoveTag={onRemoveTag}
      />

      <div className="border-b border-[#c5c0b1] px-1">
        <div className="flex items-end gap-6">
          <SidebarContentTabButton
            icon={DollarSign}
            label="基础信息"
            active={currentDetailTab === "pricing"}
            onClick={() => onChangeCurrentDetailTab("pricing")}
          />
          <SidebarContentTabButton
            icon={Users}
            label="受众分析"
            active={currentDetailTab === "audience"}
            onClick={() => onChangeCurrentDetailTab("audience")}
          />
        </div>
      </div>

      {currentDetailTab === "pricing" ? (
        <div className="space-y-3">
          <div
            className={`${SIDEBAR_CARD_RADIUS} overflow-hidden border border-[#c5c0b1] bg-[#fffefb]`}
          >
            <button
              type="button"
              onClick={onToggleCoreMetrics}
              aria-expanded={coreMetricsOpen}
              className="flex w-full items-center justify-between px-3 pt-3 pb-2 text-left"
            >
              <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-[#201515]">
                <BarChart3 className="h-4 w-4 text-[#ff4f00]" />
                核心数据
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-[#939084] transition-transform duration-200",
                  coreMetricsOpen && "rotate-180",
                )}
              />
            </button>

            <div className="flex flex-wrap items-center gap-1.5 px-3 pb-2.5">
              <div className="relative">
                <button
                  type="button"
                  onClick={onToggleMetricsRangeMenu}
                  aria-haspopup="listbox"
                  aria-expanded={metricsRangeMenuOpen}
                  className="inline-flex items-center gap-0.5 rounded-full border border-[#c5c0b1] bg-[#fffdf9] px-2 py-1 text-[11px] font-semibold text-[#36342e] transition-all hover:border-[#c5c0b1] hover:bg-[#eceae3]"
                >
                  <span>最近 {scrapeCount} 条</span>
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 text-[#939084] transition-transform",
                      metricsRangeMenuOpen && "rotate-180",
                    )}
                  />
                </button>
                {metricsRangeMenuOpen ? (
                  <div
                    role="listbox"
                    className="absolute top-full left-0 z-30 mt-1 w-[108px] overflow-hidden rounded-[14px] border border-[#c5c0b1] bg-[#fffefb]"
                  >
                    {SCRAPE_COUNT_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        role="option"
                        aria-selected={opt === scrapeCount}
                        onClick={() => {
                          onChangeScrapeCount(opt);
                          onToggleMetricsRangeMenu();
                        }}
                        className={cn(
                          "flex w-full items-center justify-between px-2.5 py-1.5 text-[11px] transition-colors hover:bg-[#eceae3]",
                          opt === scrapeCount ? "font-semibold text-[#ff4f00]" : "text-[#36342e]",
                        )}
                      >
                        <span>最近 {opt} 条</span>
                        {opt === scrapeCount ? <Check className="h-3 w-3" /> : null}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <span className="inline-flex shrink-0 items-center rounded-full border border-[#c5c0b1] bg-[#eceae3] px-2 py-1 text-[11px] font-semibold text-[#ff4f00]">
                CPM {creatorCpm}
              </span>

              <div className="ml-auto flex items-center gap-1 text-[11px] font-medium text-[#939084]">
                <span>数据透视</span>
                <span className="group/tip relative inline-flex">
                  <CircleHelp className="h-3.5 w-3.5 cursor-help text-[#b5b2aa] transition-colors hover:text-[#939084]" />
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute top-full right-0 z-40 mt-1.5 w-56 rounded-[10px] border border-[#c5c0b1] bg-[#fffefb] px-2.5 py-2 text-[11px] leading-[1.55] text-[#36342e] opacity-0 transition-opacity group-hover/tip:opacity-100"
                  >
                    在当前页面开启数据透视后，会叠加播放量、平均播放与互动率数据，并按平均播放量排序前
                    N 条视频。若取数异常，刷新网页即可。
                  </span>
                </span>
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

            {coreMetricsOpen ? (
              <div className="border-t border-[#eceae3]">
                <div className="grid grid-cols-2 divide-x divide-y divide-[#eceae3]">
                  {sidebarMetricItems.map((item) => (
                    <SidebarMetricInline
                      key={item.key}
                      icon={item.icon}
                      label={item.label}
                      value={item.value}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <SidebarCollapsibleSection
            icon={Sparkles}
            title="AI 评价"
            open={aiReviewOpen}
            onToggle={onToggleAiReview}
          >
            <p className="text-[13px] leading-[1.6] text-[#36342e]">{getCreatorReview(creator)}</p>
          </SidebarCollapsibleSection>

          <SidebarCollapsibleSection
            icon={Activity}
            title="流量诊断"
            open={diagnosticsOpen}
            onToggle={onToggleDiagnostics}
          >
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="rounded-[12px] bg-[#fffdf9] px-2 py-2">
                <div className="text-[10.5px] text-[#939084]">扑街率</div>
                <div className="mt-0.5 text-sm font-semibold text-[#201515]">
                  {diagnostics.flopRate}%
                </div>
              </div>
              <div className="rounded-[12px] bg-[#fffdf9] px-2 py-2">
                <div className="text-[10.5px] text-[#939084]">常态区间</div>
                <div className="mt-0.5 text-sm font-semibold text-emerald-600">
                  {diagnostics.normalRange}
                </div>
              </div>
              <div className="rounded-[12px] bg-[#fffdf9] px-2 py-2">
                <div className="text-[10.5px] text-[#939084]">爆款率</div>
                <div className="mt-0.5 text-sm font-semibold text-[#201515]">
                  {diagnostics.hitRate}%
                </div>
              </div>
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-[3px] text-[11px] text-emerald-700">
              <Check className="h-3 w-3" />
              {diagnostics.stabilityText}
            </div>
          </SidebarCollapsibleSection>

          {creator.topics && creator.topics.length > 0 && (
            <SidebarCollapsibleSection
              icon={Hash}
              title="话题提及"
              open={topicsOpen}
              onToggle={onToggleTopics}
            >
              <TopicWordCloud topics={creator.topics} />
            </SidebarCollapsibleSection>
          )}
        </div>
      ) : isAudienceUnlocked ? (
        <div className={`${SIDEBAR_CARD_RADIUS} border border-[#c5c0b1] bg-[#fffefb] p-3`}>
          <div className="rounded-[16px] border border-[#c5c0b1] bg-[#eceae3] p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-[#201515]">深度受众分析</div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                <Check className="h-3 w-3" />
                已解锁
              </span>
            </div>
            <div className="mt-2.5 space-y-2">
              {audienceHighlights.map((item) => (
                <AudienceHighlightBar
                  key={item.label}
                  label={item.label}
                  pct={item.pct}
                  flag={item.flag}
                  flags={item.flags}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={onOpenWorkspaceAudience}
              className="mt-2.5 flex w-full items-center justify-center gap-1 rounded-[12px] border border-[#c5c0b1] bg-[#fffefb] py-2 text-xs text-[#939084] transition-all hover:border-[#c5c0b1] hover:bg-[#fffdf9] hover:text-[#36342e]"
            >
              <ExternalLink className="h-3 w-3" />
              更多受众信息
            </button>
          </div>
        </div>
      ) : (
        <div className={`${SIDEBAR_CARD_RADIUS} border border-[#c5c0b1] bg-[#fffefb] p-3`}>
          <div className="relative overflow-hidden rounded-[16px] border border-[#c5c0b1] bg-gradient-to-b from-[#fffdf9] to-[#eceae3] px-3 py-4">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[radial-gradient(circle_at_top,rgba(201,100,66,0.10),transparent_70%)]" />
            <div className="relative flex flex-col items-center text-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#c5c0b1] bg-[#fffefb] text-[#ff4f00]">
                <Lock className="h-4 w-4" />
              </div>
              <div className="mt-2.5 text-sm font-semibold text-[#201515]">解锁深度受众分析</div>
              <p className="mt-1 max-w-[240px] text-[11.5px] leading-[1.55] text-[#36342e]">
                系统将深扫互动粉丝、剔除水军与低净值流量，输出更精准的受众画像与谈判依据。
              </p>
              <button
                type="button"
                onClick={onUnlockAudience}
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#201515] px-4 py-2 text-[12px] font-semibold text-[#fffefb] transition-all hover:bg-[#201515] active:scale-[0.98]"
              >
                <Sparkles className="h-3.5 w-3.5" />
                继续深度分析
                <span className="rounded-full bg-[#fffefb]/15 px-1.5 py-[1px] text-[10px] font-medium text-[#fffefb]/85">
                  消耗 {AUDIENCE_UNLOCK_COST} 积分
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
