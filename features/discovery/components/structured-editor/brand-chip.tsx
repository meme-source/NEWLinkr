"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { T } from "../../data/tokens";
import { InlineChip } from "./inline-chip";
import { MAX_MANUAL_BRANDS, SUGGESTED_BRANDS, type BrandMode } from "./types";

interface BrandChipProps {
  brandMode: BrandMode;
  brands: string[];
  onChange: (next: { brandMode: BrandMode; brands: string[] }) => void;
}

export function brandChipText(brandMode: BrandMode, brands: string[]): string {
  if (brandMode === "auto") return "同品类品牌";
  if (brands.length === 0) return "指定品牌";
  if (brands.length === 1) return brands[0];
  return `${brands[0]} +${brands.length - 1}`;
}

export function BrandChip({ brandMode, brands, onChange }: BrandChipProps) {
  const isCustomized = brandMode === "manual" && brands.length > 0;
  const titleAttr = brands.length > 1 ? brands.join(", ") : undefined;

  return (
    <InlineChip
      label={brandChipText(brandMode, brands)}
      active={isCustomized}
      title={titleAttr}
      popoverFillHost
      popoverAlign="center"
      renderPopover={(close) => (
        <BrandPopover
          brandMode={brandMode}
          brands={brands}
          onCommit={(next) => {
            onChange(next);
            close();
          }}
          onCancel={close}
        />
      )}
    />
  );
}

interface BrandPopoverProps {
  brandMode: BrandMode;
  brands: string[];
  onCommit: (next: { brandMode: BrandMode; brands: string[] }) => void;
  onCancel: () => void;
}

function BrandPopover({ brandMode, brands, onCommit, onCancel }: BrandPopoverProps) {
  const [draftMode, setDraftMode] = useState<BrandMode>(brandMode);
  const [draftBrands, setDraftBrands] = useState<string[]>(brands);

  const addBrand = (name: string) => {
    if (draftBrands.length >= MAX_MANUAL_BRANDS) return;
    if (draftBrands.includes(name)) return;
    setDraftBrands((prev) => [...prev, name]);
    setDraftMode("manual");
  };
  const removeBrand = (name: string) => {
    setDraftBrands((prev) => prev.filter((b) => b !== name));
  };

  const confirm = () => {
    // Spec §3.3 「确定行为」: in manual mode but no brands → fall back to auto.
    if (draftMode === "manual" && draftBrands.length === 0) {
      onCommit({ brandMode: "auto", brands: [] });
    } else {
      onCommit({ brandMode: draftMode, brands: draftBrands });
    }
  };

  return (
    <>
      <div
        className="border-b px-4 py-2.5 text-[12px] font-semibold"
        style={{ borderColor: T.borderLight, color: T.charcoal }}
      >
        找谁合作过的达人？
      </div>

      {/* Body — radios on the left (compact); manual panel slides in to the
          right column when selected. The flex layout collapses to a single
          column on narrow popovers (<480 px) so it remains usable on the
          25%-width agent console. */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 sm:flex-row">
        <div className="flex flex-col gap-1 sm:w-[230px] sm:shrink-0">
          <RadioRow
            selected={draftMode === "auto"}
            title="同品类品牌"
            hint="系统从产品识别品类，自动反推该品类头部品牌（CeraVe / La Roche-Posay…）"
            onClick={() => setDraftMode("auto")}
          />
          <RadioRow
            selected={draftMode === "manual"}
            title="指定品牌"
            hint={`最多选 ${MAX_MANUAL_BRANDS} 个，会精确匹配这几个品牌的合作证据`}
            onClick={() => setDraftMode("manual")}
          />
        </div>

        {draftMode === "manual" ? (
          <div
            className="flex-1 rounded-[10px] border p-3"
            style={{ borderColor: T.borderLight, backgroundColor: T.ivory }}
          >
            <ManualBrandPanel brands={draftBrands} onAdd={addBrand} onRemove={removeBrand} />
          </div>
        ) : null}
      </div>

      <div
        className="flex items-center justify-end gap-2 border-t px-3 py-2.5"
        style={{ borderColor: T.borderLight }}
      >
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full px-3 py-1 text-[12px] transition-colors hover:bg-[--hover]"
          style={{ ["--hover" as string]: T.ivory, color: T.charcoal }}
        >
          取消
        </button>
        <button
          type="button"
          onClick={confirm}
          className="rounded-full px-3.5 py-1 text-[12px] font-medium text-white transition-[filter] hover:brightness-110 active:scale-[0.98]"
          style={{ backgroundColor: T.terracotta }}
        >
          确定
        </button>
      </div>
    </>
  );
}

function RadioRow({
  selected,
  title,
  hint,
  onClick,
}: {
  selected: boolean;
  title: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-1 flex w-full items-start gap-2.5 rounded-[10px] px-2.5 py-2 text-left transition-colors hover:bg-[--hover]"
      style={{
        ["--hover" as string]: T.ivory,
        backgroundColor: selected ? "rgba(255,79,0,0.06)" : "transparent",
      }}
    >
      <span
        aria-hidden
        className="mt-[3px] inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border"
        style={{
          borderColor: selected ? T.terracotta : T.border,
          backgroundColor: selected ? T.terracotta : "white",
          boxShadow: selected ? "inset 0 0 0 2px white" : undefined,
        }}
      />
      <span className="flex-1">
        <span
          className="block text-[13px] leading-[1.4]"
          style={{
            color: selected ? T.terracotta : T.nearBlack,
            fontWeight: selected ? 500 : 400,
          }}
        >
          {title}
        </span>
        <span className="mt-1 block text-[11.5px] leading-[1.5]" style={{ color: T.stone }}>
          {hint}
        </span>
      </span>
    </button>
  );
}

function ManualBrandPanel({
  brands,
  onAdd,
  onRemove,
}: {
  brands: string[];
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
}) {
  const [query, setQuery] = useState("");

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const name = query.trim();
            if (name) {
              onAdd(name);
              setQuery("");
            }
          }
        }}
        placeholder="搜品牌名或 @ 账号..."
        className="w-full rounded-lg border bg-[--bg] px-3 py-2 text-[12.5px] outline-none focus:border-[color:var(--brand)] focus:bg-white"
        style={{
          ["--bg" as string]: T.ivory,
          ["--brand" as string]: T.terracotta,
          borderColor: T.borderLight,
          color: T.nearBlack,
        }}
      />

      {brands.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {brands.map((b) => (
            <span
              key={b}
              className="inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[12px]"
              style={{
                backgroundColor: "rgba(255,79,0,0.1)",
                color: T.terracotta,
              }}
            >
              {b}
              <button
                type="button"
                onClick={() => onRemove(b)}
                aria-label={`移除 ${b}`}
                className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-[rgba(255,79,0,0.18)]"
              >
                <X size={10} strokeWidth={2.6} />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div
        className="mt-3 text-[10.5px] font-semibold tracking-[0.06em] uppercase"
        style={{ color: T.stone }}
      >
        同品类建议
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {SUGGESTED_BRANDS.map((b) => {
          const selected = brands.includes(b);
          const disabled = !selected && brands.length >= MAX_MANUAL_BRANDS;
          return (
            <button
              key={b}
              type="button"
              disabled={disabled}
              onClick={() => onAdd(b)}
              className="inline-flex items-center gap-1 rounded-full border px-2 py-[3px] text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                backgroundColor: selected ? "rgba(255,79,0,0.1)" : "white",
                borderColor: selected ? T.terracotta : T.borderLight,
                color: selected ? T.terracotta : T.charcoal,
              }}
            >
              {!selected ? <Plus size={10} strokeWidth={2.6} /> : null}
              {b}
            </button>
          );
        })}
      </div>
    </div>
  );
}
