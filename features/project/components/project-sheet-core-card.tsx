"use client";

import { FolderKanban, Link2 } from "lucide-react";

import type { WorkspaceProjectDraft } from "@/features/project/components/project-context";
import {
  CATEGORY_OPTIONS,
  FieldLabel,
  TextInput,
} from "@/features/project/components/project-sheet-fields";
import { cn } from "@/lib/utils";

// §3.1 核心信息 — 项目身份层。三行紧凑布局：
//   1) 项目名称（全宽）
//   2) 产品名称 + 品类（同一行）
//   3) 品牌 + 产品链接（同一行）

type UpdateField = <K extends keyof WorkspaceProjectDraft>(
  key: K,
  value: WorkspaceProjectDraft[K],
) => void;

interface FieldErrors {
  name?: string;
  productName?: string;
  category?: string;
}

export function ProjectSheetCoreCard({
  draft,
  errors,
  onUpdate,
}: {
  draft: WorkspaceProjectDraft;
  errors: FieldErrors;
  onUpdate: UpdateField;
}) {
  return (
    <section className="rounded-3xl border border-[#c5c0b1] bg-[#fffefb] p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#201515]">
        <FolderKanban className="h-4 w-4 text-[#ff4f00]" />
        核心信息
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px]">
          <div>
            <FieldLabel label="产品名称" required />
            <TextInput
              value={draft.productName}
              onChange={(value) => onUpdate("productName", value)}
              placeholder="例如：防蓝光护眼面霜"
              error={errors.productName}
            />
          </div>
          <div>
            <FieldLabel label="品类" required />
            <select
              value={draft.category}
              onChange={(event) => onUpdate("category", event.target.value)}
              className={cn(
                "w-full rounded-xl border bg-[#fffefb] px-3.5 py-2.5 text-sm text-[#201515] focus:outline-none",
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <FieldLabel label="品牌" />
            <TextInput
              value={draft.brand}
              onChange={(value) => onUpdate("brand", value)}
              placeholder="例如：MyBrand"
            />
          </div>
          <div>
            <FieldLabel label="产品链接" />
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#939084]">
                <Link2 className="h-3.5 w-3.5" />
              </span>
              <input
                type="url"
                value={draft.productLink}
                onChange={(event) => onUpdate("productLink", event.target.value)}
                placeholder="https://"
                className="w-full rounded-xl border border-[#c5c0b1] bg-[#fffefb] py-2.5 pr-3.5 pl-9 text-sm text-[#201515] placeholder:text-[#b5b2aa] focus:border-[#ff4f00]/35 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
