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

const STACK_UPPER_SURFACE = "#f6f2e9";
const STACK_UPPER_BORDER = "#ece5db";
const STACK_LOWER_BORDER = "#f1ece4";
const STACK_ACTIVE_SURFACE = "#ffffff";
const PRIMARY_ACTION_BUTTON_CLASSES =
  "inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-[#d38a67] bg-[linear-gradient(180deg,#db7a56_0%,#c96442_100%)] px-5 text-[12.5px] font-semibold tracking-[-0.01em] text-[#fff8f1] shadow-[0_14px_26px_-18px_rgba(164,87,55,0.68),inset_0_1px_0_rgba(255,243,232,0.3)] transition-all hover:border-[#cc7a56] hover:bg-[linear-gradient(180deg,#e18460_0%,#cf6d49_100%)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96442]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf9f5]";

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
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-[26px] border border-[#e8e6dc] bg-[#faf9f5] p-1.5 shadow-[0_1px_0_rgba(20,20,19,0.02)]">
        {/* Header slot — blogger info is the upper surface in the stacked card.
            Inactive tabs inherit that same surface, while the active tab drops into the white panel below. */}
        {header ? (
          <>
            <div
              className="relative z-[2] rounded-t-[20px] border border-b-0 shadow-[0_6px_14px_-10px_rgba(20,20,19,0.18)]"
              style={{
                borderColor: STACK_UPPER_BORDER,
                backgroundColor: STACK_UPPER_SURFACE,
              }}
            >
              {header}
            </div>
          </>
        ) : null}

        {/* Mode / filter card — sits flush under the upper card so inactive tabs
            visually stay on the same surface and the active tab drops into white. */}
        <div
          className={[
            "relative",
            header
              ? "rounded-b-[20px] border border-t-0 border-[#ece9dd]"
              : "rounded-[20px] border border-[#ece9dd]",
          ].join(" ")}
          style={{ backgroundColor: STACK_ACTIVE_SURFACE }}
        >
          {/* Tab row — active state slides with a subtle upward bump. */}
          <div
            role="tablist"
            aria-label="相似搜索模式"
            className="grid grid-cols-3 border-b"
            style={{
              borderColor: header ? STACK_ACTIVE_SURFACE : STACK_LOWER_BORDER,
              backgroundColor: header ? STACK_UPPER_SURFACE : "#faf9f5",
            }}
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
                    "relative isolate inline-flex min-h-[36px] items-center justify-center gap-1 overflow-hidden px-2 py-0 text-[11.5px] font-semibold transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#c96442]/30 focus-visible:outline-none focus-visible:ring-inset",
                    isActive ? "z-10 text-[#2a2927]" : "text-[#87867f] hover:text-[#2a2927]",
                  ].join(" ")}
                >
                  {isActive ? (
                    <motion.span
                      layoutId="similar-search-active-tab"
                      aria-hidden="true"
                      transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.7 }}
                      className="absolute inset-x-0 top-0 bottom-[-1px] rounded-t-[14px]"
                      style={{ backgroundColor: STACK_ACTIVE_SURFACE }}
                    />
                  ) : null}
                  <span
                    className={[
                      "relative z-10 transition-[font-size] duration-200",
                      isActive ? "text-[12.5px]" : "text-[11.5px]",
                    ].join(" ")}
                  >
                    {mode.label}
                  </span>
                  {isSeedTab ? <ArrowUpRight className="relative z-10 h-3 w-3 opacity-70" /> : null}
                </button>
              );
            })}
          </div>

          {/* Header strip */}
          <div className="px-4 pt-3 pb-2">
            <div className="text-[11px] leading-snug text-[#87867f]">{active.summary}</div>
          </div>

          {isSeed ? (
            <div className="px-4 pb-4">
              <button
                type="button"
                onClick={() => onOpenSeedFinder?.()}
                className={PRIMARY_ACTION_BUTTON_CLASSES}
              >
                打开博主发现
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
              <div className="mt-2 text-center text-[10px] text-[#a8a69c]">
                将在后台打开并基于当前达人自动筛选
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 px-4 pb-4">
              <div className="grid grid-cols-2 gap-2">
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

      {!isSeed ? (
        <div className="flex flex-col items-center gap-1.5 text-center">
          <button
            type="button"
            onClick={onRunSearch}
            disabled={isSearching}
            aria-label={`根据 ${actionSubjectLabel} ${isSearching ? "搜索中" : active.label}`}
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
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/15 text-[9px] font-semibold text-[#fff1e6] shadow-[0_2px_7px_rgba(20,20,19,0.16)]">
                博
              </span>
            )}
            <span>{isSearching ? "搜索中..." : active.label}</span>
          </button>

          <div className="inline-flex items-center gap-1 text-[10px] font-medium text-[#b08a63]">
            <span>此任务消耗</span>
            <PointsIcon className="h-3 w-3 text-[#8f745a]" />
            <span className="font-semibold tracking-[0.01em] text-[#9a7550]">3</span>
          </div>
        </div>
      ) : null}
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
      <span className="mb-1 block text-[9.5px] font-semibold tracking-[0.12em] text-[#a8a69c] uppercase">
        {label}
      </span>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full cursor-pointer appearance-none rounded-[10px] border border-[#e8e6dc] bg-white px-2.5 py-1.5 pr-7 text-[12px] font-medium text-[#2a2927] transition-colors outline-none hover:border-[#c96442]/40 focus:border-[#c96442]/60"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-2 h-3 w-3 -translate-y-1/2 text-[#87867f]" />
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
          className="text-[9.5px] font-semibold tracking-[0.12em] text-[#a8a69c] uppercase"
        >
          {label}
        </label>
        <span className="text-[12px] leading-none font-bold text-[#2a2927]">
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
        className="linkr-range h-1 w-full cursor-pointer appearance-none rounded-full outline-none"
        style={{
          background: `linear-gradient(to right, #c96442 0%, #c96442 ${pct}%, #e8e6dc ${pct}%, #e8e6dc 100%)`,
        }}
      />
      <style jsx>{`
        .linkr-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 9999px;
          background: #ffffff;
          border: 2px solid #c96442;
          box-shadow: 0 1px 3px rgba(201, 100, 66, 0.35);
          cursor: pointer;
        }
        .linkr-range::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 9999px;
          background: #ffffff;
          border: 2px solid #c96442;
          box-shadow: 0 1px 3px rgba(201, 100, 66, 0.35);
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
