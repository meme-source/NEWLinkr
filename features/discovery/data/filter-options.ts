import type { DiscoveryFilters } from "../types";

export const FOLLOWER_STEPS: { label: string; value: string | null }[] = [
  { label: "不限", value: null },
  { label: "1万+", value: "1万+" },
  { label: "5万+", value: "5万+" },
  { label: "10万+", value: "10万+" },
  { label: "50万+", value: "50万+" },
  { label: "100万+", value: "100万+" },
  { label: "500万+", value: "500万+" },
];

export const VIEW_STEPS: { label: string; value: string | null }[] = [
  { label: "不限", value: null },
  { label: "1千+", value: "1千+" },
  { label: "1万+", value: "1万+" },
  { label: "5万+", value: "5万+" },
  { label: "10万+", value: "10万+" },
  { label: "100万+", value: "100万+" },
  { label: "1000万+", value: "1000万+" },
];

export const APPLICATION_CONDITIONS: { id: string; label: string; hint: string }[] = [
  { id: "gifting", label: "接受免费寄样", hint: "Gifting only" },
  { id: "paid", label: "接受付费合作", hint: "Paid placement" },
  { id: "affiliate", label: "可走折扣码 / 联盟", hint: "Affiliate / Code" },
  { id: "longterm", label: "接受长期合作", hint: "Long-term" },
  { id: "email", label: "公开商务邮箱", hint: "Has business email" },
];

export const CATEGORIES: { l1: string; l2: string[] }[] = [
  { l1: "美妆护肤", l2: ["护肤", "彩妆", "香水", "个护"] },
  { l1: "服装穿搭", l2: ["街头", "商务", "运动", "复古"] },
  { l1: "食品饮料", l2: ["健康食品", "零食", "咖啡茶饮", "调味品"] },
  { l1: "家居生活", l2: ["家具", "家电", "装饰", "收纳"] },
  { l1: "数码 3C", l2: ["手机配件", "智能家居", "耳机音响", "相机"] },
  { l1: "运动健身", l2: ["跑步", "瑜伽", "力量训练", "户外"] },
];

export const GOALS: { id: string; label: string }[] = [
  { id: "brand", label: "品牌曝光" },
  { id: "promo", label: "促销转化" },
  { id: "launch", label: "新品推广" },
  { id: "seeding", label: "口碑种草" },
];

export const EMPTY_DISCOVERY_FILTERS: DiscoveryFilters = {
  region: "all",
  language: "all",
  followers: "all",
  verified: "all",
  email: "all",
};
