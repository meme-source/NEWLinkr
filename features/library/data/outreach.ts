// 博主库批量建联弹窗的发件账户 + 邮件模板预设。
//
// Mock 阶段：发件账户和模板都来自硬编码列表。Phase 1+ 接通真实后端时：
//   - sender accounts 从 settings/integrations 读
//   - templates 从用户自建 + 系统模板表读
// 模板 key 与 features/plugin/data/email-templates.ts 保持一致，方便日后聚合。

export interface SenderAccount {
  id: string;
  label: string;
  address: string;
}

export const MOCK_SENDER_ACCOUNTS: SenderAccount[] = [
  { id: "primary", label: "工作邮箱", address: "team@2linkr.io" },
  { id: "growth", label: "增长邮箱", address: "growth@2linkr.io" },
];

export interface OutreachTemplate {
  key: string;
  label: string;
  category: string;
  summary: string;
  subject: string;
  body: string;
}

// 正文里 {{handle}} / {{name}} / {{platform}} 等占位符在发送时由后端替换。
// 这里只做纯文本预设；后端接通前批量发送会按选中博主轮替占位符。
export const OUTREACH_TEMPLATES: OutreachTemplate[] = [
  {
    key: "intro",
    label: "初次建联",
    category: "自建模板",
    summary: "适合首次触达，介绍品牌与合作切入点。",
    subject: "Hi {{handle}}，关于一次合作的想法",
    body: [
      "Hi {{handle}}，",
      "",
      "我是 2Linkr 的合作伙伴，最近一直在跟进 {{platform}} 上的优质创作者，看到你近期的内容很有共鸣。",
      "",
      "我们正在筹备一个面向你这类受众的合作计划，预算与节奏都比较灵活。如果你有兴趣聊一下，我可以把更具体的资料发给你。",
      "",
      "期待回复。",
      "team@2linkr.io",
    ].join("\n"),
  },
  {
    key: "followup",
    label: "二次催促",
    category: "自建模板",
    summary: "已触达但未回复，提醒上次沟通并给出下一步。",
    subject: "再次打扰一下，{{handle}}",
    body: [
      "Hi {{handle}}，",
      "",
      "上周给你发过一封关于合作的邮件，担心被淹没所以再轻提一次。",
      "",
      "如果时机不合适我完全理解；如果还感兴趣，我们这边随时可以再聊。",
      "",
      "祝好，",
      "team@2linkr.io",
    ].join("\n"),
  },
  {
    key: "gifted",
    label: "寄样邀约",
    category: "自建模板",
    summary: "先寄样再确认合作，给到具体试用理由。",
    subject: "想给你寄一份样品，{{handle}}",
    body: [
      "Hi {{handle}}，",
      "",
      "看了你最近在 {{platform}} 上的几条内容，觉得我们的产品和你的风格挺匹配，想先寄一份样品给你试用。",
      "",
      "无需任何承诺；如果你觉得合适，再聊后续合作的形式与节奏。需要的话回复我一个收货地址即可。",
      "",
      "期待。",
      "team@2linkr.io",
    ].join("\n"),
  },
];

export const VARIABLE_TOKENS: { token: string; label: string }[] = [
  { token: "{{handle}}", label: "博主 ID" },
  { token: "{{name}}", label: "博主姓名" },
  { token: "{{platform}}", label: "平台" },
];
