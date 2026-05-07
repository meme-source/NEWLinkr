"use client";

import { useEffect, useRef } from "react";

interface DiscardModalProps {
  open: boolean;
  projectName: string;
  onCancel: () => void;
  onConfirm: () => void;
}

// §4 退出确认弹窗。
// 行为：
//   打开 → 焦点自动落在「取消」（破坏性默认 = 安全）
//   关闭（取消） → 点取消 / ESC / 点 backdrop 都视为取消
//   关闭（确定） → 必须显式点击「确定离开」红色按钮
//     · backdrop 与 ESC 故意不触发确认，避免误删
export function DiscardModal({ open, projectName, onCancel, onConfirm }: DiscardModalProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management + ESC handling. We never let ESC fire onConfirm — the
  // spec explicitly forbids it as accidental destruction.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    cancelButtonRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    };
    document.addEventListener("keydown", onKey);

    // Lock body scroll while modal is mounted.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] grid place-items-center"
      style={{ background: "rgba(32, 21, 21, 0.42)", backdropFilter: "blur(3px)" }}
      onClick={(event) => {
        // Only treat clicks on the overlay itself as cancel; clicks inside
        // the modal panel will be stopped by the inner handler below.
        if (event.target === event.currentTarget) onCancel();
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="discard-modal-title"
        aria-describedby="discard-modal-body"
        className="w-[420px] max-w-[calc(100vw-32px)] rounded-2xl bg-white px-6 pt-6 pb-5"
        style={{
          boxShadow: "0 24px 60px rgba(32, 21, 21, 0.25)",
          animation: "linkr-modal-pop 240ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <h3
          id="discard-modal-title"
          className="font-display text-[18px] font-semibold tracking-[-0.01em] text-[var(--foreground)]"
        >
          确定要离开吗？
        </h3>
        <p
          id="discard-modal-body"
          className="mt-2 text-[13.5px] leading-[1.55] text-[var(--dark-charcoal)]"
        >
          离开后，<strong className="font-semibold">这次搜索的对话和结果都不会被保存</strong>。 已{" "}
          <strong className="font-semibold">收藏</strong> 或加入{" "}
          <strong className="font-semibold">outreach</strong> 的博主已存到「{projectName}」里，
          不受影响。
        </p>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-[var(--dark-charcoal)] transition-colors hover:bg-[var(--background-alt)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none"
            style={{ background: "var(--primary)" }}
          >
            确定离开
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes linkr-modal-pop {
          from {
            opacity: 0;
            transform: scale(0.94) translateY(6px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
