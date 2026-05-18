"use client";

import type { ChatIntent } from "../../chat-types";
import { T } from "../../data/tokens";
import { BrandChip } from "./brand-chip";
import { CategoryChip } from "./category-chip";
import { FollowerCapChip } from "./follower-cap-chip";
import { ProductInput } from "./product-input";
import { TimeChip } from "./time-chip";
import { DEFAULT_FOLLOWER_CAP, DEFAULT_TIME_DAYS, type StructuredEditorState } from "./types";

interface StructuredEditorProps {
  intent: ChatIntent;
  state: StructuredEditorState;
  onChange: (next: StructuredEditorState) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

const LABEL_PREFIX = "我的产品：";

/**
 * 结构化输入编辑器 —— 每个维度按自己的「锚点」收字段(见 v2/dimensions.ts)。
 *
 * 每个字段是一个独立区块(FieldRow,行间有分隔线)—— 不用整句解释性文字,
 * 让用户一眼看到「这里有好几个字段可以填」,而不是「填完产品就结束了」。
 *
 *  - competitor → 对标竞品[必填] · 我的产品[选填] · 时间窗
 *  - scenario   → 我的产品[必填,锚点]
 *  - trending   → 对标品类[必填,可由产品推] · 我的产品[选填] · 时间窗
 *  - lowFollower→ 对标品类[必填] · 我的产品[选填] · 时间窗 · 粉丝量上限
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
    onChange({ ...state, timeDays: { ...state.timeDays, [intent]: days } });
  };

  const updateCategory = (category: string) => onChange({ ...state, category });
  const updateFollowerCap = (followerCap: number) => onChange({ ...state, followerCap });

  const hasProduct = state.productChip !== null || state.productNote.trim().length > 0;

  const productRow = (anchor: boolean) => (
    <FieldRow label="我的产品" optional={!anchor}>
      <ProductInput
        chip={state.productChip}
        note={state.productNote}
        onChange={updateProduct}
        onSubmit={onSubmit}
        disabled={disabled}
      />
    </FieldRow>
  );

  return (
    <div data-editor-bounds className="divide-y divide-[#f1efe9]">
      {intent === "competitor" ? (
        <>
          <FieldRow label="对标竞品">
            <BrandChip brandMode={state.brandMode} brands={state.brands} onChange={updateBrand} />
          </FieldRow>
          {productRow(false)}
          <FieldRow label="时间窗">
            <TimeChip
              value={state.timeDays.competitor ?? 90}
              defaultDays={DEFAULT_TIME_DAYS.competitor ?? 90}
              onChange={updateTimeDays}
            />
          </FieldRow>
        </>
      ) : null}

      {intent === "scenario" ? productRow(true) : null}

      {intent === "trending" ? (
        <>
          <FieldRow label="对标品类">
            <CategoryChip
              value={state.category}
              hasProductFallback={hasProduct}
              onChange={updateCategory}
            />
          </FieldRow>
          {productRow(false)}
          <FieldRow label="时间窗">
            <TimeChip
              value={state.timeDays.trending ?? 14}
              defaultDays={DEFAULT_TIME_DAYS.trending ?? 14}
              onChange={updateTimeDays}
            />
          </FieldRow>
        </>
      ) : null}

      {intent === "lowFollower" ? (
        <>
          <FieldRow label="对标品类">
            <CategoryChip
              value={state.category}
              hasProductFallback={hasProduct}
              onChange={updateCategory}
            />
          </FieldRow>
          {productRow(false)}
          <FieldRow label="时间窗">
            <TimeChip
              value={state.timeDays.lowFollower ?? 14}
              defaultDays={DEFAULT_TIME_DAYS.lowFollower ?? 14}
              onChange={updateTimeDays}
            />
          </FieldRow>
          <FieldRow label="粉丝量上限">
            <FollowerCapChip value={state.followerCap} onChange={updateFollowerCap} />
          </FieldRow>
        </>
      ) : null}
    </div>
  );
}

// 单个字段区块 —— 左侧是固定宽度的字段名,右侧是控件。行间分隔线由父容器
// 的 divide-y 提供,让多个字段读起来是「一组可填项」而非一句话。
function FieldRow({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline gap-3 py-2.5">
      <span className="flex w-[72px] shrink-0 items-baseline gap-1">
        <span className="text-[12.5px] font-medium" style={{ color: T.charcoal }}>
          {label}
        </span>
        {optional ? (
          <span className="text-[10px]" style={{ color: T.stone }}>
            选填
          </span>
        ) : null}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/**
 * Submit-time serialization — collapses the structured state into the single
 * string the agent flow / brief parser already understand. Each dimension
 * emits its anchor (竞品 / 产品 / 品类) plus the refinement fields it carries.
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
    return [productLine, `对标投过 ${brand} 的合作款，${time}内可直接建联的同品类达人`]
      .filter(Boolean)
      .join("\n");
  }

  if (intent === "scenario") {
    return productLine;
  }

  // trending / lowFollower —— 品类锚点 + 时间窗(+ 粉丝量上限)。
  const category = state.category.trim() || "产品所属品类";
  const days = state.timeDays[intent] ?? 14;
  const time = days === 0 ? "不限时间" : `近 ${days} 天`;

  if (intent === "lowFollower") {
    const cap = state.followerCap ?? DEFAULT_FOLLOWER_CAP;
    const capText = `${Math.round(cap / 10_000)} 万`;
    return [
      productLine,
      `对标品类「${category}」，找${time}内、粉丝量 ${capText}以下的低粉爆款达人`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [productLine, `对标品类「${category}」，找${time}内品类爆款组合相似、可立刻触达的达人`]
    .filter(Boolean)
    .join("\n");
}

/**
 * @deprecated 提交门禁已改为按维度锚点判定 —— 用 `isAnchorSatisfied`
 * (v2/dimensions.ts) 替代。保留此函数仅为兼容仍在引用它的旧入口。
 */
export function isEditorEmpty(state: StructuredEditorState): boolean {
  return state.productChip === null && state.productNote.trim().length === 0;
}
