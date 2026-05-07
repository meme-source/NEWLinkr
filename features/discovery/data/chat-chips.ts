import type { CountryCode, FollowerBucket, ViewsStep } from "../chat-types";
import type { PlatformId } from "../types";

export const PLATFORM_OPTIONS: { id: PlatformId; label: string; available: boolean }[] = [
  { id: "tiktok", label: "TikTok", available: true },
  { id: "instagram", label: "Instagram", available: false },
  { id: "youtube", label: "YouTube", available: false },
];

export const COUNTRY_OPTIONS: { id: CountryCode; label: string; flag: string }[] = [
  { id: "global", label: "全球", flag: "🌐" },
  { id: "us", label: "美国", flag: "🇺🇸" },
  { id: "gb", label: "英国", flag: "🇬🇧" },
  { id: "ca", label: "加拿大", flag: "🇨🇦" },
  { id: "au", label: "澳洲", flag: "🇦🇺" },
  { id: "sea", label: "东南亚", flag: "🌏" },
  { id: "me", label: "中东", flag: "🕌" },
  { id: "any", label: "不限", flag: "·" },
];

export const LANGUAGE_OPTIONS: string[] = [
  "any",
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

export const FOLLOWER_OPTIONS: {
  id: FollowerBucket;
  label: string;
  range?: string;
}[] = [
  { id: "any", label: "不限" },
  { id: "nano", label: "Nano", range: "1K–10K" },
  { id: "micro", label: "Micro", range: "10K–100K" },
  { id: "mid", label: "Mid", range: "100K–500K" },
  { id: "macro", label: "Macro", range: "500K–1M" },
  { id: "mega", label: "Mega", range: "1M+" },
];

// Slider stops shown to the user. Index 0 = 不限.
export const VIEWS_STEPS: { step: ViewsStep; label: string; short: string }[] = [
  { step: 0, label: "不限", short: "不限" },
  { step: 1, label: "≥ 1 千", short: "1K+" },
  { step: 2, label: "≥ 1 万", short: "10K+" },
  { step: 3, label: "≥ 5 万", short: "50K+" },
  { step: 4, label: "≥ 10 万", short: "100K+" },
  { step: 5, label: "≥ 50 万", short: "500K+" },
  { step: 6, label: "≥ 100 万", short: "1M+" },
];

export const PLATFORM_LABEL: Record<PlatformId, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
};

export const COUNTRY_LABEL: Record<CountryCode, string> = {
  global: "全球",
  us: "美国",
  gb: "英国",
  ca: "加拿大",
  au: "澳洲",
  sea: "东南亚",
  me: "中东",
  any: "不限",
};

export const FOLLOWER_LABEL: Record<FollowerBucket, string> = {
  any: "不限",
  nano: "Nano · 1K–10K",
  micro: "Micro · 10K–100K",
  mid: "Mid · 100K–500K",
  macro: "Macro · 500K–1M",
  mega: "Mega · 1M+",
};

export function viewsLabel(step: ViewsStep): string {
  const found = VIEWS_STEPS.find((v) => v.step === step);
  return found?.short ?? "不限";
}

export function geoLabel(country: CountryCode, language: string): string {
  const c = COUNTRY_OPTIONS.find((x) => x.id === country)?.label ?? "全球";
  const l = language === "any" ? "任意语言" : language;
  return `${c} · ${l}`;
}
