import type { Template } from "@/features/outreach/data/outreach-types";
import { INIT_MY_TEMPLATES, TEMPLATES } from "@/features/outreach/data/templates";
import type { EmailTemplateGroup, EmailTemplateOption } from "../types";

// 共享邮件模板源 —— Web 工作台「邮件模板」与插件「邮件模板」下拉共用同一份。
//
// 当前上游 mock 仍是 features/outreach/data/templates.ts（模板编辑 UI 归 outreach
// 维护）。这一层把系统模板 + 我的模板归一化成 EmailTemplateOption，让任何 surface
// 都能直接列出并渲染。接真实后端时，把这里换成 fetch 即可，下游 surface 不用动。

function toOption(template: Template, group: EmailTemplateGroup): EmailTemplateOption {
  const prefix = group === "系统模板" ? "sys" : "mine";
  return {
    id: `${prefix}-${template.id}`,
    name: template.name,
    group,
    subject: template.subject,
    body: template.body,
    summary: template.scenes.join(" · "),
  };
}

export const EMAIL_TEMPLATE_OPTIONS: EmailTemplateOption[] = [
  ...TEMPLATES.map((template) => toOption(template, "系统模板")),
  ...INIT_MY_TEMPLATES.map((template) => toOption(template, "我的模板")),
];

/** The template a fresh composer should preselect. */
export const DEFAULT_EMAIL_TEMPLATE_ID: string = EMAIL_TEMPLATE_OPTIONS[0]?.id ?? "";

export function findEmailTemplate(id: string): EmailTemplateOption | null {
  if (!id) return null;
  return EMAIL_TEMPLATE_OPTIONS.find((option) => option.id === id) ?? null;
}
