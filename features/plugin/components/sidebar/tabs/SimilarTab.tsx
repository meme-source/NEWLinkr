"use client";

import { Check, ChevronDown, CircleHelp, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreatorAvatar } from "@/features/plugin/components/creator-avatar";
import { SimilarCardCarousel } from "@/features/plugin/components/similar-card-carousel";
import { SimilarSearchModule } from "@/features/plugin/components/similar-search-module";
import type {
  CreatorProfile,
  ProjectSummary,
  ReviewFlow,
  SearchModeKey,
} from "@/features/plugin/types";
import { searchResults } from "@/features/plugin/data/search-results";
import { SCRAPE_COUNT_OPTIONS, SIDEBAR_PANEL_CARD_CLASSES } from "../shared";
import { CreatorTopicSummaryRow } from "../CreatorTopicSummaryRow";

type SimilarMetricItem = {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
};

export function SimilarTab({
  creator,
  location,
  creatorType,
  scrapeCount,
  onChangeScrapeCount,
  similarMetricsRangeMenuOpen,
  onToggleSimilarMetricsRangeMenu,
  dataCheckOn,
  onToggleDataCheck,
  selectedMode,
  onSelectMode,
  onRunSearch,
  isSearching,
  hasSearched,
  resultPopupOpen,
  searchProgress,
  activeModeEta,
  activeResults,
  visibleCards,
  selectedProject,
  reseedAnchorLabel,
  onChangeReseedAnchorLabel,
  savedCreatorIds,
  creatorTagsById,
  onSaveCreator,
  onDismissCreator,
  onSeedCreator,
  onAddCreatorTag,
  onRemoveCreatorTag,
  onQuickScreen,
  onEndSearch,
  onCardChange,
  onOpenSeedFinder,
  onSelectSidebarTab,
  sidebarMetricItems,
  onSendEmail,
}: {
  creator: CreatorProfile;
  location: { flag: string; country: string };
  creatorType: string;
  scrapeCount: number;
  onChangeScrapeCount: (n: number) => void;
  similarMetricsRangeMenuOpen: boolean;
  onToggleSimilarMetricsRangeMenu: () => void;
  dataCheckOn: boolean;
  onToggleDataCheck: () => void;
  selectedMode: SearchModeKey;
  onSelectMode: (value: SearchModeKey) => void;
  onRunSearch: () => void;
  isSearching: boolean;
  hasSearched: boolean;
  resultPopupOpen: boolean;
  searchProgress: number;
  activeModeEta: string;
  activeResults: (typeof searchResults)[SearchModeKey];
  visibleCards: (typeof searchResults)[SearchModeKey]["cards"];
  selectedProject: ProjectSummary;
  reseedAnchorLabel: string | null;
  onChangeReseedAnchorLabel: (value: string | null) => void;
  savedCreatorIds: string[];
  creatorTagsById: Record<string, string[]>;
  onSaveCreator: (creatorId: string) => void;
  onDismissCreator: (creatorId: string) => void;
  onSeedCreator: (creatorId: string) => void;
  onAddCreatorTag: (creatorId: string, label: string) => void;
  onRemoveCreatorTag: (creatorId: string, label: string) => void;
  onQuickScreen: () => void;
  onEndSearch: () => void;
  onCardChange?: (creatorId: string) => void;
  onOpenSeedFinder: () => void;
  onSelectSidebarTab: (tab: "current") => void;
  sidebarMetricItems: SimilarMetricItem[];
  onSendEmail: (creatorId: string) => void;
  // unused; kept for original API
  _reviewFlow?: ReviewFlow;
}) {
  return (
    <div className="space-y-3">
      {!hasSearched ? (
        <SimilarSearchModule
          selectedMode={
            selectedMode === "budget"
              ? "budget"
              : selectedMode === "seed"
                ? "seed"
                : "comprehensive"
          }
          onSelectMode={(mode) => {
            if (mode === "seed") onSelectMode("seed");
            else onSelectMode(mode);
          }}
          onRunSearch={onRunSearch}
          isSearching={isSearching}
          onOpenSeedFinder={onOpenSeedFinder}
          onOpenAnalysis={() => onSelectSidebarTab("current")}
          actionSubjectLabel={creator.handle}
          actionSubject={
            <CreatorAvatar
              creator={creator}
              className="h-5 w-5 border border-[#fffefb]/80"
              labelClassName="text-[9px] leading-none"
            />
          }
          header={
            <div className="px-3.5 pt-3.5 pb-2">
              {/* Avatar + handle + location/type pills */}
              <div className="flex min-w-0 items-start gap-3">
                <CreatorAvatar
                  creator={creator}
                  className="h-12 w-12 shrink-0 border-2 border-[#fffefb]"
                  labelClassName="text-base leading-none"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="truncate text-[15px] leading-tight font-semibold text-[#201515]">
                    {creator.handle}
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#c5c0b1] bg-[#fffefb] px-1.5 py-0.5 text-[10px] text-[#36342e]">
                      <span>{location.flag}</span>
                      <span>{location.country}</span>
                    </span>
                    <span className="rounded-full border border-[#c5c0b1] bg-[#fffefb] px-1.5 py-0.5 text-[10px] text-[#36342e]">
                      {creatorType}
                    </span>
                  </div>
                </div>
              </div>

              {/* Range dropdown + data toggle — flat on card surface, no nested wrapper. */}
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={onToggleSimilarMetricsRangeMenu}
                    aria-haspopup="listbox"
                    aria-expanded={similarMetricsRangeMenuOpen}
                    className="inline-flex h-7 items-center gap-1 rounded-full border border-[#c5c0b1] bg-[#fffefb] px-2.5 text-[11px] font-semibold text-[#36342e] transition-all hover:border-[#b5b2aa] hover:bg-[#eceae3]"
                  >
                    <span>最近 {scrapeCount} 条</span>
                    <ChevronDown
                      className={cn(
                        "h-2.5 w-2.5 text-[#939084] transition-transform",
                        similarMetricsRangeMenuOpen && "rotate-180",
                      )}
                    />
                  </button>
                  {similarMetricsRangeMenuOpen ? (
                    <div
                      role="listbox"
                      className="absolute top-full left-0 z-30 mt-1 w-[104px] overflow-hidden rounded-[12px] border border-[#c5c0b1] bg-[#fffefb]"
                    >
                      {SCRAPE_COUNT_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          role="option"
                          aria-selected={opt === scrapeCount}
                          onClick={() => {
                            onChangeScrapeCount(opt);
                            onToggleSimilarMetricsRangeMenu();
                          }}
                          className={cn(
                            "flex w-full items-center justify-between px-2.5 py-1.5 text-[10.5px] transition-colors hover:bg-[#eceae3]",
                            opt === scrapeCount ? "font-semibold text-[#ff4f00]" : "text-[#36342e]",
                          )}
                        >
                          <span>{opt}条</span>
                          {opt === scrapeCount ? <Check className="h-3 w-3" /> : null}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="inline-flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-[#939084]">数据透视</span>
                  <span className="group/tip relative inline-flex">
                    <CircleHelp className="h-3 w-3 cursor-help text-[#b5b2aa] transition-colors hover:text-[#939084]" />
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
                      "relative h-[18px] w-[30px] shrink-0 rounded-full transition-colors",
                      dataCheckOn ? "bg-[#ff4f00]" : "bg-[#b5b2aa]",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-[1px] left-[1px] h-[14px] w-[14px] rounded-full bg-[#fffefb] transition-transform",
                        dataCheckOn && "translate-x-3",
                      )}
                    />
                  </button>
                </div>
              </div>

              {/* Hashtag/topic row — flat on card surface */}
              {creator.topics && creator.topics.length > 0 ? (
                <div className="mt-3">
                  <CreatorTopicSummaryRow topics={creator.topics} scrapeCount={scrapeCount} />
                </div>
              ) : null}

              {/* 4-cell metric grid — Solid Tile variant per docs/DESIGN.md §6 */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                {sidebarMetricItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.key} className="rounded-[14px] bg-[#eceae3] px-3 py-2.5">
                      <div className="inline-flex items-center gap-1 text-[10.5px] font-medium text-[#939084]">
                        <Icon className="h-3.5 w-3.5" />
                        <span>{item.label}</span>
                      </div>
                      <div className="mt-1 text-[18px] font-bold tracking-[-0.02em] text-[#201515]">
                        {item.value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          }
        />
      ) : null}

      {hasSearched && !resultPopupOpen && (
        <div className="flex items-center justify-between px-0.5">
          <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-[#939084]">
            <span>为</span>
            <CreatorAvatar
              creator={creator}
              className="h-5 w-5 shrink-0 border border-[#fffefb]/80"
              labelClassName="text-[9px]"
            />
            <span className="truncate font-semibold text-[#201515]">
              {reseedAnchorLabel ?? creator.handle}
            </span>
            <span>· {activeResults.total} 位匹配</span>
          </div>
          <button
            type="button"
            onClick={() => {
              const blob = new Blob([activeResults.cards.map((c) => c.name).join("\n")], {
                type: "text/plain",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${selectedProject.name}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="inline-flex items-center gap-1 rounded-full border border-[#c5c0b1] bg-[#fffefb] px-2.5 py-1 text-[10.5px] font-medium text-[#36342e] transition-all hover:border-[#ff4f00]/40 hover:text-[#ff4f00] active:scale-[0.97]"
          >
            <Download className="h-3 w-3" />
            <span>导出</span>
          </button>
        </div>
      )}

      {isSearching ? (
        <div className={SIDEBAR_PANEL_CARD_CLASSES}>
          <div className="text-sm font-medium text-[#36342e]">正在为您寻找...</div>
          <div className="mt-4">
            <div className="h-2.5 overflow-hidden rounded-full bg-[#c5c0b1]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#ff4f00] to-[#ff4f00] transition-all duration-300"
                style={{ width: `${searchProgress}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-[#939084]">
              <span>正在分析内容、主题、视觉调性与受众信号</span>
              <span>{searchProgress}%</span>
            </div>
            <div className="mt-2 text-xs text-[#939084]">
              {activeModeEta}，请稍候，结果将按当前模式自动整理。
            </div>
          </div>
        </div>
      ) : null}

      {hasSearched && !resultPopupOpen ? (
        <SimilarCardCarousel
          cards={visibleCards}
          projectScopeId={selectedProject.id}
          anchor={creator}
          savedCreatorIds={savedCreatorIds}
          creatorTagsById={creatorTagsById}
          onSave={onSaveCreator}
          onDismiss={onDismissCreator}
          onSeedCreator={onSeedCreator}
          onReseedComplete={(name) => onChangeReseedAnchorLabel(name)}
          onAddTag={onAddCreatorTag}
          onRemoveTag={onRemoveCreatorTag}
          onQuickScreen={onQuickScreen}
          onEndSearch={onEndSearch}
          onCardChange={onCardChange}
          dataCheckOn={dataCheckOn}
          onToggleDataCheck={onToggleDataCheck}
          scrapeCount={scrapeCount}
          onChangeScrapeCount={onChangeScrapeCount}
          onViewDetail={() => onSelectSidebarTab("current")}
          onSendEmail={onSendEmail}
        />
      ) : null}
    </div>
  );
}
