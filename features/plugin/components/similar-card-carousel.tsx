"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, Zap } from "lucide-react";

import { InfluencerCard } from "@/features/plugin/components/influencer-card";
import { mapCardItemToInfluencerCard } from "@/features/plugin/components/influencer-card/map-card-item";
import { SimilarModePicker } from "@/features/plugin/components/similar-mode-picker";
import type { SimilarSearchModeKey } from "@/features/plugin/components/similar-search-module";
import { SeedSourcePanel } from "@/features/discovery/v2/seed-source-panel";
import { Button } from "@/components/ui/button";
import {
  addSeed as addSeedToPool,
  hasSeed,
  projectPendingCount,
  removeSeed as removeSeedFromPool,
  rerankBySeeds,
  type SeedDescriptor,
} from "@/features/discovery/v2/lib/seed-pool";

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
  /** 后台「受众人群」维度的分析产出。缺失时 mapper 按 id 走 mock 受众表兜底。 */
  audience?: string[];
  country?: string;
  /** 博主类型标签,渲染在标题行第二行(国家旁)。如「户外生活博主」。 */
  creatorType?: string;
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
  /** 头像 URL。未提供时由 mapper 按 id 派生一张稳定 pravatar 图。*/
  avatar?: string;
  [key: string]: unknown;
}

const SCRAPE_COUNT_OPTIONS = [5, 10, 15] as const;
const COVER_COUNT_OPTIONS = [3, 5, 9] as const;
const SEARCH_SETTINGS_STORAGE_KEY = "2linkr:similar-search-settings:v1";

// 3D 轮播区与底部操作区之间的固定间距(px)。卡片高度现在按内容实时测量
// (见 measureCurrentCard),容器永远恰好包住当前卡片,这个间距保证两个区块
// 之间始终隔开 —— 哪怕未来卡片再变长,也不会重叠到「No / 收藏」按钮上。
const CARD_TO_ACTIONS_GAP = 16;
// 首帧占位高度:ResizeObserver 测出真实高度前先用它,避免初次渲染塌陷。
const DEFAULT_CARD_AREA_HEIGHT = 620;
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
  /** 头像 URL。未提供时由 mapper 按 id 派生一张稳定 pravatar 图。*/
  avatar?: string;
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
  /** SeedSourcePanel 的「导出」按钮触发。SimilarTab 实现具体的 txt 导出。 */
  onExport?: () => void;
  /**
   * 用户在进入逐个筛选前已经在 SimilarSearchModule 选过的模式（"找相似" / "找平替"）。
   * 传入后 carousel 直接沿用，不会在第一次点「根据 X 找相似」时再弹 picker —— 逐个
   * 筛选体验应该是一气呵成的，不要把用户已经做过的选择再问一遍。
   */
  initialMode?: SimilarSearchModeKey;
}

// Mode → 主按钮显示文案。和 SimilarSearchModule / SimilarModePicker 的标签保持一致。
const MODE_LABELS: Record<SimilarSearchModeKey, string> = {
  comprehensive: "找相似",
  budget: "找平替",
  seed: "找种子达人",
};

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

// AnchorItem / CardItem → SeedDescriptor 的标准化映射 —— 两端共享
// SeedSourcePanel 的入参形态，避免每个 caller 都各自塑造一遍 seed 字段。
//
// 头像策略：caller 显式传 avatar 则用之；否则按 id 派生一张稳定 pravatar 图，
// 让相似来源面板的 AvatarStack 永远叠加的是真实人脸，而不是字母 fallback。
// pravatar.cc 有效 image id 是 1–70，下面用 FNV-1a 取模映射，保证同一个
// creator id 永远命中同一张脸。
function mockAvatarFromId(id: string): string {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const imgId = ((h >>> 0) % 70) + 1;
  return `https://i.pravatar.cc/96?img=${imgId}`;
}

function anchorToSeed(a: AnchorItem): SeedDescriptor {
  return {
    id: a.id,
    handle: a.handle,
    name: a.name || a.handle,
    avatarUrl: a.avatar ?? mockAvatarFromId(a.id),
  };
}

function cardToSeed(c: CardItem): SeedDescriptor {
  // CardItem 没有 handle 字段 —— name 通常已经形如 "@foo"。统一加前缀容错。
  const handle = c.name.startsWith("@") ? c.name : `@${c.name.replace(/^@/, "")}`;
  return {
    id: c.id,
    handle,
    name: c.name,
    avatarUrl: c.avatar ?? mockAvatarFromId(c.id),
  };
}

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

// ── Card stack position helper ────────────────────────────────────────────
// 卡片是一摞「不透明」的牌。背后的卡 opacity 永远是 1 —— 半透明会让后面那张
// 的文字透到当前卡上,正是图里那种「乱重影」。这里靠 zIndex + 不透明卡面互相
// 遮挡:当前卡完全盖住身后的卡,只在右侧露出一道干净的卡片边。已翻过的卡直接
// 滑出左侧并淡出,不参与堆叠。
function getCardStyle(diff: number) {
  if (diff === 0) return { x: 0, scale: 1, opacity: 1, zIndex: 30 };
  if (diff === 1) return { x: 16, scale: 0.96, opacity: 1, zIndex: 20 };
  if (diff === 2) return { x: 32, scale: 0.92, opacity: 1, zIndex: 10 };
  if (diff > 2) return { x: 32, scale: 0.92, opacity: 0, zIndex: 5 };
  return { x: -340, scale: 1, opacity: 0, zIndex: 0 };
}

// ── Component ──────────────────────────────────────────────────────────────

export function SimilarCardCarousel({
  cards: inputCards,
  anchor,
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
  onExport,
  initialMode,
}: SimilarCardCarouselProps) {
  const savedCount = savedCreatorIds.length;
  // 「相似来源」种子池：初始只有 anchor（来自插件父级的当前博主）。每次用户
  // 在弹出的 ModePicker 里挑了非"找种子达人"模式，当前卡片就被叠加进来 ——
  // 与 Web 端 DiscoverySplitView 共用 SeedSourcePanel 的视觉与交互。
  //
  // 如果父级需要换一位 anchor 重新开 session，请用 `key={anchor.id}` 重挂载
  // 整个 carousel —— 不要靠 effect 镜像 anchor 进 state，会触发 React 19 的
  // set-state-in-effect 规则。
  const [seedHistory, setSeedHistory] = useState<SeedDescriptor[]>(() => [anchorToSeed(anchor)]);

  // 候选 rerank + 剔除种子：
  //   1. 已经成为种子的卡片（包括 anchor 和后续累积进来的）直接从候选池移除 ——
  //      否则用户点完"根据 X 找相似"，rerank 会因为 X 的哈希与自己完美匹配把它
  //      重新冒到 index 0，加载动画结束后看到的还是同一张脸，体感上就像"没动"。
  //   2. 剩下的候选再按种子签名交集做 rerank，保证多种子时排序稳定。
  // 用 card.id 作为稳定 key（CardItem 没有 handle 字段），同一组 seeds 永远得到
  // 同一个顺序。下面所有读 `cards` 的代码自动用这版过滤+rerank 后的列表。
  const cards = useMemo(() => {
    const seedIds = new Set(seedHistory.map((s) => s.id));
    const remaining = inputCards.filter((c) => !seedIds.has(c.id));
    return rerankBySeeds(remaining, seedHistory, (c) => c.id);
  }, [inputCards, seedHistory]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favorited, setFavorited] = useState<Set<string>>(() => new Set(savedCreatorIds));
  const [filterMode, setFilterMode] = useState<FilterMode>("找相似");
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showSeedModePicker, setShowSeedModePicker] = useState(false);
  // 进入 carousel 前用户已经在 SimilarSearchModule 选过模式（"找相似" / "找平替"），
  // 这里直接沿用 —— 同一 session 内不要把已经做过的选择再问一遍。"找种子达人"会在
  // SimilarSearchModule 那一步就跳走，所以这里只会收到 comprehensive / budget。
  const [seedPickerMode, setSeedPickerMode] = useState<SimilarSearchModeKey>(
    initialMode ?? "comprehensive",
  );
  // 一旦 session 结束（结束按钮 → 父级卸载 carousel），状态随父级一起重置。
  const [hasChosenMode, setHasChosenMode] = useState<boolean>(Boolean(initialMode));
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

  // ── 轮播区高度:跟随当前卡片实时测量 ──────────────────────────────────────
  // 卡片是绝对定位堆叠的,容器必须显式给高度。过去写死 590px —— 一旦卡片内容
  // 变长(例如「深度分析」从雷达图换成多行列表),就会溢出容器、压到底部按钮上。
  // 这里用 ResizeObserver 量当前卡片的真实高度,容器永远恰好包住它,从根上杜绝
  // 重叠。offsetHeight 取布局高度,不受 3D 轮播的 scale / rotate 变换影响。
  const cardObserverRef = useRef<ResizeObserver | null>(null);
  const [cardAreaHeight, setCardAreaHeight] = useState<number | null>(null);
  const measureCurrentCard = useCallback((node: HTMLDivElement | null) => {
    cardObserverRef.current?.disconnect();
    cardObserverRef.current = null;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      setCardAreaHeight(node.offsetHeight > 0 ? node.offsetHeight : null);
    });
    observer.observe(node);
    cardObserverRef.current = observer;
  }, []);

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
  // 主操作按钮的文案随当前模式走："找相似" / "找平替"。seed 模式在
  // SimilarSearchModule 那一步就跳走，不会出现在 carousel 里。
  const activeModeLabel = MODE_LABELS[seedPickerMode] ?? "找相似";
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

  // 把"用户最终选了哪个 mode"的处理逻辑收敛到这里。两条入口共享：
  //   · 第一次点找相似 → picker 弹出 → 用户选模式 → onSelect 调到这里
  //   · 之后再点找相似 → 跳过 picker → handleFindSimilarFromCurrent 直接调到这里
  // 「累积」的核心也在这里：非 seed 模式都会把当前 card 追加到 seedHistory，
  // 池里既有的种子保留不动，下方候选 rerank 自动按交集再排。
  const applySeedMode = (mode: SimilarSearchModeKey) => {
    if (!currentCard) return;
    if (mode === "seed") {
      onSeedCreator(currentCard.id);
      return;
    }
    const nextSeed = cardToSeed(currentCard);
    if (!hasSeed(seedHistory, nextSeed.id)) {
      setSeedHistory((prev) => addSeedToPool(prev, nextSeed));
    }
    runSeedSearch(currentCard.name);
  };

  const handleFindSimilarFromCurrent = () => {
    if (!currentCard) return;
    // 已经在本 session 选过模式 → 直接沿用，不再打断用户。
    if (hasChosenMode) {
      applySeedMode(seedPickerMode);
      return;
    }
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

  // pending = 还没被翻过的候选数量；projectPendingCount 按种子组合的哈希指纹
  // 决定方向（多种子时通常增加，也可能减少），与 Web 端 SeedSourcePanel 完全
  // 同源 —— 见 lib/seed-pool.ts 的注释。
  const visiblePending = cards.length - currentIndex;
  const pendingCount = projectPendingCount(Math.max(0, visiblePending), seedHistory);

  const handleRemoveSeed = (id: string) => {
    setSeedHistory((prev) => {
      if (prev.length <= 1) return prev; // 至少保留一颗种子
      return removeSeedFromPool(prev, id);
    });
  };

  return (
    <div className="relative mx-auto w-full" style={{ maxWidth: "100%" }}>
      {/* ── 相似来源叠加面板 ── 面板内自带分隔线分级（标题 / 计数 / 候选区），
          所以这里只给它一点外边距，不再加边框。SimilarTab 通过 onExport 传入
          txt 导出动作，导出按钮排在「结束」左侧，与 web 端方向一致。 */}
      <div className="relative mb-2 px-1">
        <SeedSourcePanel
          seeds={seedHistory}
          pendingCount={pendingCount}
          savedCount={savedCount}
          onRemoveSeed={handleRemoveSeed}
          onEndSession={() => setShowEndConfirm(true)}
          onExport={onExport ?? (() => undefined)}
          canExport={Boolean(onExport)}
        />
      </div>

      {/* ── Card stack ── 高度跟随当前卡片实时测量,marginBottom 是与底部操作区
          之间的固定间距。overflow:hidden 把整摞卡片裁进当前卡的高度 —— 背后那张
          若内容更长,也不会从底部漏出来叠到当前卡上(另一种「重影」来源)。 */}
      <div
        className="relative w-full"
        style={{
          height: cardAreaHeight ?? DEFAULT_CARD_AREA_HEIGHT,
          marginBottom: CARD_TO_ACTIONS_GAP,
          overflow: "hidden",
          transition: "height 0.2s ease",
        }}
      >
        {cards.map((card, index) => {
          const diff = index - currentIndex;
          const style = getCardStyle(diff);
          const isCurrent = index === currentIndex;

          return (
            <motion.div
              key={card.id}
              // 只测量当前卡片(scale 1,即最高的一张);两侧卡片被缩小,
              // 永远矮于它,所以容器按当前卡片给高度即可包住所有卡片。
              ref={isCurrent ? measureCurrentCard : undefined}
              className="absolute top-0 left-1/2"
              style={{
                width: "min(320px, 100%)",
                marginLeft: "min(-160px, -50%)",
                // 缩放以顶边为锚点,背后的卡与当前卡顶端对齐、只在下方收短,
                // 这样露出来的永远是干净的右侧卡边而不是错位的内容。
                transformOrigin: "top center",
              }}
              initial={false}
              animate={{
                x: style.x,
                scale: style.scale,
                opacity: style.opacity,
                zIndex: style.zIndex,
              }}
              transition={{ type: "spring", stiffness: 260, damping: 28, mass: 0.8 }}
            >
              <InfluencerCard
                data={mapCardItemToInfluencerCard(card, {
                  scrapeCount,
                  coverCount,
                  perspective: dataCheckOn,
                  userTags: creatorTagsById[card.id] ?? [],
                  isSaved: favorited.has(card.id),
                  filterMode,
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
                onOpenEmailSidebar={() => {
                  if (onSendEmail) {
                    onSendEmail(card.id);
                  } else if (typeof card.email === "string" && card.email.trim().length > 0) {
                    window.location.href = `mailto:${card.email}`;
                  }
                }}
                onToggleSave={() => {
                  if (favorited.has(card.id)) {
                    setFavorited((prev) => {
                      const next = new Set(prev);
                      next.delete(card.id);
                      return next;
                    });
                    onDismiss(card.id);
                  } else {
                    setFavorited((prev) => {
                      const next = new Set(prev);
                      next.add(card.id);
                      return next;
                    });
                    onSave(card.id);
                  }
                }}
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
                className="mx-4 rounded-[8px] px-5 py-5"
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
                  <Button
                    unstyled
                    type="button"
                    onClick={() => setShowEndConfirm(false)}
                    className="flex-1 rounded-[8px] py-2.5 text-sm font-medium transition-colors"
                    style={{
                      background: TOKEN.parchment,
                      border: `1px solid ${TOKEN.borderWarm}`,
                      color: TOKEN.charcoal,
                    }}
                  >
                    取消
                  </Button>
                  <Button
                    unstyled
                    type="button"
                    onClick={handleEndConfirm}
                    className="flex-1 rounded-[8px] py-2.5 text-sm font-semibold transition-colors"
                    style={{
                      background: TOKEN.terracotta,
                      color: "#fffefb",
                    }}
                  >
                    确认结束
                  </Button>
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
      <div className="mx-auto w-full space-y-1.5" style={{ maxWidth: "min(320px, 100%)" }}>
        {/* Primary actions row */}
        <div className="flex gap-1.5">
          <Button
            unstyled
            type="button"
            onClick={handleNo}
            disabled={!currentCard}
            className="flex flex-1 items-center justify-center gap-1 rounded-[8px] py-2 text-xs font-medium transition-all disabled:opacity-40"
            style={{
              background: "#eceae3",
              border: "1px solid #b5b2aa",
              color: TOKEN.charcoal,
            }}
            title="不感兴趣：后续推荐会降低这类相似特征权重"
          >
            <X className="h-3.5 w-3.5" />
            <span>No</span>
          </Button>

          <Button
            unstyled
            type="button"
            onClick={handleSaveSignal}
            disabled={!currentCard}
            className="flex flex-1 items-center justify-center gap-1 rounded-[8px] py-2 text-xs font-semibold transition-all disabled:opacity-40"
            style={{
              background: currentSaved ? "#fff7f4" : TOKEN.ivory,
              border: `1px solid ${TOKEN.sand}`,
              color: currentSaved ? TOKEN.terracotta : TOKEN.charcoal,
            }}
            title="感兴趣：收藏当前博主"
          >
            <Heart
              className="h-3.5 w-3.5"
              style={{
                fill: currentSaved ? TOKEN.terracotta : "none",
              }}
            />
            <span>{currentSaved ? "已收藏" : "收藏"}</span>
          </Button>
        </div>

        {/* Secondary action row */}
        <div className="flex">
          <Button
            unstyled
            type="button"
            onClick={handleFindSimilarFromCurrent}
            disabled={!currentCard}
            className="flex w-full min-w-0 items-center justify-center gap-1 rounded-[8px] py-2 text-xs font-semibold transition-all disabled:opacity-40"
            style={{
              background: TOKEN.terracotta,
              color: "#fffefb",
            }}
            title={`根据 ${currentCreatorLabel} 继续${activeModeLabel}`}
            aria-label={`根据 ${currentCreatorLabel} ${activeModeLabel}`}
          >
            <span>根据</span>
            {currentCard ? <InlineCreatorAvatar name={currentCard.name} /> : null}
            <span>{activeModeLabel}</span>
          </Button>
        </div>

        {/* Quick switch */}
        <Button
          unstyled
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
        </Button>
      </div>

      {/* Mode picker — shown when user taps "根据 TA 找相似" in the carousel */}
      <SimilarModePicker
        open={showSeedModePicker}
        selectedMode={seedPickerMode}
        onSelect={(mode) => {
          setSeedPickerMode(mode);
          setHasChosenMode(true);
          setShowSeedModePicker(false);
          applySeedMode(mode);
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
