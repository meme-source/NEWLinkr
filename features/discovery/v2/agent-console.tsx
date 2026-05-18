"use client";

import { ArrowUp, Loader2 } from "lucide-react";
import { forwardRef, useImperativeHandle, useRef } from "react";

import { Button } from "@/components/ui/button";
import type { ChatChips } from "../chat-types";
import { ChipBar } from "../components/chip-bar";
import { ProjectSwitcher } from "./project-switcher";
import { SeedSourcePanel } from "./seed-source-panel";
import type { SeedDescriptor } from "./lib/seed-pool";

const BRAND = "#ff4f00";
const GREEN = "#2f9d62";

export type ConsoleStatus = "ready" | "thinking";

// Stable shape exposed by the console for the runner in DiscoverySplitView.
export interface AgentConsoleHandle {
  /** Container that holds the streaming step list. */
  stepsEl: HTMLDivElement | null;
  /** Summary block — toggle `visible` after all steps complete. */
  summaryEl: HTMLDivElement | null;
  /** Update the headline + sub-line inside the summary. */
  setSummary: (headline: string, sub: string) => void;
}

export type ConsoleChips = ChatChips;

interface UserMessage {
  productUrl: string | null;
  productTitle: string | null;
  freeText: string;
}

interface Props {
  status: ConsoleStatus;
  userMessage: UserMessage | null;
  inputValue: string;
  onInputChange: (v: string) => void;
  onSubmit: () => void;
  chips: ConsoleChips;
  onChipsChange: (next: ConsoleChips) => void;
  /**
   * Surfaced as the leading exit-search button in the console header. Parent
   * decides whether to confirm via modal — we just emit the request.
   */
  onRequestDiscard?: () => void;
  /** Toast channel for the embedded ProjectSwitcher. */
  onToast?: (message: string) => void;
  /**
   * 「相似来源」面板的状态。seeds 长度 > 0 时面板会渲染到 header 下面、steps
   * 流上方。空数组 → 隐藏面板（普通 intake 不需要这一行）。
   */
  seeds?: readonly SeedDescriptor[];
  pendingCount?: number;
  savedCount?: number;
  onRemoveSeed?: (id: string) => void;
  onEndSession?: () => void;
  onExport?: () => void;
}

export const AgentConsole = forwardRef<AgentConsoleHandle, Props>(function AgentConsole(
  {
    status,
    userMessage,
    inputValue,
    onInputChange,
    onSubmit,
    chips,
    onChipsChange,
    onRequestDiscard,
    onToast,
    seeds,
    pendingCount = 0,
    savedCount = 0,
    onRemoveSeed,
    onEndSession,
    onExport,
  },
  ref,
) {
  const showSeedPanel = Boolean(seeds && seeds.length > 0);
  const stepsRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const summaryCountRef = useRef<HTMLSpanElement>(null);
  const summarySubRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(
    ref,
    () => ({
      get stepsEl() {
        return stepsRef.current;
      },
      get summaryEl() {
        return summaryRef.current;
      },
      setSummary: (headline, sub) => {
        if (summaryCountRef.current) {
          summaryCountRef.current.textContent = headline;
        }
        if (summarySubRef.current) {
          summarySubRef.current.textContent = sub;
        }
      },
    }),
    [],
  );

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const isWorking = status === "thinking";

  return (
    <aside className="flex h-full w-full flex-col bg-[#fffefb]">
      {/* ─── Header (simplified per mock §2) ─────────────── */}
      <header className="flex flex-shrink-0 items-center justify-between border-b border-[#eceae3] px-5 py-4">
        <div className="flex min-w-0 items-center gap-2">
          {onRequestDiscard ? (
            <Button
              unstyled
              type="button"
              onClick={onRequestDiscard}
              title="退出此次搜索（不保存）"
              aria-label="退出此次搜索"
              className="group flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#939084] transition-all duration-150 hover:bg-[rgba(255,79,0,0.08)] hover:text-[#ff4f00]"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform duration-150 group-hover:translate-x-[1px]"
              >
                <path d="M10 12l3-4-3-4" />
                <line x1="13" y1="8" x2="6" y2="8" />
                <path d="M6 3H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2" />
              </svg>
            </Button>
          ) : null}
          <div className="text-[16px] font-bold tracking-[-0.01em] text-[#201515]">Linkr</div>
          <ProjectSwitcher onToast={onToast} />
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full border border-[#eceae3] bg-white px-2.5 py-1 text-[11px] font-medium"
          style={{ color: isWorking ? BRAND : GREEN }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor: isWorking ? BRAND : GREEN,
              animation: isWorking ? "linkr-status-pulse 1.4s ease-in-out infinite" : undefined,
            }}
          />
          {isWorking ? "分析中" : "Ready"}
        </span>
      </header>

      {/* ─── 「相似来源」叠加面板 ─── 仅在 seeds 非空时渲染。
           面板内部用横线分级（一级标题 / 二级计数），所以这里只给它内边距，
           不再加外边框 —— 否则会跟 panel 自己的尾部 divider 视觉上重叠。 */}
      {showSeedPanel && seeds ? (
        <div className="relative flex-shrink-0 bg-[#fffefb] px-4 pt-3">
          <SeedSourcePanel
            seeds={seeds}
            pendingCount={pendingCount}
            savedCount={savedCount}
            onRemoveSeed={onRemoveSeed ?? (() => undefined)}
            onEndSession={onEndSession ?? (() => undefined)}
            onExport={onExport ?? (() => undefined)}
            canExport={Boolean(onExport)}
          />
        </div>
      ) : null}

      {/* ─── Stream ─────────────────────────────────────── */}
      <div className="hide-scrollbar flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto px-5 py-5">
        {userMessage && <UserBubble message={userMessage} />}

        <div ref={stepsRef} className="flex flex-col gap-2.5" />

        {/* Summary — driven imperatively by the runner */}
        <div
          ref={summaryRef}
          className="agent-summary mt-1 rounded-lg border border-[#eceae3] bg-white p-4"
        >
          <div className="flex items-center gap-1.5 text-[15px] font-semibold text-[#201515]">
            <span ref={summaryCountRef}>分析中</span>
            <span className="font-bold" style={{ color: BRAND }}>
              →
            </span>
          </div>
          <div ref={summarySubRef} className="mt-1 text-[12.5px] text-[#939084]" />
        </div>
      </div>

      {/* ─── Footer (chips + input) — sits in normal flow as a flex sibling
          so the scroll area above it never gets covered, regardless of how
          tall the chip bar wraps on narrow columns. */}
      <div className="flex-shrink-0 border-t border-[#eceae3] bg-[#fffefb] px-4 pt-3 pb-4">
        <ChipBar chips={chips} onChange={onChipsChange} />
        <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-[#eceae3] bg-[#fafaf6] px-3 py-2 focus-within:border-[#c5c0b1] focus-within:bg-white">
          <input
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKey}
            disabled={isWorking}
            placeholder="追问，比如：只看美国 + 5-50 万粉丝"
            className="flex-1 bg-transparent text-[13px] text-[#201515] placeholder:text-[#b8b4a8] focus:outline-none disabled:opacity-50"
          />
          <Button
            unstyled
            type="button"
            onClick={onSubmit}
            disabled={!inputValue.trim() || isWorking}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-white transition-all disabled:cursor-not-allowed disabled:opacity-40"
            style={{ backgroundColor: BRAND }}
            aria-label="Send"
          >
            {isWorking ? (
              <Loader2 size={14} className="animate-spin" strokeWidth={2.6} />
            ) : (
              <ArrowUp size={14} strokeWidth={2.8} />
            )}
          </Button>
        </div>
      </div>

      <ConsoleStyles />
    </aside>
  );
});

function UserBubble({ message }: { message: UserMessage }) {
  // freeText is the full serialized prompt fed to the agent flow — it
  // already contains "我的产品：<url>" so the LLM sees one canonical input.
  // The bubble shows the product as a chip above, so we strip that line out
  // of the visible text to avoid the URL appearing twice.
  const visibleText = stripProductLine(message.freeText);
  return (
    <div className="user-msg max-w-[92%] self-end rounded-[8px_8px_2px_8px] bg-[#fff1e8] px-3.5 py-2.5 text-[13.5px] leading-[1.55] text-[#201515]">
      {message.productUrl && (
        <>
          <div className="text-[#36342e]">我的产品：</div>
          <span className="my-0.5 inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[12.5px]">
            🔗 {message.productUrl}
            {message.productTitle ? ` · ${message.productTitle}` : ""}
          </span>
        </>
      )}
      {visibleText && <div className="mt-1">{visibleText}</div>}
    </div>
  );
}

const PRODUCT_LINE_PREFIX = "我的产品：";

function stripProductLine(text: string): string {
  return text
    .split("\n")
    .filter((line) => !line.trim().startsWith(PRODUCT_LINE_PREFIX))
    .join("\n")
    .trim();
}

/**
 * The agent-console step DOM is built imperatively by the runner using
 * styled className strings — these styles wire the className contracts to
 * actual CSS. Mirrors mock CSS verbatim so the streaming visuals match.
 */
function ConsoleStyles() {
  return (
    <style jsx global>{`
      @keyframes linkr-status-pulse {
        0%,
        100% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.4;
          transform: scale(1.3);
        }
      }
      @keyframes linkr-step-spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* ── Step container ────────────────────────────── */
      .agent-step {
        opacity: 0;
        transform: translateY(4px);
        transition:
          opacity 280ms ease,
          transform 280ms ease;
        display: flex;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 10px;
        background: transparent;
      }
      .agent-step.visible {
        opacity: 1;
        transform: translateY(0);
      }
      .agent-step.active {
        background: rgba(255, 79, 0, 0.04);
      }

      .step-icon-wrap {
        flex-shrink: 0;
        width: 18px;
        height: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 2px;
      }
      .step-icon-circle {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 1.5px solid #b8b4a8;
        position: relative;
        transition: all 200ms ease;
      }
      .agent-step.active .step-icon-circle {
        border-color: #ff4f00;
        border-top-color: transparent;
        animation: linkr-step-spin 0.8s linear infinite;
      }
      .agent-step.done .step-icon-circle {
        border-color: #ff4f00;
        background: #ff4f00;
      }
      .agent-step.done .step-icon-circle::after {
        content: "";
        position: absolute;
        left: 3px;
        top: 1px;
        width: 4px;
        height: 7px;
        border: solid white;
        border-width: 0 1.5px 1.5px 0;
        transform: rotate(45deg);
      }

      .step-body {
        flex: 1;
        min-width: 0;
      }
      .step-title {
        font-size: 13.5px;
        color: #36342e;
        font-weight: 500;
        line-height: 1.4;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .agent-step.done .step-title {
        color: #939084;
        font-weight: 400;
      }

      .step-time {
        font-size: 10.5px;
        color: #b8b4a8;
        flex-shrink: 0;
        opacity: 0;
        transition: opacity 200ms ease;
      }
      .agent-step.done .step-time {
        opacity: 1;
      }

      .step-result {
        font-size: 13px;
        color: #201515;
        line-height: 1.65;
        margin-top: 4px;
      }
      .step-result:empty {
        display: none;
      }
      .agent-step.done .step-result {
        color: #36342e;
      }
      .result-line {
        display: block;
      }
      .result-strong {
        color: #201515;
        font-weight: 500;
      }
      .result-meta {
        color: #939084;
        font-size: 12px;
        margin-top: 1px;
      }

      /* Brand pills (step 3) */
      .brand-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin-top: 4px;
      }
      .brand-pill {
        display: inline-block;
        padding: 3px 9px;
        background: white;
        border: 1px solid #eceae3;
        border-radius: 999px;
        font-size: 12px;
        color: #201515;
        opacity: 0;
        transform: translateY(3px);
        transition:
          opacity 240ms ease,
          transform 240ms ease;
      }
      .brand-pill.shown {
        opacity: 1;
        transform: translateY(0);
      }

      /* Count row (step 4) */
      .count-row {
        display: flex;
        align-items: baseline;
        gap: 6px;
        margin-top: 2px;
      }
      .count-num {
        font-size: 18px;
        font-weight: 600;
        color: #201515;
        font-variant-numeric: tabular-nums;
      }
      .count-label {
        font-size: 12px;
        color: #939084;
      }

      /* ─── Tab 2 · Type pills (creator type with priority) ────── */
      .type-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 4px;
      }
      .type-pill {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 10px;
        background: #eceae3;
        border: 1px solid #c5c0b1;
        border-radius: 999px;
        font-size: 12px;
        line-height: 1.4;
        color: #36342e;
        opacity: 0;
        transform: translateY(3px);
        transition:
          opacity 240ms ease,
          transform 240ms ease;
      }
      .type-pill.shown {
        opacity: 1;
        transform: translateY(0);
      }
      .type-pill-label {
        font-weight: 500;
        color: #201515;
      }
      .type-pill-sep {
        color: #b8b4a8;
      }
      .type-pill-priority {
        color: #939084;
        font-weight: 400;
      }

      /* ─── Tab 2 · Method rows (creator type → method pills) ──── */
      .method-rows {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 6px;
      }
      .method-row {
        display: grid;
        grid-template-columns: 84px 1fr;
        align-items: center;
        gap: 10px;
        opacity: 0;
        transform: translateY(3px);
        transition:
          opacity 240ms ease,
          transform 240ms ease;
      }
      .method-row.shown {
        opacity: 1;
        transform: translateY(0);
      }
      .method-row-type {
        font-size: 12.5px;
        font-weight: 500;
        color: #939084;
      }
      .method-row-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
      }
      .method-pill {
        display: inline-block;
        padding: 3px 9px;
        background: #fffefb;
        border: 1px solid #c5c0b1;
        border-radius: 999px;
        font-size: 12px;
        color: #201515;
        opacity: 0;
        transform: translateY(2px);
        transition:
          opacity 200ms ease,
          transform 200ms ease;
      }
      .method-pill.shown {
        opacity: 1;
        transform: translateY(0);
      }

      /* ─── Tab 2 · Combo cards ─────────────────────────────────── */
      .combo-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
        margin-top: 6px;
      }
      @media (max-width: 1280px) {
        .combo-grid {
          grid-template-columns: 1fr;
        }
      }
      .combo-card {
        background: #fffdf9;
        border-radius: 10px;
        padding: 10px 12px;
        box-shadow:
          0 1px 2px rgba(32, 21, 21, 0.04),
          0 0 0 1px rgba(197, 192, 177, 0.5);
        opacity: 0;
        transform: translateY(4px);
        transition:
          opacity 280ms ease,
          transform 280ms ease;
      }
      .combo-card.shown {
        opacity: 1;
        transform: translateY(0);
      }
      .combo-card-head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 6px;
      }
      .combo-card-title {
        font-size: 12.5px;
        font-weight: 500;
        color: #201515;
        line-height: 1.35;
      }
      .combo-card-score {
        font-size: 15px;
        font-weight: 600;
        color: #201515;
        font-variant-numeric: tabular-nums;
      }
      .combo-card-rationale {
        margin-top: 3px;
        font-size: 11.5px;
        color: #939084;
        line-height: 1.45;
      }
      /* ─── Tab 3 · Baseline tiles ──────────────────────────────── */
      .baseline-basis {
        font-size: 12.5px;
        color: #36342e;
        margin-top: 4px;
        margin-bottom: 8px;
      }
      .baseline-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 6px;
      }
      .baseline-tile {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        background: #eceae3;
        border-radius: 10px;
        padding: 9px 11px;
        min-height: 38px;
        opacity: 0;
        transform: translateY(3px);
        transition:
          opacity 240ms ease,
          transform 240ms ease;
      }
      .baseline-tile.shown {
        opacity: 1;
        transform: translateY(0);
      }
      .baseline-tile-label {
        font-size: 11.5px;
        font-weight: 500;
        color: #939084;
        line-height: 1.2;
        white-space: nowrap;
      }
      .baseline-tile-value {
        font-size: 14px;
        font-weight: 600;
        color: #201515;
        line-height: 1.2;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }

      /* ─── Tab 3 · Trend label pills (label + count) ───────────── */
      .trend-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 4px;
      }
      .trend-pill {
        display: inline-flex;
        align-items: baseline;
        gap: 5px;
        padding: 3px 10px;
        background: #eceae3;
        border: 1px solid #c5c0b1;
        border-radius: 999px;
        opacity: 0;
        transform: translateY(3px);
        transition:
          opacity 240ms ease,
          transform 240ms ease;
      }
      .trend-pill.shown {
        opacity: 1;
        transform: translateY(0);
      }
      .trend-pill-label {
        font-size: 12px;
        font-weight: 400;
        color: #36342e;
      }
      .trend-pill-count {
        font-size: 12.5px;
        font-weight: 600;
        color: #201515;
        font-variant-numeric: tabular-nums;
      }

      /* Summary — hidden by default, runner toggles .visible */
      .agent-summary {
        opacity: 0;
        transform: translateY(6px);
        transition:
          opacity 320ms ease,
          transform 320ms ease;
      }
      .agent-summary.visible {
        opacity: 1;
        transform: translateY(0);
      }
    `}</style>
  );
}
