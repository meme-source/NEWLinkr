"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Coins, FolderKanban, Link2, Package2, Sparkles, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  ProjectDrawerMode,
  ProjectDrawerVariant,
  WorkspaceProject,
  WorkspaceProjectDraft,
} from "@/features/project/components/project-context";

const CATEGORY_OPTIONS = [
  "美妆护肤",
  "彩妆",
  "服装穿搭",
  "运动健身",
  "食品饮料",
  "家居生活",
  "数码 3C",
  "母婴亲子",
  "宠物生活",
  "其他",
] as const;

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "CNY", label: "CNY" },
] as const;

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
  };
}

function FieldLabel({
  label,
  required = false,
  hint,
}: {
  label: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="mb-1.5 block text-xs font-medium text-[#36342e]">
      {label}
      {required ? <span className="ml-1 text-[#ff4f00]">*</span> : null}
      {hint ? <span className="ml-1 text-[#939084]">{hint}</span> : null}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: React.HTMLInputTypeAttribute;
  error?: string;
}) {
  return (
    <>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm text-[#201515] placeholder:text-[#b5b2aa] focus:outline-none",
          error ? "border-[#ff4f00]/45" : "border-[#c5c0b1] focus:border-[#ff4f00]/35",
        )}
      />
      {error ? <p className="mt-1.5 text-[11px] text-[#ff4f00]">{error}</p> : null}
    </>
  );
}

export function ProjectSheet({
  open,
  mode,
  variant,
  project,
  existingProjects,
  onVariantChange,
  onClose,
  onSave,
}: {
  open: boolean;
  mode: ProjectDrawerMode;
  variant: ProjectDrawerVariant;
  project?: WorkspaceProject;
  existingProjects: WorkspaceProject[];
  onVariantChange: (variant: ProjectDrawerVariant) => void;
  onClose: () => void;
  onSave: (draft: WorkspaceProjectDraft) => void;
}) {
  // Draft and errors are initialized from the `project` prop at mount.
  // The parent re-mounts this component (via key) whenever it wants the form
  // to reset, so we don't need a useEffect to re-derive state from props.
  const [draft, setDraft] = useState<WorkspaceProjectDraft>(buildDraft(project));
  const [errors, setErrors] = useState<FieldErrors>({});

  const title = mode === "create" ? "新建项目" : "编辑项目";
  const description =
    mode === "create"
      ? "当前项目会同步贯穿博主发现、博主库和建联中心。先建立项目，再让所有动作有归属。"
      : "修改后的项目资料会同步到当前项目视角，帮助团队统一筛选标准、节奏和预算。";

  const optionalSummary = useMemo(() => {
    const tags: string[] = [];
    if (draft.startDate || draft.endDate) {
      tags.push("已补充时间范围");
    }
    if (draft.budgetAmount.trim()) {
      tags.push("已补充预算");
    }
    if (draft.brand.trim() || draft.productLink.trim()) {
      tags.push("已补充产品资料");
    }
    return tags;
  }, [draft]);

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

    if (!trimmedName) {
      nextErrors.name = "请填写项目名称";
    }
    if (!trimmedProductName) {
      nextErrors.productName = "请填写产品名称";
    }
    if (!trimmedCategory) {
      nextErrors.category = "请选择品类";
    }

    const duplicated = existingProjects.some((item) => {
      if (project && item.id === project.id) {
        return false;
      }
      return item.name.trim() === trimmedName;
    });
    if (trimmedName && duplicated) {
      nextErrors.name = "项目名称已存在，请更换后再试";
    }

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
    if (!validate()) {
      return;
    }
    onSave(draft);
  };

  if (!open) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-foreground/18 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed top-0 right-0 z-[80] flex h-full w-full max-w-[560px] flex-col border-l border-[#c5c0b1] bg-[#fffefb] shadow-[0_24px_60px_-18px_rgba(20,20,19,0.28)]">
        <div className="border-b border-[#c5c0b1] bg-background px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#fffdf9] px-3 py-1 text-[11px] font-medium text-[#ff4f00] ring-1 ring-[#fff0e6]">
                <FolderKanban className="h-3.5 w-3.5" />
                {mode === "create" ? "项目创建" : "项目配置"}
              </div>
              <h2 className="mt-3 text-xl font-semibold text-[#201515]">{title}</h2>
              <p className="mt-1.5 max-w-[420px] text-sm leading-6 text-[#36342e]">{description}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#939084] transition-colors hover:bg-[#eceae3] hover:text-[#201515]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {mode === "create" ? (
            <div className="mt-4 inline-flex rounded-2xl border border-[#c5c0b1] bg-[#fffefb] p-1">
              {(
                [
                  { key: "quick", label: "快捷新建" },
                  { key: "detailed", label: "详细信息卡片" },
                ] as const
              ).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onVariantChange(item.key)}
                  className={cn(
                    "rounded-xl px-3.5 py-2 text-sm transition-colors",
                    variant === item.key
                      ? "bg-background font-medium text-[#201515] shadow-sm"
                      : "text-[#939084] hover:text-[#36342e]",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {variant === "quick" && mode === "create" ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-[#fff0e6] bg-[#fffdf9] p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-background text-[#ff4f00] ring-1 ring-[#fff0e6]">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#201515]">
                      先把项目立起来，再开始动作
                    </p>
                    <p className="mt-1.5 text-xs leading-5 text-[#36342e]">
                      快捷新建只保留最关键的 3
                      项必填信息。创建完成后，系统就会以这个项目承接搜索、收藏、建联和后续协作。
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-3xl border border-[#c5c0b1] bg-background p-5">
                <div>
                  <FieldLabel label="项目名称" required />
                  <TextInput
                    value={draft.name}
                    onChange={(value) => updateField("name", value)}
                    placeholder="例如：Q2 夏季 Campaign"
                    error={errors.name}
                  />
                </div>
                <div>
                  <FieldLabel label="产品名称" required />
                  <TextInput
                    value={draft.productName}
                    onChange={(value) => updateField("productName", value)}
                    placeholder="例如：防蓝光护眼面霜"
                    error={errors.productName}
                  />
                </div>
                <div>
                  <FieldLabel label="品类" required />
                  <select
                    value={draft.category}
                    onChange={(event) => updateField("category", event.target.value)}
                    className={cn(
                      "w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm text-[#201515] focus:outline-none",
                      errors.category
                        ? "border-[#ff4f00]/45"
                        : "border-[#c5c0b1] focus:border-[#ff4f00]/35",
                    )}
                  >
                    <option value="">请选择品类</option>
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {errors.category ? (
                    <p className="mt-1.5 text-[11px] text-[#ff4f00]">{errors.category}</p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-3xl border border-[#c5c0b1] bg-background p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#201515]">补充信息</p>
                    <p className="mt-1 text-xs text-[#939084]">
                      以下内容均为选填，但越完整，越方便后续团队协作和节奏安排。
                    </p>
                  </div>
                  {optionalSummary.length > 0 ? (
                    <span className="rounded-full bg-[#eef0e2] px-2.5 py-1 text-[10px] font-medium text-[#36342e]">
                      {optionalSummary.join(" · ")}
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel label="开始时间" />
                    <TextInput
                      type="date"
                      value={draft.startDate}
                      onChange={(value) => updateField("startDate", value)}
                      placeholder=""
                      error={errors.startDate}
                    />
                  </div>
                  <div>
                    <FieldLabel label="结束时间" />
                    <TextInput
                      type="date"
                      value={draft.endDate}
                      onChange={(value) => updateField("endDate", value)}
                      placeholder=""
                      error={errors.endDate}
                    />
                  </div>
                  <div>
                    <FieldLabel label="预算" />
                    <div className="grid grid-cols-[1fr_104px] gap-2">
                      <TextInput
                        type="number"
                        value={draft.budgetAmount}
                        onChange={(value) => updateField("budgetAmount", value)}
                        placeholder="例如：5000"
                        error={errors.budgetAmount}
                      />
                      <select
                        value={draft.budgetCurrency}
                        onChange={(event) =>
                          updateField(
                            "budgetCurrency",
                            event.target.value as WorkspaceProjectDraft["budgetCurrency"],
                          )
                        }
                        className="rounded-xl border border-[#c5c0b1] bg-background px-3 py-2.5 text-sm text-[#201515] focus:border-[#ff4f00]/35 focus:outline-none"
                      >
                        {CURRENCY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <FieldLabel label="品牌" />
                    <TextInput
                      value={draft.brand}
                      onChange={(value) => updateField("brand", value)}
                      placeholder="例如：MyBrand"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <FieldLabel label="产品链接" />
                  <TextInput
                    type="url"
                    value={draft.productLink}
                    onChange={(value) => updateField("productLink", value)}
                    placeholder="https://"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-2xl border border-[#c5c0b1] bg-background p-4">
                <p className="text-sm font-semibold text-[#201515]">详细信息卡片</p>
                <p className="mt-1.5 text-xs leading-5 text-[#36342e]">
                  适合需要明确协作边界的时候使用。先确认核心信息，再补充时间范围与预算，后续发现、筛选、建联都会更顺畅。
                </p>
              </div>

              <section className="rounded-3xl border border-[#c5c0b1] bg-background p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#201515]">
                  <FolderKanban className="h-4 w-4 text-[#ff4f00]" />
                  核心信息
                </div>
                <div className="mt-4 space-y-4">
                  <div>
                    <FieldLabel label="项目名称" required />
                    <TextInput
                      value={draft.name}
                      onChange={(value) => updateField("name", value)}
                      placeholder="例如：Q2 夏季 Campaign"
                      error={errors.name}
                    />
                  </div>
                  <div>
                    <FieldLabel label="产品名称" required />
                    <TextInput
                      value={draft.productName}
                      onChange={(value) => updateField("productName", value)}
                      placeholder="例如：防蓝光护眼面霜"
                      error={errors.productName}
                    />
                  </div>
                  <div>
                    <FieldLabel label="品类" required />
                    <select
                      value={draft.category}
                      onChange={(event) => updateField("category", event.target.value)}
                      className={cn(
                        "w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm text-[#201515] focus:outline-none",
                        errors.category
                          ? "border-[#ff4f00]/45"
                          : "border-[#c5c0b1] focus:border-[#ff4f00]/35",
                      )}
                    >
                      <option value="">请选择品类</option>
                      {CATEGORY_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {errors.category ? (
                      <p className="mt-1.5 text-[11px] text-[#ff4f00]">{errors.category}</p>
                    ) : null}
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-[#c5c0b1] bg-background p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#201515]">
                  <CalendarDays className="h-4 w-4 text-[#ff4f00]" />
                  时间范围
                </div>
                <p className="mt-1.5 text-xs text-[#939084]">
                  让团队知道当前项目从什么时候启动，到什么时候收口，方便安排发现与跟进节奏。
                </p>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel label="开始时间" />
                    <TextInput
                      type="date"
                      value={draft.startDate}
                      onChange={(value) => updateField("startDate", value)}
                      placeholder=""
                      error={errors.startDate}
                    />
                  </div>
                  <div>
                    <FieldLabel label="结束时间" />
                    <TextInput
                      type="date"
                      value={draft.endDate}
                      onChange={(value) => updateField("endDate", value)}
                      placeholder=""
                      error={errors.endDate}
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-[#c5c0b1] bg-background p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#201515]">
                  <Coins className="h-4 w-4 text-[#ff4f00]" />
                  预算与补充信息
                </div>
                <p className="mt-1.5 text-xs text-[#939084]">
                  预算和产品资料不是必填，但它们会直接影响筛选标准、建联优先级和报价判断。
                </p>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel label="预算" />
                    <div className="grid grid-cols-[1fr_104px] gap-2">
                      <TextInput
                        type="number"
                        value={draft.budgetAmount}
                        onChange={(value) => updateField("budgetAmount", value)}
                        placeholder="例如：5000"
                        error={errors.budgetAmount}
                      />
                      <select
                        value={draft.budgetCurrency}
                        onChange={(event) =>
                          updateField(
                            "budgetCurrency",
                            event.target.value as WorkspaceProjectDraft["budgetCurrency"],
                          )
                        }
                        className="rounded-xl border border-[#c5c0b1] bg-background px-3 py-2.5 text-sm text-[#201515] focus:border-[#ff4f00]/35 focus:outline-none"
                      >
                        {CURRENCY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <FieldLabel label="品牌" />
                    <TextInput
                      value={draft.brand}
                      onChange={(value) => updateField("brand", value)}
                      placeholder="例如：MyBrand"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <FieldLabel label="产品链接" />
                  <div className="relative">
                    <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#939084]">
                      <Link2 className="h-3.5 w-3.5" />
                    </span>
                    <input
                      type="url"
                      value={draft.productLink}
                      onChange={(event) => updateField("productLink", event.target.value)}
                      placeholder="https://"
                      className="w-full rounded-xl border border-[#c5c0b1] bg-background py-2.5 pr-3.5 pl-9 text-sm text-[#201515] placeholder:text-[#b5b2aa] focus:border-[#ff4f00]/35 focus:outline-none"
                    />
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>

        <div className="border-t border-[#c5c0b1] bg-background px-6 py-4">
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
                className="rounded-xl bg-[#201515] px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[#201515]"
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
