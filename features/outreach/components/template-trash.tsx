"use client";

import { useState } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { TrashItem } from "@/features/outreach/data/outreach-types";
import { cn } from "@/lib/utils";

// §3.5 系统模板"复制并编辑"二次确认 modal — Zaiper Design 视觉。
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(45,45,46,0.5)] p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="系统模板不可直接修改"
        className="w-[400px] rounded-lg border border-[#c5c0b1] bg-[#fffefb] p-6"
      >
        <h3 className="text-[16px] font-semibold tracking-[-0.3px] text-[#201515]">
          系统模板不可直接修改
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-[#36342e]">
          你可以复制一份到「我的模板」进行编辑，系统模板将始终保持原始不变。
        </p>
        <div className="mt-3 rounded-md bg-[#fffdf9] px-3.5 py-2.5">
          <p className="text-[12px] text-[#36342e]">
            将基于 <span className="font-semibold text-[#201515]">「{templateName}」</span> 创建副本
          </p>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button
            unstyled
            type="button"
            onClick={onClose}
            className="rounded border border-[#c5c0b1] bg-[#fffefb] px-4 py-2 text-[13px] font-medium text-[#36342e] transition-colors hover:bg-[#eceae3] hover:text-[#201515]"
          >
            取消
          </Button>
          <Button
            unstyled
            type="button"
            onClick={onCopyEdit}
            className="rounded border border-[#ff4f00] bg-[#ff4f00] px-4 py-2 text-[13px] font-semibold text-[#fffefb] transition-colors hover:border-[#e64600] hover:bg-[#e64600]"
          >
            复制并编辑
          </Button>
        </div>
      </div>
    </div>
  );
}

// §3.5 模板回收站 — Zaiper Design 视觉。
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
      <div className="flex flex-wrap items-center gap-3">
        <Button
          unstyled
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-[12px] font-medium text-[#939084] transition-colors hover:border-[#c5c0b1] hover:text-[#36342e]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          返回模板
        </Button>
        <span aria-hidden className="text-[#c5c0b1]">
          |
        </span>
        <h2 className="text-[16px] font-semibold tracking-[-0.3px] text-[#201515]">回收站</h2>
        <span className="rounded-full bg-[#eceae3] px-2 py-0.5 text-[11px] font-semibold text-[#36342e] tabular-nums">
          {trash.length} 条
        </span>
        <div className="ml-auto">
          {clearConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-[#939084]">确认清空？</span>
              <Button
                unstyled
                type="button"
                onClick={() => {
                  onClearAll();
                  setClearConfirm(false);
                }}
                className="rounded-md bg-red-500 px-3 py-1.5 text-[12px] font-semibold text-[#fffefb] hover:bg-red-600"
              >
                确认
              </Button>
              <Button
                unstyled
                type="button"
                onClick={() => setClearConfirm(false)}
                className="rounded-md border border-[#c5c0b1] bg-[#fffefb] px-3 py-1.5 text-[12px] text-[#36342e] hover:bg-[#eceae3]"
              >
                取消
              </Button>
            </div>
          ) : (
            <Button
              unstyled
              type="button"
              onClick={() => setClearConfirm(true)}
              disabled={trash.length === 0}
              className="inline-flex items-center gap-1.5 rounded border border-red-200 bg-[#fffefb] px-3 py-1.5 text-[12px] font-medium text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              清空回收站
            </Button>
          )}
        </div>
      </div>

      {trash.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#c5c0b1] bg-[#fffdf9] py-16 text-center">
          <p className="text-[14px] font-semibold text-[#201515]">回收站为空</p>
          <p className="mt-1 text-[12px] text-[#939084]">删除的模板将在 30 天后自动清除</p>
        </div>
      ) : (
        <ul role="list" className="space-y-2.5">
          {trash.map((item) => {
            const remaining = 30 - item.deletedDaysAgo;
            const nearExpiry = remaining <= 7;
            return (
              <li
                key={item.id}
                className={cn(
                  "rounded-lg border bg-[#fffefb] p-4 transition-colors",
                  nearExpiry ? "border-amber-200" : "border-[#c5c0b1] hover:border-[#36342e]",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-[#201515]">{item.name}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
                      <span className="text-[#939084]">{item.deletedDaysAgo} 天前删除</span>
                      <span
                        className={cn(
                          "font-medium",
                          nearExpiry ? "text-amber-600" : "text-[#939084]",
                        )}
                      >
                        {nearExpiry && "⚠ "}还有 {remaining} 天自动删除
                      </span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      unstyled
                      type="button"
                      onClick={() => onRestore(item.id)}
                      className="rounded-md border border-[#c5c0b1] bg-[#fffefb] px-3 py-1.5 text-[12px] font-medium text-[#36342e] transition-colors hover:bg-[#eceae3] hover:text-[#201515]"
                    >
                      恢复
                    </Button>
                    {permConfirmId === item.id ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-[#939084]">确认永久删除？</span>
                        <Button
                          unstyled
                          type="button"
                          onClick={() => {
                            onPermDelete(item.id);
                            setPermConfirmId(null);
                          }}
                          className="rounded-md bg-red-500 px-2.5 py-1.5 text-[11px] font-semibold text-[#fffefb] hover:bg-red-600"
                        >
                          确认
                        </Button>
                        <Button
                          unstyled
                          type="button"
                          onClick={() => setPermConfirmId(null)}
                          className="rounded-md border border-[#c5c0b1] bg-[#fffefb] px-2.5 py-1.5 text-[11px] text-[#36342e] hover:bg-[#eceae3]"
                        >
                          取消
                        </Button>
                      </div>
                    ) : (
                      <Button
                        unstyled
                        type="button"
                        onClick={() => setPermConfirmId(item.id)}
                        className="rounded-md border border-red-100 bg-[#fffefb] px-3 py-1.5 text-[12px] font-medium text-red-500 transition-colors hover:bg-red-50"
                      >
                        永久删除
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
