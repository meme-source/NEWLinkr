"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type {
  CreatorProfile,
  CurrentDetailTab as CurrentDetailTabKey,
  EmailSendOptions,
  EmailTemplateKey,
  HoverMetricKey,
  InlineDataKey,
  MetricAggregation,
  ProjectSummary,
  ReviewFlow,
  SearchModeKey,
  SidebarTab,
  SocialPlatformKey,
} from "@/features/plugin/types";
import { searchResults } from "@/features/plugin/data/search-results";
import { emailTemplates } from "@/features/plugin/data/email-templates";
import {
  DEFAULT_HOVER_METRICS,
  computeAudienceHighlights,
  getAudienceSummary,
  getCreatorDiagnostics,
  getCreatorEmail,
  getCreatorLocation,
  getCreatorMetricSnapshot,
  getCreatorType,
  getDefaultScheduleAt,
  getEmailSubjectSegments,
  getEmailTemplateDraft,
  getEmailTemplateSegments,
  getEmailTemplateSubject,
} from "./shared";
import { buildSidebarMetricItems } from "./metric-items";
import { SidebarProjectSelector } from "./SidebarProjectSelector";
import { SidebarNavRail } from "./SidebarNavRail";
import { QuickSettingsPanel } from "./QuickSettingsPanel";
import { EmailReviewModal } from "./EmailReviewModal";
import { CurrentTab } from "./tabs/CurrentTab";
import { EmailTab } from "./tabs/EmailTab";
import { SimilarTab } from "./tabs/SimilarTab";

export function SimilarSidebar({
  projects,
  selectedProject,
  onSelectProject,
  onQuickCreateProject,
  onDeleteProject,
  selectedMode,
  onSelectMode,
  onRunSearch,
  activeSidebarTab,
  onSelectSidebarTab,
  isSearching,
  hasSearched,
  activeModeEta,
  activeResults,
  searchProgress,
  creator,
  creatorTagsById,
  visibleCards,
  savedCreatorIds,
  savedProjectCreators,
  onOpenProfile,
  onSaveCreator,
  onDismissCreator,
  onSeedCreator,
  onQuickScreen,
  onOpenSeedFinder,
  onAddCreatorTag,
  onRemoveCreatorTag,
  selectedEmailTemplate,
  onSelectEmailTemplate,
  emailDraft,
  onEmailDraftChange,
  onSendCurrent,
  resultPopupOpen,
  onEndSearch,
  onCardChange,
  collapsed,
  onToggleCollapse,
  expandedWidth,
  isResizing,
  onResizeStart,
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
}: SimilarSidebarProps) {
  const [reseedAnchorLabel, setReseedAnchorLabel] = useState<string | null>(null);

  const email = getCreatorEmail(creator);
  const location = getCreatorLocation(creator);
  const currentCreatorTags = creatorTagsById[creator.id] ?? [];
  const creatorMetrics = getCreatorMetricSnapshot(creator, scrapeCount);
  const creatorCpm = creatorMetrics.cpm;
  const audienceHighlights = computeAudienceHighlights(getAudienceSummary(creator));
  const configuredMetricKeys = selectedHoverMetricKeys.length
    ? selectedHoverMetricKeys
    : DEFAULT_HOVER_METRICS;
  const sidebarMetricItems = buildSidebarMetricItems(
    configuredMetricKeys,
    creator,
    creatorMetrics,
    hoverMetricModes,
  );

  const [senderEmails] = useState<Array<{ id: string; label: string; address: string }>>([
    { id: "demo", label: "工作邮箱", address: "team@2linkr.io" },
  ]);
  const [selectedSenderId, setSelectedSenderId] = useState<string>(
    senderEmails.length > 0 ? senderEmails[0].id : "",
  );
  const selectedSender = senderEmails.find((acct) => acct.id === selectedSenderId) ?? null;
  const [emailSubject, setEmailSubject] = useState("");
  const [emailAttachments, setEmailAttachments] = useState<File[]>([]);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([creator.id]);
  const [previewRecipientId, setPreviewRecipientId] = useState(creator.id);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [sendMenuOpen, setSendMenuOpen] = useState(false);
  const [sendMode, setSendMode] = useState<EmailSendOptions["mode"]>("now");
  const [scheduledAt, setScheduledAt] = useState(getDefaultScheduleAt);
  const [pluginStatus, setPluginStatus] = useState<"working" | "idle">("working");

  const emailCandidateCreators = useMemo(() => {
    const map = new Map<string, CreatorProfile>();
    map.set(creator.id, creator);
    savedProjectCreators.forEach((item) => map.set(item.id, item));
    return Array.from(map.values());
  }, [creator, savedProjectCreators]);
  const selectedRecipientSet = new Set(selectedRecipientIds);
  const emailRecipientCreators = emailCandidateCreators.filter((item) =>
    selectedRecipientSet.has(item.id),
  );
  const emailRecipientIds = emailRecipientCreators.map((item) => item.id);
  const emailRecipientCount = emailRecipientCreators.length;
  const filteredRecipientCreators = emailCandidateCreators;
  const orderedRecipientCreators = useMemo(() => {
    const currentCreator = filteredRecipientCreators.find((item) => item.id === creator.id);
    const restCreators = filteredRecipientCreators.filter((item) => item.id !== creator.id);
    const selectedCreators = restCreators.filter((item) => selectedRecipientIds.includes(item.id));
    const unselectedCreators = restCreators.filter(
      (item) => !selectedRecipientIds.includes(item.id),
    );
    return currentCreator
      ? [currentCreator, ...selectedCreators, ...unselectedCreators]
      : [...selectedCreators, ...unselectedCreators];
  }, [creator.id, filteredRecipientCreators, selectedRecipientIds]);
  const allFilteredRecipientsSelected =
    filteredRecipientCreators.length > 0 &&
    filteredRecipientCreators.every((item) => selectedRecipientSet.has(item.id));
  const previewCreator =
    emailCandidateCreators.find((item) => item.id === previewRecipientId) ??
    emailRecipientCreators[0] ??
    creator;
  const emailTemplateSegments = selectedEmailTemplate
    ? getEmailTemplateSegments(selectedEmailTemplate, previewCreator, selectedProject)
    : [];
  const personalizedSegmentCount = emailTemplateSegments.filter((s) => s.personalized).length;
  const canOpenEmailReview =
    Boolean(selectedEmailTemplate) &&
    emailSubject.trim().length > 0 &&
    emailDraft.trim().length > 0 &&
    emailRecipientCount > 0;

  const toggleRecipient = (creatorId: string) => {
    setPreviewRecipientId(creatorId);
    setSelectedRecipientIds((current) =>
      current.includes(creatorId)
        ? current.filter((item) => item !== creatorId)
        : [...current, creatorId],
    );
  };
  const toggleAllFilteredRecipients = () => {
    if (filteredRecipientCreators.length === 0) return;
    const filteredIds = filteredRecipientCreators.map((item) => item.id);
    if (allFilteredRecipientsSelected) {
      setSelectedRecipientIds((current) => current.filter((item) => !filteredIds.includes(item)));
      return;
    }
    setSelectedRecipientIds((current) => Array.from(new Set([...current, ...filteredIds])));
  };

  const activeEmailTemplate =
    emailTemplates.find((template) => template.key === selectedEmailTemplate) ?? null;
  const selectedTemplateLabel = activeEmailTemplate?.label ?? "自定义邮件";

  const [diagnosticsOpen, setDiagnosticsOpen] = useState(true);
  const [aiReviewOpen, setAiReviewOpen] = useState(true);
  const [topicsOpen, setTopicsOpen] = useState(true);
  const [coreMetricsOpen, setCoreMetricsOpen] = useState(true);
  const [metricsRangeMenuOpen, setMetricsRangeMenuOpen] = useState(false);
  const [similarMetricsRangeMenuOpen, setSimilarMetricsRangeMenuOpen] = useState(false);
  const [currentDetailTab, setCurrentDetailTab] = useState<CurrentDetailTabKey>("pricing");
  const [unlockedAudienceIds, setUnlockedAudienceIds] = useState<Set<string>>(new Set());
  const diagnostics = getCreatorDiagnostics(creator);
  const isAudienceUnlocked = unlockedAudienceIds.has(creator.id);
  const creatorType = getCreatorType(creator);
  const handleUnlockAudience = () => {
    setUnlockedAudienceIds((current) => {
      if (current.has(creator.id)) return current;
      const next = new Set(current);
      next.add(creator.id);
      return next;
    });
  };

  useEffect(() => {
    setPreviewRecipientId(creator.id);
  }, [creator.id]);

  useEffect(() => {
    if (!selectedEmailTemplate) {
      onSelectEmailTemplate("intro");
      return;
    }
    setEmailSubject(
      getEmailTemplateSubject(selectedEmailTemplate, previewCreator, selectedProject),
    );
    onEmailDraftChange(
      getEmailTemplateDraft(selectedEmailTemplate, previewCreator, selectedProject),
    );
  }, [
    onEmailDraftChange,
    onSelectEmailTemplate,
    previewCreator,
    selectedEmailTemplate,
    selectedProject,
  ]);

  useEffect(() => {
    const availableIds = new Set(emailCandidateCreators.map((item) => item.id));
    setSelectedRecipientIds((current) => {
      const next = current.filter((creatorId) => availableIds.has(creatorId));
      const stable =
        next.length === current.length &&
        next.every((creatorId, index) => creatorId === current[index]);
      if (stable && next.length > 0) return current;
      return next.length > 0 ? next : [creator.id];
    });
    setPreviewRecipientId((current) => (availableIds.has(current) ? current : creator.id));
  }, [creator.id, emailCandidateCreators, selectedProject.id]);

  const handleSendAction = () => {
    if (!selectedEmailTemplate) {
      onRecordQuickSettingsChange("请先选择邮件模板。");
      return;
    }
    if (!emailSubject.trim()) {
      onRecordQuickSettingsChange("邮件标题为空，请先补充后再发送。");
      return;
    }
    if (!emailDraft.trim()) {
      onRecordQuickSettingsChange("邮件内容为空，请先生成或补充后再发送。");
      return;
    }
    if (sendMode === "scheduled" && !scheduledAt) {
      onRecordQuickSettingsChange("请先选择定时发送时间。");
      return;
    }
    setSendMenuOpen(false);
    setReviewModalOpen(true);
  };

  const confirmEmailSend = () => {
    const previewGeneratedSubject = getEmailTemplateSubject(
      selectedEmailTemplate,
      previewCreator,
      selectedProject,
    );
    const previewGeneratedDraft = getEmailTemplateDraft(
      selectedEmailTemplate,
      previewCreator,
      selectedProject,
    );
    const subjectWasEdited = emailSubject.trim() !== previewGeneratedSubject.trim();
    const contentWasEdited = emailDraft.trim() !== previewGeneratedDraft.trim();
    const recipientMessages = emailRecipientCreators.map((recipient) => {
      const subjectSegments = subjectWasEdited
        ? [{ text: emailSubject }]
        : getEmailSubjectSegments(selectedEmailTemplate, recipient, selectedProject);
      const contentSegments = contentWasEdited
        ? [{ text: emailDraft }]
        : getEmailTemplateSegments(selectedEmailTemplate, recipient, selectedProject);

      return {
        creatorId: recipient.id,
        subject: subjectSegments.map((segment) => segment.text).join(""),
        content: contentSegments.map((segment) => segment.text).join(""),
        subjectSegments,
        contentSegments,
        personalizedSegmentCount: contentSegments.filter((segment) => segment.personalized).length,
      };
    });

    onSendCurrent(selectedTemplateLabel, emailDraft, {
      subject: emailSubject,
      attachmentCount: emailAttachments.length,
      mode: sendMode,
      scheduledAt: sendMode === "scheduled" ? scheduledAt : undefined,
      senderAddress: selectedSender?.address,
      recipientCreatorIds: emailRecipientIds,
      recipientMessages,
      templateKey: selectedEmailTemplate || "custom",
    });
    setReviewModalOpen(false);
  };

  const handleSidebarWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (event.ctrlKey) return;
    if (event.deltaX === 0 && event.deltaY === 0) return;
    event.preventDefault();
    window.scrollBy({ top: event.deltaY, left: event.deltaX, behavior: "auto" });
  };

  return (
    <aside
      role="dialog"
      aria-modal="true"
      aria-label="插件侧边栏"
      className={cn(
        "absolute inset-y-0 right-0 z-20 flex flex-row border-l border-[#c5c0b1] bg-[#fffdf9]/96 backdrop-blur transition-[width] duration-300",
        collapsed && "w-11",
        isResizing && "transition-none select-none",
      )}
      style={collapsed ? undefined : { width: expandedWidth }}
    >
      {!collapsed ? (
        <div
          role="presentation"
          onPointerDown={(event) => {
            event.preventDefault();
            onResizeStart(event.clientX);
          }}
          className="group absolute inset-y-0 left-0 z-30 w-3 -translate-x-1/2 cursor-col-resize touch-none"
        >
          <div
            className={cn(
              "absolute inset-y-6 left-1/2 -translate-x-1/2 rounded-full bg-[#b5b2aa] transition-all duration-150",
              isResizing
                ? "w-1.5 bg-[#ff4f00]"
                : "w-px group-hover:w-1 group-hover:bg-[#ff4f00]/70",
            )}
          />
        </div>
      ) : null}

      <div className={cn("flex min-w-0 flex-1 flex-col", collapsed && "hidden")}>
        <div
          onWheelCapture={handleSidebarWheel}
          className="hide-scrollbar flex-1 overflow-y-auto px-4 pt-3 pb-5"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <SidebarProjectSelector
            projects={projects}
            selectedProject={selectedProject}
            onSelectProject={onSelectProject}
            onQuickCreateProject={onQuickCreateProject}
            onDeleteProject={onDeleteProject}
          />

          {activeSidebarTab === "quick" ? (
            <QuickSettingsPanel
              creator={creator}
              location={location}
              creatorMetrics={creatorMetrics}
              dataCheckOn={dataCheckOn}
              onToggleDataCheck={onToggleDataCheck}
              scrapeCount={scrapeCount}
              onChangeScrapeCount={onChangeScrapeCount}
              inlineDataKeys={inlineDataKeys}
              onChangeInlineDataKeys={onChangeInlineDataKeys}
              selectedPlatform={selectedPlatform}
              onChangePlatform={onChangePlatform}
              selectedHoverMetricKeys={selectedHoverMetricKeys}
              onChangeHoverMetricKeys={onChangeHoverMetricKeys}
              hoverMetricModes={hoverMetricModes}
              onChangeHoverMetricModes={onChangeHoverMetricModes}
              onRecordQuickSettingsChange={onRecordQuickSettingsChange}
              pluginStatus={pluginStatus}
              onTogglePluginStatus={() =>
                setPluginStatus((s) => (s === "working" ? "idle" : "working"))
              }
            />
          ) : null}

          {activeSidebarTab === "current" ? (
            <CurrentTab
              creator={creator}
              email={email}
              location={location}
              creatorType={creatorType}
              isSaved={savedCreatorIds.includes(creator.id)}
              onToggleSave={() => onSaveCreator(creator.id)}
              onOpenEmailSidebar={() => onSelectSidebarTab("email")}
              tags={currentCreatorTags}
              onAddTag={(label) => onAddCreatorTag(creator.id, label)}
              onRemoveTag={(label) => onRemoveCreatorTag(creator.id, label)}
              currentDetailTab={currentDetailTab}
              onChangeCurrentDetailTab={setCurrentDetailTab}
              coreMetricsOpen={coreMetricsOpen}
              onToggleCoreMetrics={() => setCoreMetricsOpen((v) => !v)}
              scrapeCount={scrapeCount}
              onChangeScrapeCount={onChangeScrapeCount}
              metricsRangeMenuOpen={metricsRangeMenuOpen}
              onToggleMetricsRangeMenu={() => setMetricsRangeMenuOpen((v) => !v)}
              creatorCpm={creatorCpm}
              dataCheckOn={dataCheckOn}
              onToggleDataCheck={onToggleDataCheck}
              sidebarMetricItems={sidebarMetricItems}
              aiReviewOpen={aiReviewOpen}
              onToggleAiReview={() => setAiReviewOpen((v) => !v)}
              diagnostics={diagnostics}
              diagnosticsOpen={diagnosticsOpen}
              onToggleDiagnostics={() => setDiagnosticsOpen((v) => !v)}
              topicsOpen={topicsOpen}
              onToggleTopics={() => setTopicsOpen((v) => !v)}
              isAudienceUnlocked={isAudienceUnlocked}
              audienceHighlights={audienceHighlights}
              onUnlockAudience={handleUnlockAudience}
              onOpenWorkspaceAudience={() => {
                window.open(
                  `/workspace?creator=${encodeURIComponent(creator.id)}&tab=audience`,
                  "_blank",
                );
              }}
              onSelectSidebarTab={onSelectSidebarTab}
            />
          ) : null}

          {activeSidebarTab === "email" ? (
            <EmailTab
              creator={creator}
              orderedRecipientCreators={orderedRecipientCreators}
              filteredRecipientCreatorsCount={filteredRecipientCreators.length}
              emailRecipientCount={emailRecipientCount}
              selectedRecipientSet={selectedRecipientSet}
              previewCreator={previewCreator}
              allFilteredRecipientsSelected={allFilteredRecipientsSelected}
              onToggleAllFilteredRecipients={toggleAllFilteredRecipients}
              onToggleRecipient={toggleRecipient}
              onSetPreviewRecipient={setPreviewRecipientId}
              onOpenProfile={(creatorId) => onOpenProfile(creatorId)}
              senderEmails={senderEmails}
              selectedSenderId={selectedSenderId}
              onChangeSelectedSenderId={setSelectedSenderId}
              selectedEmailTemplate={selectedEmailTemplate}
              onSelectEmailTemplate={onSelectEmailTemplate}
              emailSubject={emailSubject}
              onChangeEmailSubject={setEmailSubject}
              emailAttachments={emailAttachments}
              onChangeEmailAttachments={setEmailAttachments}
              emailTemplateSegments={emailTemplateSegments}
              personalizedSegmentCount={personalizedSegmentCount}
              canOpenEmailReview={canOpenEmailReview}
              onSendAction={handleSendAction}
              sendMode={sendMode}
              onChangeSendMode={(mode) => {
                setSendMode(mode);
                setSendMenuOpen(false);
              }}
              sendMenuOpen={sendMenuOpen}
              onToggleSendMenu={() => setSendMenuOpen((value) => !value)}
              scheduledAt={scheduledAt}
              onChangeScheduledAt={setScheduledAt}
            />
          ) : null}

          {reviewModalOpen ? (
            <EmailReviewModal
              templateKey={selectedEmailTemplate}
              templateLabel={selectedTemplateLabel}
              project={selectedProject}
              recipients={emailRecipientCreators}
              senderAddress={selectedSender?.address ?? "未选择发件账号"}
              subject={emailSubject}
              attachmentCount={emailAttachments.length}
              sendMode={sendMode}
              scheduledAt={sendMode === "scheduled" ? scheduledAt : undefined}
              onClose={() => setReviewModalOpen(false)}
              onConfirm={confirmEmailSend}
            />
          ) : null}

          {activeSidebarTab === "similar" ? (
            <SimilarTab
              creator={creator}
              location={location}
              creatorType={creatorType}
              scrapeCount={scrapeCount}
              onChangeScrapeCount={onChangeScrapeCount}
              similarMetricsRangeMenuOpen={similarMetricsRangeMenuOpen}
              onToggleSimilarMetricsRangeMenu={() => setSimilarMetricsRangeMenuOpen((v) => !v)}
              dataCheckOn={dataCheckOn}
              onToggleDataCheck={onToggleDataCheck}
              selectedMode={selectedMode}
              onSelectMode={onSelectMode}
              onRunSearch={onRunSearch}
              isSearching={isSearching}
              hasSearched={hasSearched}
              resultPopupOpen={resultPopupOpen}
              searchProgress={searchProgress}
              activeModeEta={activeModeEta}
              activeResults={activeResults}
              visibleCards={visibleCards}
              selectedProject={selectedProject}
              reseedAnchorLabel={reseedAnchorLabel}
              onChangeReseedAnchorLabel={setReseedAnchorLabel}
              savedCreatorIds={savedCreatorIds}
              creatorTagsById={creatorTagsById}
              onSaveCreator={onSaveCreator}
              onDismissCreator={onDismissCreator}
              onSeedCreator={onSeedCreator}
              onAddCreatorTag={onAddCreatorTag}
              onRemoveCreatorTag={onRemoveCreatorTag}
              onQuickScreen={onQuickScreen}
              onEndSearch={onEndSearch}
              onCardChange={onCardChange}
              onOpenSeedFinder={onOpenSeedFinder}
              onSelectSidebarTab={(tab) => onSelectSidebarTab(tab)}
              sidebarMetricItems={sidebarMetricItems}
              onSendEmail={(creatorId) => {
                onSaveCreator(creatorId);
                setSelectedRecipientIds((prev) => Array.from(new Set([...prev, creatorId])));
                onSelectSidebarTab("email");
              }}
            />
          ) : null}
        </div>
      </div>

      <SidebarNavRail
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
        activeSidebarTab={activeSidebarTab}
        onSelectSidebarTab={onSelectSidebarTab}
      />
    </aside>
  );
}

type SimilarSidebarProps = {
  projects: ProjectSummary[];
  selectedProject: ProjectSummary;
  onSelectProject: (projectId: string) => void;
  onQuickCreateProject: () => void;
  onDeleteProject: (projectId: string) => void;
  selectedMode: SearchModeKey;
  onSelectMode: (value: SearchModeKey) => void;
  onRunSearch: () => void;
  activeSidebarTab: SidebarTab;
  onSelectSidebarTab: (tab: SidebarTab) => void;
  isSearching: boolean;
  hasSearched: boolean;
  activeModeEta: string;
  activeResults: (typeof searchResults)[SearchModeKey];
  searchProgress: number;
  creator: CreatorProfile;
  creatorTagsById: Record<string, string[]>;
  visibleCards: (typeof searchResults)[SearchModeKey]["cards"];
  savedCreatorIds: string[];
  savedProjectCreators: CreatorProfile[];
  onOpenProfile: (creatorId: string, flow?: ReviewFlow) => void;
  onSaveCreator: (creatorId: string) => void;
  onDismissCreator: (creatorId: string) => void;
  onSeedCreator: (creatorId: string) => void;
  onQuickScreen: () => void;
  onOpenSeedFinder: () => void;
  onAddCreatorTag: (creatorId: string, label: string) => void;
  onRemoveCreatorTag: (creatorId: string, label: string) => void;
  selectedEmailTemplate: EmailTemplateKey;
  onSelectEmailTemplate: (value: EmailTemplateKey) => void;
  emailDraft: string;
  onEmailDraftChange: (value: string) => void;
  onSendCurrent: (templateLabel: string, draft: string, options: EmailSendOptions) => void;
  resultPopupOpen: boolean;
  onEndSearch: () => void;
  onCardChange?: (creatorId: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  expandedWidth: number;
  isResizing: boolean;
  onResizeStart: (clientX: number) => void;
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
};
