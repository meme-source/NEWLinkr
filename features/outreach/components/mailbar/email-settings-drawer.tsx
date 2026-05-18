"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MailbarAccountRow } from "@/features/outreach/components/mailbar/mailbar-account-row";
import { MailbarDefaultsForm } from "@/features/outreach/components/mailbar/mailbar-defaults-form";
import type { MailSettingsState } from "@/features/outreach/components/mailbar/use-mail-settings";

const DRAWER_WIDTH = 520;

interface EmailSettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  settings: MailSettingsState;
}

// 右侧 520px 抽屉。复用 MailbarAccountRow + MailbarDefaultsForm。
// 与 features/creator/components/drawer/drawer-shell 的视觉/动效约定保持一致：
// rgba 背板 + framer-motion spring，Esc 关闭，body 滚动锁。
export function EmailSettingsDrawer({ open, onClose, settings }: EmailSettingsDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const { account, accountVars, setAccountConnected, updateAccountVar } = settings;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(32,21,21,0.35)" }}
            onClick={onClose}
          />
          <motion.aside
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 280 }}
            role="dialog"
            aria-modal="true"
            aria-label="邮箱设置"
            className="fixed top-0 right-0 bottom-0 z-50 flex flex-col bg-[#fffefb]"
            style={{
              width: DRAWER_WIDTH,
              borderLeft: "1px solid #c5c0b1",
              boxShadow: "-30px 0 80px -40px rgba(32,21,21,0.35)",
            }}
          >
            <header className="flex items-center justify-between border-b border-[#c5c0b1] px-5 py-4">
              <div>
                <h3 className="text-[15px] font-semibold tracking-tight text-[#201515]">
                  邮箱设置
                </h3>
                <p className="mt-0.5 text-[11px] text-[#939084]">账号、发件人变量、签名</p>
              </div>
              <Button
                unstyled
                type="button"
                onClick={onClose}
                aria-label="关闭"
                className="flex h-8 w-8 items-center justify-center rounded-md text-[#939084] transition-colors hover:bg-[#eceae3] hover:text-[#36342e]"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </Button>
            </header>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
              <Section title="账号绑定">
                <MailbarAccountRow
                  account={account}
                  onConnect={() => setAccountConnected(true)}
                  onDisconnect={() => setAccountConnected(false)}
                />
              </Section>
              <Section title="发件人信息 / 默认变量">
                <MailbarDefaultsForm values={accountVars} onChange={updateAccountVar} />
              </Section>
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-[#c5c0b1] bg-[#fffefb] px-5 py-3.5">
              <Button
                unstyled
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[#c5c0b1] bg-[#fffefb] px-4 py-2 text-[13px] font-medium text-[#36342e] transition-colors hover:bg-[#eceae3]"
              >
                取消
              </Button>
              <Button
                unstyled
                type="button"
                onClick={onClose}
                className="rounded-md bg-[#ff4f00] px-4 py-2 text-[13px] font-semibold text-[#fffefb] transition-colors hover:bg-[#e64600]"
              >
                保存设置
              </Button>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="mb-2.5 text-[11px] font-semibold tracking-wider text-[#939084] uppercase">
        {title}
      </p>
      {children}
    </section>
  );
}
