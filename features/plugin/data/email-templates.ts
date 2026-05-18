// 插件邮件模板 —— 现在统一从共享层 features/email 取数据，与 Web 工作台
// 「邮件模板」同源。模板内容、增删改由 outreach 维护，这里只做选择 + 渲染。
export {
  EMAIL_TEMPLATE_OPTIONS as emailTemplates,
  DEFAULT_EMAIL_TEMPLATE_ID,
  findEmailTemplate,
} from "@/features/email/data/templates";
