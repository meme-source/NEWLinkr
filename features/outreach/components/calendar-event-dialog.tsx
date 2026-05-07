"use client";

import { X } from "lucide-react";
import { useMemo, useState } from "react";

import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/features/outreach/components/searchable-select";
import {
  CATEGORY_DESCRIPTION,
  CATEGORY_LABEL,
  type CalendarEventCategory,
} from "@/features/outreach/data/calendar-events";
import type { OutreachCreator } from "@/features/outreach/data/outreach-types";
import type { WorkspaceProject } from "@/features/project/components/project-context";
import { cn } from "@/lib/utils";

// §3.7.3 New-event dialog. The category dropdown rules which fields show:
//   - publish/followup → creator picker + date (writes back to OutreachCreator)
//   - other → date + title + notes (creates a standalone CalendarEvent)
// Project nodes (开始/结束) are auto-rendered, never created here.
//
// Mount-fresh pattern: the parent gates rendering on `open` and uses a
// remount key tied to each open cycle, so internal state always seeds from
// props on mount and we never need an effect to reset fields.

// projectId 是创建事件时显式选择的项目归属。publish/followup 事件的项目由所选
// 博主决定（写在 OutreachCreator.projectId 上），dialog 会先按所选项目过滤博主
// 列表；"其他"事件则把 projectId 直接落到 StandaloneCalendarEvent。null = 未指定。
export type CalendarEventDraft =
  | {
      category: "publish";
      creatorId: string;
      date: string;
      projectId: string | null;
    }
  | {
      category: "followup";
      creatorId: string;
      date: string;
      notes?: string;
      projectId: string | null;
    }
  | {
      category: "other";
      date: string;
      endDate?: string;
      title: string;
      notes?: string;
      projectId: string | null;
      // 可选博主绑定 —— null = 不绑定。绑定后日历卡片会渲染可点击的博主名。
      creatorId: string | null;
    };

interface CalendarEventDialogProps {
  // Initial start date. When the parent opens the dialog from a range select,
  // it also passes `defaultEndDate` so the user lands on a multi-day form.
  defaultDate: string;
  defaultEndDate?: string;
  // Creators eligible for "publish" (must be 合作中 / 已完成 / 暂停中) and
  // "followup" (anyone past 已发送). For "其他" events we accept any creator
  // regardless of status.
  publishableCreators: OutreachCreator[];
  followupCreators: OutreachCreator[];
  allCreators: OutreachCreator[];
  // 全量项目列表（dialog 里的项目下拉框；不在这里 import context 是为了让
  // dialog 保持纯展示组件、可被 Storybook / 单测复用）。
  projects: WorkspaceProject[];
  // 当前作用域里的项目 id，作为新建事件的默认归属。null = 全部项目模式，
  // 此时不预填任何项目，等用户主动选。
  defaultProjectId: string | null;
  onSubmit: (draft: CalendarEventDraft) => void;
  onClose: () => void;
}

export function CalendarEventDialog({
  defaultDate,
  defaultEndDate,
  publishableCreators,
  followupCreators,
  allCreators,
  projects,
  defaultProjectId,
  onSubmit,
  onClose,
}: CalendarEventDialogProps) {
  // When a range was selected we default to "其他" (the only category that
  // supports multi-day spans). Otherwise we still default to "其他" since
  // the user explicitly asked for it as the default in the design pass.
  const [category, setCategory] = useState<CalendarEventCategory>("other");
  const [date, setDate] = useState(defaultDate);
  const [endDate, setEndDate] = useState(defaultEndDate ?? "");
  const [creatorId, setCreatorId] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  // 项目选择：在"全部项目"作用域下默认空（用户必须主动选），否则预填当前项目。
  const [projectId, setProjectId] = useState<string>(defaultProjectId ?? "");

  // 不同事件类型采用不同的博主候选池：publish 仅"合作中/已完成/暂停中"，
  // followup 是"已发送"及之后的所有状态，"其他"事件则不限状态、且博主是
  // 可选的。三个分支共用同一个下拉框逻辑，选博主都会自动对齐项目。
  const creatorPool = useMemo(() => {
    if (category === "publish") return publishableCreators;
    if (category === "followup") return followupCreators;
    return allCreators;
  }, [category, publishableCreators, followupCreators, allCreators]);

  // Range form only makes sense for the "other" category — publish and
  // followup are intrinsically single-day. If the user switches to one of
  // those, just hide the end-date field; we don't clear it (in case they
  // switch back).
  const showEndDate = category === "other";

  const canSubmit = (() => {
    if (!date) return false;
    if (category === "other") {
      if (title.trim().length === 0) return false;
      if (endDate && endDate < date) return false;
      return true;
    }
    return creatorId.length > 0;
  })();

  const handleSubmit = () => {
    if (!canSubmit) return;
    // 项目以 UI 上当前显示的为准 —— 选博主时已经自动填充过；用户若手动改过，
    // 这里不再回退覆盖，让显式选择生效。
    const resolvedProjectId = projectId === "" ? null : projectId;
    if (category === "publish") {
      onSubmit({ category: "publish", creatorId, date, projectId: resolvedProjectId });
      return;
    }
    if (category === "followup") {
      onSubmit({
        category: "followup",
        creatorId,
        date,
        notes: notes.trim() || undefined,
        projectId: resolvedProjectId,
      });
      return;
    }
    onSubmit({
      category: "other",
      date,
      endDate: endDate && endDate !== date ? endDate : undefined,
      title: title.trim(),
      notes: notes.trim() || undefined,
      projectId: resolvedProjectId,
      creatorId: creatorId === "" ? null : creatorId,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#c5c0b1] bg-[#fffefb]">
        <div className="flex items-center justify-between border-b border-[#c5c0b1] px-5 py-4">
          <div>
            <div className="text-xs tracking-wider text-[#939084] uppercase">新建事件</div>
            <div className="mt-1 text-sm font-semibold text-[#201515]">
              {CATEGORY_LABEL[category]}
            </div>
            <div className="mt-0.5 text-[11px] text-[#939084]">
              {CATEGORY_DESCRIPTION[category]}
            </div>
          </div>
          <button
            type="button"
            aria-label="关闭"
            onClick={onClose}
            className="rounded-lg p-1 text-[#939084] hover:bg-[#eceae3] hover:text-[#36342e]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <Field label="事件类型">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CalendarEventCategory)}
              className="w-full rounded-lg border border-[#c5c0b1] bg-[#fffefb] px-3 py-1.5 text-sm text-[#201515] focus:border-[#ff4f00] focus:outline-none"
            >
              <option value="publish">{CATEGORY_LABEL.publish}</option>
              <option value="followup">{CATEGORY_LABEL.followup}</option>
              <option value="other">{CATEGORY_LABEL.other}</option>
            </select>
          </Field>

          <div className={cn("grid gap-3", showEndDate ? "grid-cols-2" : "grid-cols-1")}>
            <Field label={showEndDate ? "开始" : "日期"}>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-[#c5c0b1] bg-[#fffefb] px-3 py-1.5 text-sm text-[#201515] tabular-nums focus:border-[#ff4f00] focus:outline-none"
              />
            </Field>
            {showEndDate ? (
              <Field
                label="结束（可选）"
                hint={endDate && endDate < date ? "晚于开始日" : undefined}
              >
                <input
                  type="date"
                  value={endDate}
                  min={date}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-[#c5c0b1] bg-[#fffefb] px-3 py-1.5 text-sm text-[#201515] tabular-nums focus:border-[#ff4f00] focus:outline-none"
                />
              </Field>
            ) : null}
          </div>

          <Field
            label={category === "other" ? "博主（可选）" : "博主"}
            hint={
              category === "publish"
                ? "仅显示已进入合作的博主"
                : category === "followup"
                  ? "仅显示已发送邮件之后的博主"
                  : "可绑定一位博主，绑定后日历中可点名字进入资料"
            }
          >
            {creatorPool.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#c5c0b1] bg-[#fffdf9] px-3 py-2 text-[11px] text-[#939084]">
                暂无可选博主
              </div>
            ) : (
              <SearchableSelect
                ariaLabel="选择博主"
                value={creatorId}
                onChange={(nextId) => {
                  setCreatorId(nextId);
                  // 选了博主就把项目对齐到博主自身的 projectId；清空选择不动项目，
                  // 让用户之前手动设的项目保持。
                  const picked = creatorPool.find((c) => c.id === nextId);
                  if (picked) setProjectId(picked.projectId);
                }}
                options={buildCreatorOptions(creatorPool, category === "other")}
                placeholder={category === "other" ? "— 不绑定博主 —" : "— 选择博主 —"}
                searchPlaceholder="按 handle / 平台搜索…"
                emptyMessage="无匹配博主"
              />
            )}
          </Field>

          <Field
            label="项目"
            hint={
              category === "other"
                ? "选填，会跟随事件一起分配到该项目"
                : "选博主后，自动填充所属项目"
            }
          >
            {projects.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#c5c0b1] bg-[#fffdf9] px-3 py-2 text-[11px] text-[#939084]">
                暂无项目，先去创建
              </div>
            ) : (
              <SearchableSelect
                ariaLabel="选择项目"
                value={projectId}
                onChange={setProjectId}
                options={buildProjectOptions(projects)}
                placeholder="— 未指定项目 —"
                searchPlaceholder="按项目名搜索…"
                emptyMessage="无匹配项目"
              />
            )}
          </Field>

          {category === "other" ? (
            <Field label="标题">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：投放中段复盘"
                className="w-full rounded-lg border border-[#c5c0b1] bg-[#fffefb] px-3 py-1.5 text-sm text-[#201515] placeholder:text-[#c5c0b1] focus:border-[#ff4f00] focus:outline-none"
              />
            </Field>
          ) : null}

          {category !== "publish" ? (
            <Field label="备注（可选）">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-lg border border-[#c5c0b1] bg-[#fffefb] px-3 py-1.5 text-sm text-[#201515] focus:border-[#ff4f00] focus:outline-none"
              />
            </Field>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#c5c0b1] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#c5c0b1] px-3 py-1.5 text-[11px] font-medium text-[#36342e] hover:bg-[#eceae3]"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[11px] font-medium",
              canSubmit
                ? "bg-[#ff4f00] text-[#fffefb] hover:bg-[#ff4f00]"
                : "cursor-not-allowed bg-[#eceae3] text-[#c5c0b1]",
            )}
          >
            创建
          </button>
        </div>
      </div>
    </div>
  );
}

// 把 OutreachCreator / WorkspaceProject 转换成 SearchableSelect 选项。
// includeUnbound 控制是否在最前面塞一条"不绑定博主"的空值选项。
function buildCreatorOptions(
  creators: OutreachCreator[],
  includeUnbound: boolean,
): SearchableSelectOption[] {
  const base: SearchableSelectOption[] = creators.map((c) => ({
    value: c.id,
    label: c.handle,
    description: `${c.platform} · ${(c.followers / 1000).toFixed(0)}K`,
  }));
  if (includeUnbound) {
    return [{ value: "", label: "— 不绑定博主 —" }, ...base];
  }
  return base;
}

function buildProjectOptions(projects: WorkspaceProject[]): SearchableSelectOption[] {
  return [
    { value: "", label: "— 未指定项目 —" },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ];
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 flex items-baseline justify-between text-[11px] tracking-wide text-[#939084]">
        <span>{label}</span>
        {hint ? <span className="text-[10px] text-[#c5c0b1]">{hint}</span> : null}
      </label>
      {children}
    </div>
  );
}
