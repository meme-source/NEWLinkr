"use client";

import { CreatorProfileHeader } from "@/features/plugin/components/creator-profile-header";
import type {
  CreatorProfile,
  CurrentDetailTab as CurrentDetailTabKey,
  SidebarTab,
} from "@/features/plugin/types";

import { CurrentTabBar } from "../current-tab-bar";
import { ContentDataPanel } from "../current-content-panel";
import { AudiencePanel } from "../current-audience-panel";

interface DiagnosticsValues {
  flopRate: number;
  hitRate: number;
  normalRange: string;
  stabilityText: string;
}

interface CurrentTabProps {
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
  scrapeCount: number;
  onChangeScrapeCount: (n: number) => void;
  metricsRangeMenuOpen: boolean;
  onToggleMetricsRangeMenu: () => void;
  creatorCpm: string;
  dataCheckOn: boolean;
  onToggleDataCheck: () => void;
  diagnostics: DiagnosticsValues;
  isAudienceUnlocked: boolean;
  onUnlockAudience: () => void;
  onOpenWorkspaceAudience: () => void;
  // kept for API parity with original
  onSelectSidebarTab: (tab: SidebarTab) => void;
}

// 「博主分析」页：最外层是无边框的基础信息块，下方切换「内容数据 / 受众分析」。
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
  scrapeCount,
  onChangeScrapeCount,
  metricsRangeMenuOpen,
  onToggleMetricsRangeMenu,
  creatorCpm,
  dataCheckOn,
  onToggleDataCheck,
  diagnostics,
  isAudienceUnlocked,
  onUnlockAudience,
  onOpenWorkspaceAudience,
  onSelectSidebarTab,
}: CurrentTabProps) {
  void onSelectSidebarTab;

  return (
    <div className="space-y-4">
      {/* 基础信息块 — 最外层最大层级，不加卡片边框 / 背景。 */}
      <div className="px-1">
        <CreatorProfileHeader
          name={creator.name}
          handle={creator.handle}
          flag={location.flag}
          country={location.country}
          creatorType={creatorType}
          email={email}
          hasEmail={Boolean(creator.email)}
          onOpenEmailSidebar={onOpenEmailSidebar}
          isSaved={isSaved}
          onToggleSave={onToggleSave}
          tags={tags}
          onAddTag={onAddTag}
          onRemoveTag={onRemoveTag}
        />
      </div>

      <div className="px-1">
        <CurrentTabBar value={currentDetailTab} onChange={onChangeCurrentDetailTab} />
      </div>

      {currentDetailTab === "pricing" ? (
        <ContentDataPanel
          creator={creator}
          creatorType={creatorType}
          diagnostics={diagnostics}
          scrapeCount={scrapeCount}
          onChangeScrapeCount={onChangeScrapeCount}
          metricsRangeMenuOpen={metricsRangeMenuOpen}
          onToggleMetricsRangeMenu={onToggleMetricsRangeMenu}
          creatorCpm={creatorCpm}
          dataCheckOn={dataCheckOn}
          onToggleDataCheck={onToggleDataCheck}
        />
      ) : (
        <AudiencePanel
          creator={creator}
          isUnlocked={isAudienceUnlocked}
          onUnlock={onUnlockAudience}
          onOpenWorkspace={onOpenWorkspaceAudience}
        />
      )}
    </div>
  );
}
