"use client";

import type { ChatIntent } from "../../chat-types";
import { T } from "../../data/tokens";
import { BrandChip } from "./brand-chip";
import { ProductInput } from "./product-input";
import { TimeChip } from "./time-chip";
import { DEFAULT_TIME_DAYS, type StructuredEditorState } from "./types";

interface StructuredEditorProps {
  intent: ChatIntent;
  state: StructuredEditorState;
  onChange: (next: StructuredEditorState) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

const LABEL_PREFIX = "我的产品：";

/**
 * Replaces the legacy multi-line textarea with a structured per-mode editor:
 *  - mode1 (competitor): 我的产品 [chip] / 找投过 [brand] 的达人，[time]
 *  - mode2 (scenario):   我的产品 [chip] / (system hint, no extra input)
 *  - mode3 (trending):   我的产品 [chip] / 找 [time] 起量的同类达人
 */
export function StructuredEditor({
  intent,
  state,
  onChange,
  onSubmit,
  disabled,
}: StructuredEditorProps) {
  const updateProduct = (next: { chip: StructuredEditorState["productChip"]; note: string }) => {
    onChange({ ...state, productChip: next.chip, productNote: next.note });
  };

  const updateBrand = (next: {
    brandMode: StructuredEditorState["brandMode"];
    brands: string[];
  }) => {
    onChange({ ...state, ...next });
  };

  const updateTimeDays = (days: number) => {
    onChange({
      ...state,
      timeDays: { ...state.timeDays, [intent]: days },
    });
  };

  const productLine = (
    <div className="flex flex-wrap items-baseline gap-y-1">
      <span className="text-[14.5px] leading-[1.5] font-medium" style={{ color: T.charcoal }}>
        {LABEL_PREFIX}
      </span>
      <ProductInput
        chip={state.productChip}
        note={state.productNote}
        onChange={updateProduct}
        onSubmit={onSubmit}
        disabled={disabled}
      />
    </div>
  );

  return (
    <div data-editor-bounds className="space-y-1">
      {productLine}

      {intent === "competitor" ? (
        <SentenceLine>
          <span style={{ color: T.charcoal }}>找投过</span>
          <BrandChip brandMode={state.brandMode} brands={state.brands} onChange={updateBrand} />
          <span style={{ color: T.charcoal }}>的达人，</span>
          <TimeChip
            value={state.timeDays.competitor ?? 90}
            defaultDays={DEFAULT_TIME_DAYS.competitor ?? 90}
            onChange={updateTimeDays}
          />
        </SentenceLine>
      ) : null}

      {intent === "scenario" ? (
        <div className="px-1 text-[13.5px] leading-[1.6]" style={{ color: T.stone }}>
          系统会自动匹配博主类型 × 合作方式，无需额外输入
        </div>
      ) : null}

      {intent === "trending" ? (
        <SentenceLine>
          <span style={{ color: T.charcoal }}>找</span>
          <TimeChip
            value={state.timeDays.trending ?? 14}
            defaultDays={DEFAULT_TIME_DAYS.trending ?? 14}
            onChange={updateTimeDays}
          />
          <span style={{ color: T.charcoal }}>起量的同类达人</span>
        </SentenceLine>
      ) : null}
    </div>
  );
}

function SentenceLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline gap-y-1 text-[14.5px] leading-[1.7]">
      {children}
    </div>
  );
}

/**
 * Submit-time serialization — collapses the structured state into the single
 * string the agent flow already understands. Mirrors mock §3.4 「提交时合并」.
 */
export function serializeEditorState(intent: ChatIntent, state: StructuredEditorState): string {
  const productUrl = state.productChip ? `https://${state.productChip.url}` : "";
  const productNote = state.productNote.trim();
  const product = [productUrl, productNote].filter(Boolean).join(" ").trim();
  const productLine = product ? `${LABEL_PREFIX}${product}` : "";

  if (intent === "competitor") {
    const brand =
      state.brandMode === "manual" && state.brands.length > 0
        ? state.brands.join(" / ")
        : "同品类品牌";
    const days = state.timeDays.competitor ?? 90;
    const time = days === 0 ? "不限时间" : `近 ${days} 天`;
    return [productLine, `找投过 ${brand} 的达人，${time}`].filter(Boolean).join("\n");
  }

  if (intent === "scenario") {
    return productLine;
  }

  // trending
  const days = state.timeDays.trending ?? 14;
  const time = days === 0 ? "不限时间" : `近 ${days} 天`;
  return [productLine, `找 ${time} 起量的同类达人`].filter(Boolean).join("\n");
}

export function isEditorEmpty(state: StructuredEditorState): boolean {
  return state.productChip === null && state.productNote.trim().length === 0;
}
