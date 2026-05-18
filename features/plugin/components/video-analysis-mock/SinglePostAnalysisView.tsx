"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  ChevronDown,
  Download,
  FileText,
  Lock,
  Music,
  PieChart,
  Radar,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Video,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  FEATURE_COST,
  FEATURE_LABEL,
  TOTAL_TOKENS_PER_MONTH,
  type MockFeatureId,
  type MockPost,
  type UnlockHistoryEntry,
} from "./mock-posts";

import { Button } from "@/components/ui/button";

export type AnalysisSubTab = "current" | "history";

interface SinglePostAnalysisViewProps {
  post: MockPost;
  tokensUsed: number;
  /** 用户点 paywall「消耗 X 次解锁」CTA — 父组件弹 UnlockConfirmModal 处理后续。 */
  onRequestUnlock: (featureId: MockFeatureId) => void;
  // ── mini tab + 历史记录 ──
  subTab: AnalysisSubTab;
  onSubTabChange: (tab: AnalysisSubTab) => void;
  history: UnlockHistoryEntry[];
  /** 用户在历史列表点条目 — 父组件负责切帖 + 让本组件 forceExpand 对应 accordion。 */
  onHistoryItemClick: (entry: UnlockHistoryEntry) => void;
  /** 从历史跳转过来时，父组件传入要自动展开的 featureId；展开后由内部清掉。 */
  forceExpandFeatureId: MockFeatureId | null;
  onForceExpandConsumed: () => void;
}

interface FeatureRow {
  id: MockFeatureId;
  Icon: typeof Activity;
}

// 顺序就是显示顺序。「投放效果监控」放第 0 位（默认展开），其余按"免费→付费"
// 分组：免费的 track / extract-video / extract-audio 在前，付费的 audience /
// fake-fans / subtitle / ai-breakdown 在后。
const FEATURE_ROWS: FeatureRow[] = [
  { id: "placement", Icon: Radar },
  { id: "track", Icon: Activity },
  { id: "audience", Icon: PieChart },
  { id: "fake-fans", Icon: ShieldAlert },
  { id: "extract-video", Icon: Video },
  { id: "extract-audio", Icon: Music },
  { id: "subtitle", Icon: FileText },
  { id: "ai-breakdown", Icon: Sparkles },
];

export function SinglePostAnalysisView({
  post,
  tokensUsed,
  onRequestUnlock,
  subTab,
  onSubTabChange,
  history,
  onHistoryItemClick,
  forceExpandFeatureId,
  onForceExpandConsumed,
}: SinglePostAnalysisViewProps) {
  // 默认展开"投放效果监控"（用户第一眼看到的高优先级 module）；用户每帖切换都
  // 可以单独展开/折叠不同项，状态在本组件 local。
  const [expanded, setExpanded] = useState<Set<MockFeatureId>>(new Set(["placement"]));
  const accordionRefs = useRef<Map<MockFeatureId, HTMLDivElement | null>>(new Map());

  // 从历史跳转过来：父组件把 forceExpandFeatureId 设上，本 effect 响应一次性
  // 展开 + 滚动 + 通知父组件清掉。lint 规则 react-hooks/set-state-in-effect 在
  // 这里 disable —— 这是 React 文档允许的"响应 prop 触发 state 同步"用例之一，
  // 与 project-context.tsx 的 SSR localStorage hydration 是同类型。
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!forceExpandFeatureId) return;
    setExpanded((prev) => {
      if (prev.has(forceExpandFeatureId)) return prev;
      const next = new Set(prev);
      next.add(forceExpandFeatureId);
      return next;
    });
    const id = window.setTimeout(() => {
      const el = accordionRefs.current.get(forceExpandFeatureId);
      el?.scrollIntoView({ block: "start", behavior: "smooth" });
      onForceExpandConsumed();
    }, 80);
    return () => window.clearTimeout(id);
  }, [forceExpandFeatureId, onForceExpandConsumed]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const toggle = (id: MockFeatureId) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const remaining = Math.max(0, TOTAL_TOKENS_PER_MONTH - tokensUsed);
  const usedPct = (tokensUsed / TOTAL_TOKENS_PER_MONTH) * 100;

  return (
    <div className="flex h-full flex-col">
      {/* 顶部 — 标题 + Token banner + mini tab */}
      <div className="flex-shrink-0 border-b px-4 pt-4" style={{ borderColor: "#eceae3" }}>
        <div className="mb-3 flex items-center gap-2">
          <Activity size={14} strokeWidth={2.2} style={{ color: "#ff4f00" }} aria-hidden />
          <h2 className="text-[14px] font-semibold" style={{ color: "#201515" }}>
            单帖 AI 分析
          </h2>
          <span className="ml-auto truncate text-[10.5px]" style={{ color: "#939084" }}>
            {post.handle}
          </span>
        </div>
        <TokenBanner used={tokensUsed} total={TOTAL_TOKENS_PER_MONTH} pct={usedPct} />
        <SubTabBar subTab={subTab} onChange={onSubTabChange} historyCount={history.length} />
      </div>

      {/* 内容区 —— 当前帖 / 历史记录 二选一。hide-scrollbar 跟真 SidebarShell 同源 */}
      <div className="hide-scrollbar flex-1 overflow-y-auto">
        {subTab === "current" ? (
          FEATURE_ROWS.map((row) => (
            <FeatureAccordion
              key={row.id}
              row={row}
              post={post}
              isExpanded={expanded.has(row.id)}
              onToggle={() => toggle(row.id)}
              onRequestUnlock={onRequestUnlock}
              remaining={remaining}
              registerRef={(el) => accordionRefs.current.set(row.id, el)}
            />
          ))
        ) : (
          <HistoryView history={history} onItemClick={onHistoryItemClick} />
        )}
      </div>
    </div>
  );
}

// ─── Mini tab（当前帖 / 历史记录）──────────────────────────────────────

function SubTabBar({
  subTab,
  onChange,
  historyCount,
}: {
  subTab: AnalysisSubTab;
  onChange: (t: AnalysisSubTab) => void;
  historyCount: number;
}) {
  return (
    <div
      className="mt-3 -mb-px flex items-center gap-4 border-b"
      style={{ borderColor: "transparent" }}
    >
      <SubTabButton
        label="当前帖"
        active={subTab === "current"}
        onClick={() => onChange("current")}
      />
      <SubTabButton
        label={`历史记录${historyCount > 0 ? ` · ${historyCount}` : ""}`}
        active={subTab === "history"}
        onClick={() => onChange("history")}
      />
    </div>
  );
}

function SubTabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      unstyled
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="relative pb-2 text-[12.5px] transition-colors"
      style={{
        color: active ? "#201515" : "#939084",
        fontWeight: active ? 600 : 500,
      }}
    >
      {label}
      {active ? (
        <span
          aria-hidden
          className="absolute right-0 bottom-0 left-0 h-[2px] rounded-full"
          style={{ backgroundColor: "#ff4f00" }}
        />
      ) : null}
    </Button>
  );
}

// ─── 历史记录 view ─────────────────────────────────────────────────────

function HistoryView({
  history,
  onItemClick,
}: {
  history: UnlockHistoryEntry[];
  onItemClick: (entry: UnlockHistoryEntry) => void;
}) {
  if (history.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="text-[12px]" style={{ color: "#939084" }}>
          本月还没有解锁过付费数据
        </div>
        <div className="mt-1 text-[10.5px]" style={{ color: "#b5b2aa" }}>
          下月 1 日 token 余额刷新
        </div>
      </div>
    );
  }

  const sorted = [...history].sort(
    (a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime(),
  );
  const groups = groupByDay(sorted);

  return (
    <div className="px-4 pt-3 pb-4">
      {groups.map((g) => (
        <div key={g.label} className="mb-3 last:mb-0">
          <div
            className="mb-1.5 text-[10.5px] font-semibold tracking-[0.5px] uppercase"
            style={{ color: "#939084" }}
          >
            {g.label}
          </div>
          <div className="flex flex-col gap-1.5">
            {g.entries.map((entry) => (
              <HistoryRow key={entry.id} entry={entry} onClick={() => onItemClick(entry)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function HistoryRow({ entry, onClick }: { entry: UnlockHistoryEntry; onClick: () => void }) {
  const featureLabel = FEATURE_LABEL[entry.featureId];
  const date = new Date(entry.unlockedAt);
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return (
    <Button
      unstyled
      type="button"
      onClick={onClick}
      className="group w-full rounded-[8px] border bg-[#fffdf9] px-3 py-2.5 text-left transition-colors hover:bg-white"
      style={{ borderColor: "#eceae3" }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-[12.5px] font-medium" style={{ color: "#201515" }}>
          {featureLabel}
        </span>
        <span
          className="flex-shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums"
          style={{ backgroundColor: "rgba(255, 79, 0, 0.10)", color: "#ff4f00" }}
        >
          -{entry.cost} 次
        </span>
      </div>
      <div className="mt-1 flex items-baseline gap-1.5 text-[10.5px]" style={{ color: "#939084" }}>
        <span className="font-medium" style={{ color: "#36342e" }}>
          {entry.postHandle}
        </span>
        <span>·</span>
        <span className="tabular-nums">{time}</span>
      </div>
      <div className="mt-0.5 truncate text-[10.5px]" style={{ color: "#939084" }}>
        {entry.postCaption}
      </div>
      <div
        className="mt-1 text-[10.5px] font-medium transition-colors group-hover:underline"
        style={{ color: "#ff4f00" }}
      >
        查看 →
      </div>
    </Button>
  );
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

interface DayGroup {
  label: string;
  entries: UnlockHistoryEntry[];
}

function groupByDay(entries: UnlockHistoryEntry[]): DayGroup[] {
  const buckets = new Map<string, UnlockHistoryEntry[]>();
  for (const e of entries) {
    const day = e.unlockedAt.slice(0, 10);
    const list = buckets.get(day) ?? [];
    list.push(e);
    buckets.set(day, list);
  }
  const days = Array.from(buckets.keys()).sort((a, b) => (a < b ? 1 : -1));
  return days.map((day, idx) => ({
    label: idx === 0 ? "今天" : idx === 1 ? "昨天" : day,
    entries: buckets.get(day)!,
  }));
}

// ─── Token banner ──────────────────────────────────────────────────────

function TokenBanner({ used, total, pct }: { used: number; total: number; pct: number }) {
  return (
    <div
      className="rounded-[8px] px-3 py-2.5"
      style={{ backgroundColor: "#fffdf9", border: "1px solid #eceae3" }}
    >
      <div className="flex items-baseline justify-between">
        <div className="flex items-center gap-1.5">
          <Zap size={11} strokeWidth={2.4} style={{ color: "#ff4f00" }} aria-hidden />
          <span className="text-[11px] font-semibold" style={{ color: "#36342e" }}>
            AI 分析次数
          </span>
        </div>
        <span className="text-[11px] tabular-nums" style={{ color: "#939084" }}>
          剩 <span style={{ color: "#201515", fontWeight: 600 }}>{total - used}</span> / {total}
        </span>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full"
        style={{ backgroundColor: "#eceae3" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #ffb88a 0%, #ff7a3d 100%)",
          }}
        />
      </div>
      <div className="mt-1.5 text-[10.5px]" style={{ color: "#939084" }}>
        本月已用 {used} 次 · 下月 1 日刷新
      </div>
    </div>
  );
}

// ─── Accordion 单项 ────────────────────────────────────────────────────

function FeatureAccordion({
  row,
  post,
  isExpanded,
  onToggle,
  onRequestUnlock,
  remaining,
  registerRef,
}: {
  row: FeatureRow;
  post: MockPost;
  isExpanded: boolean;
  onToggle: () => void;
  onRequestUnlock: (id: MockFeatureId) => void;
  remaining: number;
  registerRef: (el: HTMLDivElement | null) => void;
}) {
  const { id, Icon } = row;
  const label = FEATURE_LABEL[id];
  const cost = FEATURE_COST[id];
  const isFree = cost === 0;
  const isUnlocked = isFree || post.unlocked.includes(id);

  return (
    <div ref={registerRef} className="border-b" style={{ borderColor: "#eceae3" }}>
      <Button
        unstyled
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-[#fffdf9]"
      >
        <Icon
          size={13}
          strokeWidth={2.1}
          style={{ color: isUnlocked ? "#36342e" : "#939084" }}
          aria-hidden
        />
        <span
          className="flex-1 text-[12.5px]"
          style={{
            color: isUnlocked ? "#201515" : "#36342e",
            fontWeight: isExpanded ? 600 : 500,
          }}
        >
          {label}
        </span>
        {!isFree ? (
          isUnlocked ? (
            <span
              className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: "rgba(63, 107, 41, 0.10)",
                color: "#3f6b29",
              }}
            >
              已解锁
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: "rgba(255, 79, 0, 0.10)",
                color: "#ff4f00",
              }}
            >
              <Lock size={9} strokeWidth={2.4} aria-hidden />
              扣费 {cost} 次
            </span>
          )
        ) : null}
        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.18 }}
          className="flex-shrink-0"
          style={{ color: "#939084" }}
        >
          <ChevronDown size={13} strokeWidth={2.2} />
        </motion.span>
      </Button>

      <AnimatePresence initial={false}>
        {isExpanded ? (
          <motion.div
            key="body"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {isUnlocked ? (
                <FeatureBody id={id} post={post} />
              ) : (
                <InlinePaywall
                  featureLabel={label}
                  cost={cost}
                  remaining={remaining}
                  onUnlock={() => onRequestUnlock(id)}
                />
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// ─── Inline paywall（点 CTA 触发 modal）─────────────────────────────────

function InlinePaywall({
  featureLabel,
  cost,
  remaining,
  onUnlock,
}: {
  featureLabel: string;
  cost: number;
  remaining: number;
  onUnlock: () => void;
}) {
  const insufficientTokens = remaining < cost;
  return (
    <div
      className="flex flex-col items-center gap-2 rounded-[8px] px-4 py-4 text-center"
      style={{ backgroundColor: "#fffdf9", border: "1px dashed #c5c0b1" }}
    >
      <AlertTriangle size={16} strokeWidth={2.2} style={{ color: "#ff4f00" }} aria-hidden />
      <div className="text-[11.5px] leading-[1.55] font-medium" style={{ color: "#36342e" }}>
        解锁「{featureLabel}」后，本帖此项数据永久可见
      </div>
      <Button
        unstyled
        type="button"
        onClick={onUnlock}
        disabled={insufficientTokens}
        className="mt-1 inline-flex items-center gap-1 rounded-[6px] px-3 py-1.5 text-[11.5px] font-semibold text-[#fffefb] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        style={{ backgroundColor: "#ff4f00" }}
      >
        <Sparkles size={11} strokeWidth={2.4} aria-hidden />
        {insufficientTokens ? `余额不足（需 ${cost} 次）` : `消耗 ${cost} 次解锁`}
      </Button>
    </div>
  );
}

// ─── 单个功能的展开内容 ────────────────────────────────────────────────

function FeatureBody({ id, post }: { id: MockFeatureId; post: MockPost }) {
  if (id === "placement") return <PlacementBody post={post} />;
  if (id === "track") return <TrackBody post={post} />;
  if (id === "audience") return <AudienceBody post={post} />;
  if (id === "fake-fans") return <FakeFansBody post={post} />;
  if (id === "extract-video") return <ExtractBody kind="video" />;
  if (id === "extract-audio") return <ExtractBody kind="audio" />;
  if (id === "subtitle") return <SubtitleBody />;
  if (id === "ai-breakdown") return <AiBreakdownBody />;
  return null;
}

// ─── Tab 0: 投放效果监控 ───────────────────────────────────────────────
//
// 跟「帖子表现」字段有 overlap（都看播放/互动/收藏/评论），但本模块更"业务侧"：
//  - 顶部投放级 tag（重点投放 / 测试中 / 已结案 …）
//  - 5 个 metric（观看 / ER / 收藏 / 评论 / 分享）
//  - 底部 CTA 跳转 /workspace/outreach 的「追踪看板 → 投放表现」
//
// 真产品的"投放追踪"功能现在挂在 outreach 模块里（board-performance-*.tsx），
// 所以跳转目标就是 /workspace/outreach。等真产品独立 tracking 路由再调。

function PlacementBody({ post }: { post: MockPost }) {
  const { metrics, placementTags } = post;
  return (
    <div>
      {placementTags.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-1">
          {placementTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
              style={{
                backgroundColor: "#eceae3",
                color: "#36342e",
                border: "1px solid #c5c0b1",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      <div className="grid grid-cols-3 gap-1.5">
        <Metric label="观看" value={metrics.plays} />
        <Metric label="ER" value={metrics.er} />
        <Metric label="收藏" value={metrics.saves} />
        <Metric label="评论" value={metrics.comments} />
        <Metric label="分享" value={metrics.shares} />
      </div>
      {/*
       * Deep link 精确到「追踪看板 → 投放表现 → 该帖对应的投放卡片」。
       * URL 三段语义：
       *   ?tab=board       → outreach 顶部 tab 切到「追踪看板」
       *   &view=performance → 切到子 view「投放表现」（默认是「项目概览」）
       *   #placement-<id>  → 滚动锚点，定位到该帖的 PlacementCard
       *
       * outreach page 的 tab + view 已经从 useSearchParams 读取并切换；
       * #placement-<id> 锚点依赖 board-performance-card.tsx 给 article 加 id。
       * 详见 §7。
       */}
      <a
        href={`/workspace/outreach?tab=board&view=performance#placement-${post.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-[6px] py-2 text-[12px] font-semibold transition-opacity hover:opacity-85"
        style={{
          backgroundColor: "#fffdf9",
          color: "#ff4f00",
          border: "1px solid #ff4f00",
        }}
      >
        <ArrowUpRight size={13} strokeWidth={2.4} aria-hidden />
        在投放后台看完整数据
      </a>
    </div>
  );
}

function TrackBody({ post }: { post: MockPost }) {
  const { metrics } = post;
  // 刷新 icon 状态：rotation 每次点击 +360 触发 motion 旋转，
  // justRefreshed 控制 4 秒内显示"刚刚刷新"文案。mock 不真去拉数据。
  const [rotation, setRotation] = useState(0);
  const [justRefreshed, setJustRefreshed] = useState(false);
  const handleRefresh = () => {
    setRotation((r) => r + 360);
    setJustRefreshed(true);
    window.setTimeout(() => setJustRefreshed(false), 4000);
  };
  return (
    <div>
      <div className="grid grid-cols-2 gap-1.5">
        <Metric label="播放量" value={metrics.plays} />
        <Metric label="互动率" value={metrics.er} />
        <Metric label="新增收藏" value={metrics.saves} />
        <Metric label="新增评论" value={metrics.comments} />
      </div>
      <div
        className="mt-2 flex items-center gap-2 rounded-[6px] px-2.5 py-1.5 text-[10.5px]"
        style={{ backgroundColor: "#fffdf9", color: "#939084", border: "1px solid #eceae3" }}
      >
        <span className="flex-1">
          {justRefreshed ? "刚刚刷新 · 下次同步 02:00" : "7 日内完成 4 次抓取 · 下次同步 02:00"}
        </span>
        <Button
          unstyled
          type="button"
          onClick={handleRefresh}
          aria-label="刷新数据"
          className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-[4px] transition-colors hover:bg-[#eceae3]"
          style={{ color: justRefreshed ? "#ff4f00" : "#939084" }}
        >
          <motion.span
            animate={{ rotate: rotation }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: "inline-flex" }}
          >
            <RefreshCw size={11} strokeWidth={2.2} />
          </motion.span>
        </Button>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] px-2 py-2 text-center" style={{ backgroundColor: "#eceae3" }}>
      <div className="text-[10px]" style={{ color: "#939084" }}>
        {label}
      </div>
      <div className="mt-0.5 text-[14px] font-semibold tabular-nums" style={{ color: "#201515" }}>
        {value}
      </div>
    </div>
  );
}

function AudienceBody({ post }: { post: MockPost }) {
  const { audience } = post;
  return (
    <div>
      <SectionLabel text="性别" />
      <BarRow label="男性" pct={audience.gender.male} />
      <BarRow label="女性" pct={audience.gender.female} />
      <div className="mt-3">
        <SectionLabel text="年龄段" />
        {audience.age.map((a) => (
          <BarRow key={a.range} label={a.range} pct={a.pct} />
        ))}
      </div>
      <div className="mt-3">
        <SectionLabel text="受众地区（T1）" />
        {audience.regions.map((r) => (
          <BarRow key={r.label} label={`${r.flag}  ${r.label}`} pct={r.pct} />
        ))}
      </div>
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div
      className="mb-1 text-[9.5px] font-semibold tracking-[0.5px] uppercase"
      style={{ color: "#939084" }}
    >
      {text}
    </div>
  );
}

function BarRow({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="mb-1.5 last:mb-0">
      <div className="mb-0.5 flex items-baseline justify-between text-[11px]">
        <span style={{ color: "#36342e" }}>{label}</span>
        <span className="font-medium tabular-nums" style={{ color: "#201515" }}>
          {pct}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: "#eceae3" }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #ffb88a 0%, #ff7a3d 100%)",
          }}
        />
      </div>
    </div>
  );
}

function FakeFansBody({ post }: { post: MockPost }) {
  const { fakeFans } = post;
  return (
    <div>
      <div className="grid grid-cols-3 gap-1.5">
        <StatBlock
          label="真实用户"
          value={`${fakeFans.real}%`}
          tone="#3f6b29"
          bg="rgba(63, 107, 41, 0.10)"
        />
        <StatBlock
          label="疑似假粉"
          value={`${fakeFans.fake}%`}
          tone="#ff4f00"
          bg="rgba(255, 79, 0, 0.10)"
        />
        <StatBlock label="网红粉丝" value={`${fakeFans.influencer}%`} tone="#36342e" bg="#eceae3" />
      </div>
      <div className="mt-3">
        <SectionLabel text="样例可疑账号" />
        <SuspiciousRow handle="@ty…ji.1710" reason="Low engagement, suspicious activity" />
        <SuspiciousRow handle="@musa190310" reason="No posts, suspicious username" />
      </div>
    </div>
  );
}

function StatBlock({
  label,
  value,
  tone,
  bg,
}: {
  label: string;
  value: string;
  tone: string;
  bg: string;
}) {
  return (
    <div className="rounded-[6px] px-1.5 py-2 text-center" style={{ backgroundColor: bg }}>
      <div className="text-[13px] font-semibold tabular-nums" style={{ color: tone }}>
        {value}
      </div>
      <div className="mt-0.5 text-[9.5px]" style={{ color: "#36342e" }}>
        {label}
      </div>
    </div>
  );
}

function SuspiciousRow({ handle, reason }: { handle: string; reason: string }) {
  return (
    <div
      className="mb-1.5 flex items-center gap-2 rounded-[6px] px-2 py-1.5 last:mb-0"
      style={{ border: "1px solid #eceae3", backgroundColor: "#fffdf9" }}
    >
      <div className="h-4 w-4 flex-shrink-0 rounded-full" style={{ backgroundColor: "#eceae3" }} />
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-medium" style={{ color: "#201515" }}>
          {handle}
        </div>
        <div className="truncate text-[10px]" style={{ color: "#939084" }}>
          {reason}
        </div>
      </div>
    </div>
  );
}

function ExtractBody({ kind }: { kind: "video" | "audio" }) {
  const buttonText = kind === "video" ? "下载 mp4" : "下载 mp3";
  const hint =
    kind === "video"
      ? "原始 mp4（无水印）· 最大 100MB · 仅供分析使用"
      : "原声 mp3 · 最大 25MB · 适合配音 / 原声引用";
  return (
    <div>
      <Button
        unstyled
        type="button"
        className="flex w-full items-center justify-center gap-1.5 rounded-[6px] py-2 text-[12px] font-semibold text-[#fffefb] transition-opacity hover:opacity-90"
        style={{ backgroundColor: "#201515" }}
      >
        <Download size={12} strokeWidth={2.4} aria-hidden />
        {buttonText}
      </Button>
      <div className="mt-1.5 text-[10.5px]" style={{ color: "#939084" }}>
        {hint}
      </div>
    </div>
  );
}

function SubtitleBody() {
  return (
    <div>
      <div
        className="rounded-[6px] px-2.5 py-2 text-[11.5px] leading-[1.55]"
        style={{ backgroundColor: "#fffdf9", border: "1px solid #eceae3", color: "#36342e" }}
      >
        <span className="font-medium tabular-nums" style={{ color: "#939084" }}>
          00:00
        </span>{" "}
        This is your sign to have people
        <br />
        <span className="font-medium tabular-nums" style={{ color: "#939084" }}>
          00:03
        </span>{" "}
        with the same body type as you as your fitness inspo.
      </div>
      <Button
        unstyled
        type="button"
        className="mt-2 text-[11px] font-medium transition-colors hover:underline"
        style={{ color: "#ff4f00" }}
      >
        复制全部字幕
      </Button>
    </div>
  );
}

function AiBreakdownBody() {
  return (
    <div>
      <div className="text-[11px] leading-[1.55]" style={{ color: "#939084" }}>
        选择一个分析角度，AI 会基于本帖的内容、画面、文案、互动综合输出。
      </div>
      <div className="mt-2 space-y-1.5">
        <RadioCard label="深度内容解析" desc="核心观点 + 叙事逻辑 + 情感基调" />
        <RadioCard label="爆款要素拆解" desc="选题 / 脚本 / 视觉 / 音乐" />
        <RadioCard label="把视频翻译成中文" desc="画面描述 + 字幕逐句翻译" />
      </div>
      <Button
        unstyled
        type="button"
        className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-[6px] py-2 text-[12px] font-semibold text-[#fffefb] transition-opacity hover:opacity-90"
        style={{ backgroundColor: "#ff4f00" }}
      >
        <Sparkles size={12} strokeWidth={2.4} aria-hidden />
        开始分析
      </Button>
    </div>
  );
}

function RadioCard({ label, desc }: { label: string; desc: string }) {
  return (
    <label
      className="flex cursor-pointer items-start gap-2 rounded-[6px] px-2 py-2 transition-colors hover:bg-[#fffdf9]"
      style={{ border: "1px solid #eceae3" }}
    >
      <input type="radio" name="ai-instruction" className="mt-1 accent-[#ff4f00]" />
      <div>
        <div className="text-[11.5px] font-medium" style={{ color: "#201515" }}>
          {label}
        </div>
        <div className="mt-0.5 text-[10.5px]" style={{ color: "#939084" }}>
          {desc}
        </div>
      </div>
    </label>
  );
}
