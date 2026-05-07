// Smart URL extraction for the product input — splits a free-form string into
// an optional URL chip and a residual note. Mirrors the rules in the v2 mock
// (3.4 「智能拆 URL」).

const URL_REGEX = /(https?:\/\/[^\s]+|(?:www\.)?[a-z0-9][\w-]*\.[a-z]{2,}(?:\/[^\s]*)?)/i;

export interface ExtractedUrl {
  url: string;
  rest: string;
}

export function extractUrl(text: string): ExtractedUrl | null {
  const m = text.match(URL_REGEX);
  if (!m || m.index === undefined) return null;
  const url = m[0];
  // Bare domains must include a path — avoids "我用过 cerave.com 还行" false
  // positives where the user mentions a brand mid-sentence.
  if (!/^https?:\/\//i.test(url) && !/\//.test(url)) return null;
  const before = text.slice(0, m.index);
  const after = text.slice(m.index + url.length);
  const rest = (before + " " + after).trim().replace(/\s+/g, " ");
  return { url, rest };
}

/** Strip the protocol + www prefix for display inside the chip. */
export function normalizeChipUrl(rawUrl: string): string {
  return rawUrl.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
}

/** Mock metadata fetch — backend will replace this with a real og:title call. */
export function mockProductTitle(url: string): string {
  const u = url.toLowerCase();
  if (u.includes("cerave")) return "敏感肌修复面霜";
  if (u.includes("larocheposay") || u.includes("laroche")) return "舒缓修护精华";
  if (u.includes("amazon")) return "亚马逊商品";
  if (u.includes("shopify") || u.includes("shop")) return "电商商品";
  return "已识别产品";
}
