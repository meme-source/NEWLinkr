"use client";

import { useState, useEffect, useRef, type MouseEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  X,
  ChevronDown,
  Zap,
  ArrowLeftRight,
  ArrowUpRight,
  Check,
  Mail,
  Sparkles,
  Send,
  Loader2,
  Info,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type FilterMode = "找相似" | "找平替" | "找种子达人";

// 找相似 6 维子分（spec §4.2）
interface SimilarSubscores {
  topic: number;     // 内容主题 30%
  format: number;    // 内容形式 25%
  visual: number;    // 视觉调性 20%
  data: number;      // 数据量级 15%
  activity: number;  // 近期活跃 5%
  contact: number;   // 可联系性 5%
}

// 找平替 4 维子分（spec §5.3）
interface AlternativeSubscores {
  similarity: number;        // 相似度 40%
  costAdvantage: number;     // 成本优势 35%
  dataPerformance: number;   // 数据表现 20%
  contactabilityRisk: number;// 可联系性/风险 5%
}

// 找平替详情：与当前博主对比
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
  visualPending?: boolean;       // §4.5 视觉异步未完成
  emailStatusLabel?: string;     // e.g. "已验证" / "已找到" / "未找到"
  [key: string]: unknown;
}

const SCRAPE_COUNT_OPTIONS = [5, 10, 15] as const;
const COVER_COUNT_OPTIONS = [0, 3, 5] as const;
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
}

// ── Design tokens (Claude/Anthropic system) ────────────────────────────────

const TOKEN = {
  parchment: "#f5f4ed",
  ivory: "#faf9f5",
  nearBlack: "#141413",
  charcoal: "#4d4c48",
  olive: "#5e5d59",
  stone: "#87867f",
  terracotta: "#c96442",
  coral: "#d97757",
  borderWarm: "#e8e6dc",
  borderCream: "#f0eee6",
  sand: "#e8e6dc",
};

const modeDetails: Record<
  FilterMode,
  { emoji: string; desc: string; color: string; bg: string; border: string }
> = {
  找相似: {
    emoji: "🪞",
    desc: "风格、粉丝画像高度一致的博主",
    color: TOKEN.terracotta,
    bg: "#fef3e8",
    border: "#f5d0a9",
  },
  找平替: {
    emoji: "💰",
    desc: "报价更低、效果相当的替代博主",
    color: "#7a5c1e",
    bg: "#fdf8ed",
    border: "#e8d5a0",
  },
  找种子达人: {
    emoji: "🌱",
    desc: "低重合、高潜力的种子达人",
    color: "#2d6a35",
    bg: "#eef6ef",
    border: "#b8d9bb",
  },
};

const modeOptions: FilterMode[] = ["找相似", "找平替", "找种子达人"];

function countryToFlagEmoji(country?: string): string {
  if (!country) return "🏳";
  const raw = country.trim();
  if (!raw) return "🏳";
  const upper = raw.toUpperCase();

  const directCode = upper.match(/\b([A-Z]{2})\b/)?.[1];
  const code = directCode ?? (() => {
    const map: Record<string, string> = {
      中国: "CN",
      CHINA: "CN",
      美国: "US",
      USA: "US",
      "UNITED STATES": "US",
      英国: "GB",
      UK: "GB",
      "GREAT BRITAIN": "GB",
      日本: "JP",
      JAPAN: "JP",
      韩国: "KR",
      "SOUTH KOREA": "KR",
      德国: "DE",
      GERMANY: "DE",
      法国: "FR",
      FRANCE: "FR",
      意大利: "IT",
      ITALY: "IT",
      西班牙: "ES",
      SPAIN: "ES",
      加拿大: "CA",
      CANADA: "CA",
      澳大利亚: "AU",
      AUSTRALIA: "AU",
      新加坡: "SG",
      SINGAPORE: "SG",
      马来西亚: "MY",
      MALAYSIA: "MY",
      泰国: "TH",
      THAILAND: "TH",
      越南: "VN",
      VIETNAM: "VN",
      印度尼西亚: "ID",
      INDONESIA: "ID",
      菲律宾: "PH",
      PHILIPPINES: "PH",
      印度: "IN",
      INDIA: "IN",
      巴西: "BR",
      BRAZIL: "BR",
      墨西哥: "MX",
      MEXICO: "MX",
      俄罗斯: "RU",
      RUSSIA: "RU",
      土耳其: "TR",
      TURKEY: "TR",
      阿联酋: "AE",
      UAE: "AE",
      沙特: "SA",
      "SAUDI ARABIA": "SA",
    };
    return map[upper];
  })();

  if (!code || code.length !== 2) return "🏳";
  const A = 0x1f1e6;
  const first = code.charCodeAt(0) - 65;
  const second = code.charCodeAt(1) - 65;
  if (first < 0 || first > 25 || second < 0 || second > 25) return "🏳";
  return String.fromCodePoint(A + first, A + second);
}

// Warm tag palette aligned with Claude design system
const tagColors = [
  { bg: "#fef3e8", border: "#f5d0a9", color: "#c96442" },   // terracotta
  { bg: "#f0f4ff", border: "#c7d7f7", color: "#3670c9" },   // muted blue
  { bg: "#eef6ef", border: "#b8d9bb", color: "#2d6a35" },   // warm green
];

// ── Avatar helper (initials, no external images) ───────────────────────────

function CreatorInitials({
  name,
  size = 76,
  fontSize = 28,
}: {
  name: string;
  size?: number;
  fontSize?: number;
}) {
  const initial = (name.replace(/^@/, "")[0] ?? "?").toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "radial-gradient(circle at 30% 30%, #f6ddd1 0%, #d3b4a2 45%, #9c7c70 100%)",
        border: "3px solid #ffffff",
        boxShadow: "0 8px 24px rgba(20,20,19,0.14)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: "Georgia, serif",
          fontSize,
          fontWeight: 600,
          color: "#ffffff",
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}
      >
        {initial}
      </span>
    </div>
  );
}

function InlineCreatorAvatar({ name }: { name: string }) {
  const initial = (name.replace(/^@/, "")[0] ?? "?").toUpperCase();
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/80 text-[9px] font-semibold shadow-[0_2px_6px_rgba(20,20,19,0.18)]"
      style={{
        background: "radial-gradient(circle at 30% 30%, #f6ddd1 0%, #d3b4a2 48%, #9c7c70 100%)",
        color: "#ffffff",
        lineHeight: 1,
      }}
    >
      {initial}
    </span>
  );
}

function CarouselTagRow({
  tags,
  onAdd,
  onEdit,
  onRemove,
}: {
  tags: string[];
  onAdd: (label: string) => void;
  onEdit: (oldLabel: string, newLabel: string) => void;
  onRemove: (label: string) => void;
}) {
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [adding, setAdding] = useState(false);
  const [addValue, setAddValue] = useState("");
  const addInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const MAX_TAGS = 3;

  useEffect(() => {
    if (adding) addInputRef.current?.focus();
  }, [adding]);

  useEffect(() => {
    if (editingLabel !== null) editInputRef.current?.select();
  }, [editingLabel]);

  const commitEdit = () => {
    if (editingLabel !== null) {
      onEdit(editingLabel, editValue);
      setEditingLabel(null);
    }
  };

  const commitAdd = () => {
    const value = addValue.trim();
    if (value) onAdd(value);
    setAddValue("");
    setAdding(false);
  };

  const getTagStyle = (tag: string) => {
    const index =
      Array.from(tag).reduce((sum, char) => sum + char.charCodeAt(0), 0) % tagColors.length;
    return tagColors[index];
  };

  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-2 px-4">
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#b0aea6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="self-center shrink-0"
      >
        <path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.71-7.71a1 1 0 0 0 0-1.41z" />
        <circle cx="7" cy="7" r="1" fill="#b0aea6" stroke="none" />
      </svg>

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1 overflow-hidden rounded-[14px] border border-[#e8e6dc] bg-white px-2 py-1">
        {tags.length === 0 && !adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#d1cfc5] px-2 py-0.5 text-xs text-[#b0aea6] transition-colors hover:border-[#c96442]/40 hover:text-[#c96442]"
          >
            <span>+ 添加标签</span>
          </button>
        ) : null}

        {tags.map((tag) => {
          const isEditing = editingLabel === tag;
          const style = getTagStyle(tag);
          return (
            <span
              key={tag}
              onClick={() => {
                if (!isEditing) {
                  setEditingLabel(tag);
                  setEditValue(tag);
                }
              }}
              className="inline-flex max-w-full cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-all"
              style={{
                background: style.bg,
                borderColor: style.border,
                color: style.color,
              }}
            >
              {isEditing ? (
                <input
                  ref={editInputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit();
                    if (e.key === "Escape") setEditingLabel(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{ width: Math.max(editValue.length, 3) * 7 + 4 }}
                  className="min-w-[24px] bg-transparent text-xs outline-none"
                />
              ) : (
                <>
                  <span className="max-w-full truncate">{tag}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(tag);
                    }}
                    className="ml-0.5 shrink-0 leading-none opacity-50 transition-opacity hover:opacity-100"
                    aria-label={`删除标签 ${tag}`}
                  >
                    ×
                  </button>
                </>
              )}
            </span>
          );
        })}

        {adding ? (
          <input
            ref={addInputRef}
            value={addValue}
            onChange={(e) => setAddValue(e.target.value)}
            onBlur={commitAdd}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitAdd();
              if (e.key === "Escape") {
                setAdding(false);
                setAddValue("");
              }
            }}
            placeholder="标签…"
            style={{ width: Math.max(addValue.length, 4) * 7 + 20 }}
            className="min-w-[48px] bg-transparent text-xs text-[#141413] outline-none placeholder:text-[#b0aea6]"
          />
        ) : null}

        {tags.length < MAX_TAGS && !adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="ml-auto shrink-0 self-center text-sm leading-none text-[#b0aea6] transition-colors hover:text-[#c96442]"
            aria-label="添加标签"
          >
            +
          </button>
        ) : null}
      </div>
    </div>
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
}: SimilarCardCarouselProps) {
  const savedCount = savedCreatorIds.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favorited, setFavorited] = useState<Set<string>>(() => new Set(savedCreatorIds));
  const [filterMode, setFilterMode] = useState<FilterMode>("找相似");
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [signalToast, setSignalToast] = useState<string | null>(null);
  const [modeSwitchFeedback, setModeSwitchFeedback] = useState(false);
  const [localScrapeCount, setLocalScrapeCount] = useState<ScrapeCountOption>(10);
  const [scrapeMenuOpen, setScrapeMenuOpen] = useState(false);
  const [coverCount, setCoverCount] = useState<CoverCountOption>(3);
  const [coverMenuOpen, setCoverMenuOpen] = useState(false);
  const [localDataCheckOn, setLocalDataCheckOn] = useState(false);
  const [settingsReady, setSettingsReady] = useState(false);
  const settingsScopeId = projectScopeId ?? "global";
  const scrapeCount: ScrapeCountOption = SCRAPE_COUNT_OPTIONS.includes(
    controlledScrapeCount as ScrapeCountOption
  )
    ? (controlledScrapeCount as ScrapeCountOption)
    : localScrapeCount;
  const dataCheckOn = controlledDataCheckOn ?? localDataCheckOn;

  const modeMenuRef = useRef<HTMLDivElement>(null);
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
        SCRAPE_COUNT_OPTIONS.includes(scoped.scrapeCount) ? scoped.scrapeCount : 10
      );
      setCoverCount(
        COVER_COUNT_OPTIONS.includes(scoped.coverCount) ? scoped.coverCount : 3
      );
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

  // Click-outside to close mode menu
  useEffect(() => {
    if (!showModeMenu) return;
    const handleClick = (e: globalThis.MouseEvent) => {
      if (modeMenuRef.current && !modeMenuRef.current.contains(e.target as Node)) {
        setShowModeMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showModeMenu]);

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
  const currentCreatorLabel = currentCard ? `@${currentCard.name.replace(/^@/, "")}` : "当前候选博主";
  const toggleDataCheck = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (onToggleDataCheck) {
      onToggleDataCheck();
      return;
    }
    setLocalDataCheckOn((prev) => !prev);
  };

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
    onSeedCreator(currentCard.id);
  };

  const handleSendEmail = () => {
    if (!currentCard) return;
    if (onSendEmail) {
      onSendEmail(currentCard.id);
      return;
    }
    if (typeof currentCard.email === "string" && currentCard.email.trim().length > 0) {
      window.location.href = `mailto:${currentCard.email}`;
      showSignalToast("已打开邮件草稿");
    } else {
      showSignalToast("暂未找到邮箱");
    }
  };

  const handleViewDetail = () => {
    if (!currentCard) return;
    if (onViewDetail) {
      onViewDetail(currentCard.id);
      return;
    }
    setShowDetail(true);
  };

  const handleSelectMode = (mode: FilterMode) => {
    setFilterMode(mode);
    setShowModeMenu(false);
    setCurrentIndex(0);
    setModeSwitchFeedback(true);
    window.setTimeout(() => setModeSwitchFeedback(false), 700);
    if (currentCard) {
      onSeedCreator(currentCard.id);
    }
  };

  const handleSeedJump = () => {
    setFilterMode("找种子达人");
    setShowModeMenu(false);
    onQuickScreen();
  };

  const handleEndConfirm = () => {
    setShowEndConfirm(false);
    onEndSearch();
  };

  return (
    <div className="w-full mx-auto" style={{ maxWidth: "100%" }}>
      {/* ── Top row ── */}
      <div className="flex items-center justify-between mb-2.5 px-1">
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

        {/* Merged mode selector + end */}
        <div className="relative flex items-center gap-1.5" ref={modeMenuRef}>
          <button
            type="button"
            onClick={() => setShowModeMenu((p) => !p)}
            title="切换并执行模式"
            className="group inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-medium transition-all"
            style={{
              background: modeSwitchFeedback ? "#fef3e8" : TOKEN.ivory,
              border: `1px solid ${modeSwitchFeedback ? "#f5d0a9" : TOKEN.borderWarm}`,
              color: modeSwitchFeedback ? TOKEN.terracotta : TOKEN.stone,
            }}
          >
            <span>{modeDetails[filterMode].emoji}</span>
            <span>{filterMode}</span>
            <ArrowLeftRight className="h-3.5 w-3.5" />
            {filterMode === "找种子达人" ? (
              <span className="inline-flex items-center gap-0.5 rounded-full border border-[#b8d9bb] bg-[#eef6ef] px-1.5 py-0.5 text-[10px] font-semibold text-[#2d6a35]">
                <span>跳转</span>
                <ArrowUpRight className="h-2.5 w-2.5" />
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setShowEndConfirm(true)}
            title="结束找相似"
            className="p-2 rounded-full transition-all"
            style={{
              background: TOKEN.ivory,
              border: `1px solid ${TOKEN.borderWarm}`,
              color: TOKEN.stone,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#fef3e8";
              (e.currentTarget as HTMLElement).style.color = TOKEN.terracotta;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = TOKEN.ivory;
              (e.currentTarget as HTMLElement).style.color = TOKEN.stone;
            }}
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Mode dropdown */}
          <AnimatePresence>
            {showModeMenu && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.14 }}
                className="absolute top-full right-0 mt-2 rounded-2xl py-1.5 z-50"
                style={{
                  minWidth: "152px",
                  background: TOKEN.ivory,
                  border: `1px solid ${TOKEN.borderWarm}`,
                  boxShadow: "0 12px 40px -12px rgba(20,20,19,0.18)",
                }}
              >
                {modeOptions.map((mode) => (
                  <div
                    key={mode}
                    className="group relative flex w-full items-center gap-1 px-1.5 py-1 transition-colors"
                    style={{ background: "transparent" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = TOKEN.parchment;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectMode(mode)}
                      className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-left text-sm transition-colors"
                      style={{
                        color: filterMode === mode ? TOKEN.terracotta : TOKEN.olive,
                        fontWeight: filterMode === mode ? 600 : 400,
                        background: "transparent",
                      }}
                    >
                      <span className="inline-flex min-w-0 items-center gap-1">
                        <span>{modeDetails[mode].emoji}</span>
                        <span className="truncate">{mode}</span>
                      </span>
                      {filterMode === mode ? (
                        <Check className="h-3.5 w-3.5 shrink-0" style={{ color: TOKEN.terracotta }} />
                      ) : null}
                    </button>
                    {mode === "找种子达人" ? (
                      <button
                        type="button"
                        className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-[#b8d9bb] bg-[#eef6ef] px-1.5 py-0.5 text-[10px] font-semibold text-[#2d6a35]"
                        onClick={handleSeedJump}
                      >
                        <span>跳转</span>
                        <ArrowUpRight className="h-2.5 w-2.5" />
                      </button>
                    ) : null}
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute left-1/2 top-full z-40 mt-1 w-max max-w-[220px] -translate-x-1/2 rounded-[10px] border border-[#e8e6dc] bg-white px-2 py-1.5 text-[10.5px] leading-[1.5] text-[#4d4c48] opacity-0 shadow-[0_12px_30px_-18px_rgba(77,76,72,0.35)] transition-opacity group-hover:opacity-100"
                    >
                      {modeDetails[mode].desc}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── 3D Card carousel ── */}
      <div
        className="relative w-full mb-4"
        style={{ height: "520px", perspective: "1400px" }}
      >
        {cards.map((card, index) => {
          const diff = index - currentIndex;
          const style = getCardStyle(diff);
          const isCurrent = index === currentIndex;

          return (
            <motion.div
              key={card.id}
              className="absolute left-1/2 top-0"
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
              <div
                className="rounded-3xl overflow-hidden flex flex-col"
                style={{
                  height: "500px",
                  background: "linear-gradient(160deg, #ffffff 0%, #faf9f5 100%)",
                  border: `1px solid ${TOKEN.borderWarm}`,
                  boxShadow:
                    "0 0 0 1px rgba(232,230,220,0.58), 0 14px 40px -13px rgba(20,20,19,0.13)",
                  position: "relative",
                }}
              >
                {/* ── Top strip: index + score badge ── */}
                <div className="flex items-center justify-between px-4 pt-3">
                  <span
                    style={{
                      fontFamily: "Georgia, serif",
                      color: TOKEN.stone,
                      fontSize: "11px",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {currentIndex + 1} / {cards.length}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {card.visualPending ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9.5px] font-medium"
                        style={{
                          background: "#f5f1e7",
                          color: TOKEN.olive,
                          border: `1px solid ${TOKEN.borderWarm}`,
                        }}
                        title="封面视觉分析未就绪：当前用 5 维评分，完成后自动刷新"
                      >
                        <Loader2 className="h-2.5 w-2.5 animate-spin" />
                        视觉分析中
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* ── Identity row: avatar + handle + meta + score ── */}
                <div className="flex items-center gap-2.5 px-4 pt-1">
                  <CreatorInitials name={card.name} size={44} fontSize={18} />
                  <div className="flex-1 min-w-0">
                    <p
                      className="truncate"
                      style={{
                        fontFamily: "Georgia, serif",
                        color: TOKEN.nearBlack,
                        fontSize: "16px",
                        fontWeight: 600,
                        lineHeight: 1.15,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      @{card.name.replace(/^@/, "")}
                    </p>
                    <div
                      className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5"
                      style={{ color: TOKEN.stone, fontSize: "10.5px", lineHeight: 1.3 }}
                    >
                      {card.country ? (
                        <span className="inline-flex items-center gap-0.5">
                          <span
                            aria-hidden
                            className="inline-flex h-3 w-3 items-center justify-center text-[10px] leading-none"
                          >
                            {countryToFlagEmoji(card.country)}
                          </span>
                          {card.country}
                        </span>
                      ) : null}
                      {card.country ? <span style={{ color: TOKEN.borderWarm }}>·</span> : null}
                      <span
                        className="inline-flex items-center gap-0.5"
                        style={{ color: card.email ? "#2d6a35" : TOKEN.stone }}
                        title={typeof card.email === "string" ? card.email : undefined}
                      >
                        {typeof card.email === "string" && card.email.trim().length > 0 ? (
                          <>
                            <button
                              type="button"
                              className="inline-flex items-center justify-center rounded-full transition-colors hover:bg-[#eef6ef]"
                              style={{ width: 16, height: 16, color: "#2d6a35" }}
                              aria-label="邮件建联"
                              title={`邮件建联 ${card.email}`}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleSendEmail();
                              }}
                            >
                              <Send className="w-3 h-3" />
                            </button>
                            <span>邮箱已找到</span>
                          </>
                        ) : (
                          <>
                            <Mail className="w-2.5 h-2.5" />
                            <span>邮箱未找到</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="group relative shrink-0">
                    <button
                      type="button"
                      aria-label="打开博主分析"
                      onClick={handleViewDetail}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-[10px] border border-[#edd9ce] bg-[linear-gradient(180deg,#fffdfa_0%,#f8efe8_100%)] text-[#c96442] shadow-[0_10px_24px_-20px_rgba(201,100,66,0.55)] transition-all duration-150 hover:-translate-y-[1px] hover:border-[#d9b6a6] hover:bg-[#fff7f1] hover:text-[#b85a39] active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-[#c96442]/20"
                      title="打开博主分析"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                    </button>
                    <span className="pointer-events-none absolute right-0 top-full z-20 mt-1.5 whitespace-nowrap rounded-[10px] bg-[#141413] px-2.5 py-1 text-[10px] text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                      博主分析
                    </span>
                  </div>
                </div>

                {/* ── Compact metric strip ── */}
                <div
                  className="relative z-10 mx-4 mt-3 grid h-[66px] shrink-0 grid-cols-4 overflow-hidden rounded-[26px]"
                  style={{
                    background: "#fffdf8",
                    border: `1px solid ${TOKEN.borderWarm}`,
                    boxShadow: "0 1px 0 rgba(255,255,255,0.72) inset",
                  }}
                >
                  <CompactMetric
                    label="预估报价"
                    value={card.price ?? "—"}
                    estimated
                    highlight={filterMode === "找平替"}
                    hint={
                      filterMode === "找平替" && card.seedPrice
                        ? `预估报价 ~${card.price ?? "—"}，当前博主 ${card.seedPrice}`
                        : "系统估算，建议建联确认"
                    }
                  />
                  <CompactMetric label="中位点赞" value={card.medianLikes ?? "—"} divider />
                  <CompactMetric label="中位评论" value={card.medianComments ?? "—"} divider />
                  <CompactMetric
                    label="互动率"
                    value={card.er ?? "—"}
                    divider
                  />
                </div>

                <CarouselTagRow
                  tags={creatorTagsById[card.id] ?? []}
                  onAdd={(label) => onAddTag(card.id, label)}
                  onEdit={(oldLabel, newLabel) => {
                    onRemoveTag(card.id, oldLabel);
                    if (newLabel.trim()) onAddTag(card.id, newLabel.trim());
                  }}
                  onRemove={(label) => onRemoveTag(card.id, label)}
                />

                {/* ── Saving banner (找平替 only) ── */}
                {filterMode === "找平替" && card.savingPct ? (
                  <div
                    className="mx-4 mt-3 flex items-baseline gap-2 rounded-xl px-3 py-2"
                    style={{
                      background: "linear-gradient(120deg, #f0f7f1 0%, #eef6ef 100%)",
                      border: "1px solid #c4ddc7",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "Georgia, serif",
                        color: "#2d6a35",
                        fontSize: "14px",
                        fontWeight: 700,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      省 {card.savingPct}
                    </span>
                    <span style={{ fontSize: "10.5px", color: "#4d7a55", lineHeight: 1.3 }}>
                      {card.price ?? "—"}
                      <span style={{ color: "#8aae93", margin: "0 4px" }}>vs 当前</span>
                      {card.seedPrice ?? "—"}
                    </span>
                  </div>
                ) : null}

                {/* ── 为什么推荐 / 为什么是平替 ── 子分维度可视化（spec §4.6 / §5.6 内联版） */}
                {(() => {
                  const heading = filterMode === "找平替" ? "为什么是平替" : "深度分析";
                  const accent = filterMode === "找平替" ? "#7a5c1e" : TOKEN.terracotta;
                  const accentBg = filterMode === "找平替" ? "#fdf8ed" : "#fef3e8";
                  const reasonsList =
                    card.reasons && card.reasons.length > 0
                      ? card.reasons
                      : card.reason
                      ? [card.reason]
                      : [];

                  // 构造维度行：label + score + reason 文本（按 reasons 顺序映射）
                  type DimRow = {
                    key: string;
                    label: string;
                    weightLabel: string;
                    score: number;
                    note?: string;
                  };
                  let rows: DimRow[] = [];
                  if (filterMode === "找平替" && card.altSubscores) {
                    const s = card.altSubscores;
                    rows = [
                      { key: "similarity", label: "综合相似度", weightLabel: "40%", score: s.similarity, note: reasonsList[0] },
                      { key: "cost",       label: "成本优势",    weightLabel: "35%", score: s.costAdvantage, note: reasonsList[1] ?? (card.savingPct ? `预估省 ${card.savingPct}` : undefined) },
                      { key: "data",       label: "数据表现",    weightLabel: "20%", score: s.dataPerformance, note: reasonsList[2] },
                      { key: "risk",       label: "可联系/风险",  weightLabel: "5%",  score: s.contactabilityRisk, note: card.emailStatusLabel ? `邮箱${card.emailStatusLabel}` : undefined },
                    ];
                  } else if (filterMode !== "找平替" && card.subscores) {
                    const s = card.subscores;
                    rows = [
                      { key: "topic",    label: "内容主题", weightLabel: "30%", score: s.topic,    note: reasonsList[0] },
                      { key: "format",   label: "内容形式", weightLabel: "25%", score: s.format,   note: reasonsList[1] },
                      { key: "visual",   label: "视觉调性", weightLabel: "20%", score: s.visual,   note: card.visualPending ? "封面分析中" : undefined },
                      { key: "data",     label: "数据量级", weightLabel: "15%", score: s.data,     note: reasonsList[2] ?? (card.views ? `中位播放 ${card.views}` : undefined) },
                      { key: "activity", label: "近期活跃", weightLabel: "5%",  score: s.activity, note: s.activity >= 90 ? "近 7 天有更新" : undefined },
                      { key: "contact",  label: "可联系性", weightLabel: "5%",  score: s.contact,  note: card.emailStatusLabel ?? (typeof card.email === "string" && card.email ? "邮箱已找到" : undefined) },
                    ];
                  }

                  // 没有子分时回退到原 bullets 视图
                  if (rows.length === 0) {
                    if (reasonsList.length === 0) return null;
                    return (
                      <div className="px-4 mt-3">
                        <div
                          className="inline-flex items-center gap-1"
                          style={{
                            color: TOKEN.olive,
                            fontSize: "9.5px",
                            fontWeight: 600,
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                          }}
                        >
                          <Sparkles className="w-2.5 h-2.5" style={{ color: accent }} />
                          <span>{heading}</span>
                        </div>
                        <ul className="mt-1.5 space-y-1">
                          {reasonsList.slice(0, 3).map((b, i) => (
                            <li
                              key={i}
                              className="flex gap-2"
                              style={{ color: TOKEN.charcoal, fontSize: "11.5px", lineHeight: 1.45 }}
                            >
                              <span
                                aria-hidden
                                className="shrink-0 rounded-full"
                                style={{ marginTop: 6, width: 4, height: 4, background: accent, opacity: 0.55 }}
                              />
                              <span
                                className="flex-1"
                                style={{
                                  display: "-webkit-box",
                                  WebkitLineClamp: 1,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                }}
                              >
                                {b}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  }

                  if (filterMode !== "找平替") {
                    return (
                      <div className="px-4 mt-3">
                        <div className="flex items-center justify-between">
                          <div
                            className="inline-flex items-center gap-1"
                            style={{
                              color: TOKEN.olive,
                              fontSize: "9.5px",
                              fontWeight: 600,
                              letterSpacing: "0.14em",
                              textTransform: "uppercase",
                            }}
                          >
                            <Sparkles className="w-2.5 h-2.5" style={{ color: accent }} />
                            <span>{heading}</span>
                          </div>
                          <span
                            className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-[1px]"
                            style={{
                              background: accentBg,
                              color: accent,
                              fontSize: "9px",
                              fontWeight: 600,
                              letterSpacing: "0.04em",
                            }}
                            title="5.0 分制：主题、形式、视觉、活跃、数据"
                          >
                            5.0 分制
                          </span>
                        </div>
                        <SimilarDeepAnalysisWidget card={card} reasons={reasonsList} />
                      </div>
                    );
                  }

                  return (
                    <div className="px-4 mt-3">
                      <div className="flex items-center justify-between">
                        <div
                          className="inline-flex items-center gap-1"
                          style={{
                            color: TOKEN.olive,
                            fontSize: "9.5px",
                            fontWeight: 600,
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                          }}
                        >
                          <Sparkles className="w-2.5 h-2.5" style={{ color: accent }} />
                          <span>{heading}</span>
                        </div>
                        <span
                          className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-[1px]"
                          style={{
                            background: accentBg,
                            color: accent,
                            fontSize: "9px",
                            fontWeight: 600,
                            letterSpacing: "0.04em",
                          }}
                          title="维度数值越长 = 与当前博主在该维度上越相近 / 越占优"
                        >
                          维度对比
                        </span>
                      </div>

                      <div className="mt-1.5 space-y-[3px]">
                        {rows.map((r) => {
                          const safe = Math.max(0, Math.min(100, Math.round(r.score)));
                          const tone =
                            safe >= 85 ? accent : safe >= 65 ? accent : "#b59169";
                          return (
                            <div key={r.key} className="flex items-center gap-2">
                              {/* label + weight */}
                              <div
                                className="shrink-0 inline-flex items-baseline gap-1"
                                style={{ width: 64 }}
                              >
                                <span
                                  style={{
                                    color: TOKEN.charcoal,
                                    fontSize: "10.5px",
                                    fontWeight: 500,
                                    lineHeight: 1.2,
                                  }}
                                >
                                  {r.label}
                                </span>
                                <span style={{ color: TOKEN.stone, fontSize: "8.5px" }}>
                                  {r.weightLabel}
                                </span>
                              </div>

                              {/* bar */}
                              <div
                                className="relative flex-1 overflow-hidden rounded-full"
                                style={{
                                  height: 6,
                                  background: TOKEN.borderCream,
                                }}
                                title={r.note ? `${r.label} · ${safe} · ${r.note}` : `${r.label} · ${safe}`}
                              >
                                <div
                                  className="h-full rounded-full transition-[width] duration-500"
                                  style={{ width: `${safe}%`, background: tone, opacity: 0.85 }}
                                />
                              </div>

                              {/* score */}
                              <span
                                className="tabular-nums shrink-0 text-right"
                                style={{
                                  color: TOKEN.nearBlack,
                                  fontSize: "10.5px",
                                  fontWeight: 600,
                                  width: 22,
                                  lineHeight: 1.1,
                                }}
                              >
                                {safe}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* 注释一行：把每条 reason 的关键名词点出来，作为人类可读补充 */}
                      {(() => {
                        const noteRow = rows
                          .map((r) => r.note)
                          .filter((n): n is string => typeof n === "string" && n.trim().length > 0);
                        if (noteRow.length === 0) return null;
                        return (
                          <p
                            className="mt-1.5 truncate"
                            style={{ color: TOKEN.olive, fontSize: "10px", lineHeight: 1.4 }}
                          >
                            {noteRow.slice(0, 3).join(" · ")}
                          </p>
                        );
                      })()}
                    </div>
                  );
                })()}

                {/* ── Tradeoffs footnote ── */}
                {card.tradeoffs && card.tradeoffs.length > 0 ? (
                  <p
                    className="px-4 mt-2 truncate"
                    style={{ color: TOKEN.stone, fontSize: "10.5px", lineHeight: 1.4 }}
                  >
                    <span style={{ color: TOKEN.olive, fontWeight: 600 }}>主要参考</span>
                    <span style={{ color: TOKEN.borderWarm, margin: "0 6px" }}>·</span>
                    {card.tradeoffs.slice(0, 2).join(" · ")}
                  </p>
                ) : null}

                {/* ── Settings footer (search-level controls) ── */}
                <div
                  className="mt-auto flex items-center justify-between gap-2 px-3 py-2"
                  style={{
                    borderTop: `1px solid ${TOKEN.borderCream}`,
                    background: TOKEN.parchment,
                  }}
                >
                  <span
                    style={{
                      fontSize: "9px",
                      letterSpacing: "0.14em",
                      color: TOKEN.stone,
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    搜索设置
                  </span>
                  <div className="flex items-center gap-1">
                    {/* 最近 N 条 */}
                    <div className="relative" ref={isCurrent ? scrapeMenuRef : null}>
                      <button
                        type="button"
                        onClick={() => isCurrent && setScrapeMenuOpen((v) => !v)}
                        disabled={!isCurrent}
                        title="采样越多，判断越稳；采样越少，结果越快"
                        className="inline-flex h-[22px] items-center gap-0.5 rounded-full px-2 text-[10px] font-semibold disabled:cursor-default"
                        style={{
                          background: "#ffffff",
                          border: `1px solid ${TOKEN.borderWarm}`,
                          color: TOKEN.olive,
                        }}
                      >
                        <span>近 {scrapeCount}</span>
                        <ChevronDown
                          className="h-2.5 w-2.5"
                          style={{
                            color: TOKEN.stone,
                            transform: scrapeMenuOpen ? "rotate(180deg)" : undefined,
                          }}
                        />
                      </button>
                      {isCurrent && scrapeMenuOpen ? (
                        <div
                          role="listbox"
                          className="absolute right-0 bottom-full z-30 mb-1 w-[140px] overflow-hidden rounded-[12px]"
                          style={{
                            background: "#ffffff",
                            border: `1px solid ${TOKEN.borderWarm}`,
                            boxShadow: "0 -10px 32px -18px rgba(77,76,72,0.24)",
                          }}
                        >
                          <div
                            className="px-2.5 pt-1.5 pb-1 text-[10px] uppercase tracking-wide"
                            style={{ color: TOKEN.stone }}
                          >
                            采样发文条数
                          </div>
                          {SCRAPE_COUNT_OPTIONS.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              role="option"
                              aria-selected={opt === scrapeCount}
                              onClick={() => handleScrapeCountChange(opt)}
                              className="flex w-full items-center justify-between px-2.5 py-1.5 text-[10.5px] transition-colors"
                              style={{
                                background: "transparent",
                                color: opt === scrapeCount ? TOKEN.terracotta : TOKEN.charcoal,
                                fontWeight: opt === scrapeCount ? 600 : 400,
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.background = TOKEN.parchment;
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.background = "transparent";
                              }}
                            >
                              <span>
                                {opt}条
                                {opt === 10 ? (
                                  <span className="ml-1 text-[9.5px]" style={{ color: TOKEN.stone }}>
                                    推荐
                                  </span>
                                ) : null}
                              </span>
                              {opt === scrapeCount ? <Check className="h-3 w-3" /> : null}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    {/* 封面 N */}
                    <div className="relative" ref={isCurrent ? coverMenuRef : null}>
                      <button
                        type="button"
                        onClick={() => isCurrent && setCoverMenuOpen((v) => !v)}
                        disabled={!isCurrent}
                        title="封面图作为视觉调性辅助分析，不影响基础匹配"
                        className="inline-flex h-[22px] items-center gap-0.5 rounded-full px-2 text-[10px] font-semibold disabled:cursor-default"
                        style={{
                          background: "#ffffff",
                          border: `1px solid ${TOKEN.borderWarm}`,
                          color: TOKEN.olive,
                        }}
                      >
                        <span>封面 {coverCount === 0 ? "关" : coverCount}</span>
                        <ChevronDown
                          className="h-2.5 w-2.5"
                          style={{
                            color: TOKEN.stone,
                            transform: coverMenuOpen ? "rotate(180deg)" : undefined,
                          }}
                        />
                      </button>
                      {isCurrent && coverMenuOpen ? (
                        <div
                          role="listbox"
                          className="absolute right-0 bottom-full z-30 mb-1 w-[140px] overflow-hidden rounded-[12px]"
                          style={{
                            background: "#ffffff",
                            border: `1px solid ${TOKEN.borderWarm}`,
                            boxShadow: "0 -10px 32px -18px rgba(77,76,72,0.24)",
                          }}
                        >
                          <div
                            className="px-2.5 pt-1.5 pb-1 text-[10px] uppercase tracking-wide"
                            style={{ color: TOKEN.stone }}
                          >
                            视觉辅助封面
                          </div>
                          {COVER_COUNT_OPTIONS.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              role="option"
                              aria-selected={opt === coverCount}
                              onClick={() => {
                                setCoverCount(opt);
                                setCoverMenuOpen(false);
                              }}
                              className="flex w-full items-center justify-between px-2.5 py-1.5 text-[10.5px] transition-colors"
                              style={{
                                background: "transparent",
                                color: opt === coverCount ? TOKEN.terracotta : TOKEN.charcoal,
                                fontWeight: opt === coverCount ? 600 : 400,
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.background = TOKEN.parchment;
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.background = "transparent";
                              }}
                            >
                              <span>
                                {opt === 0 ? "关闭" : `${opt} 张`}
                                {opt === 3 ? (
                                  <span className="ml-1 text-[9.5px]" style={{ color: TOKEN.stone }}>
                                    推荐
                                  </span>
                                ) : null}
                              </span>
                              {opt === coverCount ? <Check className="h-3 w-3" /> : null}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    {/* 数据透视 toggle */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={dataCheckOn}
                      aria-label="数据透视开关"
                      title="在原页面叠加播放量、互动率，并按平均播放排序前 N 条视频"
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={toggleDataCheck}
                      className="inline-flex h-[22px] cursor-pointer items-center gap-1 rounded-full pl-2 pr-1 text-[10px] font-semibold"
                      style={{
                        background: dataCheckOn ? "#fef3e8" : "#ffffff",
                        border: `1px solid ${dataCheckOn ? "#f5d0a9" : TOKEN.borderWarm}`,
                        color: dataCheckOn ? TOKEN.terracotta : TOKEN.olive,
                      }}
                    >
                      <span>透视</span>
                      <span
                        className="relative inline-block rounded-full"
                        style={{
                          width: 18,
                          height: 10,
                          background: dataCheckOn ? TOKEN.terracotta : TOKEN.borderWarm,
                          transition: "background 0.18s",
                        }}
                      >
                        <span
                          className="absolute rounded-full bg-white"
                          style={{
                            width: 8,
                            height: 8,
                            top: 1,
                            left: 1,
                            transform: dataCheckOn ? "translateX(8px)" : undefined,
                            transition: "transform 0.18s",
                            boxShadow: "0 1px 2px rgba(20,20,19,0.18)",
                          }}
                        />
                      </span>
                    </button>
                  </div>
                </div>


              </div>
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
              className="absolute inset-0 z-20 flex items-center justify-center rounded-3xl"
              style={{
                background: "rgba(245,244,237,0.88)",
                backdropFilter: "blur(6px)",
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
                  background: "#ffffff",
                  border: `1px solid ${TOKEN.borderWarm}`,
                  boxShadow: "0 20px 60px -16px rgba(20,20,19,0.2)",
                  width: "calc(100% - 32px)",
                }}
              >
                <p
                  className="text-sm font-semibold text-center"
                  style={{ color: TOKEN.nearBlack }}
                >
                  确定要结束找相似进程吗？
                </p>
                <p
                  className="mt-1.5 text-xs text-center leading-5"
                  style={{ color: TOKEN.stone }}
                >
                  结束后，搜索结果将会清空，仅保留搜索设置。
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEndConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
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
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    style={{
                      background: TOKEN.terracotta,
                      color: "#ffffff",
                    }}
                  >
                    确认结束
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Detail drawer：与当前博主对比（spec §4.6 / §5.6）── */}
        <AnimatePresence>
          {showDetail && currentCard && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 z-30 flex items-stretch justify-center rounded-3xl"
              style={{
                background: "rgba(245,244,237,0.92)",
                backdropFilter: "blur(8px)",
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowDetail(false);
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ type: "spring", stiffness: 320, damping: 26 }}
                className="m-3 flex w-full flex-col overflow-hidden rounded-2xl"
                style={{
                  background: "#ffffff",
                  border: `1px solid ${TOKEN.borderWarm}`,
                  boxShadow: "0 20px 60px -16px rgba(20,20,19,0.2)",
                }}
              >
                <div
                  className="flex items-center justify-between px-4 py-2.5"
                  style={{ borderBottom: `1px solid ${TOKEN.borderCream}` }}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      style={{
                        fontFamily: "Georgia, serif",
                        color: TOKEN.nearBlack,
                        fontSize: "13px",
                        fontWeight: 600,
                      }}
                    >
                      与当前博主对比
                    </span>
                    <span
                      className="truncate"
                      style={{ color: TOKEN.stone, fontSize: "11px" }}
                    >
                      @{currentCard.name.replace(/^@/, "")}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDetail(false)}
                    className="rounded-full p-1 transition-colors"
                    style={{ color: TOKEN.stone }}
                    aria-label="关闭详情"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {filterMode === "找平替"
                    ? renderAlternativeDetail(currentCard)
                    : renderSimilarDetail(currentCard)}
                </div>

                <div
                  className="px-4 py-2.5 text-[10px]"
                  style={{
                    borderTop: `1px solid ${TOKEN.borderCream}`,
                    color: TOKEN.stone,
                    background: TOKEN.parchment,
                  }}
                >
                  <span className="inline-flex items-center gap-1">
                    <Info className="h-2.5 w-2.5" />
                    报价、CPM、CPE 均为系统估算，建议建联确认
                  </span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Signal toast */}
      <AnimatePresence>
        {signalToast && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16 }}
            className="text-center text-xs font-medium mb-2"
            style={{ color: TOKEN.terracotta }}
          >
            {signalToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom actions ── */}
      <div className="mx-auto -mt-4 w-full space-y-2" style={{ maxWidth: "min(320px, 100%)" }}>
        {/* Primary actions row */}
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={handleNo}
            disabled={!currentCard}
            className="flex-1 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1 disabled:opacity-40"
            style={{
              background: "#f3efe3",
              border: "1px solid #d9d3c3",
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
            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1 disabled:opacity-40"
            style={{
              background: currentSaved ? "#fef3e8" : "#f3efe3",
              border: `1px solid ${currentSaved ? "#f5d0a9" : "#d9d3c3"}`,
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
            className="w-full min-w-0 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1 disabled:opacity-40"
            style={{
              background: TOKEN.terracotta,
              color: "#ffffff",
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
          className="w-full py-1.5 text-xs font-medium flex items-center justify-center gap-1 transition-colors"
          style={{ color: TOKEN.stone }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = TOKEN.charcoal;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = TOKEN.stone;
          }}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>切换到快速筛选</span>
        </button>
      </div>

    </div>
  );
}

// ── Detail drawer helpers ──────────────────────────────────────────────────

function scoreLabel(value: number): string {
  if (value >= 85) return "高度相似";
  if (value >= 70) return "相似";
  if (value >= 55) return "接近";
  if (value >= 40) return "中等";
  return "差异较大";
}

type SimilarRadarDatum = {
  subject: string;
  cand: number;
  seed: number;
  score5: string;
  color: string;
  tagClass: string;
  tags: string[];
};

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function toFivePointScore(value: number): string {
  return (clampScore(value) / 20).toFixed(1);
}

function buildSimilarRadarData(card: CardItem): SimilarRadarDatum[] {
  const s = card.subscores;
  const sourceTags = card.tags.filter((tag) => !/%$/.test(tag.trim())).slice(0, 2);
  const topicTags = sourceTags.length > 0 ? sourceTags : ["精致露营", "户外装备"];
  const visualTags = card.visualPending
    ? ["视觉分析中", "低饱和度", "风格待确认"]
    : ["自然冷杉色", "低饱和度", "高沉浸感"];

  const values = {
    topic: s?.topic ?? 82,
    format: s?.format ?? 76,
    visual: s?.visual ?? 80,
    activity: s?.activity ?? 86,
    data: s?.data ?? 78,
  };

  return [
    {
      subject: "主题",
      cand: values.topic,
      seed: 100,
      score5: toFivePointScore(values.topic),
      color: "#8b5cf6",
      tagClass: "bg-purple-50 text-purple-600 border-purple-200",
      tags: [...topicTags, "受众高度重合"].slice(0, 3),
    },
    {
      subject: "形式",
      cand: values.format,
      seed: 100,
      score5: toFivePointScore(values.format),
      color: "#3b82f6",
      tagClass: "bg-blue-50 text-blue-600 border-blue-200",
      tags: ["沉浸式 Vlog", "全景 B-roll", "极少口播"],
    },
    {
      subject: "视觉",
      cand: values.visual,
      seed: 100,
      score5: toFivePointScore(values.visual),
      color: "#10b981",
      tagClass: "bg-emerald-50 text-emerald-600 border-emerald-200",
      tags: visualTags,
    },
    {
      subject: "活跃",
      cand: values.activity,
      seed: 100,
      score5: toFivePointScore(values.activity),
      color: "#9ca3af",
      tagClass: "bg-gray-50 text-gray-600 border-gray-200",
      tags: [],
    },
    {
      subject: "数据",
      cand: values.data,
      seed: 100,
      score5: toFivePointScore(values.data),
      color: "#9ca3af",
      tagClass: "bg-gray-50 text-gray-600 border-gray-200",
      tags: [],
    },
  ];
}

function polygonPoints(data: SimilarRadarDatum[], key: "cand" | "seed", radius: number) {
  const center = 68;
  return data
    .map((datum, index) => {
      const angle = (-90 + index * 72) * (Math.PI / 180);
      const value = key === "cand" ? datum.cand : datum.seed;
      const r = radius * (clampScore(value) / 100);
      return `${center + Math.cos(angle) * r},${center + Math.sin(angle) * r}`;
    })
    .join(" ");
}

function SimilarRadarChart({ data }: { data: SimilarRadarDatum[] }) {
  const center = 68;
  const radius = 40;
  const labelRadius = 57;
  const rings = [20, 40, 60, 80, 100];

  return (
    <div className="relative mx-auto h-[136px] w-[136px] shrink-0">
      <svg viewBox="0 0 136 136" className="h-full w-full overflow-visible" aria-hidden="true">
        {rings.map((level) => (
          <polygon
            key={level}
            points={polygonPoints(data, "seed", radius * (level / 100))}
            fill="none"
            stroke="#e5e7eb"
            strokeDasharray="2 2"
            strokeWidth="1"
          />
        ))}
        {data.map((_, index) => {
          const angle = (-90 + index * 72) * (Math.PI / 180);
          return (
            <line
              key={index}
              x1={center}
              y1={center}
              x2={center + Math.cos(angle) * radius}
              y2={center + Math.sin(angle) * radius}
              stroke="#ece7df"
              strokeDasharray="2 2"
              strokeWidth="1"
            />
          );
        })}
        <polygon
          points={polygonPoints(data, "seed", radius)}
          fill="none"
          stroke="#d1d5db"
          strokeDasharray="4 3"
          strokeWidth="1.5"
        />
        <polygon
          points={polygonPoints(data, "cand", radius)}
          fill="#ea580c"
          fillOpacity="0.15"
          stroke="#ea580c"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {data.map((datum, index) => {
          const angle = (-90 + index * 72) * (Math.PI / 180);
          const x = center + Math.cos(angle) * labelRadius;
          const y = center + Math.sin(angle) * labelRadius;
          const anchor = Math.abs(x - center) < 4 ? "middle" : x < center ? "end" : "start";
          const isTop = y < center;
          return (
            <text
              key={datum.subject}
              x={x}
              y={y}
              textAnchor={anchor}
              fill={datum.color}
              fontSize="9"
              fontWeight="700"
            >
              <tspan x={x} dy={isTop ? -4 : 4}>
                {datum.subject}
              </tspan>
              <tspan x={x} dy="11" fontWeight="900" opacity="0.8">
                {datum.score5}
              </tspan>
            </text>
          );
        })}
      </svg>

      <div className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 scale-75 items-center justify-center gap-2 whitespace-nowrap opacity-60">
        <span className="flex items-center gap-1 text-[10px] font-bold text-gray-700">
          <span className="h-px w-2 border-t border-dashed border-gray-500" />
          满分基准
        </span>
        <span className="flex items-center gap-1 text-[10px] font-bold text-gray-700">
          <span className="h-1.5 w-1.5 rounded-[2px] bg-[#ea580c] opacity-60" />
          该候选人
        </span>
      </div>
    </div>
  );
}

function SimilarDeepAnalysisWidget({
  card,
  reasons,
}: {
  card: CardItem;
  reasons: string[];
}) {
  const radarData = buildSimilarRadarData(card);
  const activeLabel = (card.subscores?.activity ?? 0) >= 90 ? "高频更新" : "稳定更新";
  const contactLabel = typeof card.email === "string" && card.email.trim() ? "已关联商务邮箱" : "商务邮箱待确认";
  const operationalSummary =
    reasons[2] ??
    `同量级播放表现，互动率 ${card.er ?? "优于大盘"}；近期${activeLabel}，且${contactLabel}。`;
  const tags = radarData.flatMap((datum) =>
    datum.tags.map((tag) => ({
      tag,
      tagClass: datum.tagClass,
      key: `${datum.subject}-${tag}`,
    }))
  );

  return (
    <div className="mt-2 rounded-[16px] border border-[#f0eadd] bg-[#faf9f7] p-3 shadow-sm">
      <div className="flex justify-center pb-1">
        <SimilarRadarChart data={radarData} />
      </div>

      <div className="mt-3 border-t border-dashed border-[#e8e4dc] pt-3">
        <div
          className="mb-2 px-1"
          style={{
            color: TOKEN.stone,
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.03em",
          }}
        >
          核心匹配特征提取：
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tags.map(({ tag, tagClass, key }) => (
            <span
              key={key}
              className={`rounded-[6px] border px-2 py-1 text-[10px] font-bold shadow-sm ${tagClass}`}
            >
              {tag}
            </span>
          ))}
        </div>
        <p
          className="mt-2.5 px-1"
          style={{
            color: TOKEN.olive,
            fontSize: "10.5px",
            fontWeight: 500,
            lineHeight: 1.45,
          }}
        >
          <span style={{ color: TOKEN.charcoal, fontWeight: 700 }}>数据状态：</span>
          {operationalSummary}
        </p>
      </div>
    </div>
  );
}

function SubscoreBar({
  label,
  value,
  hint,
  accent = TOKEN.terracotta,
}: {
  label: string;
  value: number;
  hint?: string;
  accent?: string;
}) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div title={hint}>
      <div className="mb-1 flex items-baseline justify-between">
        <span style={{ color: TOKEN.charcoal, fontSize: "11.5px", fontWeight: 500 }}>
          {label}
        </span>
        <span className="tabular-nums" style={{ color: TOKEN.olive, fontSize: "11px" }}>
          {scoreLabel(safe)} · {safe}
        </span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full"
        style={{ background: TOKEN.borderCream }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${safe}%`, background: accent }}
        />
      </div>
    </div>
  );
}

function CompareRow({
  label,
  seed,
  candidate,
  hint,
}: {
  label: string;
  seed: string;
  candidate: string;
  hint?: string;
}) {
  return (
    <div
      className="flex items-baseline justify-between gap-2 py-1.5"
      style={{ borderBottom: `1px dashed ${TOKEN.borderCream}` }}
      title={hint}
    >
      <span style={{ color: TOKEN.olive, fontSize: "11px" }}>{label}</span>
      <span className="tabular-nums" style={{ color: TOKEN.charcoal, fontSize: "11.5px" }}>
        <span style={{ color: TOKEN.stone }}>{seed}</span>
        <span style={{ color: TOKEN.borderWarm, margin: "0 6px" }}>→</span>
        <span style={{ color: TOKEN.nearBlack, fontWeight: 600 }}>{candidate}</span>
      </span>
    </div>
  );
}

function renderSimilarDetail(card: CardItem) {
  const sub = card.subscores;
  return (
    <>
      <div>
        <div
          className="mb-2 inline-flex items-center gap-1"
          style={{
            color: TOKEN.olive,
            fontSize: "9.5px",
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          <Sparkles className="h-2.5 w-2.5" style={{ color: TOKEN.terracotta }} />
          相似度拆分
        </div>
        {sub ? (
          <div className="space-y-2">
            <SubscoreBar label="内容主题 · 30%" value={sub.topic} hint="bio + 最近发文主题相似度" />
            <SubscoreBar label="内容形式 · 25%" value={sub.format} hint="时长 / 形式标签重叠" />
            <SubscoreBar label="视觉调性 · 20%" value={sub.visual} hint="封面视觉向量相似度" />
            <SubscoreBar label="数据量级 · 15%" value={sub.data} hint="中位播放匹配" />
            <SubscoreBar label="近期活跃 · 5%" value={sub.activity} />
            <SubscoreBar label="可联系性 · 5%" value={sub.contact} />
          </div>
        ) : (
          <p style={{ color: TOKEN.stone, fontSize: "11px" }}>暂无子分维度数据</p>
        )}
      </div>

      {card.tradeoffs && card.tradeoffs.length > 0 ? (
        <div>
          <div
            className="mb-1.5"
            style={{
              color: TOKEN.olive,
              fontSize: "9.5px",
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            主要差距
          </div>
          <ul className="space-y-1">
            {card.tradeoffs.map((t, i) => (
              <li
                key={i}
                className="flex gap-2"
                style={{ color: TOKEN.charcoal, fontSize: "11.5px", lineHeight: 1.45 }}
              >
                <span
                  aria-hidden
                  className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
                  style={{ background: TOKEN.stone }}
                />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}

function renderAlternativeDetail(card: CardItem) {
  const sub = card.altSubscores;
  const cmp = card.seedComparison;
  const accent = "#7a5c1e";
  return (
    <>
      <div>
        <div
          className="mb-2 inline-flex items-center gap-1"
          style={{
            color: TOKEN.olive,
            fontSize: "9.5px",
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          <Sparkles className="h-2.5 w-2.5" style={{ color: accent }} />
          平替分拆分
        </div>
        {sub ? (
          <div className="space-y-2">
            <SubscoreBar label="综合相似度 · 40%" value={sub.similarity} accent={accent} />
            <SubscoreBar
              label="成本优势 · 35%"
              value={sub.costAdvantage}
              accent={accent}
              hint="报价节省 + CPM/CPE 改善"
            />
            <SubscoreBar
              label="数据表现 · 20%"
              value={sub.dataPerformance}
              accent={accent}
              hint="中位播放比 + 数据稳定性 + ER"
            />
            <SubscoreBar
              label="可联系性 / 风险 · 5%"
              value={sub.contactabilityRisk}
              accent={accent}
            />
          </div>
        ) : (
          <p style={{ color: TOKEN.stone, fontSize: "11px" }}>暂无子分维度数据</p>
        )}
      </div>

      {cmp ? (
        <div>
          <div
            className="mb-1"
            style={{
              color: TOKEN.olive,
              fontSize: "9.5px",
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            关键数据对比（当前 → 平替）
          </div>
          {cmp.medianViews ? (
            <CompareRow label="中位播放" seed={cmp.medianViews.seed} candidate={cmp.medianViews.candidate} />
          ) : null}
          {cmp.er ? (
            <CompareRow label="互动率" seed={cmp.er.seed} candidate={cmp.er.candidate} />
          ) : null}
          {cmp.price ? (
            <CompareRow
              label="预估报价"
              seed={cmp.price.seed}
              candidate={cmp.price.candidate}
              hint="系统估算"
            />
          ) : null}
          {cmp.cpm ? (
            <CompareRow label="预估 CPM" seed={cmp.cpm.seed} candidate={cmp.cpm.candidate} />
          ) : null}
          {cmp.cpe ? (
            <CompareRow label="预估 CPE" seed={cmp.cpe.seed} candidate={cmp.cpe.candidate} />
          ) : null}
          {cmp.emailStatus ? (
            <div
              className="flex items-baseline justify-between py-1.5"
              style={{ borderBottom: `1px dashed ${TOKEN.borderCream}` }}
            >
              <span style={{ color: TOKEN.olive, fontSize: "11px" }}>邮箱状态</span>
              <span style={{ color: TOKEN.nearBlack, fontSize: "11.5px", fontWeight: 600 }}>
                {cmp.emailStatus}
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      {cmp?.systemConclusion ? (
        <div
          className="rounded-xl px-3 py-2"
          style={{
            background: "#fdf8ed",
            border: "1px solid #e8d5a0",
            color: "#7a5c1e",
            fontSize: "11px",
            lineHeight: 1.5,
          }}
        >
          <div
            className="mb-1"
            style={{
              fontSize: "9.5px",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            系统结论
          </div>
          {cmp.systemConclusion}
        </div>
      ) : null}
    </>
  );
}

function CompactMetric({
  label,
  value,
  divider = false,
  estimated = false,
  hint,
  highlight = false,
}: {
  label: string;
  value: string;
  divider?: boolean;
  estimated?: boolean;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="relative flex h-full min-h-0 flex-col items-center justify-center px-1.5 py-2"
      style={{
        borderLeft: divider ? `1px solid ${TOKEN.borderCream}` : "none",
      }}
      title={hint}
    >
      <div
        className="inline-flex items-center gap-0.5"
        style={{ color: TOKEN.stone, fontSize: "12px", fontWeight: 500, letterSpacing: "0" }}
      >
        <span>{label}</span>
        {estimated ? (
          <span
            aria-hidden
            className="inline-flex h-[11px] min-w-[12px] items-center justify-center rounded-[3px] px-[3px] text-[8px] font-semibold"
            style={{
              background: TOKEN.parchment,
              color: TOKEN.stone,
              border: `1px solid ${TOKEN.borderWarm}`,
              lineHeight: 1,
            }}
          >
            估
          </span>
        ) : null}
      </div>
      <div
        className="mt-1 truncate max-w-full"
        style={{
          color: highlight ? TOKEN.terracotta : TOKEN.nearBlack,
          fontSize: "17px",
          fontWeight: 600,
          letterSpacing: "0",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}
