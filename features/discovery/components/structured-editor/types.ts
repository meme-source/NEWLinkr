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
 *
 * 每个维度有不同的「锚点」(见 v2/dimensions.ts):
 *   - competitor → `brands` / `brandMode`(竞品锚点)
 *   - scenario   → `productChip` / `productNote`(产品锚点)
 *   - trending / lowFollower → `category`(品类锚点,留空则由产品推断)
 *   - lowFollower 额外用 `followerCap`(粉丝量上限,是「低粉」的定义性输入)
 */
export interface StructuredEditorState {
  productChip: ProductChip | null;
  productNote: string;
  brandMode: BrandMode;
  brands: string[];
  /** Per-mode time window in days. 0 = 不限时间. `null` for modes that don't use it. */
  timeDays: Record<ChatIntent, number | null>;
  /** 品类锚点 —— trending / lowFollower 用。留空 = 由产品自动推断品类。 */
  category: string;
  /** 粉丝量上限 —— lowFollower 专属。null = 用 DEFAULT_FOLLOWER_CAP。 */
  followerCap: number | null;
}

export const DEFAULT_TIME_DAYS: StructuredEditorState["timeDays"] = {
  competitor: 90,
  scenario: null,
  trending: 14,
  lowFollower: 14,
};

export const DEFAULT_EDITOR_STATE: StructuredEditorState = {
  productChip: null,
  productNote: "",
  brandMode: "auto",
  brands: [],
  timeDays: DEFAULT_TIME_DAYS,
  category: "",
  followerCap: null,
};

export const MAX_MANUAL_BRANDS = 5;

export const SUGGESTED_BRANDS = ["CeraVe", "La Roche-Posay", "Cetaphil", "Aveeno", "Vanicream"];

/** lowFollower 维度的「粉丝量上限」默认值与可选档位。 */
export const DEFAULT_FOLLOWER_CAP = 50_000;

export const FOLLOWER_CAP_OPTIONS: ReadonlyArray<{ value: number; label: string }> = [
  { value: 10_000, label: "1 万以下" },
  { value: 30_000, label: "3 万以下" },
  { value: 50_000, label: "5 万以下" },
  { value: 100_000, label: "10 万以下" },
];
