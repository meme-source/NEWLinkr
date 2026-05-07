import type { CountryCode, FollowerBucket, ViewsStep } from "../chat-types";
import type { PlatformId } from "../types";

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

export function viewsLabel(step: ViewsStep): string {
  const found = VIEWS_STEPS.find((v) => v.step === step);
  return found?.short ?? "不限";
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
