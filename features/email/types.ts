// Shared email domain types — used by BOTH the Web outreach surface and the
// browser-plugin composer. Sender accounts and email templates are the same
// concept on both surfaces; this module is the single shape they agree on.

export type EmailAccountProvider = "Gmail" | "Outlook" | "其他";

/** A bound sender account. Web 工作台「邮箱绑定」与插件「发送账号」共用。 */
export type EmailAccount = {
  id: string;
  /** The email address used as the From: header. */
  address: string;
  /** Short display label, e.g. "工作邮箱". */
  label: string;
  provider: EmailAccountProvider;
  connected: boolean;
};

/** One rendered span of an email body/subject. `personalized` marks per-creator content. */
export type EmailTemplateSegment = { text: string; personalized?: boolean };

export type EmailTemplateGroup = "系统模板" | "我的模板";

/** A selectable email template, normalized so any surface can list + render it. */
export type EmailTemplateOption = {
  id: string;
  name: string;
  group: EmailTemplateGroup;
  /** Raw subject with `{token}` placeholders. */
  subject: string;
  /** Raw body with `{token}` placeholders. */
  body: string;
  /** Short descriptor shown under the picker. */
  summary: string;
};

/** Resolved value for one `{token}`, plus whether it should render as personalized. */
export type TemplateVarValue = { value: string; personalized: boolean };

/** Map of bare token name (e.g. "creator_name") → resolved value. */
export type TemplateVarMap = Record<string, TemplateVarValue>;
