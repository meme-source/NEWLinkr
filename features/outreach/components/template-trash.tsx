"use client";

import { useState } from "react";

import type { TrashItem } from "@/features/outreach/data/outreach-types";
import { cn } from "@/lib/utils";

export function SystemTemplateModal({
  templateName,
  onClose,
  onCopyEdit,
}: {
  templateName: string;
  onClose: () => void;
  onCopyEdit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-[400px] rounded-2xl border border-[#c5c0b1] bg-[#fffefb] p-6">
        <h3 className="font-semibold text-[#201515]">系统模板不可直接修改</h3>
        <p className="mt-2 text-sm leading-relaxed text-[#939084]">
          你可以复制一份到「我的模板」进行编辑，系统模板将始终保持原始不变。
        </p>
        <div className="mt-2 rounded-xl bg-[#fffdf9] px-3.5 py-2.5">
          <p className="text-xs text-[#36342e]">
            将基于 <span className="font-medium text-[#201515]">「{templateName}」</span> 创建副本
          </p>
        </div>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-[#c5c0b1] py-2.5 text-sm text-[#36342e] hover:bg-[#eceae3]"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onCopyEdit}
            className="flex-1 rounded-xl bg-[#ff4f00] py-2.5 text-sm font-medium text-[#fffefb] hover:bg-[#ff4f00]"
          >
            复制并编辑
          </button>
        </div>
      </div>
    </div>
  );
}

export function TrashView({
  trash,
  onRestore,
  onPermDelete,
  onClearAll,
  onBack,
}: {
  trash: TrashItem[];
  onRestore: (id: number) => void;
  onPermDelete: (id: number) => void;
  onClearAll: () => void;
  onBack: () => void;
}) {
  const [clearConfirm, setClearConfirm] = useState(false);
  const [permConfirmId, setPermConfirmId] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-[#939084] hover:text-[#ff4f00]"
        >
          ← 返回模板
        </button>
        <span className="text-[#c5c0b1]">|</span>
        <span className="text-sm font-semibold text-[#201515]">回收站</span>
        <span className="rounded-full bg-[#eceae3] px-2 py-0.5 text-[10px] text-[#939084]">
          {trash.length} 条
        </span>
        <div className="ml-auto">
          {clearConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#939084]">确认清空？</span>
              <button
                type="button"
                onClick={() => {
                  onClearAll();
                  setClearConfirm(false);
                }}
                className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-[#fffefb] hover:bg-red-600"
              >
                确认
              </button>
              <button
                type="button"
                onClick={() => setClearConfirm(false)}
                className="rounded-lg border border-[#c5c0b1] px-3 py-1.5 text-xs text-[#36342e] hover:bg-[#eceae3]"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setClearConfirm(true)}
              disabled={trash.length === 0}
              className="rounded-xl border border-red-200 px-3.5 py-2 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-30"
            >
              清空回收站
            </button>
          )}
        </div>
      </div>

      {trash.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#c5c0b1] bg-[#fffdf9] py-16 text-center">
          <p className="text-sm text-[#939084]">回收站为空</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trash.map((item) => {
            const remaining = 30 - item.deletedDaysAgo;
            const nearExpiry = remaining <= 7;
            return (
              <div
                key={item.id}
                className={cn(
                  "rounded-2xl border bg-[#fffefb] p-5",
                  nearExpiry ? "border-amber-200" : "border-[#c5c0b1]",
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-[#201515]">{item.name}</div>
                    <div className="mt-1.5 flex items-center gap-3 text-xs">
                      <span className="text-[#939084]">{item.deletedDaysAgo} 天前删除</span>
                      <span
                        className={cn(
                          "font-medium",
                          nearExpiry ? "text-amber-600" : "text-[#939084]",
                        )}
                      >
                        {nearExpiry && "⚠ "}还有 {remaining} 天自动删除
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => onRestore(item.id)}
                      className="rounded-lg border border-[#c5c0b1] px-3 py-1.5 text-xs text-[#36342e] hover:bg-[#eceae3]"
                    >
                      恢复
                    </button>
                    {permConfirmId === item.id ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-[#939084]">确认永久删除？</span>
                        <button
                          type="button"
                          onClick={() => {
                            onPermDelete(item.id);
                            setPermConfirmId(null);
                          }}
                          className="rounded-lg bg-red-500 px-2.5 py-1.5 text-xs text-[#fffefb] hover:bg-red-600"
                        >
                          确认
                        </button>
                        <button
                          type="button"
                          onClick={() => setPermConfirmId(null)}
                          className="rounded-lg border border-[#c5c0b1] px-2.5 py-1.5 text-xs text-[#36342e]"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPermConfirmId(item.id)}
                        className="rounded-lg border border-red-100 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50"
                      >
                        永久删除
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
