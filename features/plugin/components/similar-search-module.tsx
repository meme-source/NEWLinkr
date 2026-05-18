"use client";

import { useId, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MultiSelectField } from "@/features/plugin/components/multi-select-field";

type NumRange = { min: number | null; max: number | null };

// Default range applied to both 粉丝数 and 平均播放量. Mirrors discovery
// (features/discovery/data/chat-chips.ts → DEFAULT_RANGE): a soft floor of 1K
// gates out the long tail of <1K creators that almost never represent serious
// collab candidates. Users can clear either side to "不限" manually.
const DEFAULT_RANGE: NumRange = { min: 1_000, max: null };

export type SimilarSearchModeKey = "comprehensive" | "budget" | "seed";

type ModeDef = {
  key: SimilarSearchModeKey;
  label: string;
  summary: string;
  eta: string;
};

const MODES: ModeDef[] = [
  {
    key: "comprehensive",
    label: "找相似",
    summary: "内容、调性、受众风格相近的博主推荐。",
    eta: "8–12s",
  },
  {
    key: "budget",
    label: "找平替",
    summary: "风格 / 受众相似，但报价更低的博主。",
    eta: "6–10s",
  },
  {
    key: "seed",
    label: "找种子达人",
    summary: "打开后台博主发现，从零物色一批适合的种子博主。",
    eta: "跳转",
  },
];

// Per docs/DESIGN.md §6: outermost plugin cards use #fffefb cream surface with sand border.
const SIDEBAR_CARD_CLASSES =
  "relative overflow-hidden rounded-[8px] border border-[#c5c0b1] bg-[#fffefb]";
// Per docs/DESIGN.md §4 Primary Orange button: flat #ff4f00, no gradient, no shadow.
const PRIMARY_ACTION_BUTTON_CLASSES =
  "inline-flex h-9 w-full items-center justify-center gap-2 rounded-[8px] bg-[#ff4f00] px-5 text-[13px] font-semibold tracking-[-0.01em] text-[#fffefb] transition-colors hover:bg-[#ff4f00] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4f00]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffefb]";

const REGION_OPTIONS = [
  "全球",
  "美国",
  "英国",
  "加拿大",
  "澳大利亚",
  "东南亚",
  "日本",
  "韩国",
  "中东",
  "欧洲",
  "拉美",
];

const LANGUAGE_OPTIONS = [
  "全部语言",
  "英语",
  "中文",
  "日语",
  "韩语",
  "西班牙语",
  "法语",
  "德语",
  "阿拉伯语",
];

type Props = {
  selectedMode: SimilarSearchModeKey;
  onSelectMode: (mode: SimilarSearchModeKey) => void;
  onRunSearch: () => void;
  isSearching: boolean;
  onOpenSeedFinder?: () => void;
  onOpenAnalysis?: () => void;
  header?: ReactNode;
  actionSubject?: ReactNode;
  actionSubjectLabel?: string;
};

export function SimilarSearchModule({
  selectedMode,
  onSelectMode,
  onRunSearch,
  isSearching,
  onOpenSeedFinder,
  onOpenAnalysis,
  header,
  actionSubject,
  actionSubjectLabel = "当前博主",
}: Props) {
  // 地区 / 语言 are multi-select: an empty array means 全球 / 全部语言 (不限).
  const [regions, setRegions] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [fans, setFans] = useState<NumRange>(DEFAULT_RANGE);
  const [views, setViews] = useState<NumRange>(DEFAULT_RANGE);

  const active = MODES.find((m) => m.key === selectedMode) ?? MODES[0];
  const isSeed = active.key === "seed";

  return (
    <div className="space-y-3">
      {/* Card 1 — blogger profile + view-detail link. Standalone card per docs/DESIGN.md §6. */}
      {header ? (
        <div className={SIDEBAR_CARD_CLASSES}>
          {header}
          {onOpenAnalysis ? (
            <div className="flex justify-center px-3.5 pb-3">
              <Button
                unstyled
                type="button"
                onClick={onOpenAnalysis}
                className="inline-flex items-center gap-0.5 rounded-md px-2 py-0.5 text-[13px] font-medium text-[#ff4f00] transition-colors hover:bg-[#eceae3]"
                style={{ letterSpacing: "-0.146px", lineHeight: "19.5px" }}
              >
                查看完整档案 →
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Card 2 — mode tabs + filters. Independent cream card with sand border. */}
      <div className={SIDEBAR_CARD_CLASSES}>
        <div className="relative">
          {/* Segmented control — soft pill behind the active tab, no underline. */}
          <div
            role="tablist"
            aria-label="相似搜索模式"
            className="relative mx-3 mt-3 grid grid-cols-3 rounded-[8px] p-0.5"
            style={{ backgroundColor: "#eceae3" }}
          >
            {MODES.map((mode) => {
              const isActive = mode.key === active.key;
              const isSeedTab = mode.key === "seed";
              return (
                <Button
                  unstyled
                  key={mode.key}
                  role="tab"
                  type="button"
                  aria-selected={isActive}
                  onClick={() => {
                    if (isSeedTab && onOpenSeedFinder && mode.key === active.key) {
                      onOpenSeedFinder();
                      return;
                    }
                    onSelectMode(mode.key);
                  }}
                  className={[
                    "relative isolate inline-flex min-h-[30px] items-center justify-center gap-1 rounded-[6px] px-1.5 text-[12px] font-semibold whitespace-nowrap transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#ff4f00]/30 focus-visible:outline-none focus-visible:ring-inset",
                    isActive ? "z-10 text-[#201515]" : "text-[#939084] hover:text-[#201515]",
                  ].join(" ")}
                >
                  {isActive ? (
                    <motion.span
                      layoutId="similar-search-active-tab"
                      aria-hidden="true"
                      transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.7 }}
                      className="absolute inset-0 rounded-[6px] border border-[#c5c0b1] bg-[#fffefb]"
                    />
                  ) : null}
                  <span className="relative z-10 whitespace-nowrap">{mode.label}</span>
                  {isSeedTab ? (
                    <ArrowUpRight className="relative z-10 h-3 w-3 shrink-0 opacity-70" />
                  ) : null}
                </Button>
              );
            })}
          </div>

          {/* Summary strip */}
          <div className="px-4 pt-3 pb-1">
            <div className="text-[11px] leading-snug text-[#939084]">{active.summary}</div>
          </div>

          {isSeed ? (
            <div className="px-4 pt-2 pb-4">
              <Button
                unstyled
                type="button"
                onClick={() => onOpenSeedFinder?.()}
                className={PRIMARY_ACTION_BUTTON_CLASSES}
              >
                打开博主发现
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2 px-4 pt-2 pb-4">
              <div className="grid grid-cols-2 gap-3">
                <MultiSelectField
                  label="地区"
                  allLabel={REGION_OPTIONS[0]}
                  options={REGION_OPTIONS.slice(1)}
                  values={regions}
                  onChange={setRegions}
                />
                <MultiSelectField
                  label="语言"
                  allLabel={LANGUAGE_OPTIONS[0]}
                  options={LANGUAGE_OPTIONS.slice(1)}
                  values={languages}
                  onChange={setLanguages}
                />
              </div>

              <RangeField label="粉丝数" value={fans} onChange={setFans} />
              <RangeField label="平均播放量" value={views} onChange={setViews} />
            </div>
          )}
        </div>
      </div>

      {!isSeed && (
        <Button
          unstyled
          type="button"
          onClick={onRunSearch}
          disabled={isSearching}
          aria-label={`根据 ${actionSubjectLabel} ${isSearching ? "搜索中" : active.label}，消耗 3 点`}
          className={PRIMARY_ACTION_BUTTON_CLASSES}
        >
          <span>根据</span>
          {actionSubject ? (
            <span
              aria-hidden="true"
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full"
            >
              {actionSubject}
            </span>
          ) : (
            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#c5c0b1] bg-[#fffefb] text-[9px] font-semibold text-[#36342e]">
              博
            </span>
          )}
          <span>{isSearching ? "搜索中..." : active.label}</span>
          <span aria-hidden="true" className="mx-1 h-3 w-px bg-[#fffefb]/35" />
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#fffefb]/90">
            <PointsIcon className="h-3 w-3" />3
          </span>
        </Button>
      )}
    </div>
  );
}

function PointsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1024 1024" fill="none" aria-hidden="true" className={className}>
      <path
        d="M512 455.111111c157.070222 0 284.444444-50.915556 284.444444-113.777778s-127.374222-113.777778-284.444444-113.777777-284.444444 50.915556-284.444444 113.777777 127.374222 113.777778 284.444444 113.777778zM227.555556 512c0-17.237333 11.377778-36.238222 30.947555-51.598222q14.449778 7.452444 31.288889 14.222222Q383.146667 512 512 512q128.796444 0 222.264889-37.376 16.782222-6.769778 31.288889-14.222222c19.512889 15.36 30.890667 34.360889 30.890666 51.598222 0 62.862222-127.374222 113.777778-284.444444 113.777778s-284.444444-50.915556-284.444444-113.777778z m0 170.666667c0-17.237333 11.377778-36.238222 30.947555-51.598223q14.449778 7.452444 31.288889 14.222223Q383.146667 682.666667 512 682.666667q128.796444 0 222.264889-37.376 16.782222-6.769778 31.288889-14.222223c19.512889 15.36 30.890667 34.360889 30.890666 51.598223 0 62.862222-127.374222 113.777778-284.444444 113.777777s-284.444444-50.915556-284.444444-113.777777z"
        fill="currentColor"
      />
    </svg>
  );
}

// Numeric min–max range field. Mirrors the discovery page's chip popover
// (features/discovery/components/chip-bar.tsx RangeRow) so the plugin sidebar's
// 找相似 / 找平替 filter feels identical to 博主发现页. Either side may be cleared
// to null ("不限").
function RangeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: NumRange;
  onChange: (next: NumRange) => void;
}) {
  return (
    <div>
      <div className="mb-1 text-[9.5px] font-semibold tracking-[0.12em] text-[#939084] uppercase">
        {label}
      </div>
      <div className="flex items-center gap-2 text-[12px]">
        <RangeInput
          value={value.min}
          onChange={(v) => onChange({ ...value, min: v })}
          ariaLabel={`${label} 下限`}
        />
        <span aria-hidden className="shrink-0 text-[11px] text-[#939084]">
          –
        </span>
        <RangeInput
          value={value.max}
          onChange={(v) => onChange({ ...value, max: v })}
          ariaLabel={`${label} 上限`}
        />
        <Button
          unstyled
          type="button"
          onClick={() => onChange({ min: null, max: null })}
          title="清空"
          aria-label={`清空${label}`}
          className="ml-auto inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#939084] transition-colors hover:bg-[#eceae3] hover:text-[#36342e]"
        >
          <RotateCcw className="h-3 w-3" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

function RangeInput({
  value,
  onChange,
  ariaLabel,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  ariaLabel: string;
}) {
  const id = useId();
  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      value={value === null ? "" : String(value)}
      onChange={(event) => {
        const raw = event.target.value.replace(/[^\d]/g, "");
        onChange(raw === "" ? null : Number(raw));
      }}
      placeholder="不限"
      aria-label={ariaLabel}
      className="min-w-0 flex-1 rounded-md border border-[#c5c0b1] bg-[#fffefb] px-2 py-1 text-center text-[12px] text-[#201515] tabular-nums placeholder:text-[#939084] focus:border-[#ff4f00] focus:outline-none"
    />
  );
}
