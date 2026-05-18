"use client";

import { useEffect } from "react";
import { FileText, Send, Trash2, Users, X } from "lucide-react";
import {
  SIDEBAR_CONTROL_CLASSES,
  SIDEBAR_FILLED_BUTTON_CLASSES,
  SIDEBAR_SECONDARY_BUTTON_CLASSES,
} from "./shared";

import { Button } from "@/components/ui/button";

export function DeleteProjectConfirm({
  projectName,
  onCancel,
  onConfirm,
}: {
  projectName: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
      if (event.key === "Enter") onConfirm();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel, onConfirm]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#201515]/22 px-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label="确认删除项目"
        className="relative w-full max-w-sm overflow-hidden rounded-[8px] border border-[#c5c0b1] bg-[#fffefb] p-6 text-[#201515]"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fdf2f2] text-[#b00020]">
            <Trash2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-base font-semibold">确认删除项目？</div>
            <p className="mt-1.5 text-[13px] leading-5 text-[#36342e]">
              即将删除项目
              <span className="mx-1 font-medium text-[#201515]">「{projectName}」</span>
              ，该项目的收藏、No、标签等数据将一并清除，且无法恢复。
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button
            unstyled
            type="button"
            onClick={onCancel}
            className="rounded-[8px] border border-[#c5c0b1] bg-[#fffefb] px-4 py-1.5 text-[13px] font-medium text-[#36342e] transition-colors hover:border-[#c5c0b1] hover:bg-[#eceae3]"
          >
            取消
          </Button>
          <Button
            unstyled
            type="button"
            onClick={onConfirm}
            className="rounded-[8px] bg-[#b00020] px-4 py-1.5 text-[13px] font-semibold text-[#fffefb] transition-colors hover:bg-[#8e0019]"
          >
            确认删除
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CreateProjectModal({
  closeButtonRef,
  projectName,
  onProjectNameChange,
  productDescription,
  onProductDescriptionChange,
  files,
  onFilesChange,
  onClose,
  onSubmit,
}: {
  closeButtonRef: React.RefObject<HTMLButtonElement | null>;
  projectName: string;
  onProjectNameChange: (value: string) => void;
  productDescription: string;
  onProductDescriptionChange: (value: string) => void;
  files: File[];
  onFilesChange: (files: File[]) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const canSubmit = projectName.trim().length > 0 && productDescription.trim().length > 0;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#201515]/18 px-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="快速新建项目"
        tabIndex={-1}
        className="relative w-full max-w-xl overflow-hidden rounded-[8px] border border-[#c5c0b1] bg-[linear-gradient(180deg,#fffefb_0%,#fffdf9_55%,#eceae3_100%)] p-6 text-[#201515]"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,#ff4f0033,transparent_70%)]" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c5c0b1] bg-[#fffefb] px-3 py-1 text-xs text-[#ff4f00]">
              <FileText className="h-3.5 w-3.5" />
              快速新建项目
            </div>
            <div className="mt-3 text-2xl font-semibold">填写项目基本信息</div>
            <p className="mt-2 text-sm leading-6 text-[#36342e]">
              项目名和产品信息为必填项。已有达人名单可以选填上传，方便后续继续处理。
            </p>
          </div>
          <Button
            unstyled
            type="button"
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="关闭新建项目弹窗"
            className="relative z-10 rounded-full border border-[#c5c0b1] bg-[#fffefb] p-2 text-[#939084] hover:bg-[#eceae3]"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#201515]">
              项目名 / 推广项目名
              <span className="ml-1 text-[#ff4f00]">*</span>
            </label>
            <input
              value={projectName}
              onChange={(event) => onProjectNameChange(event.target.value)}
              placeholder="例如：春季露营灯新品推广"
              className={SIDEBAR_CONTROL_CLASSES}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#201515]">
              具体是什么产品
              <span className="ml-1 text-[#ff4f00]">*</span>
            </label>
            <textarea
              value={productDescription}
              onChange={(event) => onProductDescriptionChange(event.target.value)}
              placeholder="例如：主推便携露营灯、折叠桌和配套收纳包，本轮想找户外露营场景达人做新品曝光。"
              className="min-h-[108px] w-full rounded-[8px] border border-[#c5c0b1] bg-[#fffdf9] px-3 py-3 text-sm leading-6 text-[#201515] transition-colors outline-none focus:border-[#ff4f00]/35"
            />
          </div>

          <div className="rounded-[8px] border border-dashed border-[#c5c0b1] bg-[#fffefb]/80 p-4">
            <div className="text-sm font-semibold text-[#201515]">上传已有达人名单</div>
            <p className="mt-1 text-xs leading-5 text-[#939084]">
              如果你已经整理过一版达人名单，可在这上传，方便在插件页快速进行筛选和分析。
            </p>
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-[8px] border border-[#c5c0b1] bg-[#fffdf9] px-4 py-2 text-sm font-medium text-[#36342e] transition-colors hover:border-[#c5c0b1] hover:bg-[#fffefb]">
              <FileText className="h-4 w-4 text-[#939084]" />
              选择文件
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(event) => onFilesChange(Array.from(event.target.files ?? []))}
              />
            </label>
            {files.length > 0 ? (
              <div className="mt-3 rounded-[8px] border border-[#c5c0b1] bg-[#fffdf9] px-3 py-2">
                <div className="text-xs font-medium text-[#36342e]">
                  已选择 {files.length} 个文件
                </div>
                <div className="mt-1 space-y-1">
                  {files.map((file) => (
                    <div
                      key={`${file.name}-${file.size}`}
                      className="truncate text-xs text-[#939084]"
                    >
                      {file.name}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="relative mt-6 flex items-center justify-end gap-3">
          <Button
            unstyled
            type="button"
            onClick={onClose}
            className={SIDEBAR_SECONDARY_BUTTON_CLASSES}
          >
            取消
          </Button>
          <Button
            unstyled
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className={`${SIDEBAR_FILLED_BUTTON_CLASSES} disabled:cursor-not-allowed disabled:opacity-60`}
          >
            创建项目
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SearchResultPopup({
  total,
  modeLabel,
  onQuickScreen,
  onSequentialScreen,
  onDelete,
  onClose,
  closeButtonRef,
}: {
  total: string;
  modeLabel: string;
  onQuickScreen: () => void;
  onSequentialScreen: () => void;
  onDelete: () => void;
  onClose: () => void;
  closeButtonRef: React.RefObject<HTMLButtonElement | null>;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#201515]/18 px-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onDelete();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="搜索结果弹窗"
        tabIndex={-1}
        className="relative w-full max-w-lg overflow-hidden rounded-[8px] border border-[#c5c0b1] bg-[linear-gradient(180deg,#fffefb_0%,#fffdf9_55%,#eceae3_100%)] p-6 text-[#201515]"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,#ff4f0033,transparent_70%)]" />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c5c0b1] bg-[#fffefb] px-3 py-1 text-xs text-[#ff4f00]">
              <Send className="h-3.5 w-3.5" />
              搜索完成，建议先确认下一步动作
            </div>
            <div className="mt-3">
              <div className="text-2xl font-semibold">共找到 {total} 位相似博主</div>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#36342e]">
              当前模式为&ldquo;{modeLabel}
              &rdquo;。你可以直接去后台批量筛选，也可以进入逐个筛选路径，逐位查看创作者主页。
            </p>
          </div>
          <Button
            unstyled
            type="button"
            ref={closeButtonRef}
            onClick={onDelete}
            aria-label="关闭结果弹窗"
            className="relative z-10 rounded-full border border-[#c5c0b1] bg-[#fffefb] p-2 text-[#939084] hover:bg-[#eceae3]"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Button
            unstyled
            type="button"
            onClick={onQuickScreen}
            className="rounded-[8px] border border-[#c5c0b1] bg-[#fffefb] p-4 text-left transition-all hover:-translate-y-0.5 hover:bg-[#eceae3]"
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4 text-[#939084]" />
              快速筛选
            </div>
            <div className="mt-2 text-xs leading-5 text-[#36342e]">
              直接跳转后台，以列表方式查看全部相似博主并批量管理。
            </div>
          </Button>
          <Button
            unstyled
            type="button"
            onClick={onSequentialScreen}
            className="rounded-[8px] border border-[#c5c0b1] bg-[#fffefb] p-4 text-left transition-all hover:-translate-y-0.5 hover:bg-[#eceae3]"
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="h-4 w-4 text-[#939084]" />
              逐个筛选
            </div>
            <div className="mt-2 text-xs leading-5 text-[#36342e]">
              逐一跳转博主主页，用悬浮助手完成找相似、收藏、No 和打标签。
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}
