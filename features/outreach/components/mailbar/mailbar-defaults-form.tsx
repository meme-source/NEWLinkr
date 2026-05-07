"use client";

import { type AccountVarValues } from "@/features/outreach/data/template-vars";

interface MailbarDefaultsFormProps {
  values: AccountVarValues;
  onChange: <K extends keyof AccountVarValues>(key: K, value: AccountVarValues[K]) => void;
}

// §3.6.2 (refactor): 邮箱设置展开态里的「默认变量 / 发件人信息」表单。
// 只列账号级变量；项目级 / 博主级变量在邮件编辑时自动注入，不在此表单展示。
export function MailbarDefaultsForm({ values, onChange }: MailbarDefaultsFormProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label="发件人姓名" required hint="博主收到邮件时看到的名字，会替换 {my_name}">
          <input
            value={values.my_name}
            onChange={(e) => onChange("my_name", e.target.value)}
            className="w-full rounded-lg border border-[#c5c0b1] bg-[#fffdf9] px-3 py-2 text-sm text-[#201515] focus:border-[#ff4f00]/40 focus:outline-none"
          />
        </Field>
        <Field label="职位 / 团队" hint="例：Brand Partnerships，会替换 {my_role}">
          <input
            value={values.my_role}
            onChange={(e) => onChange("my_role", e.target.value)}
            className="w-full rounded-lg border border-[#c5c0b1] bg-[#fffdf9] px-3 py-2 text-sm text-[#201515] focus:border-[#ff4f00]/40 focus:outline-none"
          />
        </Field>
        <Field label="品牌名" required hint="模板中 {brand_name} 的来源">
          <input
            value={values.brand_name}
            onChange={(e) => onChange("brand_name", e.target.value)}
            className="w-full rounded-lg border border-[#c5c0b1] bg-[#fffdf9] px-3 py-2 text-sm text-[#201515] focus:border-[#ff4f00]/40 focus:outline-none"
          />
        </Field>
        <Field label="品牌官网" hint="可选，会替换 {brand_url}">
          <input
            value={values.brand_url}
            onChange={(e) => onChange("brand_url", e.target.value)}
            className="w-full rounded-lg border border-[#c5c0b1] bg-[#fffdf9] px-3 py-2 text-sm text-[#201515] focus:border-[#ff4f00]/40 focus:outline-none"
          />
        </Field>
      </div>

      <Field label="邮件签名" hint="纯文本，支持换行；插入签名时使用">
        <textarea
          value={values.signature}
          onChange={(e) => onChange("signature", e.target.value)}
          rows={3}
          className="w-full resize-none rounded-lg border border-[#c5c0b1] bg-[#fffdf9] px-3 py-2 text-sm text-[#201515] focus:border-[#ff4f00]/40 focus:outline-none"
        />
      </Field>
    </div>
  );
}

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

function Field({ label, required, hint, children }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1 text-[11px] font-medium text-[#36342e]">
        {label}
        {required ? <span className="text-red-500">*</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-[10px] text-[#939084]">{hint}</span> : null}
    </label>
  );
}
