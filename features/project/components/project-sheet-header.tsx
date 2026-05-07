"use client";

import { X } from "lucide-react";

import {
  getProjectStatusDotClass,
  getProjectStatusLabel,
  getProjectStatusPillClass,
  type ProjectDrawerMode,
  type WorkspaceProjectStatus,
} from "@/features/project/components/project-context";
import { ProjectStatusSelect } from "@/features/project/components/project-status-select";
import { cn } from "@/lib/utils";

// §3.1 项目抽屉头部 — 状态 pill + 项目名称 H2 同一行，副标题压在下方一行展示
// 产品 · 品类 · 品牌。编辑模式状态可改；创建模式状态锁定为草稿（按 §3.1.1 规则，
// 没有任何建联任务的项目就是草稿，所以新建时不允许选其他状态）。

interface Props {
  mode: ProjectDrawerMode;
  status: WorkspaceProjectStatus;
  draftName: string;
  fallbackName: string;
  productName: string;
  category: string;
  brand: string;
  onStatusChange: (status: WorkspaceProjectStatus) => void;
  onClose: () => void;
}

export function ProjectSheetHeader({
  mode,
  status,
  draftName,
  fallbackName,
  productName,
  category,
  brand,
  onStatusChange,
  onClose,
}: Props) {
  const trimmedName = draftName.trim();
  const displayName =
    trimmedName || fallbackName.trim() || (mode === "create" ? "新建项目" : "编辑项目");
  const subtitleParts = [productName.trim(), category.trim(), brand.trim()].filter(Boolean);

  return (
    <div className="border-b border-[#c5c0b1] bg-[#fffefb] px-6 py-4">
      <div className="flex items-center gap-3">
        {mode === "edit" ? (
          <ProjectStatusSelect value={status} onChange={onStatusChange} />
        ) : (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium",
              getProjectStatusPillClass(status),
            )}
          >
            <span
              className={cn("h-2 w-2 rounded-full", getProjectStatusDotClass(status))}
              aria-hidden
            />
            {getProjectStatusLabel(status)}
          </span>
        )}
        <h2 className="min-w-0 flex-1 truncate text-lg font-semibold text-[#201515]">
          {displayName}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[#939084] transition-colors hover:bg-[#eceae3] hover:text-[#201515]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {subtitleParts.length > 0 ? (
        <p className="mt-1.5 truncate text-xs text-[#939084]">{subtitleParts.join(" · ")}</p>
      ) : null}
    </div>
  );
}
