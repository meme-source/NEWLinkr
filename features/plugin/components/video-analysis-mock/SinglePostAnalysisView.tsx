"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  FileText,
  Lock,
  Music,
  PieChart,
  ShieldAlert,
  Sparkles,
  Video,
  Zap,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { FeatureBody } from "./SinglePostFeatureBodies";
import {
  FEATURE_COST,
  FEATURE_LABEL,
  TOTAL_TOKENS_PER_MONTH,
  type MockFeatureId,
  type MockPost,
} from "./mock-posts";
import { SinglePostTrackingTab } from "./SinglePostTrackingTab";

// 两个子 tab：单帖分析（功能 accordion）/ 单帖追踪（投放效果监控 + 投放追踪）。
export type AnalysisSubTab = "analysis" | "tracking";

interface SinglePostAnalysisViewProps {
  post: MockPost;
  tokensUsed: number;
  /** 用户点 paywall「消耗 X 积分解锁」CTA — 父组件弹 UnlockConfirmModal 处理后续。 */
  onRequestUnlock: (featureId: MockFeatureId) => void;
  subTab: AnalysisSubTab;
  onSubTabChange: (tab: AnalysisSubTab) => void;
  /** 「单帖追踪」tab 里「投放追踪」按钮 —— 父组件弹 TrackingSetupDialog。 */
  onOpenTracking: () => void;
}

interface FeatureRow {
  id: MockFeatureId;
  Icon: typeof Activity;
}

// 「单帖分析」tab 的功能行。「投放效果监控」(placement) 已移到「单帖追踪」tab，
// 不再是 accordion 项。其余按"免费 → 付费"分组。
const FEATURE_ROWS: FeatureRow[] = [
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
  onOpenTracking,
}: SinglePostAnalysisViewProps) {
  // 默认展开"帖子表现"（用户第一眼看到的高优先级 module）。
  const [expanded, setExpanded] = useState<Set<MockFeatureId>>(new Set(["track"]));

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
        <SubTabBar subTab={subTab} onChange={onSubTabChange} />
      </div>

      {/* 内容区 —— 单帖分析 / 单帖追踪 二选一。 */}
      <div className="hide-scrollbar flex-1 overflow-y-auto">
        {subTab === "analysis" ? (
          FEATURE_ROWS.map((row) => (
            <FeatureAccordion
              key={row.id}
              row={row}
              post={post}
              isExpanded={expanded.has(row.id)}
              onToggle={() => toggle(row.id)}
              onRequestUnlock={onRequestUnlock}
              remaining={remaining}
            />
          ))
        ) : (
          <SinglePostTrackingTab
            post={post}
            unlocked={post.unlocked.includes("placement")}
            cost={FEATURE_COST.placement}
            remaining={remaining}
            onOpenTracking={onOpenTracking}
          />
        )}
      </div>
    </div>
  );
}

// ─── Mini tab（单帖分析 / 单帖追踪）─────────────────────────────────────

function SubTabBar({
  subTab,
  onChange,
}: {
  subTab: AnalysisSubTab;
  onChange: (t: AnalysisSubTab) => void;
}) {
  return (
    <div
      className="mt-3 -mb-px flex items-center gap-4 border-b"
      style={{ borderColor: "transparent" }}
    >
      <SubTabButton
        label="单帖分析"
        active={subTab === "analysis"}
        onClick={() => onChange("analysis")}
      />
      <SubTabButton
        label="单帖追踪"
        active={subTab === "tracking"}
        onClick={() => onChange("tracking")}
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
            AI 分析积分
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
        本月已用 {used} 积分 · 下月 1 日刷新
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
}: {
  row: FeatureRow;
  post: MockPost;
  isExpanded: boolean;
  onToggle: () => void;
  onRequestUnlock: (id: MockFeatureId) => void;
  remaining: number;
}) {
  const { id, Icon } = row;
  const label = FEATURE_LABEL[id];
  const cost = FEATURE_COST[id];
  const isFree = cost === 0;
  const isUnlocked = isFree || post.unlocked.includes(id);

  return (
    <div className="border-b" style={{ borderColor: "#eceae3" }}>
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
              style={{ backgroundColor: "rgba(63, 107, 41, 0.10)", color: "#3f6b29" }}
            >
              已解锁
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: "rgba(255, 79, 0, 0.10)", color: "#ff4f00" }}
            >
              <Lock size={9} strokeWidth={2.4} aria-hidden />
              消耗 {cost} 积分解锁
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
        <Lock size={11} strokeWidth={2.4} aria-hidden />
        {insufficientTokens ? `余额不足（需 ${cost} 积分）` : `消耗 ${cost} 积分解锁`}
      </Button>
    </div>
  );
}
