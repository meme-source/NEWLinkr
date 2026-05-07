"use client";

import { Pencil, Trash2 } from "lucide-react";

import { SCENE_CFG, type MyTemplate, type Template } from "@/features/outreach/data/outreach-types";
import { cn } from "@/lib/utils";

interface TemplateCardProps {
  template: Template & { basedOn?: string };
  isSystem: boolean;
  onEdit: () => void;
  onDelete?: () => void;
}

export function TemplateCard({ template: t, isSystem, onEdit, onDelete }: TemplateCardProps) {
  const isSpecific = t.scope === "specific";
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border bg-[#fffefb] p-5",
        isSpecific
          ? "border-l-4 border-y-[#c5c0b1] border-r-[#c5c0b1] border-l-[#36342e]"
          : "border-[#c5c0b1]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#201515]">{t.name}</span>
            {isSystem && (
              <span className="rounded-full bg-[#eceae3] px-1.5 py-0.5 text-[9px] font-medium text-[#939084]">
                系统
              </span>
            )}
            {!isSystem && (t as MyTemplate).basedOn && (
              <span className="rounded-full bg-[#fff7f4] px-1.5 py-0.5 text-[9px] font-medium text-[#ff4f00]/70">
                基于·{(t as MyTemplate).basedOn}
              </span>
            )}
            {isSpecific && (
              <span className="rounded-full bg-[#eceae3] px-1.5 py-0.5 text-[9px] font-medium text-[#36342e]">
                🎯 非通用
              </span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {t.scenes.map((s) => (
              <span
                key={s}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                  SCENE_CFG[s] ?? "border-[#c5c0b1] bg-[#eceae3] text-[#939084]",
                )}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1 rounded-lg border border-[#c5c0b1] px-2.5 py-1.5 text-xs text-[#36342e] hover:bg-[#eceae3]"
          >
            <Pencil className="h-3 w-3" />
            编辑
          </button>
          {!isSystem && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#c5c0b1] text-[#939084] hover:border-red-200 hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-[#fffdf9] px-3 py-2">
        <span className="text-[10px] font-medium tracking-wider text-[#939084] uppercase">
          主题行
        </span>
        <p className="mt-0.5 text-xs text-[#36342e]">{t.subject}</p>
      </div>

      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-[#939084]">
        {t.body.split("\n")[0]}
      </p>

      <div className="mt-4 flex items-end justify-between border-t border-[#eceae3] pt-4">
        <div className="flex gap-5">
          {isSystem ? (
            <>
              {[
                { label: "全局使用", value: String(t.usage) },
                { label: "打开率", value: `${t.openRate}%` },
                { label: "回复率", value: `${t.replyRate}%`, accent: true },
              ].map((m) => (
                <div key={m.label}>
                  <div className="text-[10px] text-[#939084]">{m.label}</div>
                  <div
                    className={cn(
                      "mt-0.5 text-sm font-semibold",
                      m.accent ? "text-[#ff4f00]" : "text-[#201515]",
                    )}
                  >
                    {m.value}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              {[
                {
                  label: "字数",
                  value: `${(t as MyTemplate).wordCount ?? t.body.split(" ").length}`,
                },
                { label: "打开率", value: `${t.openRate}%` },
                { label: "回复率", value: `${t.replyRate}%`, accent: true },
              ].map((m) => (
                <div key={m.label}>
                  <div className="text-[10px] text-[#939084]">{m.label}</div>
                  <div
                    className={cn(
                      "mt-0.5 text-sm font-semibold",
                      m.accent ? "text-[#ff4f00]" : "text-[#201515]",
                    )}
                  >
                    {m.value}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
        <span className="text-[10px] text-[#c5c0b1]">更新 {t.lastUpdated}</span>
      </div>

      {isSpecific && (t.projectIds?.length || t.audienceTags?.length || t.purpose) ? (
        <div className="mt-3 flex flex-wrap items-center gap-1 text-[10px] text-[#939084]">
          {t.projectIds?.length ? <span>项目：{t.projectIds.join(" / ")}</span> : null}
          {t.audienceTags?.length ? <span>· 受众：{t.audienceTags.join(" / ")}</span> : null}
          {t.purpose ? <span>· {t.purpose}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
