import { DEMO_BRIEF } from "../data/demo-fixture";
import { TABBIT_BRIEF } from "../data/tabbit-fixture";
import { UNKNOWN_BRIEF } from "../data/unknown-fixture";
import type { ParsedBrief } from "./parsed-brief-types";

const PARSE_LATENCY_MS = 1100;

/**
 * Mock brief parser. Today: keyword-routes the input text + URL to a
 * fixture. Tomorrow (S4): an Anthropic call replaces the routing logic;
 * the return shape stays identical.
 *
 * The router only recognizes the two seeded fixtures (Tabbit and the demo
 * skincare scenario). Any other input falls through to UNKNOWN_BRIEF —
 * intentionally honest about the limits of keyword routing rather than
 * silently masquerading as the demo skincare brief.
 */
export async function parseBrief(input: {
  briefText: string;
  productUrl: string | null;
}): Promise<ParsedBrief> {
  await sleep(PARSE_LATENCY_MS);
  const haystack = `${input.briefText} ${input.productUrl ?? ""}`.toLowerCase();

  if (matchesTabbit(haystack)) {
    return { ...TABBIT_BRIEF, rawBriefText: input.briefText };
  }
  if (matchesDemo(haystack)) {
    return { ...DEMO_BRIEF, rawBriefText: input.briefText };
  }
  return { ...UNKNOWN_BRIEF, rawBriefText: input.briefText };
}

function matchesTabbit(haystack: string): boolean {
  return (
    haystack.includes("tabbit") ||
    haystack.includes("ai 浏览器") ||
    haystack.includes("ai浏览器") ||
    haystack.includes("ai browser") ||
    (haystack.includes("personal productivity") && haystack.includes("notion"))
  );
}

function matchesDemo(haystack: string): boolean {
  return (
    haystack.includes("cerave") ||
    haystack.includes("laroche") ||
    haystack.includes("cetaphil") ||
    haystack.includes("敏感肌") ||
    haystack.includes("神经酰胺")
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
