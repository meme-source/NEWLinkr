"use client";

import { Trash2 } from "lucide-react";

import { useCreatorProfile } from "@/features/creator/components/creator-profile-context";
import { SearchableSelect } from "@/features/outreach/components/searchable-select";
import { CATEGORY_LABEL, CATEGORY_VISUAL } from "@/features/outreach/data/calendar-events";
import type { DayItem, DayItemKind } from "@/features/outreach/components/schedule-day-panel";
import type { OutreachCreator } from "@/features/outreach/data/outreach-types";
import type { WorkspaceProject } from "@/features/project/components/project-context";
import { cn } from "@/lib/utils";

// §3.7.4 单条事件卡片 — 把分类标签 / 标题（博主可点击进入资料抽屉）/ 备注 /
// 日期编辑 / 项目归属四件事拼在一起。"其他"事件支持改项目；publish/followup
// 事件的项目跟随博主，因此只读；项目里程碑本身就是项目，也是只读。

interface DayItemRowProps {
  item: DayItem;
  creator: OutreachCreator | undefined;
  projects: WorkspaceProject[];
  projectsById: Record<string, WorkspaceProject>;
  onUpdateDate: (newDate: string) => void;
  onUpdateEndDate: (newEndDate: string | null) => void;
  onUpdateNotes: (newNotes: string) => void;
  onUpdateProjectId: (newProjectId: string | null) => void;
  onDelete: () => void;
}

export function DayItemRow({
  item,
  creator,
  projects,
  projectsById,
  onUpdateDate,
  onUpdateEndDate,
  onUpdateNotes,
  onUpdateProjectId,
  onDelete,
}: DayItemRowProps) {
  const tone = kindTone(item.kind);
  const { openCreatorProfile } = useCreatorProfile();
  // 仅 publish / followup 这种"绑定到博主"的事件支持点名字弹抽屉。
  const isCreatorEvent = (item.kind === "publish" || item.kind === "followup") && !!creator;
  // 只有"其他"事件可以改项目；其他事件项目由博主或里程碑本身决定。
  const canEditProject = item.kind === "other";
  const projectName = item.projectId ? (projectsById[item.projectId]?.name ?? null) : null;

  const handleOpenCreator = () => {
    if (!creator) return;
    openCreatorProfile({ handle: creator.handle });
  };

  return (
    <li
      className={cn(
        "rounded-xl border p-3",
        item.kind === "milestone-start" || item.kind === "milestone-end"
          ? "border-[#c5c0b1] bg-[#fffdf9]"
          : "border-[#c5c0b1] bg-[#fffefb]",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                tone.badge,
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
              {kindLabel(item.kind)}
            </span>
            {item.badge ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                  item.badge.cls.badge,
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", item.badge.cls.dot)} />
                {item.badge.label}
              </span>
            ) : null}
            {projectName ? (
              <span
                title={`所属项目：${projectName}`}
                className="inline-flex max-w-[140px] items-center gap-1 truncate rounded-full border border-[#eceae3] bg-[#fffdf9] px-1.5 py-0.5 text-[10px] font-medium text-[#36342e]"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#c5c0b1]" />
                <span className="truncate">{projectName}</span>
              </span>
            ) : null}
          </div>
          {isCreatorEvent ? (
            <button
              type="button"
              onClick={handleOpenCreator}
              aria-label={`查看 ${item.title} 详情`}
              className="mt-1.5 block max-w-full truncate text-left text-sm font-medium text-[#201515] underline-offset-2 hover:text-[#ff4f00] hover:underline focus-visible:text-[#ff4f00] focus-visible:underline focus-visible:outline-none"
            >
              {item.title}
            </button>
          ) : (
            <div className="mt-1.5 truncate text-sm font-medium text-[#201515]">{item.title}</div>
          )}
          {item.subtitle ? (
            <div className="mt-0.5 truncate text-[11px] text-[#939084]">{item.subtitle}</div>
          ) : null}
          {item.kind === "other" && creator ? (
            <button
              type="button"
              onClick={handleOpenCreator}
              aria-label={`查看 ${creator.handle} 详情`}
              className="mt-0.5 inline-block max-w-full truncate text-left text-[11px] text-[#939084] underline-offset-2 hover:text-[#ff4f00] hover:underline focus-visible:text-[#ff4f00] focus-visible:underline focus-visible:outline-none"
            >
              @{creator.handle} · {creator.platform} · {(creator.followers / 1000).toFixed(0)}K
            </button>
          ) : null}
          {item.endDate && item.endDate !== item.date ? (
            <div className="mt-0.5 text-[11px] text-[#939084]">
              持续 {dayCount(item.date, item.endDate)} 天 · 至 {item.endDate}
            </div>
          ) : null}
        </div>
        {item.canDelete ? (
          <button
            type="button"
            onClick={onDelete}
            aria-label={item.kind === "publish" ? "清除发文档期" : "删除事件"}
            className="rounded-md p-1 text-[#939084] hover:bg-[#eceae3] hover:text-[#ff4f00]"
          >
            <Trash2 size={13} />
          </button>
        ) : null}
      </div>

      <NotesEditor value={item.notes ?? ""} onChange={onUpdateNotes} />

      {item.canEditDate || canEditProject ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {item.canEditDate ? (
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-[#939084]">{item.endDate ? "起" : "改期"}</label>
              <input
                type="date"
                value={item.date}
                onChange={(e) => {
                  if (e.target.value) onUpdateDate(e.target.value);
                }}
                className="rounded-md border border-[#c5c0b1] bg-[#fffefb] px-2 py-0.5 text-[11px] text-[#36342e] tabular-nums focus:border-[#ff4f00] focus:outline-none"
              />
            </div>
          ) : null}
          {item.kind === "other" ? (
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-[#939084]">止</label>
              <input
                type="date"
                value={item.endDate ?? ""}
                min={item.date}
                onChange={(e) => onUpdateEndDate(e.target.value === "" ? null : e.target.value)}
                className="rounded-md border border-[#c5c0b1] bg-[#fffefb] px-2 py-0.5 text-[11px] text-[#36342e] tabular-nums focus:border-[#ff4f00] focus:outline-none"
              />
              {item.endDate ? (
                <button
                  type="button"
                  onClick={() => onUpdateEndDate(null)}
                  className="text-[10px] text-[#939084] underline-offset-2 hover:text-[#ff4f00] hover:underline"
                >
                  仅当天
                </button>
              ) : null}
            </div>
          ) : null}
          {canEditProject ? (
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-[#939084]">项目</label>
              <SearchableSelect
                ariaLabel="切换所属项目"
                className="w-44"
                value={item.projectId ?? ""}
                onChange={(next) => onUpdateProjectId(next === "" ? null : next)}
                options={[
                  { value: "", label: "未指定" },
                  ...projects.map((p) => ({ value: p.id, label: p.name })),
                ]}
                placeholder="未指定"
                searchPlaceholder="按项目名搜索…"
                emptyMessage="无匹配项目"
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

// 备注编辑器：折叠时在 summary 行预览（最多 1 行），点开后展开 textarea。
// textarea 而不是 contentEditable —— 这块只承接短文本（≤ 280 字），不需要富文本，
// textarea 行为更稳、更可访问、保存逻辑也更直观。
function NotesEditor({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const NOTES_MAX = 280;
  const trimmed = value.trim();
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = event.target.value;
    onChange(next.length > NOTES_MAX ? next.slice(0, NOTES_MAX) : next);
  };
  return (
    <details className="group mt-2 rounded-lg border border-[#eceae3] bg-[#fffdf9] open:bg-[#fffefb]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-[11px] text-[#939084] hover:text-[#36342e]">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="font-medium tracking-wider uppercase">备注</span>
          {trimmed ? (
            <span className="truncate text-[#36342e]">{trimmed}</span>
          ) : (
            <span className="text-[#939084]">点击添加</span>
          )}
        </span>
        <span className="text-[10px] text-[#c5c0b1] group-open:hidden">展开</span>
        <span className="hidden text-[10px] text-[#c5c0b1] group-open:inline">收起</span>
      </summary>
      <div className="px-2.5 pb-2">
        <textarea
          value={value}
          onChange={handleChange}
          maxLength={NOTES_MAX}
          rows={3}
          placeholder="为这条事件写点备注…例如：要重点跟进的合同条款 / 联系备忘"
          className="w-full resize-none rounded-md border border-[#c5c0b1] bg-[#fffefb] px-2 py-1.5 text-[12px] leading-relaxed text-[#201515] placeholder:text-[#c5c0b1] focus:border-[#ff4f00] focus:outline-none"
        />
        <div className="mt-1 text-right text-[10px] text-[#939084] tabular-nums">
          {value.length}/{NOTES_MAX}
        </div>
      </div>
    </details>
  );
}

function kindLabel(kind: DayItemKind): string {
  if (kind === "milestone-start") return "项目开始";
  if (kind === "milestone-end") return "项目结束";
  return CATEGORY_LABEL[kind];
}

function kindTone(kind: DayItemKind) {
  if (kind === "milestone-start" || kind === "milestone-end") return CATEGORY_VISUAL.milestone;
  return CATEGORY_VISUAL[kind];
}

function dayCount(startIso: string, endIso: string): number {
  const ms = new Date(`${endIso}T00:00:00`).getTime() - new Date(`${startIso}T00:00:00`).getTime();
  return Math.round(ms / 86_400_000) + 1;
}
