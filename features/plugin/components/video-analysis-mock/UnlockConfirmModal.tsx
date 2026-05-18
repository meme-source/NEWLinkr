"use client";

import { motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface UnlockConfirmModalProps {
  open: boolean;
  /** 要解锁的功能 label，如「受众画像」。 */
  featureLabel: string | null;
  /** 这次解锁消耗多少 token（0.5 / 0.3 等）。 */
  cost: number;
  /** 当前剩余 token 数。 */
  remaining: number;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * UnlockConfirmModal — 小型居中弹窗。点击 paywall「消耗 0.5 次解锁」CTA 后弹出，
 * 二次确认是否扣 token。视觉跟 SinglePostAnalysisView 的 inline paywall 同源。
 */
export function UnlockConfirmModal({
  open,
  featureLabel,
  cost,
  remaining,
  onCancel,
  onConfirm,
}: UnlockConfirmModalProps) {
  if (!open || !featureLabel) return null;

  const remainingAfter = Math.max(0, remaining - cost);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <Button
        unstyled
        type="button"
        aria-label="取消"
        onClick={onCancel}
        className="absolute inset-0"
        style={{ background: "rgba(32, 21, 21, 0.32)" }}
      />
      <motion.div
        initial={{ opacity: 0, y: 6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-[360px] rounded-[8px] border bg-[#fffefb] shadow-[0_24px_60px_-30px_rgba(20,20,19,0.45)]"
        style={{ borderColor: "#c5c0b1" }}
      >
        <div className="flex items-start justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={14} strokeWidth={2.4} style={{ color: "#ff4f00" }} aria-hidden />
            <h2 className="text-[14px] font-semibold" style={{ color: "#201515" }}>
              解锁「{featureLabel}」
            </h2>
          </div>
          <Button
            unstyled
            type="button"
            onClick={onCancel}
            aria-label="关闭"
            className="flex h-6 w-6 items-center justify-center rounded-[5px] transition-colors hover:bg-[#eceae3]"
            style={{ color: "#939084" }}
          >
            <X size={12} strokeWidth={2.2} />
          </Button>
        </div>

        <div className="px-4 pb-3">
          <p className="text-[12.5px] leading-[1.55]" style={{ color: "#36342e" }}>
            此次操作消耗 <span className="font-semibold tabular-nums">{cost}</span> 次任务，
            解锁后本帖永久可见。
          </p>
          <div
            className="mt-2.5 rounded-[8px] px-3 py-2 text-[11.5px] leading-[1.6] tabular-nums"
            style={{ backgroundColor: "#fffdf9", border: "1px solid #eceae3", color: "#36342e" }}
          >
            <div className="flex items-center justify-between">
              <span style={{ color: "#939084" }}>本月剩余</span>
              <span style={{ color: "#201515" }}>{remaining} 次</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span style={{ color: "#939084" }}>解锁后剩</span>
              <span style={{ color: "#201515", fontWeight: 600 }}>{remainingAfter} 次</span>
            </div>
          </div>
        </div>

        <div
          className="flex items-center justify-end gap-2 border-t px-4 py-3"
          style={{ borderColor: "#eceae3" }}
        >
          <Button
            unstyled
            type="button"
            onClick={onCancel}
            className="rounded-[6px] px-3 py-1.5 text-[12.5px] font-medium transition-colors hover:bg-[#eceae3]"
            style={{ color: "#36342e" }}
          >
            取消
          </Button>
          <Button
            unstyled
            type="button"
            onClick={onConfirm}
            className="rounded-[6px] px-3.5 py-1.5 text-[12.5px] font-semibold text-[#fffefb] transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#ff4f00" }}
          >
            确认解锁
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
