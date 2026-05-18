import type { EmailAccount } from "../types";

// 共享发件账号源 —— Web 工作台「邮箱绑定」(features/outreach mailbar) 与插件
// 「发送账号」(features/plugin email composer) 都从这里读。
//
// Phase 0 mock。接真实后端时只改这一处：账号改为从 settings / integrations
// 的绑定结果读取，两个 surface 的 UI 都不用动。
export const EMAIL_ACCOUNTS: EmailAccount[] = [
  {
    id: "primary",
    address: "marketing@mybrand.com",
    label: "工作邮箱",
    provider: "Gmail",
    connected: true,
  },
  {
    id: "growth",
    address: "growth@mybrand.com",
    label: "增长邮箱",
    provider: "Outlook",
    connected: true,
  },
];

/** Accounts that are actually bound — the only ones a composer should offer. */
export const CONNECTED_EMAIL_ACCOUNTS: EmailAccount[] = EMAIL_ACCOUNTS.filter(
  (account) => account.connected,
);

/** The account a fresh composer / mailbar should preselect. */
export const DEFAULT_EMAIL_ACCOUNT: EmailAccount = CONNECTED_EMAIL_ACCOUNTS[0] ?? EMAIL_ACCOUNTS[0];
