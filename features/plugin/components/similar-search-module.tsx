"use client";

import { useId, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ChevronDown } from "lucide-react";

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
    summary: "打开后台博主发现，基于当前达人扩展低重合、高潜力的种子。",
    eta: "跳转",
  },
];

// Per docs/DESIGN.md §6: outermost plugin cards use #fffefb cream surface with sand border.
const SIDEBAR_CARD_CLASSES =
  "relative overflow-hidden rounded-[20px] border border-[#c5c0b1] bg-[#fffefb]";
// Per docs/DESIGN.md §4 Primary Orange button: flat #ff4f00, no gradient, no shadow.
const PRIMARY_ACTION_BUTTON_CLASSES =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#ff4f00] px-5 text-[13px] font-semibold tracking-[-0.01em] text-[#fffefb] transition-colors hover:bg-[#ff4f00] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4f00]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffefb]";

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
  const [region, setRegion] = useState("全球");
  const [language, setLanguage] = useState("全部语言");
  const [fans, setFans] = useState(10_000);
  const [views, setViews] = useState(1_000);

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
              <button
                type="button"
                onClick={onOpenAnalysis}
                className="inline-flex items-center gap-0.5 rounded-md px-2 py-0.5 text-[13px] font-medium text-[#ff4f00] transition-colors hover:bg-[#eceae3]"
                style={{ letterSpacing: "-0.146px", lineHeight: "19.5px" }}
              >
                查看完整档案 →
              </button>
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
            className="relative mx-3 mt-3 grid grid-cols-3 rounded-full p-1"
            style={{ backgroundColor: "#eceae3" }}
          >
            {MODES.map((mode) => {
              const isActive = mode.key === active.key;
              const isSeedTab = mode.key === "seed";
              return (
                <button
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
                    "relative isolate inline-flex min-h-[28px] items-center justify-center gap-0.5 rounded-full px-1.5 text-[11.5px] font-semibold whitespace-nowrap transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#ff4f00]/30 focus-visible:outline-none focus-visible:ring-inset",
                    isActive ? "z-10 text-[#201515]" : "text-[#939084] hover:text-[#201515]",
                  ].join(" ")}
                >
                  {isActive ? (
                    <motion.span
                      layoutId="similar-search-active-tab"
                      aria-hidden="true"
                      transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.7 }}
                      className="absolute inset-0 rounded-full border border-[#c5c0b1] bg-[#fffefb]"
                    />
                  ) : null}
                  <span className="relative z-10 whitespace-nowrap">{mode.label}</span>
                  {isSeedTab ? (
                    <ArrowUpRight className="relative z-10 h-2.5 w-2.5 shrink-0 opacity-70" />
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Summary strip */}
          <div className="px-4 pt-3 pb-1">
            <div className="text-[11px] leading-snug text-[#939084]">{active.summary}</div>
          </div>

          {isSeed ? (
            <div className="px-4 pt-2 pb-4">
              <button
                type="button"
                onClick={() => onOpenSeedFinder?.()}
                className={PRIMARY_ACTION_BUTTON_CLASSES}
              >
                打开博主发现
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
              <div className="mt-2 text-center text-[10px] text-[#939084]">
                将在后台打开并基于当前达人自动筛选
              </div>
            </div>
          ) : (
            <div className="space-y-4 px-4 pt-2 pb-4">
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label="地区"
                  value={region}
                  onChange={setRegion}
                  options={REGION_OPTIONS}
                />
                <SelectField
                  label="语言"
                  value={language}
                  onChange={setLanguage}
                  options={LANGUAGE_OPTIONS}
                />
              </div>

              <RangeField
                label="粉丝数"
                value={fans}
                onChange={setFans}
                min={1_000}
                max={1_000_000}
                step={1_000}
                formatter={formatCount}
              />

              <RangeField
                label="平均观看量"
                value={views}
                onChange={setViews}
                min={100}
                max={500_000}
                step={100}
                formatter={formatCount}
              />
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={isSeed ? () => onOpenSeedFinder?.() : onRunSearch}
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
      </button>
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

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  const id = useId();
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1 block text-[9.5px] font-semibold tracking-[0.12em] text-[#939084] uppercase">
        {label}
      </span>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full cursor-pointer appearance-none border-0 bg-transparent py-1 pr-5 pl-0 text-[13px] font-semibold text-[#201515] transition-colors outline-none hover:text-[#ff4f00] focus:text-[#ff4f00]"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-1 h-3 w-3 -translate-y-1/2 text-[#939084]" />
      </div>
    </label>
  );
}

function RangeField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  formatter,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  formatter: (value: number) => string;
}) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div className="mb-0.5 flex items-baseline justify-between">
        <label
          htmlFor={id}
          className="text-[9.5px] font-semibold tracking-[0.12em] text-[#939084] uppercase"
        >
          {label}
        </label>
        <span className="text-[12px] leading-none font-bold text-[#201515]">
          {formatter(value)}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="linkr-range h-[3px] w-full cursor-pointer appearance-none rounded-full outline-none"
        style={{
          background: `linear-gradient(to right, #ff4f00 0%, #ff4f00 ${pct}%, #c5c0b1 ${pct}%, #c5c0b1 100%)`,
        }}
      />
      <style jsx>{`
        .linkr-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 9999px;
          background: #ff4f00;
          border: 2px solid #fffefb;
          box-shadow: 0 1px 4px rgba(201, 100, 66, 0.28);
          cursor: pointer;
        }
        .linkr-range::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 9999px;
          background: #ff4f00;
          border: 2px solid #fffefb;
          box-shadow: 0 1px 4px rgba(201, 100, 66, 0.28);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

function formatCount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  if (value >= 10_000) {
    return `${Math.round(value / 1_000)}K`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toLocaleString();
}
