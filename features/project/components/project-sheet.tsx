"use client";

import { GripVertical, Package2 } from "lucide-react";
import { useState } from "react";

import {
  type ProjectDrawerMode,
  type WorkspaceProject,
  type WorkspaceProjectDraft,
} from "@/features/project/components/project-context";
import { ProjectSheetBasicCard } from "@/features/project/components/project-sheet-basic-card";
import { ProjectSheetCoreCard } from "@/features/project/components/project-sheet-core-card";
import { ProjectSheetExecutionSection } from "@/features/project/components/project-sheet-execution";
import { ProjectSheetHeader } from "@/features/project/components/project-sheet-header";
import { ProjectSheetQualitySection } from "@/features/project/components/project-sheet-quality";
import { ProjectSheetTimeHealthSection } from "@/features/project/components/project-sheet-time-health";
import { ProjectSheetUpcomingSection } from "@/features/project/components/project-sheet-upcoming";
import { useResizableDrawer } from "@/lib/hooks/use-resizable-drawer";

const DEFAULT_WIDTH = 560;

type FieldKey = "name" | "productName" | "category" | "startDate" | "endDate" | "budgetAmount";
type FieldErrors = Partial<Record<FieldKey, string>>;

function buildDraft(project?: WorkspaceProject): WorkspaceProjectDraft {
  return {
    name: project?.name ?? "",
    productName: project?.productName ?? "",
    category: project?.category ?? "",
    brand: project?.brand ?? "",
    productLink: project?.productLink ?? "",
    startDate: project?.startDate ?? "",
    endDate: project?.endDate ?? "",
    budgetAmount: project?.budgetAmount ?? "",
    budgetCurrency: project?.budgetCurrency ?? "USD",
    status: project?.status ?? "draft",
    cpmMultiplier: project?.cpmMultiplier ?? null,
    outreachTarget: project?.outreachTarget ?? null,
  };
}

function formatMetaDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function ProjectSheet({
  open,
  mode,
  project,
  existingProjects,
  onClose,
  onSave,
}: {
  open: boolean;
  mode: ProjectDrawerMode;
  project?: WorkspaceProject;
  existingProjects: WorkspaceProject[];
  onClose: () => void;
  onSave: (draft: WorkspaceProjectDraft) => void;
}) {
  const [draft, setDraft] = useState<WorkspaceProjectDraft>(buildDraft(project));
  const [errors, setErrors] = useState<FieldErrors>({});
  const { width, startResize } = useResizableDrawer({ defaultWidth: DEFAULT_WIDTH });

  const updateField = <K extends keyof WorkspaceProjectDraft>(
    key: K,
    value: WorkspaceProjectDraft[K],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validate = () => {
    const nextErrors: FieldErrors = {};
    const trimmedName = draft.name.trim();
    const trimmedProductName = draft.productName.trim();
    const trimmedCategory = draft.category.trim();

    if (!trimmedName) nextErrors.name = "请填写项目名称";
    if (!trimmedProductName) nextErrors.productName = "请填写产品名称";
    if (!trimmedCategory) nextErrors.category = "请选择品类";

    const duplicated = existingProjects.some((item) => {
      if (project && item.id === project.id) return false;
      return item.name.trim() === trimmedName;
    });
    if (trimmedName && duplicated) nextErrors.name = "项目名称已存在，请更换后再试";
    if (draft.startDate && draft.endDate && draft.endDate < draft.startDate) {
      nextErrors.endDate = "结束时间不能早于开始时间";
    }
    if (draft.budgetAmount.trim() && Number(draft.budgetAmount) < 0) {
      nextErrors.budgetAmount = "预算不能为负数";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave(draft);
  };

  if (!open) return null;

  // §3.1.1 创建模式只能是 draft；编辑模式跟着 draft 走，让用户在 sheet 里能直接改。
  const headerStatus = mode === "create" ? "draft" : (draft.status ?? "draft");

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/18 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="fixed top-0 right-0 z-[80] flex h-full max-w-[95vw] flex-col border-l border-[#c5c0b1] bg-[#fffdf9]"
        style={{ width }}
      >
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="拖动调整宽度"
          onMouseDown={startResize}
          className="group absolute top-0 bottom-0 left-0 z-[90] flex w-2 -translate-x-1/2 cursor-col-resize items-center justify-center"
        >
          <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent transition-colors group-hover:bg-[#ff4f00]/40" />
          <span className="relative flex h-9 w-4 items-center justify-center rounded-full border border-[#c5c0b1] bg-[#fffefb] text-[#939084] transition-colors group-hover:border-[#ff4f00]/50 group-hover:text-[#ff4f00]">
            <GripVertical className="h-3 w-3" strokeWidth={2.25} />
          </span>
        </div>

        <ProjectSheetHeader
          mode={mode}
          status={headerStatus}
          draftName={draft.name}
          fallbackName={project?.name ?? ""}
          productName={draft.productName}
          category={draft.category}
          brand={draft.brand}
          onStatusChange={(status) => updateField("status", status)}
          onClose={onClose}
        />

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-3">
            <ProjectSheetCoreCard draft={draft} errors={errors} onUpdate={updateField} />
            <ProjectSheetBasicCard draft={draft} errors={errors} onUpdate={updateField} />
            {mode === "edit" && project ? (
              <>
                <ProjectSheetTimeHealthSection project={project} />
                <ProjectSheetExecutionSection
                  projectId={project.id}
                  outreachTarget={draft.outreachTarget ?? null}
                />
                <ProjectSheetUpcomingSection projectId={project.id} />
                <ProjectSheetQualitySection projectId={project.id} />
                <p className="px-1 pt-1 text-[10px] text-[#939084]">
                  创建于 {formatMetaDate(project.createdAt)} · 最近更新{" "}
                  {formatMetaDate(project.updatedAt)}
                </p>
              </>
            ) : null}
          </div>
        </div>

        <div className="border-t border-[#c5c0b1] bg-[#fffefb] px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#939084]">
              <Package2 className="h-3.5 w-3.5" />
              {mode === "create"
                ? "项目创建后会立即成为当前项目"
                : "保存后，当前项目资料会同步到各业务页面"}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[#c5c0b1] px-4 py-2.5 text-sm text-[#36342e] transition-colors hover:bg-[#eceae3]"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="rounded-xl bg-[#201515] px-4 py-2.5 text-sm font-medium text-[#fffefb] transition-colors hover:bg-[#201515]"
              >
                {mode === "create" ? "创建项目" : "保存项目"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
