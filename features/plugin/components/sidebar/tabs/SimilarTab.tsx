"use client";

import { Check, ChevronDown, CircleHelp } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { CreatorAvatar } from "@/features/plugin/components/creator-avatar";
import { CreatorProfileHeader } from "@/features/plugin/components/creator-profile-header";
import { SimilarCardCarousel } from "@/features/plugin/components/similar-card-carousel";
import { SimilarSearchModule } from "@/features/plugin/components/similar-search-module";
import type {
  CreatorProfile,
  ProjectSummary,
  ReviewFlow,
  SearchModeKey,
  SidebarTab,
} from "@/features/plugin/types";
import { searchResults } from "@/features/plugin/data/search-results";
import { Button } from "@/components/ui/button";
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
  email,
  location,
  creatorType,
  scrapeCount,
  onChangeScrapeCount,
  creatorCpm,
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
  // 旧的"为 [博主] · N 位匹配"提示行已经移除，所以这里的 reseedAnchorLabel
  // 不再渲染；但 prop 在类型上仍然保留，避免 SidebarShell 那边一并改动。
  reseedAnchorLabel: _reseedAnchorLabel,
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
  email: string;
  location: { flag: string; country: string };
  creatorType: string;
  scrapeCount: number;
  onChangeScrapeCount: (n: number) => void;
  creatorCpm: string;
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
  onSelectSidebarTab: (tab: SidebarTab) => void;
  sidebarMetricItems: SimilarMetricItem[];
  onSendEmail: (creatorId: string) => void;
  // unused; kept for original API
  _reviewFlow?: ReviewFlow;
}) {
  return (
    <div className="space-y-1.5">
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
              <CreatorProfileHeader
                name={creator.name}
                handle={creator.handle}
                flag={location.flag}
                country={location.country}
                creatorType={creatorType}
                email={email}
                hasEmail={Boolean(creator.email)}
                onOpenEmailSidebar={() => onSelectSidebarTab("email")}
                isSaved={savedCreatorIds.includes(creator.id)}
                onToggleSave={() => onSaveCreator(creator.id)}
                tags={creatorTagsById[creator.id] ?? []}
                onAddTag={(label) => onAddCreatorTag(creator.id, label)}
                onRemoveTag={(label) => onRemoveCreatorTag(creator.id, label)}
              />

              {/* Range dropdown + data toggle — flat on card surface, no nested wrapper. */}
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Button
                      unstyled
                      type="button"
                      onClick={onToggleSimilarMetricsRangeMenu}
                      aria-haspopup="listbox"
                      aria-expanded={similarMetricsRangeMenuOpen}
                      className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-[#201515] transition-colors hover:text-[#ff4f00]"
                    >
                      <span>近 {scrapeCount} 条</span>
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 text-[#939084] transition-transform",
                          similarMetricsRangeMenuOpen && "rotate-180",
                        )}
                      />
                    </Button>
                    {similarMetricsRangeMenuOpen ? (
                      <div
                        role="listbox"
                        className="absolute top-full left-0 z-30 mt-1 w-[108px] overflow-hidden rounded-[8px] border border-[#c5c0b1] bg-[#fffefb] shadow-[0_8px_20px_-12px_rgba(20,20,19,0.32)]"
                      >
                        {SCRAPE_COUNT_OPTIONS.map((opt) => (
                          <Button
                            unstyled
                            key={opt}
                            type="button"
                            role="option"
                            aria-selected={opt === scrapeCount}
                            onClick={() => {
                              onChangeScrapeCount(opt);
                              onToggleSimilarMetricsRangeMenu();
                            }}
                            className={cn(
                              "flex w-full items-center justify-between px-2.5 py-1.5 text-[11px] transition-colors hover:bg-[#eceae3]",
                              opt === scrapeCount
                                ? "font-semibold text-[#ff4f00]"
                                : "text-[#36342e]",
                            )}
                          >
                            <span>近 {opt} 条</span>
                            {opt === scrapeCount ? <Check className="h-3 w-3" /> : null}
                          </Button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <span aria-hidden className="text-[#b5b2aa]">
                    ·
                  </span>
                  <span className="text-[12px] font-medium text-[#36342e]">CPM {creatorCpm}</span>
                </div>

                <div className="inline-flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-[#939084]">数据透视</span>
                  <span className="group/tip relative inline-flex">
                    <CircleHelp className="h-3 w-3 cursor-help text-[#b5b2aa] transition-colors hover:text-[#939084]" />
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute top-full right-0 z-40 mt-1.5 w-56 rounded-[8px] border border-[#c5c0b1] bg-[#fffefb] px-2.5 py-2 text-[11px] leading-[1.55] text-[#36342e] opacity-0 transition-opacity group-hover/tip:opacity-100"
                    >
                      在当前页面开启数据透视后，会叠加播放量、平均播放与互动率数据，并按平均播放量排序前
                      N 条视频。若取数异常，刷新网页即可。
                    </span>
                  </span>
                  <Toggle
                    checked={dataCheckOn}
                    onCheckedChange={onToggleDataCheck}
                    size="sm"
                    aria-label="数据透视开关"
                  />
                </div>
              </div>

              {/* Hashtag/topic row — flat on card surface */}
              {creator.topics && creator.topics.length > 0 ? (
                <div className="mt-2">
                  <CreatorTopicSummaryRow topics={creator.topics} scrapeCount={scrapeCount} />
                </div>
              ) : null}

              {/* 4-cell metric grid — Solid Tile variant per docs/DESIGN.md §6 */}
              <div className="mt-2.5 grid grid-cols-2 gap-x-2 gap-y-1.5">
                {sidebarMetricItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.key} className="rounded-[8px] bg-[#eceae3] px-3 py-2.5">
                      <div className="inline-flex items-center gap-1 text-[10.5px] leading-none font-medium text-[#939084]">
                        <Icon className="h-3.5 w-3.5" />
                        <span>{item.label}</span>
                      </div>
                      <div className="mt-1 text-[18px] leading-none font-bold tracking-[-0.02em] text-[#201515]">
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

      {/* 原来这里有一条"为 [avatar] [handle] · N 位匹配 [导出]"提示行 ——
          下方 SeedSourcePanel 已经显示了相同的种子头像与"待筛选 / 已收藏"计数，
          重复展示会显得冗余，所以这一行整体移除；导出按钮挪进 panel 的标题区。 */}

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
          // 上游 SimilarSearchModule 已经选过模式 → 直接传给 carousel，让逐个
          // 筛选过程一气呵成，避免在第一次「根据 X 找相似」时再弹 picker。
          // SearchModeKey 比 SimilarSearchModeKey 宽，统一收敛到 carousel 支持的
          // 三种（tier/geo/brand 当作 comprehensive 兜底，与 SimilarSearchModule
          // 的 onSelectMode 兜底一致）。
          initialMode={
            selectedMode === "budget"
              ? "budget"
              : selectedMode === "seed"
                ? "seed"
                : "comprehensive"
          }
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
          onExport={() => {
            // 简单 txt 导出（沿用之前在头部那条提示行里的逻辑）。SeedSourcePanel
            // 通过 onExport prop 触发，与 web 端 CSV 导出语义对齐：导当前候选。
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
        />
      ) : null}
    </div>
  );
}
