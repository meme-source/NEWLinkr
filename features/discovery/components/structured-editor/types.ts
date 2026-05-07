import type { ChatIntent } from "../../chat-types";

export interface ProductChip {
  /** Display URL — `https://` and `www.` already stripped. */
  url: string;
  /** Async-fetched product title. Empty while loading. */
  title: string;
  loading: boolean;
}

export type BrandMode = "auto" | "manual";

/**
 * Per-mode editor state. Lives next to the existing ChatChips so we don't have
 * to disturb the chat-driven filter pipeline. The smart-product split is the
 * "input area" model from the v2 mock §3.4.
 */
export interface StructuredEditorState {
  productChip: ProductChip | null;
  productNote: string;
  brandMode: BrandMode;
  brands: string[];
  /** Per-mode time window in days. 0 = 不限时间. `null` for modes that don't use it. */
  timeDays: Record<ChatIntent, number | null>;
}

export const DEFAULT_TIME_DAYS: StructuredEditorState["timeDays"] = {
  competitor: 90,
  scenario: null,
  trending: 14,
};

export const DEFAULT_EDITOR_STATE: StructuredEditorState = {
  productChip: null,
  productNote: "",
  brandMode: "auto",
  brands: [],
  timeDays: DEFAULT_TIME_DAYS,
};

export const MAX_MANUAL_BRANDS = 5;

export const SUGGESTED_BRANDS = ["CeraVe", "La Roche-Posay", "Cetaphil", "Aveeno", "Vanicream"];
