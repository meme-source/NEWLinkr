"use client";

import { cn } from "@/lib/utils";

// 项目抽屉里共用的小型表单零件 —— 仅服务于「营销方案」Tab 里仍可编辑的字段
// （产品信息 + 项目头部）。目标市场 / 投放平台 / 目标受众 / 核心卖点已改为
// 「博主发现」自动回填的只读展示，不再需要多选 chip。

export const CATEGORY_OPTIONS = [
  "美妆护肤",
  "彩妆",
  "服装穿搭",
  "运动健身",
  "食品饮料",
  "家居生活",
  "数码 3C",
  "母婴亲子",
  "宠物生活",
  "其他",
] as const;

export const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "CNY", label: "CNY" },
] as const;

export function FieldLabel({
  label,
  required = false,
  hint,
}: {
  label: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="mb-1.5 block text-xs font-medium text-[#36342e]">
      {label}
      {required ? <span className="ml-1 text-[#ff4f00]">*</span> : null}
      {hint ? <span className="ml-1 text-[#939084]">{hint}</span> : null}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: React.HTMLInputTypeAttribute;
  error?: string;
}) {
  return (
    <>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-lg border bg-[#fffefb] px-3.5 py-2.5 text-sm text-[#201515] placeholder:text-[#b5b2aa] focus:outline-none",
          error ? "border-[#ff4f00]/45" : "border-[#c5c0b1] focus:border-[#ff4f00]/35",
        )}
      />
      {error ? <p className="mt-1.5 text-[11px] text-[#ff4f00]">{error}</p> : null}
    </>
  );
}
