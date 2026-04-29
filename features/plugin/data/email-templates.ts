import type { EmailTemplateMeta } from "../types";

export const emailTemplates: EmailTemplateMeta[] = [
  {
    key: "intro",
    label: "初次建联",
    category: "自建模板",
    summary: "适合首次触达，AI 会补入姓名、内容亮点和合作切入点。",
  },
  {
    key: "followup",
    label: "二次催促",
    category: "自建模板",
    summary: "适合已触达但未回复对象，突出上次沟通与下一步动作。",
  },
  {
    key: "gifted",
    label: "寄样邀约",
    category: "自建模板",
    summary: "适合先寄样再确认合作，AI 会生成更具体的试用理由。",
  },
];
