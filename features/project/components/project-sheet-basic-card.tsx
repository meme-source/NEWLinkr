"use client";

import { CalendarDays } from "lucide-react";

import type { WorkspaceProjectDraft } from "@/features/project/components/project-context";
import {
  CURRENCY_OPTIONS,
  FieldLabel,
  TextInput,
} from "@/features/project/components/project-sheet-fields";

// §3.1 基础信息 — 项目参数层。一张卡内 2x2 排布：
//   开始时间 ｜ 结束时间
//   预算（金额 + 货币）｜ 目标建联人数
// 目标建联人数从原"建联与产出"小节迁来，因为它是用户决定的目标参数，
// 跟"开始/截止/预算"是同一类（约束 / 目标），而非派生数据。

type UpdateField = <K extends keyof WorkspaceProjectDraft>(
  key: K,
  value: WorkspaceProjectDraft[K],
) => void;

interface FieldErrors {
  endDate?: string;
  budgetAmount?: string;
}

export function ProjectSheetBasicCard({
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
        <CalendarDays className="h-4 w-4 text-[#ff4f00]" />
        基础信息
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                onUpdate(
                  "budgetCurrency",
                  event.target.value as WorkspaceProjectDraft["budgetCurrency"],
                )
              }
              className="rounded-xl border border-[#c5c0b1] bg-[#fffefb] px-3 py-2.5 text-sm text-[#201515] focus:border-[#ff4f00]/35 focus:outline-none"
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
          <FieldLabel label="目标建联人数" />
          <TextInput
            type="number"
            value={draft.outreachTarget == null ? "" : String(draft.outreachTarget)}
            onChange={(value) => {
              const trimmed = value.trim();
              if (trimmed === "") {
                onUpdate("outreachTarget", null);
                return;
              }
              const parsed = Number(trimmed);
              onUpdate("outreachTarget", Number.isFinite(parsed) && parsed >= 0 ? parsed : null);
            }}
            placeholder="例如：50"
          />
        </div>
      </div>
    </section>
  );
}
