import type { RegionTierKey } from "../types";

export const REGION_TIER_OPTIONS: Array<{ key: RegionTierKey; label: string }> = [
  { key: "developed", label: "发达地区" },
  { key: "developing", label: "发展中地区" },
  { key: "underdeveloped", label: "欠发达地区" },
];

export const COUNTRY_OPTIONS: Array<{
  name: string;
  flag: string;
  tier: RegionTierKey;
}> = [
  { name: "美国", flag: "🇺🇸", tier: "developed" },
  { name: "加拿大", flag: "🇨🇦", tier: "developed" },
  { name: "英国", flag: "🇬🇧", tier: "developed" },
  { name: "德国", flag: "🇩🇪", tier: "developed" },
  { name: "日本", flag: "🇯🇵", tier: "developed" },
  { name: "澳大利亚", flag: "🇦🇺", tier: "developed" },
  { name: "中国", flag: "🇨🇳", tier: "developing" },
  { name: "巴西", flag: "🇧🇷", tier: "developing" },
  { name: "印尼", flag: "🇮🇩", tier: "developing" },
  { name: "菲律宾", flag: "🇵🇭", tier: "developing" },
  { name: "墨西哥", flag: "🇲🇽", tier: "developing" },
  { name: "印度", flag: "🇮🇳", tier: "developing" },
  { name: "孟加拉国", flag: "🇧🇩", tier: "underdeveloped" },
  { name: "尼泊尔", flag: "🇳🇵", tier: "underdeveloped" },
];

export const LOCALE_REGION_TO_COUNTRY: Record<string, string> = {
  US: "美国",
  CA: "加拿大",
  GB: "英国",
  DE: "德国",
  JP: "日本",
  AU: "澳大利亚",
  CN: "中国",
  BR: "巴西",
  ID: "印尼",
  PH: "菲律宾",
  MX: "墨西哥",
  IN: "印度",
  BD: "孟加拉国",
  NP: "尼泊尔",
};

export const CURRENCY_OPTIONS = ["USD", "EUR", "GBP", "JPY", "CNY"] as const;

export const CURRENCY_SYMBOLS: Record<(typeof CURRENCY_OPTIONS)[number], string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
};

export const REGION_TIER_BASE_CPM_USD: Record<RegionTierKey, number> = {
  developed: 16,
  developing: 10,
  underdeveloped: 6,
};

export const COUNTRY_CPM_OVERRIDE_USD: Partial<Record<string, number>> = {
  美国: 18,
  加拿大: 15,
  英国: 16,
  德国: 15,
  日本: 14,
  澳大利亚: 15,
  中国: 10,
  巴西: 9,
  印尼: 8,
  菲律宾: 8,
  墨西哥: 9,
  印度: 8,
  孟加拉国: 6,
  尼泊尔: 6,
};

export const FLAG_TO_DISCOVERY_COUNTRY: Record<string, string> = {
  "🇺🇸": "美国",
  "🇨🇦": "加拿大",
  "🇬🇧": "英国",
  "🇩🇪": "德国",
  "🇯🇵": "日本",
  "🇵🇭": "菲律宾",
  "🇮🇩": "印尼",
  "🇧🇷": "巴西",
};

export const COUNTRY_TO_FLAG: Record<string, string> = {
  美国: "🇺🇸",
  加拿大: "🇨🇦",
  英国: "🇬🇧",
  德国: "🇩🇪",
  日本: "🇯🇵",
  澳大利亚: "🇦🇺",
  中国: "🇨🇳",
  菲律宾: "🇵🇭",
  印尼: "🇮🇩",
  巴西: "🇧🇷",
  墨西哥: "🇲🇽",
  印度: "🇮🇳",
  孟加拉国: "🇧🇩",
  尼泊尔: "🇳🇵",
};
