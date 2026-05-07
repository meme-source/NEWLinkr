// §3.4.3 / §3.5.4 / §3.6.2: single source of truth for the variable tokens
// the inbox composer, the template editor, and the mailbar defaults form all
// share. Tokens are grouped by *who* is responsible for filling them in:
//
// - account: the user fills these once in 收件箱 顶部的邮箱设置（mailbar）
// - project: derived from the active project; the user maintains them in the
//   project setup, not in the mailbar
// - creator: derived from the selected thread / creator; never user-entered
//
// Tokens use the literal `{name}` form (single curly), matching the `{...}`
// patterns already living in templates.ts; the `{{name}}` form previously seen
// in the inbox editor's signature has been folded into the same shape.

export type TemplateVarScope = "account" | "project" | "creator";

export interface TemplateVar {
  /** Bare name, e.g. "creator_name" */
  name: string;
  /** Token as it appears inside template / email body, e.g. "{creator_name}" */
  token: string;
  /** Chinese label shown in dropdowns and the defaults form */
  label: string;
  /** Who fills this token */
  scope: TemplateVarScope;
  /** Optional helper text rendered next to the input in the mailbar form */
  hint?: string;
}

export const TEMPLATE_VAR_LIST: ReadonlyArray<TemplateVar> = [
  // account-level — set once in the mailbar
  {
    name: "my_name",
    token: "{my_name}",
    label: "我的姓名",
    scope: "account",
    hint: "签名 / 邮件中称呼自己的名字",
  },
  {
    name: "my_role",
    token: "{my_role}",
    label: "我的职位",
    scope: "account",
    hint: "例：Brand Partnerships",
  },
  {
    name: "brand_name",
    token: "{brand_name}",
    label: "品牌名",
    scope: "account",
    hint: "邮件中提到的品牌方名称",
  },
  {
    name: "brand_url",
    token: "{brand_url}",
    label: "品牌官网",
    scope: "account",
    hint: "可选，会作为链接插入",
  },

  // project-level — set inside the active project
  {
    name: "project_name",
    token: "{project_name}",
    label: "项目名",
    scope: "project",
  },
  {
    name: "product_name",
    token: "{product_name}",
    label: "产品名",
    scope: "project",
  },
  {
    name: "product_link",
    token: "{product_link}",
    label: "产品链接",
    scope: "project",
  },

  // creator-level — derived from the selected thread / creator
  {
    name: "creator_name",
    token: "{creator_name}",
    label: "博主名",
    scope: "creator",
  },
  {
    name: "creator_handle",
    token: "{creator_handle}",
    label: "博主账号",
    scope: "creator",
  },
  {
    name: "platform",
    token: "{platform}",
    label: "平台",
    scope: "creator",
  },
];

const byScope = (scope: TemplateVarScope) => TEMPLATE_VAR_LIST.filter((v) => v.scope === scope);

export const ACCOUNT_VARS: ReadonlyArray<TemplateVar> = byScope("account");
export const PROJECT_VARS: ReadonlyArray<TemplateVar> = byScope("project");
export const CREATOR_VARS: ReadonlyArray<TemplateVar> = byScope("creator");

/** Tokens enumerated for the inbox / template editor "插入变量" dropdown. */
export const TEMPLATE_VAR_TOKENS: ReadonlyArray<string> = TEMPLATE_VAR_LIST.map((v) => v.token);

/** Account-level keys shape, used by the mailbar form state. */
export type AccountVarKey = "my_name" | "my_role" | "brand_name" | "brand_url" | "signature";

export interface AccountVarValues {
  my_name: string;
  my_role: string;
  brand_name: string;
  brand_url: string;
  signature: string;
}

export const DEFAULT_ACCOUNT_VARS: AccountVarValues = {
  my_name: "Sarah Chen",
  my_role: "Brand Partnerships",
  brand_name: "MyBrand",
  brand_url: "www.mybrand.com",
  signature: "Sarah Chen\nBrand Partnerships | MyBrand\nwww.mybrand.com",
};
