"use client";

import { FileText, Mail, Pencil, Reply, Target, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SCENE_CFG, type MyTemplate, type Template } from "@/features/outreach/data/outreach-types";
import { cn } from "@/lib/utils";

// §3.5 Email template card — Zaiper 紧凑形态。
// 视觉重写，handler/props 1:1 不动。

interface TemplateCardProps {
  template: Template & { basedOn?: string };
  isSystem: boolean;
  onEdit: () => void;
  onDelete?: () => void;
}

export function TemplateCard({ template: t, isSystem, onEdit, onDelete }: TemplateCardProps) {
  const isMine = !isSystem;
  const wordCount = isMine ? ((t as MyTemplate).wordCount ?? t.body.split(" ").length) : null;
  const isSpecific = t.scope === "specific";

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[#c5c0b1] bg-[#fffefb] p-4 transition-colors hover:border-[#36342e]">
      {/* head — 标签 + 操作按钮 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className="text-[15px] font-semibold tracking-[-0.32px] text-[#201515]">
            {t.name}
          </span>
          {isSystem && (
            <span className="rounded-full bg-[#eceae3] px-2 py-0.5 text-[10px] font-semibold tracking-[0.3px] text-[#939084] uppercase">
              系统
            </span>
          )}
          {!isSystem && (t as MyTemplate).basedOn && (
            <span className="rounded-full bg-[#fff7f4] px-2 py-0.5 text-[10px] font-medium text-[#ff4f00]">
              基于·{(t as MyTemplate).basedOn}
            </span>
          )}
          {isSpecific && (
            <span className="rounded-full bg-[#eceae3] px-2 py-0.5 text-[10px] font-medium text-[#36342e]">
              非通用
            </span>
          )}
          {t.scenes.map((s) => (
            <span
              key={s}
              className={cn(
                "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                SCENE_CFG[s] ?? "border-[#c5c0b1] bg-[#eceae3] text-[#36342e]",
              )}
            >
              {s}
            </span>
          ))}
        </div>
        <div className="flex shrink-0 gap-1.5">
          <Button
            unstyled
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 rounded-md border border-[#c5c0b1] bg-[#fffefb] px-2.5 py-1 text-[12px] font-medium text-[#36342e] transition-colors hover:bg-[#eceae3] hover:text-[#201515]"
          >
            <Pencil className="h-3 w-3" aria-hidden />
            编辑
          </Button>
          {!isSystem && onDelete && (
            <Button
              unstyled
              type="button"
              onClick={onDelete}
              aria-label={`删除 ${t.name}`}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#c5c0b1] text-[#939084] transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-3 w-3" aria-hidden />
            </Button>
          )}
        </div>
      </div>

      {/* subject —— 主题预览，2 行截断 */}
      <p className="line-clamp-2 text-[13px] leading-snug text-[#36342e]">{t.subject}</p>

      {/* stats —— 字数 / 全局使用 / 打开率 / 回复率 + 更新日期 */}
      <div className="flex items-center gap-4 border-t border-[rgba(197,192,177,0.4)] pt-3 text-[12px] text-[#939084]">
        {isSystem ? (
          <span className="inline-flex items-center gap-1.5" title="全局使用次数">
            <Mail className="h-3 w-3 opacity-70" aria-hidden />
            <span className="font-semibold text-[#201515] tabular-nums">{t.usage}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5" title="字数">
            <FileText className="h-3 w-3 opacity-70" aria-hidden />
            <span className="font-semibold text-[#201515] tabular-nums">{wordCount} 字</span>
          </span>
        )}
        <span className="inline-flex items-center gap-1.5" title="打开率">
          <Target className="h-3 w-3 opacity-70" aria-hidden />
          <span className="font-semibold text-[#201515] tabular-nums">{t.openRate}%</span>
        </span>
        <span className="inline-flex items-center gap-1.5" title="回复率">
          <Reply className="h-3 w-3 opacity-70" aria-hidden />
          <span className="font-semibold text-[#ff4f00] tabular-nums">{t.replyRate}%</span>
        </span>
        <span className="ml-auto text-[11px] font-medium text-[#939084]">更新 {t.lastUpdated}</span>
      </div>

      {/* specific 元信息（项目 / 受众 / 用途）—— 仅"非通用"模板渲染 */}
      {isSpecific && (t.projectIds?.length || t.audienceTags?.length || t.purpose) ? (
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-[#939084]">
          {t.projectIds?.length ? <span>项目：{t.projectIds.join(" / ")}</span> : null}
          {t.audienceTags?.length ? <span>· 受众：{t.audienceTags.join(" / ")}</span> : null}
          {t.purpose ? <span>· {t.purpose}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
