"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChatChips, ChatIntent } from "../chat-types";
import { DEFAULT_RANGE } from "../data/chat-chips";
import { IntentCards } from "../components/intent-cards";
import { IntentHero } from "../components/intent-hero";
import { InputArea } from "../components/input-area";
import { serializeEditorState } from "../components/structured-editor/structured-editor";
import {
  DEFAULT_EDITOR_STATE,
  type StructuredEditorState,
} from "../components/structured-editor/types";
import { Button } from "@/components/ui/button";
import { useSidebarCollapse } from "@/features/workspace-shell/components/sidebar-collapse-context";
import { useCreatorProfile } from "@/features/creator/components/creator-profile-context";
import { useWorkspaceProject } from "@/features/project/components/project-context";
import type { FeatureGroupView, OutputCreatorView } from "../v3-view-models";
import { AgentConsole, type AgentConsoleHandle } from "./agent-console";
import {
  buildCompetitorConfirm,
  buildScenarioConfirm,
  ConfirmStep,
  type ConfirmStepData,
} from "./confirm-step";
import { deriveFeatureGroups, type ConfirmedSelection } from "./data/mock-feature-groups";
import { getDimension, isAnchorSatisfied } from "./dimensions";
import { DiscardModal } from "./discard-modal";
import type { ProposedScenario } from "./lib/scenario-proposal";
import { applyBriefFilters, applyHardFilters } from "./filters";
import { OutputCreatorCard } from "./output-creator-card";
import { ProjectSwitcher } from "./project-switcher";
import { estimateSeedCount, getExitCopy, getSeedBasisPhrase } from "./lib/agent-steps";
import { parseBrief } from "./lib/brief-parser";
import { pickPrimaryPlatform, type ParsedBrief } from "./lib/parsed-brief-types";
import { runAgentFlow } from "./lib/run-agent-flow";
import {
  addSeed,
  hasSeed,
  projectPendingCount,
  removeSeed,
  rerankBySeeds,
  type SeedDescriptor,
} from "./lib/seed-pool";
import { useSimilarDeeplink, type SimilarDeeplinkPayload } from "./lib/use-similar-deeplink";
import { MOCK_CREATORS, type Creator } from "./mock-data";

const BRAND = "#ff4f00";

type CardStatus = "pending" | "saved" | "skipped";

// `confirming`：提交后、跑 agent 前的中间确认层(场景勾选 / 竞品消歧)。
type RunState = "idle" | "confirming" | "thinking" | "ready";

interface UserMessage {
  productUrl: string | null;
  productTitle: string | null;
  freeText: string;
}

const DEFAULT_CHAT_CHIPS: ChatChips = {
  platform: "tiktok",
  countries: [],
  languages: [],
  followers: { ...DEFAULT_RANGE },
  views: { ...DEFAULT_RANGE },
  // 默认开启「仅可建联」—— v3 §4.4：过滤掉无邮箱 / 30 天未发布 / 已 No 的达人，
  // 与文档第 4.4 节"默认值"一致。
  contactableOnly: true,
};

export function DiscoverySplitView() {
  // Pre-submit: existing IntentHero + InputArea state.
  //
  // v3 §4.3「全局产品记忆」：`editorState` 是这一层的 single source of truth ——
  // 它跨 intent 共享 (setIntent 只换 intent，不动 editorState)，也跨"丢弃此次
  // 搜索"保留 (handleDiscardSearch 故意不调 setEditorState)。任何重置都意味
  // 着用户重新输入产品 URL，会破坏文档承诺的"切到另一维度时模板自动带上产品"。
  const [intent, setIntent] = useState<ChatIntent>("competitor");
  const [chatChips, setChatChips] = useState<ChatChips>(DEFAULT_CHAT_CHIPS);
  const [editorState, setEditorState] = useState<StructuredEditorState>(DEFAULT_EDITOR_STATE);

  // Shared: agent run state
  const [runState, setRunState] = useState<RunState>("idle");
  const [userMessage, setUserMessage] = useState<UserMessage | null>(null);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [canvasRevealed, setCanvasRevealed] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, CardStatus>>({});
  // Parsed brief — populated by handleIntakeSubmit before the streaming
  // flow starts. Follow-up turns reuse this same brief (we don't re-parse
  // unless the user re-submits the intake form).
  const [parsedBrief, setParsedBrief] = useState<ParsedBrief | null>(null);

  // 「相似来源」种子池：本次 session 的所有种子博主。点卡片的「找相似」按钮
  // 会追加；deeplink 进来时携带的初始 seed 也会写入这里。空数组表示用户走
  // 的是普通 intake，没有从某个具体博主出发。
  const [seeds, setSeeds] = useState<SeedDescriptor[]>([]);

  // 中间确认层(§dimensions.confirmStep)：`confirmData` 驱动确认屏渲染;
  // `confirmedSelection` 是用户在确认屏的选择,驱动结果分组(deriveFeatureGroups)。
  // `scenarioProposalRef` 是 intake→confirm 之间的临时态,不进渲染,故用 ref。
  const [confirmData, setConfirmData] = useState<ConfirmStepData | null>(null);
  const [confirmedSelection, setConfirmedSelection] = useState<ConfirmedSelection>({
    scenarios: [],
    competitors: [],
  });
  const scenarioProposalRef = useRef<ProposedScenario[]>([]);
  const pendingRunRef = useRef<{ message: UserMessage; brief: ParsedBrief } | null>(null);

  const consoleRef = useRef<AgentConsoleHandle>(null);
  // Sync guard against double-submit while the (async) brief parser is in
  // flight. setState is not synchronous, so a fast second Enter / click
  // during the ~1s parse window can slip past `if (runState === "thinking")`
  // and start a parallel runStreamingAgent — which then writes step DOM
  // twice into the same container.
  const intakeInFlightRef = useRef(false);

  // Post-submit: split-view follow-up state
  const [followUpValue, setFollowUpValue] = useState("");

  // v3 §4.6：把当前候选池按 FeatureGroup 重新分组。intent 影响每组的名称
  // 与 rationale（"竞品已验证组合" vs "高匹配场景组合" vs "近期爆款组合"）。
  const featureGroups = useMemo(
    () => deriveFeatureGroups(creators, intent, confirmedSelection),
    [creators, intent, confirmedSelection],
  );

  // Auto-collapse the workspace sidebar when entering split-view so the canvas
  // gets max width. We don't auto-expand on the way back — let the user keep
  // their preference once set.
  const { setCollapsed: setSidebarCollapsed } = useSidebarCollapse();
  // 确认屏是居中全屏(非分栏)—— 只有 thinking / ready 才折叠侧边栏进分栏。
  const isSplitView = runState === "thinking" || runState === "ready";
  useEffect(() => {
    if (isSplitView) setSidebarCollapsed(true);
  }, [isSplitView, setSidebarCollapsed]);

  const runStreamingAgent = useCallback(
    async (msg: UserMessage, isFollowUp: boolean, brief: ParsedBrief) => {
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
        : applyBriefFilters(MOCK_CREATORS, brief);

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

      const exit = getExitCopy(intent, brief);
      // v3 §4.5：summary 的 sub 行先讲清"依据 N 位达人组合"再讲过滤策略 ——
      // 让用户在画布出现前就看到 SearchBasisCard 想表达的"种子→输出"链路。
      const seedCount = estimateSeedCount(finalCount);
      const seedBasis = getSeedBasisPhrase(intent, seedCount);
      const subLine = isFollowUp
        ? `已按追问「${msg.freeText}」重排卡片`
        : `${seedBasis} · ${exit.subtitle}`;
      consoleRef.current?.setSummary(exit.countLabel(finalCount), subLine);

      await runAgentFlow({
        stepsContainer: stepsEl,
        summaryEl,
        intent,
        brief,
        onReady: () => setRunState("ready"),
        onComplete: () => {
          setCanvasRevealed(true);
        },
      });
    },
    [creators, intent],
  );

  const handleIntakeSubmit = useCallback(() => {
    if (intakeInFlightRef.current) return;
    if (runState === "thinking") return;
    // 维度锚点未满足 —— 不允许提交(竞品要竞品、场景要产品、爆款/低粉要品类)。
    if (!isAnchorSatisfied(intent, editorState)) return;
    const product = editorState.productChip;
    const freeText = serializeEditorState(intent, editorState).trim();
    if (!freeText && !product) return;
    intakeInFlightRef.current = true;
    const message: UserMessage = {
      productUrl: product?.url ?? null,
      productTitle: product?.title ?? null,
      freeText,
    };

    void (async () => {
      try {
        // Route the brief text + product URL through the (mock-today,
        // Anthropic-tomorrow) parser so the streaming flow has structured
        // understanding to work from. We block on the parse; latency is
        // masked by the AnimatePresence transition into split-view.
        const productUrl = product ? `https://${product.url}` : null;
        const briefText = [editorState.productNote, freeText].filter(Boolean).join("\n");
        const brief = await parseBrief({ briefText, productUrl });
        setParsedBrief(brief);
        setChatChips((prev) => {
          const platform = pickPrimaryPlatform(brief);
          const countries = brief.countries;
          if (prev.platform === platform && sameCountrySet(prev.countries, countries)) {
            return prev;
          }
          return { ...prev, platform, countries };
        });
        // 维度的中间交互层 —— AI 做了有后果的判断时,先让用户确认再跑 agent。
        const dimension = getDimension(intent);
        if (dimension.confirmStep === "scenario-pick") {
          const { data, scenarios } = buildScenarioConfirm(brief);
          scenarioProposalRef.current = scenarios;
          pendingRunRef.current = { message, brief };
          setConfirmData(data);
          setRunState("confirming");
        } else if (
          dimension.confirmStep === "competitor-disambig" &&
          !(editorState.brandMode === "manual" && editorState.brands.length > 0)
        ) {
          // 用户手动指定了竞品 → 锚点无歧义,跳过确认直接跑。
          scenarioProposalRef.current = [];
          pendingRunRef.current = { message, brief };
          setConfirmData(buildCompetitorConfirm(brief));
          setRunState("confirming");
        } else {
          await runStreamingAgent(message, false, brief);
        }
      } finally {
        intakeInFlightRef.current = false;
      }
    })();
  }, [editorState, intent, runState, runStreamingAgent]);

  // 确认屏「确定」—— 记录用户的场景 / 竞品选择,再跑 agent。
  const handleConfirmComplete = useCallback(
    (selectedIds: string[]) => {
      const pending = pendingRunRef.current;
      if (!pending || !confirmData) return;
      pendingRunRef.current = null;
      if (confirmData.kind === "scenario-pick") {
        setConfirmedSelection({
          scenarios: scenarioProposalRef.current.filter((s) => selectedIds.includes(s.id)),
          competitors: [],
        });
      } else {
        setConfirmedSelection({
          scenarios: [],
          competitors: confirmData.options
            .filter((o) => selectedIds.includes(o.id))
            .map((o) => o.title),
        });
      }
      setConfirmData(null);
      void runStreamingAgent(pending.message, false, pending.brief);
    },
    [confirmData, runStreamingAgent],
  );

  // 确认屏「返回修改输入」—— 丢弃这次确认,回到 intake。
  const handleConfirmCancel = useCallback(() => {
    pendingRunRef.current = null;
    setConfirmData(null);
    setRunState("idle");
  }, []);

  const handleFollowUpSubmit = useCallback(() => {
    if (intakeInFlightRef.current) return;
    const text = followUpValue.trim();
    if (!text || runState === "thinking") return;
    // Follow-up turns must reuse the brief from the intake submit — without
    // it the runner would have no understanding to drive Step C/D/E.
    if (!parsedBrief) return;
    intakeInFlightRef.current = true;
    setFollowUpValue("");
    void (async () => {
      try {
        await runStreamingAgent(
          { productUrl: null, productTitle: null, freeText: text },
          true,
          parsedBrief,
        );
      } finally {
        intakeInFlightRef.current = false;
      }
    })();
  }, [followUpValue, parsedBrief, runState, runStreamingAgent]);

  const handleChipsChange = useCallback(
    (next: ChatChips) => {
      setChatChips(next);
      if (runState !== "ready") return;
      const filtered = applyHardFilters(MOCK_CREATORS, next);
      setCreators((prev) => (sameCreators(prev, filtered) ? prev : filtered));
    },
    [runState],
  );

  const [toast, setToast] = useState<string | null>(null);

  const handleSave = useCallback(
    (id: string) => {
      setStatuses((prev) => {
        const wasSaved = prev[id] === "saved";
        const next = wasSaved ? "pending" : "saved";
        if (!wasSaved) {
          const creator = creators.find((c) => c.id === id);
          const label = creator?.handle ?? "该博主";
          setToast(`已收藏 ${label} 至博主库`);
        }
        return { ...prev, [id]: next };
      });
    },
    [creators],
  );
  const handleSkip = useCallback((id: string) => {
    setStatuses((prev) => ({ ...prev, [id]: "skipped" }));
    setCreators((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const { openCreatorProfile } = useCreatorProfile();
  // v3 改造：profile drawer 入参从 v2 Creator 切到 v3 OutputCreatorView。
  // drawer 内部还在用文本格式的 followers / er，这里临时再转回字符串；当
  // CreatorProfileContext 也升级到 v3 后这层格式化可以拿掉。
  const handleOpenProfile = useCallback(
    (c: OutputCreatorView) => {
      const followersText =
        c.followers >= 1_000_000
          ? `${(c.followers / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
          : c.followers >= 1_000
            ? `${(c.followers / 1_000).toFixed(1).replace(/\.0$/, "")}K`
            : String(c.followers);
      openCreatorProfile({
        name: c.handle,
        handle: c.handle,
        avatarUrl: c.avatarUrl ?? `https://i.pravatar.cc/120?u=${c.creatorId}`,
        region: "",
        followers: followersText,
        er: c.engagementRate > 0 ? `${c.engagementRate.toFixed(1)}%` : "—",
        platform: chatChips.platform,
        tags: c.reasons.slice(0, 2),
      });
    },
    [openCreatorProfile, chatChips.platform],
  );

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(id);
  }, [toast]);

  // §4 退出确认后：丢弃当前搜索 → 回到 intake hero。
  // 已收藏 / outreach 的博主已经写入项目数据，跟搜索 session 无关，
  // 所以这里只需要清掉 in-memory 状态即可。
  //
  // 注意：故意不 reset editorState —— v3 §4.3「全局产品记忆」要求产品 URL 在
  // 丢弃搜索后仍保留，让用户能立刻换一个 intent 重发。如果要清产品，应该
  // 让用户在编辑器里手动删 chip，不在这里强清。
  const handleDiscardSearch = useCallback(() => {
    setRunState("idle");
    setUserMessage(null);
    setCreators([]);
    setStatuses({});
    setCanvasRevealed(false);
    setFollowUpValue("");
    setParsedBrief(null);
    setSeeds([]);
    setConfirmData(null);
    setConfirmedSelection({ scenarios: [], competitors: [] });
    pendingRunRef.current = null;
    scenarioProposalRef.current = [];
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

  // 接收来自插件 / 抽屉「找相似」的深链：直接跳过 intake，把结果区拉起。
  // 与插件 handleQuickScreen 同义 —— quick-screen 直接进列表；
  // sequential-screen 同样落到结果区，仅用 toast / 标题区分逐位查看的语义。
  //
  // 深链里的 seed 同时写入 seeds 池 —— 这是 session 的第一颗种子，后续用户
  // 在卡片上继续点「找相似」会叠加到这同一个池里。
  const handleSimilarDeeplink = useCallback((payload: SimilarDeeplinkPayload) => {
    setUserMessage({
      productUrl: null,
      productTitle: null,
      freeText: `找相似：${payload.seedName} (${payload.seedHandle})`,
    });
    setChatChips((prev) =>
      prev.platform === payload.platform
        ? prev
        : { ...prev, platform: toChipPlatform(payload.platform) },
    );
    const initialSeed: SeedDescriptor = {
      id: payload.seedId,
      handle: payload.seedHandle,
      name: payload.seedName,
    };
    setSeeds([initialSeed]);
    setCreators(MOCK_CREATORS);
    setStatuses({});
    setParsedBrief(null);
    setRunState("ready");
    setCanvasRevealed(true);
    setToast(
      payload.entry === "sequential-screen"
        ? `已进入「逐个筛选」· 基于 ${payload.seedHandle} 的相似博主（共 ${MOCK_CREATORS.length} 位）`
        : `已进入「快速筛选」· 基于 ${payload.seedHandle} 的相似博主（共 ${MOCK_CREATORS.length} 位）`,
    );
  }, []);
  useSimilarDeeplink(handleSimilarDeeplink);

  // 卡片上的「找相似」按钮：把这位博主追加到种子池，rerank 当前候选，
  // 用 toast 让用户看到"叠加生效"反馈。已经在池里就 no-op + toast 提示。
  const handleFindSimilar = useCallback(
    (c: OutputCreatorView) => {
      if (hasSeed(seeds, c.creatorId)) {
        setToast(`${c.handle} 已经在相似来源里`);
        return;
      }
      const next: SeedDescriptor = {
        id: c.creatorId,
        handle: c.handle,
        name: c.handle,
        avatarUrl: c.avatarUrl ?? undefined,
      };
      setSeeds((prev) => addSeed(prev, next));
      setCreators((prev) => rerankBySeeds(prev, addSeed(seeds, next), (x) => x.handle));
      setToast(`已把 ${c.handle} 加入相似来源 · 推荐已叠加`);
    },
    [seeds],
  );

  const handleRemoveSeed = useCallback((id: string) => {
    setSeeds((prev) => {
      const next = removeSeed(prev, id);
      setCreators((cs) => rerankBySeeds(cs, next, (x) => x.handle));
      return next;
    });
  }, []);

  // session 里有多少候选 / 多少已收藏 —— 面板上的两个核心计数器。
  // 待筛选用 projectPendingCount —— 用种子组合的哈希指纹决定数字方向，符合
  // "取交集后总数可增可减、整体偏增长"的预期（详见 lib/seed-pool.ts）。
  const savedCount = useMemo(
    () => Object.values(statuses).filter((s) => s === "saved").length,
    [statuses],
  );
  const visibleCreatorCount = useMemo(
    () => creators.filter((c) => statuses[c.id] !== "skipped").length,
    [creators, statuses],
  );
  const pendingCount = useMemo(
    () => projectPendingCount(visibleCreatorCount, seeds),
    [visibleCreatorCount, seeds],
  );

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
              className="relative h-full overflow-y-auto"
            >
              {/* 项目选择器固定在发现页左上角 —— 与输入卡片解耦，
                  作为整个 intake 视图的全局上下文。 */}
              <div className="absolute top-4 left-5 z-20">
                <ProjectSwitcher onToast={setToast} />
              </div>
              <div className="flex min-h-full flex-col justify-center py-10 sm:py-12">
                <IntentHero intent={intent} />
                <div className="mx-auto w-full max-w-[820px] px-4">
                  <InputArea
                    intent={intent}
                    editorState={editorState}
                    onEditorChange={setEditorState}
                    chips={chatChips}
                    onChipsChange={handleChipsChange}
                    onSubmit={handleIntakeSubmit}
                    disabled={isWorking}
                  />
                  <IntentCards intent={intent} onIntentChange={setIntent} />
                </div>
              </div>
            </motion.div>
          ) : runState === "confirming" && confirmData ? (
            <ConfirmStep
              data={confirmData}
              onConfirm={handleConfirmComplete}
              onCancel={handleConfirmCancel}
            />
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
                  onRequestDiscard={handleRequestDiscard}
                  onToast={setToast}
                  seeds={seeds}
                  pendingCount={pendingCount}
                  savedCount={savedCount}
                  onRemoveSeed={handleRemoveSeed}
                  onEndSession={handleRequestDiscard}
                  onExport={handleExportCsv}
                />
              </div>

              <main className="@container/canvas relative flex min-w-[640px] flex-col overflow-hidden bg-[#fafaf6]">
                {!canvasRevealed ? (
                  <CanvasWaiting />
                ) : (
                  <ResultsCanvas
                    intent={intent}
                    brief={parsedBrief}
                    featureGroups={featureGroups}
                    statuses={statuses}
                    onSave={handleSave}
                    onSkip={handleSkip}
                    onOpenProfile={handleOpenProfile}
                    onExportCsv={handleExportCsv}
                    onFindSimilar={handleFindSimilar}
                    seedIds={seeds}
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
  intent,
  brief,
  featureGroups,
  statuses,
  onSave,
  onSkip,
  onOpenProfile,
  onExportCsv,
  onFindSimilar,
  seedIds,
}: {
  intent: ChatIntent;
  brief: ParsedBrief | null;
  featureGroups: FeatureGroupView[];
  statuses: Record<string, CardStatus>;
  onSave: (id: string) => void;
  onSkip: (id: string) => void;
  onOpenProfile: (creator: OutputCreatorView) => void;
  onExportCsv: () => void;
  onFindSimilar: (creator: OutputCreatorView) => void;
  seedIds: readonly SeedDescriptor[];
}) {
  const total = featureGroups.reduce((acc, g) => acc + g.creators.length, 0);
  const exit = getExitCopy(intent, brief ?? undefined);
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
            {exit.canvasTitle(total)}
          </h1>
          <div className="mt-1 text-[13px] text-[#939084]">{exit.canvasSubtitle}</div>
        </div>
        <div className="hidden items-center gap-2.5 md:flex">
          <Button
            unstyled
            type="button"
            onClick={onExportCsv}
            className="rounded-lg border border-[#eceae3] bg-white px-4 py-2 text-[13px] font-medium text-[#201515] transition-colors hover:border-[#c5c0b1]"
          >
            导出 CSV
          </Button>
        </div>
      </motion.header>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="flex-1 overflow-y-auto px-9 pt-6 pb-20"
      >
        <div className="flex flex-col gap-10">
          {featureGroups.map((g, gi) => (
            <FeatureGroupSection
              key={g.groupId}
              group={g}
              defaultExpanded={gi === 0}
              statuses={statuses}
              onSave={onSave}
              onSkip={onSkip}
              onOpenProfile={onOpenProfile}
              onFindSimilar={onFindSimilar}
              seedIds={seedIds}
            />
          ))}
        </div>
      </motion.div>
    </>
  );
}

// v3 §4.6：FeatureGroup 渲染区。组头展示 groupName + 命中达人数 + rationale +
// 三段特征摘要（content / audience / format）。第一组默认展开，其它默认折叠。
function FeatureGroupSection({
  group,
  defaultExpanded,
  statuses,
  onSave,
  onSkip,
  onOpenProfile,
  onFindSimilar,
  seedIds,
}: {
  group: FeatureGroupView;
  defaultExpanded: boolean;
  statuses: Record<string, CardStatus>;
  onSave: (id: string) => void;
  onSkip: (id: string) => void;
  onOpenProfile: (creator: OutputCreatorView) => void;
  onFindSimilar: (creator: OutputCreatorView) => void;
  seedIds: readonly SeedDescriptor[];
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const count = group.creators.length;
  return (
    <section>
      <header className="mb-3 flex items-start gap-3">
        <Button
          unstyled
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex flex-1 items-start gap-2.5 text-left"
        >
          <h2 className="text-[17px] font-semibold tracking-[-0.005em] text-[#201515]">
            {group.groupName}
          </h2>
          <span
            className="mt-0.5 inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1.5 text-[11.5px] font-semibold"
            style={{ backgroundColor: "#fff1e8", color: BRAND }}
          >
            {count}
          </span>
          <span className="ml-auto text-[12px] text-[#939084]">{expanded ? "收起" : "展开"}</span>
        </Button>
      </header>

      {/* 组特征摘要 —— 即使折叠也显示，让用户能预判要不要展开。
          rationale 是脱敏后的种子依据 (§4.6 / §4.8)，不暴露具体 handle。 */}
      <div className="mb-4 rounded-lg border border-[#eceae3] bg-white px-4 py-3 text-[12.5px] leading-relaxed text-[#36342e]">
        <div className="text-[#5d5a52]">{group.rationale}</div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[#5d5a52]">
          {group.contentFeatures && group.contentFeatures.themes.length > 0 ? (
            <span>
              <span className="text-[#939084]">主题</span>{" "}
              {group.contentFeatures.themes.join(" · ")}
            </span>
          ) : null}
          {group.audienceFeatures ? (
            <span>
              <span className="text-[#939084]">受众</span> {group.audienceFeatures.ageSkew}
              {group.audienceFeatures.genderSkew === "female_dominant"
                ? " · 女性为主"
                : group.audienceFeatures.genderSkew === "male_dominant"
                  ? " · 男性为主"
                  : " · 性别均衡"}
            </span>
          ) : null}
          {group.formatFeatures && group.formatFeatures.styleTags.length > 0 ? (
            <span>
              <span className="text-[#939084]">形式</span>{" "}
              {group.formatFeatures.styleTags.join(" · ")}
            </span>
          ) : null}
          <span className="text-[#939084]">依据样本 {group.seedCoverage} 位达人</span>
        </div>
      </div>

      {expanded ? (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))" }}
        >
          {group.creators.map((c, idx) => (
            <CascadeCard key={c.creatorId} index={idx}>
              <OutputCreatorCard
                creator={c}
                status={statuses[c.creatorId] ?? "pending"}
                onSave={onSave}
                onSkip={onSkip}
                onOpenProfile={onOpenProfile}
                groupContext={{ groupName: group.groupName, rationale: group.rationale }}
                onFindSimilar={onFindSimilar}
                isSeed={seedIds.some((s) => s.id === c.creatorId)}
              />
            </CascadeCard>
          ))}
        </div>
      ) : null}
    </section>
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

// URL 上的 platform 字段是宽口径字符串（来自 Creator.platform），
// 这里收紧到 ChatChips 支持的 PlatformId。未识别时落到 tiktok 兜底。
function toChipPlatform(value: string): ChatChips["platform"] {
  if (value === "tiktok" || value === "instagram" || value === "youtube") return value;
  return "tiktok";
}

function sameCreators(a: Creator[], b: Creator[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id) return false;
  }
  return true;
}

function sameCountrySet(a: ChatChips["countries"], b: ChatChips["countries"]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  const set = new Set(a);
  for (const code of b) if (!set.has(code)) return false;
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
