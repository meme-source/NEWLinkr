"use client";

import { useEffect, type RefObject } from "react";
import { FileText, X } from "lucide-react";

import {
  SIDEBAR_CONTROL_CLASSES,
  SIDEBAR_FILLED_BUTTON_CLASSES,
  SIDEBAR_SECONDARY_BUTTON_CLASSES,
} from "@/features/plugin/lib/style-constants";

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
  closeButtonRef: RefObject<HTMLButtonElement | null>;
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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#141413]/18 px-4 backdrop-blur-sm"
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
        className="relative w-full max-w-xl overflow-hidden rounded-[30px] border border-[#e8e6dc] bg-[linear-gradient(180deg,#ffffff_0%,#faf9f5_55%,#f5f4ed_100%)] p-6 text-[#141413] shadow-[0_30px_120px_-40px_rgba(77,76,72,0.22)]"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,#c9644233,transparent_70%)]" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#e8e6dc] bg-white px-3 py-1 text-xs text-[#c96442]">
              <FileText className="h-3.5 w-3.5" />
              快速新建项目
            </div>
            <div className="mt-3 text-2xl font-semibold">填写项目基本信息</div>
            <p className="mt-2 text-sm leading-6 text-[#5e5d59]">
              项目名和产品信息为必填项。已有达人名单可以选填上传，方便后续继续处理。
            </p>
          </div>
          <button
            type="button"
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="关闭新建项目弹窗"
            className="relative z-10 rounded-full border border-[#e8e6dc] bg-white p-2 text-[#87867f] hover:bg-[#f5f4ed]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#141413]">
              项目名 / 推广项目名
              <span className="ml-1 text-[#c96442]">*</span>
            </label>
            <input
              value={projectName}
              onChange={(event) => onProjectNameChange(event.target.value)}
              placeholder="例如：春季露营灯新品推广"
              className={SIDEBAR_CONTROL_CLASSES}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#141413]">
              具体是什么产品
              <span className="ml-1 text-[#c96442]">*</span>
            </label>
            <textarea
              value={productDescription}
              onChange={(event) => onProductDescriptionChange(event.target.value)}
              placeholder="例如：主推便携露营灯、折叠桌和配套收纳包，本轮想找户外露营场景达人做新品曝光。"
              className="min-h-[108px] w-full rounded-[20px] border border-[#e8e6dc] bg-[#faf9f5] px-3 py-3 text-sm leading-6 text-[#141413] outline-none transition-colors focus:border-[#c96442]/35"
            />
          </div>

          <div className="rounded-[24px] border border-dashed border-[#d1cfc5] bg-white/80 p-4">
            <div className="text-sm font-semibold text-[#141413]">上传已有达人名单</div>
            <p className="mt-1 text-xs leading-5 text-[#87867f]">
              如果你已经整理过一版达人名单，可在这上传，方便在插件页快速进行筛选和分析。
            </p>
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#e8e6dc] bg-[#faf9f5] px-4 py-2 text-sm font-medium text-[#4d4c48] transition-colors hover:border-[#d1cfc5] hover:bg-white">
              <FileText className="h-4 w-4 text-[#87867f]" />
              选择文件
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(event) =>
                  onFilesChange(Array.from(event.target.files ?? []))
                }
              />
            </label>
            {files.length > 0 ? (
              <div className="mt-3 rounded-[18px] border border-[#e8e6dc] bg-[#faf9f5] px-3 py-2">
                <div className="text-xs font-medium text-[#5e5d59]">
                  已选择 {files.length} 个文件
                </div>
                <div className="mt-1 space-y-1">
                  {files.map((file) => (
                    <div key={`${file.name}-${file.size}`} className="truncate text-xs text-[#87867f]">
                      {file.name}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="relative mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className={SIDEBAR_SECONDARY_BUTTON_CLASSES}
          >
            取消
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className={`${SIDEBAR_FILLED_BUTTON_CLASSES} disabled:cursor-not-allowed disabled:opacity-60`}
          >
            创建项目
          </button>
        </div>
      </div>
    </div>
  );
}
