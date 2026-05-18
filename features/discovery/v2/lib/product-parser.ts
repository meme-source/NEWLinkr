import { DEMO_PRODUCT } from "../data/demo-fixture";
import { TABBIT_PRODUCT } from "../data/tabbit-fixture";
import type { ParsedProduct } from "./parsed-brief-types";

const PARSE_LATENCY_MS = 900;

/**
 * Mock product-page parser. Today: keyword-routes the URL to a fixture and
 * stalls long enough to feel like a real fetch+LLM call. Tomorrow (S4): the
 * function body is replaced with a real og:meta scrape + Anthropic prompt;
 * the call sites stay identical.
 *
 * Returns a fallback ParsedProduct for unknown URLs so the agent flow can
 * still progress — the fallback is intentionally vague so users notice it
 * isn't a real parse.
 */
export async function parseProduct(url: string): Promise<ParsedProduct> {
  await sleep(PARSE_LATENCY_MS);
  const lower = url.toLowerCase();

  if (lower.includes("tabbit")) {
    return { ...TABBIT_PRODUCT, url };
  }
  if (lower.includes("cerave") || lower.includes("laroche") || lower.includes("cetaphil")) {
    return { ...DEMO_PRODUCT, url };
  }

  return {
    name: "未识别产品",
    category: "未知品类",
    market: "未指定市场",
    url,
    sellingPoints: [],
    audience: "未识别受众",
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
