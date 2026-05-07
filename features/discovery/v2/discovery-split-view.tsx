"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Info } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChatChips, ChatIntent } from "../chat-types";
import { IntentHero } from "../components/intent-hero";
import { InputArea } from "../components/input-area";
import {
  isEditorEmpty,
  serializeEditorState,
} from "../components/structured-editor/structured-editor";
import {
  DEFAULT_EDITOR_STATE,
  type StructuredEditorState,
} from "../components/structured-editor/types";
import { useSidebarCollapse } from "@/features/workspace-shell/components/sidebar-collapse-context";
import { useCreatorProfile } from "@/features/creator/components/creator-profile-context";
import { useWorkspaceProject } from "@/features/project/components/project-context";
import { AgentConsole, type AgentConsoleHandle } from "./agent-console";
import { CompositeCreatorCard } from "./composite-creator-card";
import { DiscardModal } from "./discard-modal";
import { applyHardFilters } from "./filters";
import { ProjectSwitcher } from "./project-switcher";
import { runAgentFlow } from "./lib/run-agent-flow";
import { groupCreators, MOCK_CREATORS, type Creator, type EvidenceRule } from "./mock-data";

const BRAND = "#ff4f00";

type CardStatus = "pending" | "saved" | "skipped";

type RunState = "idle" | "thinking" | "ready";

interface UserMessage {
  productUrl: string | null;
  productTitle: string | null;
  freeText: string;
}

const DEFAULT_CHAT_CHIPS: ChatChips = {
  platform: "tiktok",
  countries: [],
  languages: [],
  follower: "any",
  viewsStep: 0,
};

export function DiscoverySplitView() {
  // Pre-submit: existing IntentHero + InputArea state
  const [intent, setIntent] = useState<ChatIntent>("competitor");
  const [chatChips, setChatChips] = useState<ChatChips>(DEFAULT_CHAT_CHIPS);
  const [editorState, setEditorState] = useState<StructuredEditorState>(DEFAULT_EDITOR_STATE);

  // Shared: agent run state
  const [runState, setRunState] = useState<RunState>("idle");
  const [userMessage, setUserMessage] = useState<UserMessage | null>(null);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [canvasRevealed, setCanvasRevealed] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, CardStatus>>({});

  const consoleRef = useRef<AgentConsoleHandle>(null);

  // Post-submit: split-view follow-up state
  const [followUpValue, setFollowUpValue] = useState("");

  const groups = useMemo(() => groupCreators(creators), [creators]);

  // Auto-collapse the workspace sidebar when entering split-view so the canvas
  // gets max width. We don't auto-expand on the way back — let the user keep
  // their preference once set.
  const { setCollapsed: setSidebarCollapsed } = useSidebarCollapse();
  const isSplitView = runState !== "idle";
  useEffect(() => {
    if (isSplitView) setSidebarCollapsed(true);
  }, [isSplitView, setSidebarCollapsed]);

  const runStreamingAgent = useCallback(
    async (msg: UserMessage, isFollowUp: boolean) => {
      // Mount the split-view first — AgentConsole only exists when
      // runState !== "idle", so its ref isn't wired yet on intake submit.
      // We flip the state, then wait for React to paint before reading the
      // ref. Without this defer, intake submit silently no-ops on the very
      // first run because consoleRef.current is null.
      setRunState("thinking");
      setCanvasRevealed(false);
      if (!isFollowUp) {
        setUserMessage(msg);
      }

      const filteredPool = isFollowUp
        ? filterFromText(creators, msg.freeText)
        : applyHardFilters(MOCK_CREATORS, chatChips);

      // Pre-populate canvas data so once the reveal fires, cards are ready.
      setCreators(filteredPool);
      const finalCount = filteredPool.length;

      // Wait for the AgentConsole to mount. The pre-submit IntentHero is
      // wrapped in an AnimatePresence(mode="wait") with a 300ms exit, so the
      // console's ref isn't populated until that finishes. Poll the
      // imperative handle with a reasonable upper bound rather than
      // hard-coding a sleep that could outlive the actual mount.
      const stepsEl = await waitForConsoleSteps(consoleRef);
      const summaryEl = consoleRef.current?.summaryEl ?? null;
      if (!stepsEl) {
        // Defensive — if mount somehow failed, surface the canvas anyway so
        // the user isn't stranded in a half-thinking state.
        setRunState("ready");
        setCanvasRevealed(true);
        return;
      }

      consoleRef.current?.setSummary(
        finalCount,
        isFollowUp ? `已按追问「${msg.freeText}」重排卡片` : "按合作证据强弱分组，强证据组优先推进",
      );

      await runAgentFlow({
        stepsContainer: stepsEl,
        summaryEl,
        onReady: () => setRunState("ready"),
        onComplete: () => {
          setCanvasRevealed(true);
        },
      });
    },
    [chatChips, creators],
  );

  const handleIntakeSubmit = useCallback(() => {
    if (runState === "thinking") return;
    if (isEditorEmpty(editorState)) return;
    const product = editorState.productChip;
    const freeText = serializeEditorState(intent, editorState).trim();
    if (!freeText && !product) return;
    const message: UserMessage = {
      productUrl: product?.url ?? null,
      productTitle: product?.title ?? null,
      freeText,
    };
    void runStreamingAgent(message, false);
  }, [editorState, intent, runState, runStreamingAgent]);

  const handleFollowUpSubmit = useCallback(() => {
    const text = followUpValue.trim();
    if (!text || runState === "thinking") return;
    setFollowUpValue("");
    void runStreamingAgent({ productUrl: null, productTitle: null, freeText: text }, true);
  }, [followUpValue, runState, runStreamingAgent]);

  const handleChipsChange = useCallback(
    (next: ChatChips) => {
      setChatChips(next);
      if (runState !== "ready") return;
      const filtered = applyHardFilters(MOCK_CREATORS, next);
      setCreators((prev) => (sameCreators(prev, filtered) ? prev : filtered));
    },
    [runState],
  );

  const handleSave = useCallback((id: string) => {
    setStatuses((prev) => ({ ...prev, [id]: prev[id] === "saved" ? "pending" : "saved" }));
  }, []);
  const handleSkip = useCallback((id: string) => {
    setStatuses((prev) => ({ ...prev, [id]: "skipped" }));
    setCreators((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const { openCreatorProfile } = useCreatorProfile();
  const handleOpenProfile = useCallback(
    (c: Creator) => {
      openCreatorProfile({
        name: c.displayName,
        handle: c.handle,
        avatarUrl: `https://i.pravatar.cc/120?img=${c.avatarSeed}`,
        region: c.countryLabel,
        followers: c.followers,
        er: c.er,
        platform: chatChips.platform,
        tags: c.reasons.slice(0, 2),
      });
    },
    [openCreatorProfile, chatChips.platform],
  );

  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(id);
  }, [toast]);

  // §4 退出确认后：丢弃当前搜索 → 回到 intake hero。
  // 已收藏 / outreach 的博主已经写入项目数据，跟搜索 session 无关，
  // 所以这里只需要清掉 in-memory 状态即可。
  const handleDiscardSearch = useCallback(() => {
    setRunState("idle");
    setUserMessage(null);
    setCreators([]);
    setStatuses({});
    setCanvasRevealed(false);
    setFollowUpValue("");
    setToast("已丢弃此次搜索");
  }, []);

  const handleExportCsv = useCallback(() => {
    const visible = creators.filter((c) => statuses[c.id] !== "skipped");
    if (visible.length === 0) return;
    const rows = [
      ["handle", "name", "country", "followers", "median_views", "er", "evidence", "top_reason"],
      ...visible.map((c) => [
        c.handle,
        c.displayName,
        c.countryLabel,
        c.followers,
        c.medianViews,
        c.er,
        c.evidence,
        c.reasons[0] ?? "",
      ]),
    ];
    const csv = rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `linkr-discovery-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToast(`已导出 ${visible.length} 位博主到 CSV`);
  }, [creators, statuses]);

  const isPreSubmit = runState === "idle";
  const isWorking = runState === "thinking";

  // Discard-modal state lives here now that the global header is gone.
  // The exit button (in AgentConsole) flips this on; the modal calls
  // handleDiscardSearch on confirm.
  const [discardOpen, setDiscardOpen] = useState(false);
  const { currentProject } = useWorkspaceProject();
  const handleRequestDiscard = useCallback(() => setDiscardOpen(true), []);
  const handleDiscardCancel = useCallback(() => setDiscardOpen(false), []);
  const handleDiscardConfirm = useCallback(() => {
    setDiscardOpen(false);
    handleDiscardSearch();
  }, [handleDiscardSearch]);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#fffdf9]">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {isPreSubmit ? (
            <motion.div
              key="intake"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="h-full overflow-y-auto"
            >
              <div className="flex min-h-full flex-col justify-center py-10 sm:py-12">
                <IntentHero intent={intent} />
                <div className="mx-auto w-full max-w-[820px] px-4">
                  <InputArea
                    intent={intent}
                    onIntentChange={setIntent}
                    editorState={editorState}
                    onEditorChange={setEditorState}
                    chips={chatChips}
                    onChipsChange={handleChipsChange}
                    onSubmit={handleIntakeSubmit}
                    disabled={isWorking}
                    showInfoTooltip={false}
                    contextSlot={<ProjectSwitcher onToast={setToast} />}
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="split"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="grid h-full w-full bg-[#fafaf6]"
              style={{ gridTemplateColumns: "25% 75%" }}
            >
              <div className="overflow-hidden border-r border-[#eceae3]">
                <AgentConsole
                  ref={consoleRef}
                  status={isWorking ? "thinking" : "ready"}
                  userMessage={userMessage}
                  inputValue={followUpValue}
                  onInputChange={setFollowUpValue}
                  onSubmit={handleFollowUpSubmit}
                  chips={chatChips}
                  onChipsChange={handleChipsChange}
                  onRequestDiscard={handleRequestDiscard}
                  onToast={setToast}
                />
              </div>

              <main className="@container/canvas relative flex min-w-[640px] flex-col overflow-hidden bg-[#fafaf6]">
                {!canvasRevealed ? (
                  <CanvasWaiting />
                ) : (
                  <ResultsCanvas
                    groups={groups}
                    statuses={statuses}
                    onSave={handleSave}
                    onSkip={handleSkip}
                    onOpenProfile={handleOpenProfile}
                    onExportCsv={handleExportCsv}
                  />
                )}
                <AnimatePresence>
                  {toast && (
                    <motion.div
                      key={toast}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-zinc-900 px-4 py-2 text-[12px] font-medium text-white shadow-lg ring-1 ring-black/10"
                    >
                      {toast}
                    </motion.div>
                  )}
                </AnimatePresence>
              </main>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <DiscardModal
        open={discardOpen}
        projectName={currentProject.name}
        onCancel={handleDiscardCancel}
        onConfirm={handleDiscardConfirm}
      />
    </div>
  );
}

function CanvasWaiting() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3.5 text-[#939084]">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-[#b8b4a8]"
            style={{
              animation: "linkr-canvas-empty-pulse 1.4s ease-in-out infinite",
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
      <div className="text-[14px]">正在为你筛选候选博主...</div>
      <style jsx global>{`
        @keyframes linkr-canvas-empty-pulse {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(0.85);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}

function ResultsCanvas({
  groups,
  statuses,
  onSave,
  onSkip,
  onOpenProfile,
  onExportCsv,
}: {
  groups: ReturnType<typeof groupCreators>;
  statuses: Record<string, CardStatus>;
  onSave: (id: string) => void;
  onSkip: (id: string) => void;
  onOpenProfile: (creator: Creator) => void;
  onExportCsv: () => void;
}) {
  const total = groups.reduce((acc, g) => acc + g.count, 0);
  return (
    <>
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex items-start justify-between border-b border-[#eceae3] bg-[#fafaf6] px-9 pt-6 pb-5"
      >
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.01em] text-[#201515]">
            {total} 个人值得关注
          </h1>
          <div className="mt-1 text-[13px] text-[#939084]">
            按合作证据强弱分组 · 全部为 TikTok 美区近 90 天数据
          </div>
        </div>
        <div className="hidden items-center gap-2.5 md:flex">
          <button
            type="button"
            onClick={onExportCsv}
            className="rounded-[10px] border border-[#eceae3] bg-white px-4 py-2 text-[13px] font-medium text-[#201515] transition-colors hover:border-[#c5c0b1]"
          >
            导出 CSV
          </button>
        </div>
      </motion.header>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="flex-1 overflow-y-auto px-9 pt-6 pb-20"
      >
        <div className="flex flex-col gap-8">
          {groups.map((g) => (
            <section key={g.key}>
              <header className="mb-3.5 flex items-center gap-2.5">
                <h2 className="text-[17px] font-semibold tracking-[-0.005em] text-[#201515]">
                  {g.label}
                </h2>
                <span
                  className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1.5 text-[11.5px] font-semibold"
                  style={{
                    backgroundColor: g.key === "high" ? "#fff1e8" : "rgba(32,21,21,0.05)",
                    color: g.key === "high" ? BRAND : "#36342e",
                  }}
                >
                  {g.count}
                </span>
                <EvidenceRuleInfo rule={g.rule} />
                <span className="text-[12.5px] text-[#939084]">{g.hint}</span>
              </header>

              {/* Cards grid: auto-fill minmax(310px, 1fr) per mock §1 */}
              <div
                className="grid gap-4"
                style={{ gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))" }}
              >
                {g.creators.map((c, idx) => (
                  <CascadeCard key={c.id} index={idx}>
                    <CompositeCreatorCard
                      creator={c}
                      status={statuses[c.id] ?? "pending"}
                      onSave={onSave}
                      onSkip={onSkip}
                      onOpenProfile={onOpenProfile}
                    />
                  </CascadeCard>
                ))}
              </div>
            </section>
          ))}
        </div>
      </motion.div>
    </>
  );
}

/**
 * Wraps a card with a 120ms-staggered reveal — mirrors the `.creator-card.shown`
 * cascade from the mock §7. Pure CSS; once mounted the class flips on after a
 * cumulative delay so the runner doesn't need to manually add `.shown`.
 */
function CascadeCard({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <motion.div
      // h-full propagates the grid row height down to the card so every
      // sibling in the row stretches to the tallest card's height.
      className="h-full"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function EvidenceRuleInfo({ rule }: { rule: EvidenceRule }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label="查看分组规则"
        className="flex h-4 w-4 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-200/70 hover:text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)]"
        style={{ ["--brand" as string]: BRAND }}
      >
        <Info size={12} strokeWidth={2.2} />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute top-full left-0 z-30 mt-2 w-[280px] origin-top-left scale-95 rounded-xl bg-zinc-900 p-3 text-left opacity-0 shadow-lg ring-1 ring-black/10 transition-all duration-150 group-focus-within:scale-100 group-focus-within:opacity-100 group-hover:scale-100 group-hover:opacity-100"
      >
        <span className="block text-[11.5px] font-semibold tracking-tight text-white">
          {rule.title}
        </span>
        <ul className="mt-1.5 space-y-1">
          {rule.bullets.map((b) => (
            <li key={b} className="flex gap-1.5 text-[11px] leading-relaxed text-zinc-300">
              <span
                aria-hidden
                className="mt-[5px] h-1 w-1 flex-shrink-0 rounded-full bg-zinc-500"
              />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </span>
    </span>
  );
}

function sameCreators(a: Creator[], b: Creator[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id) return false;
  }
  return true;
}

/**
 * Polls the AgentConsole imperative handle until its steps element is
 * available, or gives up after ~1s. The console only mounts after the
 * intake → split-view AnimatePresence transition (mode="wait", 300ms
 * exit), so we can't read the ref synchronously after `setRunState`.
 */
async function waitForConsoleSteps(
  consoleRef: React.RefObject<AgentConsoleHandle | null>,
  timeoutMs = 1000,
): Promise<HTMLDivElement | null> {
  const start = performance.now();
  while (performance.now() - start < timeoutMs) {
    const el = consoleRef.current?.stepsEl;
    if (el) return el;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
  return consoleRef.current?.stepsEl ?? null;
}

// Parse a follower threshold like "5万", "1-5万", "50k", "小于 5 万".
// Returns an [min, max] inclusive range over followersRaw, or null if absent.
function parseFollowerRange(text: string): [number, number] | null {
  const lower = text.toLowerCase();
  // 1-5 万 / 1-5w / 10k-50k
  const range = lower.match(/(\d+(?:\.\d+)?)\s*[-到~]\s*(\d+(?:\.\d+)?)\s*([万wk]?)/);
  if (range) {
    const unit = range[3] === "k" ? 1_000 : 10_000;
    return [Number(range[1]) * unit, Number(range[2]) * unit];
  }
  // 小于 5 万 / < 5万 / under 50k / 5万以下 / <50k
  const upper =
    lower.match(/(?:<|小于|低于|不到|under|以下\s*)\s*(\d+(?:\.\d+)?)\s*([万wk]?)/) ??
    lower.match(/(\d+(?:\.\d+)?)\s*([万wk])\s*(?:以下|内|及以下)/);
  if (upper) {
    const num = Number(upper[1]);
    const u = (upper[2] ?? "").toLowerCase();
    const unit = u === "k" ? 1_000 : 10_000;
    return [0, num * unit];
  }
  // 大于 / 高于 / over
  const lowerBound = lower.match(/(?:>|大于|高于|超过|over)\s*(\d+(?:\.\d+)?)\s*([万wk]?)/);
  if (lowerBound) {
    const unit = lowerBound[2] === "k" ? 1_000 : 10_000;
    return [Number(lowerBound[1]) * unit, Number.POSITIVE_INFINITY];
  }
  return null;
}

function parseErThreshold(text: string): number | null {
  const m = text.match(/ER\s*[>≥高于超过]?\s*(\d+(?:\.\d+)?)\s*%?/i);
  if (!m) return null;
  return Number(m[1]);
}

function filterFromText(creators: Creator[], text: string): Creator[] {
  const lower = text.toLowerCase();
  let pool = creators;

  const followerRange = parseFollowerRange(text);
  if (followerRange) {
    const [min, max] = followerRange;
    pool = pool.filter((c) => c.followersRaw >= min && c.followersRaw <= max);
  }

  const erMin = parseErThreshold(text);
  if (erMin !== null) {
    pool = pool.filter((c) => Number.parseFloat(c.er) >= erMin);
  }

  if (/合作|#ad|带过|带货|brand|sponsored/.test(lower)) {
    pool = pool.filter((c) => c.videos.some((v) => v.isCollab));
  }

  if (/强证据|高证据|\bhigh\b/.test(lower)) {
    pool = pool.filter((c) => c.evidence === "high");
  } else if (/中证据|\bmedium\b/.test(lower)) {
    pool = pool.filter((c) => c.evidence === "medium");
  } else if (/弱证据|\bweak\b/.test(lower)) {
    pool = pool.filter((c) => c.evidence === "weak");
  }

  if (/美国|\bus\b|united states/.test(lower)) {
    pool = pool.filter((c) => c.flag === "🇺🇸");
  }
  if (/东南亚|sea|新加坡|singapore/.test(lower)) {
    pool = pool.filter((c) => /SEA|Singapore|Indonesia|Vietnam/.test(c.countryLabel));
  }

  // Nothing matched any rule — keep the full set (no random reverse).
  return pool;
}
