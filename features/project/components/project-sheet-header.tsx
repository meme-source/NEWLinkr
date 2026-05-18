"use client";

import { CalendarRange, Check, Pencil, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getProjectStatusDotClass,
  getProjectStatusLabel,
  getProjectStatusPillClass,
  type ProjectCurrency,
  type ProjectDrawerMode,
  type ProjectProduct,
  type WorkspaceProjectDraft,
  type WorkspaceProjectStatus,
} from "@/features/project/components/project-context";
import { ProjectProductCard } from "@/features/project/components/project-product-card";
import { ProjectStatusSelect } from "@/features/project/components/project-status-select";
import {
  CURRENCY_OPTIONS,
  FieldLabel,
  TextInput,
} from "@/features/project/components/project-sheet-fields";
import { cn } from "@/lib/utils";

// 抽屉顶部 = 项目信息区。一个项目绑定一个产品（1:1），所以项目字段（名称 / 状态 /
// 时间 / 预算）和产品字段都融在这一块米色底的大组块里 —— 不再把产品拆到下面的
// Tab。一个「编辑」按钮整块切换预览 / 编辑，编的就是同一块东西，不会割裂。

const HEADER_BG = "bg-[#f5f1e7]";

const CURRENCY_SYMBOL: Record<ProjectCurrency, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CNY: "¥",
};

type UpdateField = <K extends keyof WorkspaceProjectDraft>(
  key: K,
  value: WorkspaceProjectDraft[K],
) => void;

interface FieldErrors {
  name?: string;
  endDate?: string;
  budgetAmount?: string;
  product?: { name?: string; category?: string };
}

function formatRange(start: string, end: string): string {
  if (start && end) return `${start} → ${end}`;
  if (start) return `${start} 开始`;
  if (end) return `截止 ${end}`;
  return "未设置时间范围";
}

export function ProjectSheetHeader({
  mode,
  status,
  draft,
  errors,
  editing,
  onUpdate,
  onUpdateProduct,
  onTargetChange,
  onStatusChange,
  onEdit,
  onDone,
  onClose,
}: {
  mode: ProjectDrawerMode;
  status: WorkspaceProjectStatus;
  draft: WorkspaceProjectDraft;
  errors: FieldErrors;
  editing: boolean;
  onUpdate: UpdateField;
  onUpdateProduct: (patch: Partial<ProjectProduct>) => void;
  onTargetChange: (value: number | null) => void;
  onStatusChange: (status: WorkspaceProjectStatus) => void;
  onEdit: () => void;
  onDone: () => void;
  onClose: () => void;
}) {
  const displayName = draft.name.trim() || (mode === "create" ? "新建项目" : "未命名项目");
  const budget = draft.budgetAmount.trim()
    ? `${CURRENCY_SYMBOL[draft.budgetCurrency]}${draft.budgetAmount.trim()}`
    : "未设置预算";

  const statusControl =
    mode === "edit" ? (
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
    );

  const closeButton = (
    <Button
      unstyled
      type="button"
      onClick={onClose}
      aria-label="关闭"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#939084] transition-colors hover:bg-[#eceae3] hover:text-[#201515]"
    >
      <X className="h-4 w-4" />
    </Button>
  );

  // 产品区 —— 产品字段直接接在项目字段下方，不再写「产品」小标题
  // （产品本身已经展示出来，标题多余）。
  const productSection = (
    <div className="mt-5">
      <ProjectProductCard
        product={draft.product}
        editing={editing}
        error={errors.product}
        outreachTarget={draft.outreachTarget ?? null}
        onUpdate={onUpdateProduct}
        onTargetChange={onTargetChange}
      />
    </div>
  );

  if (!editing) {
    return (
      <div className={cn(HEADER_BG, "px-6 py-4")}>
        <div className="flex items-center gap-3">
          {statusControl}
          <h2 className="min-w-0 flex-1 truncate text-lg font-semibold text-[#201515]">
            {displayName}
          </h2>
          {closeButton}
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#36342e]">
            <span className="inline-flex items-center gap-1.5">
              <CalendarRange className="h-3.5 w-3.5 text-[#939084]" />
              {formatRange(draft.startDate, draft.endDate)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-[#939084]">预算</span>
              {budget}
            </span>
          </div>
          <Button
            unstyled
            type="button"
            onClick={onEdit}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#c5c0b1] bg-[#fffefb] px-3 py-1.5 text-xs font-medium text-[#36342e] transition-colors hover:bg-[#eceae3]"
          >
            <Pencil className="h-3.5 w-3.5" />
            编辑
          </Button>
        </div>
        {productSection}
      </div>
    );
  }

  return (
    <div className={cn(HEADER_BG, "px-6 py-4")}>
      <div className="flex items-center gap-3">
        {statusControl}
        <div className="flex-1" />
        {mode === "edit" ? (
          <Button
            unstyled
            type="button"
            onClick={onDone}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#c5c0b1] bg-[#fffefb] px-3 py-1.5 text-xs font-medium text-[#36342e] transition-colors hover:bg-[#eceae3]"
          >
            <Check className="h-3.5 w-3.5" />
            完成编辑
          </Button>
        ) : null}
        {closeButton}
      </div>

      <div className="mt-3 space-y-3">
        <div>
          <FieldLabel label="项目名称" required />
          <TextInput
            value={draft.name}
            onChange={(value) => onUpdate("name", value)}
            placeholder="例如：Q2 夏季 Campaign"
            error={errors.name}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <FieldLabel label="开始时间" />
            <TextInput
              type="date"
              value={draft.startDate}
              onChange={(value) => onUpdate("startDate", value)}
              placeholder=""
            />
          </div>
          <div>
            <FieldLabel label="结束时间" />
            <TextInput
              type="date"
              value={draft.endDate}
              onChange={(value) => onUpdate("endDate", value)}
              placeholder=""
              error={errors.endDate}
            />
          </div>
        </div>
        <div>
          <FieldLabel label="预算" />
          <div className="grid grid-cols-[1fr_104px] gap-2">
            <TextInput
              type="number"
              value={draft.budgetAmount}
              onChange={(value) => onUpdate("budgetAmount", value)}
              placeholder="例如：5000"
              error={errors.budgetAmount}
            />
            <select
              value={draft.budgetCurrency}
              onChange={(event) =>
                onUpdate("budgetCurrency", event.target.value as ProjectCurrency)
              }
              className="rounded-lg border border-[#c5c0b1] bg-[#fffefb] px-3 py-2.5 text-sm text-[#201515] focus:border-[#ff4f00]/35 focus:outline-none"
            >
              {CURRENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {productSection}
    </div>
  );
}
