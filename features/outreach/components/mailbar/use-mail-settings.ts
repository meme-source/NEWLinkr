"use client";

import { useCallback, useMemo, useState } from "react";

import {
  type AccountVarValues,
  DEFAULT_ACCOUNT_VARS,
} from "@/features/outreach/data/template-vars";
import { DEFAULT_EMAIL_ACCOUNT } from "@/features/email/data/accounts";

// §3.6.2 (refactor): inbox 顶部"邮箱设置"栏的状态。绑定信息 + 账号级变量都在这里。
// Phase 0 还没接后端，所以默认值来自 DEFAULT_ACCOUNT_VARS；切到真实后端时把
// initialAccountVars 替换为来自 service / SWR 的值即可，UI 不用改。

export interface MailAccount {
  email: string;
  provider: "Gmail" | "Outlook" | "其他";
  connected: boolean;
}

interface UseMailSettingsArgs {
  initialAccount?: MailAccount;
  initialAccountVars?: AccountVarValues;
}

export interface MailSettingsState {
  account: MailAccount;
  accountVars: AccountVarValues;
  /** True when at least one of my_name / brand_name is empty. */
  hasMissingDefaults: boolean;
  setAccountConnected: (connected: boolean) => void;
  updateAccountVar: <K extends keyof AccountVarValues>(key: K, value: AccountVarValues[K]) => void;
  resetAccountVars: () => void;
}

// 默认绑定账号来自共享层 features/email —— 与插件「发送账号」同源。
const DEFAULT_ACCOUNT: MailAccount = {
  email: DEFAULT_EMAIL_ACCOUNT.address,
  provider: DEFAULT_EMAIL_ACCOUNT.provider,
  connected: DEFAULT_EMAIL_ACCOUNT.connected,
};

export function useMailSettings(args: UseMailSettingsArgs = {}): MailSettingsState {
  const [account, setAccount] = useState<MailAccount>(args.initialAccount ?? DEFAULT_ACCOUNT);
  const [accountVars, setAccountVars] = useState<AccountVarValues>(
    args.initialAccountVars ?? DEFAULT_ACCOUNT_VARS,
  );

  const setAccountConnected = useCallback((connected: boolean) => {
    setAccount((prev) => ({ ...prev, connected }));
  }, []);

  const updateAccountVar = useCallback(
    <K extends keyof AccountVarValues>(key: K, value: AccountVarValues[K]) => {
      setAccountVars((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const resetAccountVars = useCallback(() => {
    setAccountVars(DEFAULT_ACCOUNT_VARS);
  }, []);

  const hasMissingDefaults = useMemo(
    () => accountVars.my_name.trim() === "" || accountVars.brand_name.trim() === "",
    [accountVars.my_name, accountVars.brand_name],
  );

  return {
    account,
    accountVars,
    hasMissingDefaults,
    setAccountConnected,
    updateAccountVar,
    resetAccountVars,
  };
}
