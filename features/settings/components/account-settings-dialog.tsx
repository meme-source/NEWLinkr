"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AccountFooter,
  AccountSections,
  useAccountForm,
} from "@/features/settings/components/account-tab";

// 头像菜单的"账户设置"以浮层呈现，避免离开当前工作区上下文。
// 形态参考 features/workspace-shell/components/feedback-dialog.tsx，
// 圆角依据 docs/DESIGN.md §5：弹窗壳 8px（Featured），内部容器 5px（Content）。
//
// 滚动隔离：
// - 必须 portal 到 <body>，否则 <WorkspaceSidebar> 的 onWheelCapture 会在
//   弹窗内部的 wheel 事件冒泡之前把它们重定向到 <main>，导致背景跟着滚。
// - 中间区域用 overscroll-contain，阻止滚到边界时的 chain 到祖先滚动容器。
// - backdrop 上拦截 wheel/touchmove，避免用户在弹窗外的暗色区域滚动到背景。
interface Props {
  onClose: () => void;
}

export function AccountSettingsDialog({ onClose }: Props) {
  const form = useAccountForm();
  const backdropRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // ESC 关闭。
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // 阻止 backdrop 上的滚轮 / 触屏滑动传到底层 <main>。
  // overscroll-contain 只能管住弹窗内部到达边界后的链式滚动，
  // 在 backdrop 黑色蒙层上滑动需要单独的 listener，且必须是非 passive。
  useEffect(() => {
    const backdrop = backdropRef.current;
    if (!backdrop) return;

    const inDialog = (target: EventTarget | null) =>
      target instanceof Node && dialogRef.current?.contains(target);

    const block = (event: Event) => {
      if (inDialog(event.target)) return;
      event.preventDefault();
    };

    backdrop.addEventListener("wheel", block, { passive: false });
    backdrop.addEventListener("touchmove", block, { passive: false });
    return () => {
      backdrop.removeEventListener("wheel", block);
      backdrop.removeEventListener("touchmove", block);
    };
  }, []);

  // 弹窗只在用户点击头像菜单后才挂载，渲染时一定在浏览器端；
  // 仍做一次 typeof 检查防止打包阶段意外 SSR 进入此分支。
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#201515]/40 px-4 py-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="relative flex max-h-[88vh] w-full max-w-[680px] flex-col overflow-hidden rounded-lg border border-[#c5c0b1] bg-[#fffefb] shadow-[0_24px_60px_-30px_rgba(32,21,21,0.35)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-settings-dialog-title"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-[#eceae3] px-5 py-3.5">
          <h2 id="account-settings-dialog-title" className="text-sm font-semibold text-[#201515]">
            账户设置
          </h2>
          <Button
            unstyled
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#939084] transition-colors hover:bg-[#eceae3] hover:text-[#201515]"
          >
            <X className="h-4 w-4" />
          </Button>
        </header>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          <AccountSections form={form} />
        </div>
        <AccountFooter form={form} variant="flat" onCancel={onClose} />
      </div>
    </div>,
    document.body,
  );
}
