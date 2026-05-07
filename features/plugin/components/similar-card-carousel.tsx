"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, ChevronLeft, Zap } from "lucide-react";

import { InfluencerCard } from "@/features/plugin/components/influencer-card";
import { mapCardItemToInfluencerCard } from "@/features/plugin/components/influencer-card/map-card-item";
import { SimilarModePicker } from "@/features/plugin/components/similar-mode-picker";
import type { SimilarSearchModeKey } from "@/features/plugin/components/similar-search-module";

// ── Types ──────────────────────────────────────────────────────────────────

type FilterMode = "找相似" | "找平替" | "找种子达人";

// 找相似 6 维子分（spec §4.2）
interface SimilarSubscores {
  topic: number; // 内容主题 30%
  format: number; // 内容形式 25%
  visual: number; // 视觉调性 20%
  data: number; // 数据量级 15%
  activity: number; // 近期活跃 5%
  contact: number; // 可联系性 5%
}

// 找平替 4 维子分（spec §5.3）
interface AlternativeSubscores {
  similarity: number; // 相似度 40%
  costAdvantage: number; // 成本优势 35%
  dataPerformance: number; // 数据表现 20%
  contactabilityRisk: number; // 可联系性/风险 5%
}

interface SeedComparison {
  medianViews?: { seed: string; candidate: string };
  er?: { seed: string; candidate: string };
  price?: { seed: string; candidate: string };
  cpm?: { seed: string; candidate: string };
  cpe?: { seed: string; candidate: string };
  emailStatus?: string;
  systemConclusion?: string; // 系统结论文本
}

interface CardItem {
  id: string;
  name: string;
  email: string;
  tags: string[];
  country?: string;
  fans?: string;
  views?: string;
  er?: string;
  price?: string;
  score?: string;
  reason?: string;
  reasons?: string[];
  tradeoffs?: string[];
  savingPct?: string;
  seedPrice?: string;
  topics?: Array<{ label: string; weight?: number }>;
  medianComments?: string;
  medianLikes?: string;
  // ─ Spec §7.4 / §4.6 / §5.6 新增字段（全部可选，向后兼容）─
  subscores?: SimilarSubscores;
  altSubscores?: AlternativeSubscores;
  seedComparison?: SeedComparison;
  priceConfidenceLabel?: string; // e.g. "系统估算" / "用户填报"
  visualPending?: boolean; // §4.5 视觉异步未完成
  emailStatusLabel?: string; // e.g. "已验证" / "已找到" / "未找到"
  [key: string]: unknown;
}

const SCRAPE_COUNT_OPTIONS = [5, 10, 15] as const;
const COVER_COUNT_OPTIONS = [3, 5, 9] as const;
const SEARCH_SETTINGS_STORAGE_KEY = "2linkr:similar-search-settings:v1";
type ScrapeCountOption = (typeof SCRAPE_COUNT_OPTIONS)[number];
type CoverCountOption = (typeof COVER_COUNT_OPTIONS)[number];

type SearchSettingsState = {
  filterMode: FilterMode;
  scrapeCount: ScrapeCountOption;
  coverCount: CoverCountOption;
  dataCheckOn: boolean;
};

interface AnchorItem {
  id: string;
  handle: string;
  name: string;
  [key: string]: unknown;
}

interface SimilarCardCarouselProps {
  cards: CardItem[];
  anchor: AnchorItem;
  projectScopeId?: string;
  dataCheckOn?: boolean;
  scrapeCount?: number;
  savedCreatorIds: string[];
  creatorTagsById: Record<string, string[]>;
  onSave: (id: string) => void;
  onDismiss: (id: string) => void;
  onSeedCreator: (id: string) => void;
  onAddTag: (creatorId: string, label: string) => void;
  onRemoveTag: (creatorId: string, label: string) => void;
  onQuickScreen: () => void;
  onEndSearch: () => void;
  onCardChange?: (creatorId: string) => void;
  onToggleDataCheck?: () => void;
  onChangeScrapeCount?: (count: ScrapeCountOption) => void;
  onSendEmail?: (creatorId: string) => void;
  onViewDetail?: (creatorId: string) => void;
  /** Fired when an in-place reseed search completes; parent can update its anchor label. */
  onReseedComplete?: (newAnchorName: string) => void;
}

// ── Design tokens (Linkr 3 — see docs/DESIGN.md) ─────────────────────────────
// Legacy keys (terracotta/coral/parchment/etc.) are kept because consumers
// reference them by name; values point at the Linkr palette.

const TOKEN = {
  parchment: "#eceae3", // Light Sand
  ivory: "#fffdf9", // Off-White
  nearBlack: "#201515", // Linkr Black
  charcoal: "#36342e", // Dark Charcoal
  olive: "#36342e",
  stone: "#939084", // Warm Gray
  terracotta: "#ff4f00", // Linkr Orange
  coral: "#ff4f00",
  borderWarm: "#c5c0b1", // Sand
  borderCream: "#c5c0b1",
  sand: "#c5c0b1",
};

const modeOptions: FilterMode[] = ["找相似", "找平替", "找种子达人"];

function InlineCreatorAvatar({ name }: { name: string }) {
  const initial = (name.replace(/^@/, "")[0] ?? "?").toUpperCase();
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#c5c0b1] text-[9px] font-semibold"
      style={{
        background: "radial-gradient(circle at 30% 30%, #36342e 0%, #36342e 48%, #201515 100%)",
        color: "#fffefb",
        lineHeight: 1,
      }}
    >
      {initial}
    </span>
  );
}

// ── 3D card position helper ───────────────────────────────────────────────

function getCardStyle(diff: number) {
  if (diff === 0) return { x: 0, scale: 1, opacity: 1, zIndex: 10, rotateY: 0 };
  if (diff === 1) return { x: 28, scale: 0.94, opacity: 0.4, zIndex: 5, rotateY: -6 };
  if (diff === 2) return { x: 44, scale: 0.88, opacity: 0.18, zIndex: 2, rotateY: -10 };
  if (diff > 2) return { x: 56, scale: 0.84, opacity: 0, zIndex: 1, rotateY: -12 };
  return { x: -28, scale: 0.94, opacity: 0, zIndex: 0, rotateY: 6 };
}

// ── Component ──────────────────────────────────────────────────────────────

export function SimilarCardCarousel({
  cards,
  projectScopeId,
  dataCheckOn: controlledDataCheckOn,
  scrapeCount: controlledScrapeCount,
  savedCreatorIds,
  creatorTagsById,
  onSave,
  onDismiss,
  onSeedCreator,
  onAddTag,
  onRemoveTag,
  onQuickScreen,
  onEndSearch,
  onCardChange,
  onToggleDataCheck,
  onChangeScrapeCount,
  onSendEmail,
  onViewDetail,
  onReseedComplete,
}: SimilarCardCarouselProps) {
  const savedCount = savedCreatorIds.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favorited, setFavorited] = useState<Set<string>>(() => new Set(savedCreatorIds));
  const [filterMode, setFilterMode] = useState<FilterMode>("找相似");
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showSeedModePicker, setShowSeedModePicker] = useState(false);
  const [seedPickerMode, setSeedPickerMode] = useState<SimilarSearchModeKey>("comprehensive");
  const [isSeedSearching, setIsSeedSearching] = useState(false);
  const [seedProgress, setSeedProgress] = useState(0);
  const seedTimerRefs = useRef<number[]>([]);
  const [signalToast, setSignalToast] = useState<string | null>(null);
  const [localScrapeCount, setLocalScrapeCount] = useState<ScrapeCountOption>(10);
  const [scrapeMenuOpen, setScrapeMenuOpen] = useState(false);
  const [coverCount, setCoverCount] = useState<CoverCountOption>(3);
  const [coverMenuOpen, setCoverMenuOpen] = useState(false);
  const [localDataCheckOn, setLocalDataCheckOn] = useState(false);
  const [settingsReady, setSettingsReady] = useState(false);
  const settingsScopeId = projectScopeId ?? "global";
  const scrapeCount: ScrapeCountOption = SCRAPE_COUNT_OPTIONS.includes(
    controlledScrapeCount as ScrapeCountOption,
  )
    ? (controlledScrapeCount as ScrapeCountOption)
    : localScrapeCount;
  const dataCheckOn = controlledDataCheckOn ?? localDataCheckOn;

  const scrapeMenuRef = useRef<HTMLDivElement>(null);
  const coverMenuRef = useRef<HTMLDivElement>(null);

  // Sync saved state from parent
  useEffect(() => {
    setFavorited(new Set(savedCreatorIds));
  }, [savedCreatorIds]);

  // Reset cursor when card list changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [cards]);

  // Hydrate search settings by current project scope
  useEffect(() => {
    setSettingsReady(false);
    try {
      const raw = window.localStorage.getItem(SEARCH_SETTINGS_STORAGE_KEY);
      if (!raw) {
        setFilterMode("找相似");
        setLocalScrapeCount(10);
        setCoverCount(3);
        setLocalDataCheckOn(false);
        return;
      }
      const parsed = JSON.parse(raw) as Record<string, SearchSettingsState>;
      const scoped = parsed?.[settingsScopeId];
      if (!scoped) {
        setFilterMode("找相似");
        setLocalScrapeCount(10);
        setCoverCount(3);
        setLocalDataCheckOn(false);
        return;
      }
      setFilterMode(modeOptions.includes(scoped.filterMode) ? scoped.filterMode : "找相似");
      setLocalScrapeCount(
        SCRAPE_COUNT_OPTIONS.includes(scoped.scrapeCount) ? scoped.scrapeCount : 10,
      );
      setCoverCount(COVER_COUNT_OPTIONS.includes(scoped.coverCount) ? scoped.coverCount : 3);
      setLocalDataCheckOn(Boolean(scoped.dataCheckOn));
    } catch {
      setFilterMode("找相似");
      setLocalScrapeCount(10);
      setCoverCount(3);
      setLocalDataCheckOn(false);
    } finally {
      setSettingsReady(true);
    }
  }, [settingsScopeId]);

  // Persist search settings scoped to project
  useEffect(() => {
    if (!settingsReady) return;
    try {
      const raw = window.localStorage.getItem(SEARCH_SETTINGS_STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Record<string, SearchSettingsState>) : {};
      parsed[settingsScopeId] = {
        filterMode,
        scrapeCount,
        coverCount,
        dataCheckOn,
      };
      window.localStorage.setItem(SEARCH_SETTINGS_STORAGE_KEY, JSON.stringify(parsed));
    } catch {
      // no-op: keep UI responsive even if localStorage is unavailable
    }
  }, [settingsReady, settingsScopeId, filterMode, scrapeCount, coverCount, dataCheckOn]);

  // Notify parent when active card changes (drives TikTok profile + sidebar header)
  useEffect(() => {
    const card = cards[currentIndex];
    if (card) onCardChange?.(card.id);
  }, [currentIndex, cards, onCardChange]);

  // Click-outside to close 最近N条 dropdown
  useEffect(() => {
    if (!scrapeMenuOpen) return;
    const handleClick = (e: globalThis.MouseEvent) => {
      if (scrapeMenuRef.current && !scrapeMenuRef.current.contains(e.target as Node)) {
        setScrapeMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [scrapeMenuOpen]);

  // Click-outside to close 封面采样 dropdown
  useEffect(() => {
    if (!coverMenuOpen) return;
    const handleClick = (e: globalThis.MouseEvent) => {
      if (coverMenuRef.current && !coverMenuRef.current.contains(e.target as Node)) {
        setCoverMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [coverMenuOpen]);

  const currentCard = cards[currentIndex] ?? null;
  const hasMore = currentIndex < cards.length - 1;
  const currentSaved = currentCard ? favorited.has(currentCard.id) : false;
  const currentCreatorLabel = currentCard
    ? `@${currentCard.name.replace(/^@/, "")}`
    : "当前候选博主";
  const handleScrapeCountChange = (count: ScrapeCountOption) => {
    if (onChangeScrapeCount) {
      onChangeScrapeCount(count);
    } else {
      setLocalScrapeCount(count);
    }
    setScrapeMenuOpen(false);
  };

  const showSignalToast = (message: string) => {
    setSignalToast(message);
    window.setTimeout(() => setSignalToast(null), 1200);
  };

  const handleNo = () => {
    if (!currentCard) return;
    onDismiss(currentCard.id);
    showSignalToast("已标记 No，将降低这类相似特征权重");
    if (hasMore) setCurrentIndex((p) => p + 1);
  };

  const handleSaveSignal = () => {
    if (!currentCard) return;
    if (!favorited.has(currentCard.id)) {
      setFavorited((prev) => {
        const next = new Set(prev);
        next.add(currentCard.id);
        return next;
      });
      onSave(currentCard.id);
    }
    showSignalToast("已收藏，将强化这类相似特征权重");
    if (hasMore) setCurrentIndex((p) => p + 1);
  };

  const handleFindSimilarFromCurrent = () => {
    if (!currentCard) return;
    setShowSeedModePicker(true);
  };

  const runSeedSearch = (newAnchorName: string) => {
    seedTimerRefs.current.forEach((t) => window.clearTimeout(t));
    seedTimerRefs.current = [];
    setIsSeedSearching(true);
    setSeedProgress(8);
    [26, 48, 73, 91].forEach((value, index) => {
      const t = window.setTimeout(() => setSeedProgress(value), 220 + index * 260);
      seedTimerRefs.current.push(t);
    });
    const done = window.setTimeout(() => {
      setSeedProgress(100);
      setIsSeedSearching(false);
      setCurrentIndex(0);
      onReseedComplete?.(newAnchorName);
    }, 1450);
    seedTimerRefs.current.push(done);
  };

  const handleEndConfirm = () => {
    setShowEndConfirm(false);
    onEndSearch();
  };

  return (
    <div className="relative mx-auto w-full" style={{ maxWidth: "100%" }}>
      {/* ── Top row ── */}
      <div className="mb-2.5 flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() => setShowEndConfirm(true)}
          title="结束找相似"
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all active:scale-[0.97]"
          style={{
            background: TOKEN.ivory,
            border: `1px solid ${TOKEN.borderWarm}`,
            color: TOKEN.stone,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "#eceae3";
            (e.currentTarget as HTMLElement).style.color = TOKEN.terracotta;
            (e.currentTarget as HTMLElement).style.borderColor = "#b5b2aa";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = TOKEN.ivory;
            (e.currentTarget as HTMLElement).style.color = TOKEN.stone;
            (e.currentTarget as HTMLElement).style.borderColor = TOKEN.borderWarm;
          }}
        >
          <ChevronLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>退出</span>
        </button>

        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums"
          style={{
            background: TOKEN.ivory,
            color: TOKEN.stone,
            border: `1px solid ${TOKEN.borderWarm}`,
          }}
          title="当前项目中已收藏的候选博主人数"
        >
          <Heart
            className="h-3 w-3 shrink-0"
            aria-hidden
            style={{
              color: savedCount > 0 ? TOKEN.terracotta : TOKEN.stone,
              fill: savedCount > 0 ? TOKEN.terracotta : "none",
              opacity: savedCount > 0 ? 0.9 : 0.55,
            }}
          />
          <span>已收藏 {savedCount} 人</span>
        </span>
      </div>

      {/* ── 3D Card carousel ── */}
      <div
        className="relative mb-4 w-full"
        style={{
          height: "660px",
          perspective: "1400px",
        }}
      >
        {cards.map((card, index) => {
          const diff = index - currentIndex;
          const style = getCardStyle(diff);
          const isCurrent = index === currentIndex;

          return (
            <motion.div
              key={card.id}
              className="absolute top-0 left-1/2"
              style={{
                width: "min(320px, 100%)",
                marginLeft: "min(-160px, -50%)",
                transformStyle: "preserve-3d",
              }}
              initial={false}
              animate={{
                x: style.x,
                scale: style.scale,
                opacity: style.opacity,
                zIndex: style.zIndex,
                rotateY: style.rotateY,
              }}
              transition={{ type: "spring", stiffness: 260, damping: 28, mass: 0.8 }}
            >
              <InfluencerCard
                data={mapCardItemToInfluencerCard(card, {
                  scrapeCount,
                  coverCount,
                  perspective: dataCheckOn,
                  userTags: creatorTagsById[card.id] ?? [],
                })}
                filterMode={filterMode}
                onAddTag={(label) => onAddTag(card.id, label)}
                onRemoveTag={(label) => onRemoveTag(card.id, label)}
                onEditTag={(oldLabel, newLabel) => {
                  onRemoveTag(card.id, oldLabel);
                  if (newLabel.trim()) onAddTag(card.id, newLabel.trim());
                }}
                onOpenAnalysis={() => {
                  if (!isCurrent) return;
                  onViewDetail?.(card.id);
                }}
                onSendEmail={
                  typeof card.email === "string" && card.email.trim().length > 0
                    ? () => {
                        if (onSendEmail) {
                          onSendEmail(card.id);
                        } else if (typeof card.email === "string") {
                          window.location.href = `mailto:${card.email}`;
                        }
                      }
                    : undefined
                }
                onChangeScrapeCount={handleScrapeCountChange}
                onChangeCoverCount={setCoverCount}
                onTogglePerspective={() => {
                  if (onToggleDataCheck) {
                    onToggleDataCheck();
                  } else {
                    setLocalDataCheckOn((prev) => !prev);
                  }
                }}
              />
            </motion.div>
          );
        })}

        {/* Empty state */}
        {cards.length === 0 && (
          <div
            className="absolute inset-0 flex items-center justify-center text-sm"
            style={{ color: TOKEN.stone }}
          >
            暂无推荐结果
          </div>
        )}

        {/* ── End-search confirm — overlaid on the card area ── */}
        <AnimatePresence>
          {showEndConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 z-20 flex items-center justify-center"
              style={{
                background: "rgba(245,244,237,0.88)",
                backdropFilter: "blur(6px)",
                borderRadius: "inherit",
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowEndConfirm(false);
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.93, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.93, y: 8 }}
                transition={{ type: "spring", stiffness: 360, damping: 28 }}
                className="mx-4 rounded-2xl px-5 py-5"
                style={{
                  background: "#fffefb",
                  border: `1px solid ${TOKEN.borderWarm}`,
                  width: "calc(100% - 32px)",
                }}
              >
                <p className="text-center text-sm font-semibold" style={{ color: TOKEN.nearBlack }}>
                  确定要结束找相似进程吗？
                </p>
                <p className="mt-1.5 text-center text-xs leading-5" style={{ color: TOKEN.stone }}>
                  结束后，搜索结果将会清空，仅保留搜索设置。
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEndConfirm(false)}
                    className="flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors"
                    style={{
                      background: TOKEN.parchment,
                      border: `1px solid ${TOKEN.borderWarm}`,
                      color: TOKEN.charcoal,
                    }}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={handleEndConfirm}
                    className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors"
                    style={{
                      background: TOKEN.terracotta,
                      color: "#fffefb",
                    }}
                  >
                    确认结束
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Signal toast — centered over the card area so it stays clear of bottom actions */}
        <AnimatePresence>
          {signalToast && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="pointer-events-none absolute inset-x-0 top-1/2 z-30 flex -translate-y-1/2 items-center justify-center px-4"
            >
              <span
                className="rounded-full px-3.5 py-1.5 text-xs font-semibold"
                style={{
                  backgroundColor: "rgba(32, 21, 21, 0.92)",
                  color: "#fffefb",
                  backdropFilter: "blur(6px)",
                }}
              >
                {signalToast}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottom actions ── */}
      <div className="mx-auto -mt-4 w-full space-y-2" style={{ maxWidth: "min(320px, 100%)" }}>
        {/* Primary actions row */}
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={handleNo}
            disabled={!currentCard}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl py-2 text-xs font-medium transition-all disabled:opacity-40"
            style={{
              background: "#eceae3",
              border: "1px solid #b5b2aa",
              color: TOKEN.charcoal,
            }}
            title="不感兴趣：后续推荐会降低这类相似特征权重"
          >
            <X className="h-3.5 w-3.5" />
            <span>No</span>
          </button>

          <button
            type="button"
            onClick={handleSaveSignal}
            disabled={!currentCard}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl py-2 text-xs font-semibold transition-all disabled:opacity-40"
            style={{
              background: currentSaved ? "#fff7f4" : TOKEN.ivory,
              border: `1px solid ${TOKEN.sand}`,
              color: currentSaved ? TOKEN.terracotta : TOKEN.charcoal,
            }}
            title="感兴趣：后续推荐会强化这类相似特征权重"
          >
            <Heart
              className="h-3.5 w-3.5"
              style={{
                fill: currentSaved ? TOKEN.terracotta : "none",
              }}
            />
            <span>{currentSaved ? "已收藏" : "收藏"}</span>
          </button>
        </div>

        {/* Secondary action row */}
        <div className="flex">
          <button
            type="button"
            onClick={handleFindSimilarFromCurrent}
            disabled={!currentCard}
            className="flex w-full min-w-0 items-center justify-center gap-1 rounded-xl py-2 text-xs font-semibold transition-all disabled:opacity-40"
            style={{
              background: TOKEN.terracotta,
              color: "#fffefb",
            }}
            title={`根据 ${currentCreatorLabel} 重新寻找相似博主`}
            aria-label={`根据 ${currentCreatorLabel} 找相似`}
          >
            <span>根据</span>
            {currentCard ? <InlineCreatorAvatar name={currentCard.name} /> : null}
            <span>找相似</span>
          </button>
        </div>

        {/* Quick switch */}
        <button
          type="button"
          onClick={onQuickScreen}
          className="flex w-full items-center justify-center gap-1 py-1.5 text-xs font-medium transition-colors"
          style={{ color: TOKEN.stone }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = TOKEN.charcoal;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = TOKEN.stone;
          }}
        >
          <Zap className="h-3.5 w-3.5" />
          <span>切换到快速筛选</span>
        </button>
      </div>

      {/* Mode picker — shown when user taps "根据 TA 找相似" in the carousel */}
      <SimilarModePicker
        open={showSeedModePicker}
        selectedMode={seedPickerMode}
        onSelect={(mode) => {
          setSeedPickerMode(mode);
          setShowSeedModePicker(false);
          if (!currentCard) return;
          if (mode === "seed") {
            onSeedCreator(currentCard.id);
          } else {
            runSeedSearch(currentCard.name);
          }
        }}
        onClose={() => setShowSeedModePicker(false)}
        actionSubjectLabel={currentCard?.name ?? "当前博主"}
        actionSubject={currentCard ? <InlineCreatorAvatar name={currentCard.name} /> : undefined}
      />

      {/* In-place search overlay — shown while reseeding without leaving the carousel */}
      <AnimatePresence>
        {isSeedSearching ? (
          <motion.div
            key="seed-searching"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-[4px]"
            style={{ backgroundColor: "rgba(255, 254, 251, 0.85)", borderRadius: "inherit" }}
          >
            <div className="w-full max-w-[88%] rounded-[8px] border border-[#c5c0b1] bg-[#fffefb] px-5 py-5">
              <div className="mb-3 text-[13px] font-semibold text-[#201515]">正在为你寻找...</div>
              <div className="h-2 overflow-hidden rounded-full bg-[#c5c0b1]">
                <motion.div
                  className="h-full rounded-full bg-[#ff4f00]"
                  animate={{ width: `${seedProgress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-[#939084]">
                <span>正在分析内容、调性与受众信号</span>
                <span>{seedProgress}%</span>
              </div>
              <div className="mt-1 text-[10.5px] text-[#939084]">
                预计 {seedPickerMode === "budget" ? "6–10s" : "8–12s"}，请稍候
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
