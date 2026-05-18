"use client";

import { GripVertical, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  type ProjectDrawerMode,
  type ProjectProduct,
  type WorkspaceProject,
  type WorkspaceProjectDraft,
} from "@/features/project/components/project-context";
import { ProjectSheetHeader } from "@/features/project/components/project-sheet-header";
import { ProjectSheetTabs } from "@/features/project/components/project-sheet-tabs";
import { createBlankProduct } from "@/features/project/lib/project-model";
import { useResizableDrawer } from "@/lib/hooks/use-resizable-drawer";

const DEFAULT_WIDTH = 560;

interface ProductFieldErrors {
  name?: string;
  category?: string;
}

interface FieldErrors {
  name?: string;
  product?: ProductFieldErrors;
  endDate?: string;
  budgetAmount?: string;
}

function buildDraft(project?: WorkspaceProject): WorkspaceProjectDraft {
  return {
    name: project?.name ?? "",
    // 一个项目绑定一个产品；编辑模式带出已有产品，创建 / 无产品时给空白产品。
    product:
      project?.products && project.products.length > 0
        ? // 旧 localStorage 产品可能缺 imageUrl / briefName / briefUrl 等后加字段，
          // 用空白产品兜底补齐（产品自身字段会覆盖空白默认值，含其 id）。
          { ...createBlankProduct(), ...project.products[0] }
        : createBlankProduct(),
    startDate: project?.startDate ?? "",
    endDate: project?.endDate ?? "",
    budgetAmount: project?.budgetAmount ?? "",
    budgetCurrency: project?.budgetCurrency ?? "USD",
    status: project?.status ?? "draft",
    cpmMultiplier: project?.cpmMultiplier ?? null,
    outreachTarget: project?.outreachTarget ?? null,
    targetMarkets: project?.targetMarkets ?? [],
    platforms: project?.platforms ?? [],
    sellingPoints: project?.sellingPoints ?? "",
    targetAudience: project?.targetAudience ?? "",
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
  canDelete = true,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  mode: ProjectDrawerMode;
  project?: WorkspaceProject;
  existingProjects: WorkspaceProject[];
  // 是否允许删除当前项目；最后一个项目不能删（避免 currentProject 落空）。
  canDelete?: boolean;
  onClose: () => void;
  onSave: (draft: WorkspaceProjectDraft) => void;
  // 仅编辑模式提供；不传 = 不展示删除按钮（创建模式下没东西可删）。
  onDelete?: () => void;
}) {
  const [draft, setDraft] = useState<WorkspaceProjectDraft>(buildDraft(project));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  // 顶部项目 + 产品区的预览 / 编辑切换。编辑模式默认预览，创建模式默认编辑。
  const [editingBasics, setEditingBasics] = useState(mode === "create");

  useEffect(() => {
    if (!confirmingDelete) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirmingDelete(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmingDelete]);
  const { width, startResize } = useResizableDrawer({
    defaultWidth: DEFAULT_WIDTH,
    maxWidthVw: 70,
  });

  const updateField = <K extends keyof WorkspaceProjectDraft>(
    key: K,
    value: WorkspaceProjectDraft[K],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const updateProduct = (patch: Partial<ProjectProduct>) => {
    setDraft((current) => ({ ...current, product: { ...current.product, ...patch } }));
    setErrors((current) => ({ ...current, product: undefined }));
  };

  // 校验并回写 errors，同时把结果返回给 handleSubmit —— setState 不同步，
  // 提交逻辑需要立刻拿到这次校验的错误集。
  const validate = (): FieldErrors => {
    const nextErrors: FieldErrors = {};
    const trimmedName = draft.name.trim();

    if (!trimmedName) nextErrors.name = "请填写项目名称";
    const duplicated = existingProjects.some((item) => {
      if (project && item.id === project.id) return false;
      return item.name.trim() === trimmedName;
    });
    if (trimmedName && duplicated) nextErrors.name = "项目名称已存在，请更换后再试";

    const productError: ProductFieldErrors = {};
    if (!draft.product.name.trim()) productError.name = "请填写产品名称";
    if (!draft.product.category.trim()) productError.category = "请选择品类";
    if (productError.name || productError.category) {
      nextErrors.product = productError;
    }

    if (draft.startDate && draft.endDate && draft.endDate < draft.startDate) {
      nextErrors.endDate = "结束时间不能早于开始时间";
    }
    if (draft.budgetAmount.trim() && Number(draft.budgetAmount) < 0) {
      nextErrors.budgetAmount = "预算不能为负数";
    }

    setErrors(nextErrors);
    return nextErrors;
  };

  const handleSubmit = () => {
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      // 校验错误都落在项目 / 产品字段 —— 强制展开编辑态让用户看到红字提示。
      setEditingBasics(true);
      return;
    }
    onSave(draft);
  };

  if (!open) return null;

  // §3.1.1 创建模式只能是 draft；编辑模式跟着 draft 走，让用户在 sheet 里能直接改。
  const headerStatus = mode === "create" ? "draft" : (draft.status ?? "draft");
  const isEditing = mode === "create" || editingBasics;

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/18 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="fixed top-0 right-0 z-[80] flex h-full max-w-[70vw] flex-col border-l border-[#c5c0b1] bg-[#fffdf9]"
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
          draft={draft}
          errors={errors}
          editing={isEditing}
          onUpdate={updateField}
          onUpdateProduct={updateProduct}
          onTargetChange={(value) => updateField("outreachTarget", value)}
          onStatusChange={(status) => updateField("status", status)}
          onEdit={() => setEditingBasics(true)}
          onDone={() => setEditingBasics(false)}
          onClose={onClose}
        />

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-5">
            <ProjectSheetTabs draft={draft} mode={mode} project={project} />
            {mode === "edit" && project ? (
              <p className="px-1 text-[10px] text-[#939084]">
                创建于 {formatMetaDate(project.createdAt)} · 最近更新{" "}
                {formatMetaDate(project.updatedAt)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="border-t border-[#c5c0b1] bg-[#fffefb] px-6 py-4">
          <div className="flex items-center justify-end gap-3">
            <div className="flex gap-2">
              {mode === "edit" && onDelete ? (
                confirmingDelete ? (
                  <>
                    <span className="self-center text-xs text-[#b00020]">确认删除该项目？</span>
                    <Button
                      unstyled
                      type="button"
                      onClick={() => setConfirmingDelete(false)}
                      className="rounded-lg border border-[#c5c0b1] px-3 py-2.5 text-sm text-[#36342e] transition-colors hover:bg-[#eceae3]"
                    >
                      取消
                    </Button>
                    <Button
                      unstyled
                      type="button"
                      onClick={() => {
                        setConfirmingDelete(false);
                        onDelete();
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#b00020] px-4 py-2.5 text-sm font-semibold text-[#fffefb] transition-colors hover:bg-[#8e0019]"
                    >
                      <Trash2 className="h-4 w-4" />
                      确认删除
                    </Button>
                  </>
                ) : (
                  <Button
                    unstyled
                    type="button"
                    onClick={() => setConfirmingDelete(true)}
                    disabled={!canDelete}
                    title={canDelete ? undefined : "至少需要保留一个项目"}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#e7c2c5] bg-[#fffefb] px-4 py-2.5 text-sm font-medium text-[#b00020] transition-colors hover:bg-[#fdf2f2] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    删除项目
                  </Button>
                )
              ) : (
                <Button
                  unstyled
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-[#c5c0b1] px-4 py-2.5 text-sm text-[#36342e] transition-colors hover:bg-[#eceae3]"
                >
                  取消
                </Button>
              )}
              <Button
                unstyled
                type="button"
                onClick={handleSubmit}
                className="rounded-lg bg-[#201515] px-4 py-2.5 text-sm font-medium text-[#fffefb] transition-colors hover:bg-[#201515]"
              >
                {mode === "create" ? "创建项目" : "保存项目"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
