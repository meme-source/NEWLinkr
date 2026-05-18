import type { CountryCode, FollowerBucket, NumRange } from "../chat-types";
import type { PlatformId } from "../types";

// Default starting range applied to both 粉丝量 and 均播 — gates out the long
// tail of <1K creators that almost never represent serious collab candidates.
// Users can dial either side down to null ("不限") manually.
export const DEFAULT_RANGE: NumRange = { min: 1_000, max: null };

export const PLATFORM_OPTIONS: { id: PlatformId; label: string; available: boolean }[] = [
  { id: "tiktok", label: "TikTok", available: true },
  { id: "instagram", label: "Instagram", available: false },
  { id: "youtube", label: "YouTube", available: false },
];

export const COUNTRY_OPTIONS: { id: CountryCode; label: string; flag: string }[] = [
  { id: "us", label: "美国", flag: "🇺🇸" },
  { id: "gb", label: "英国", flag: "🇬🇧" },
  { id: "ca", label: "加拿大", flag: "🇨🇦" },
  { id: "au", label: "澳洲", flag: "🇦🇺" },
  { id: "sea", label: "东南亚", flag: "🌏" },
  { id: "me", label: "中东", flag: "🕌" },
];

export const LANGUAGE_OPTIONS: string[] = [
  "英语",
  "中文（简体）",
  "中文（繁体）",
  "日语",
  "韩语",
  "西班牙语",
  "葡萄牙语",
  "法语",
  "德语",
  "意大利语",
  "印地语",
  "印尼语",
  "泰语",
  "越南语",
  "阿拉伯语",
  "土耳其语",
];

export const PLATFORM_LABEL: Record<PlatformId, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
};

export const COUNTRY_LABEL: Record<CountryCode, string> = {
  us: "美国",
  gb: "英国",
  ca: "加拿大",
  au: "澳洲",
  sea: "东南亚",
  me: "中东",
};

export const FOLLOWER_LABEL: Record<FollowerBucket, string> = {
  any: "不限",
  nano: "Nano · 1K–10K",
  micro: "Micro · 10K–100K",
  mid: "Mid · 100K–500K",
  macro: "Macro · 500K–1M",
  mega: "Mega · 1M+",
};

// Compact human-readable number formatter for chip summaries and input
// placeholders. Drops the trailing `.0` so 1000 → "1K" not "1.0K".
export function formatNum(n: number): string {
  if (n >= 10_000) return `${trimZero(n / 10_000)}万`;
  if (n >= 1_000) return `${trimZero(n / 1_000)}K`;
  return String(n);
}

function trimZero(n: number): string {
  return n.toFixed(1).replace(/\.0$/, "");
}

export function isDefaultRange(range: NumRange): boolean {
  return range.min === DEFAULT_RANGE.min && range.max === DEFAULT_RANGE.max;
}

export function isUnboundedRange(range: NumRange): boolean {
  return range.min === null && range.max === null;
}

// chip 关闭态文案：min/max 全 null = 不限；仅 min = "≥X"；仅 max = "≤X"；都有 = "X–Y"。
export function summarizeRange(range: NumRange): string {
  if (isUnboundedRange(range)) return "不限";
  if (range.min !== null && range.max === null) return `≥${formatNum(range.min)}`;
  if (range.min === null && range.max !== null) return `≤${formatNum(range.max)}`;
  return `${formatNum(range.min!)}–${formatNum(range.max!)}`;
}

// chip 关闭态文案：≤2 列出、>2 折叠为「首项 +N」。
export function summarizeCountries(countries: CountryCode[]): string {
  if (countries.length === 0) return "全球";
  const labels = countries.map((id) => COUNTRY_LABEL[id]);
  if (labels.length <= 2) return labels.join(", ");
  return `${labels[0]} +${labels.length - 1}`;
}

export function summarizeLanguages(languages: string[]): string {
  if (languages.length === 0) return "任意语言";
  const labels = languages.map((l) => l.replace(/（[^）]+）/, ""));
  if (labels.length <= 2) return labels.join(", ");
  return `${labels[0]} +${labels.length - 1}`;
}

export function geoLabel(countries: CountryCode[], languages: string[]): string {
  return `${summarizeCountries(countries)} · ${summarizeLanguages(languages)}`;
}
