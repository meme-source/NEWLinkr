"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { highlightVars } from "@/features/outreach/components/highlight-vars";
import { cn } from "@/lib/utils";

// §3.5 Internal helpers extracted from template-drawer.tsx to keep the main
// component file under the 400-line cap. Visual-only — no business logic.

export const FIELD_LABEL =
  "block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#939084]";
export const FIELD_INPUT =
  "w-full rounded-md border border-[#c5c0b1] bg-[#fffefb] px-3 py-2 text-[13px] text-[#201515] placeholder:text-[#939084] focus:border-[#ff4f00] focus:outline-none";

export const SCOPE_OPTIONS = [
  { key: "universal" as const, title: "通用模板", desc: "所有项目可见，可作为基础模板复用" },
  { key: "specific" as const, title: "非通用模板", desc: "绑定到具体场景 / 受众 / 项目" },
];

export function ScopeCard({
  option,
  active,
  onSelect,
}: {
  option: (typeof SCOPE_OPTIONS)[number];
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer flex-col gap-1 rounded-md border px-3 py-2.5 transition-colors",
        active
          ? "border-[#ff4f00] bg-[#fff7f4]"
          : "border-[#c5c0b1] bg-[#fffefb] hover:border-[#36342e]",
      )}
    >
      <span className="flex items-center gap-2">
        <input
          type="radio"
          name="scope"
          checked={active}
          onChange={onSelect}
          className="accent-[#ff4f00]"
        />
        <span className="text-[13px] font-semibold text-[#201515]">{option.title}</span>
      </span>
      <span className="ml-6 text-[11px] text-[#939084]">{option.desc}</span>
    </label>
  );
}

interface TagsFieldProps {
  label: string;
  placeholder: string;
  tags: string[];
  inputValue: string;
  onInputChange: (next: string) => void;
  onAdd: () => void;
  onRemove: (tag: string) => void;
  /** Optional per-tag class override (e.g. SCENE_CFG color). */
  tagClassName?: (tag: string) => string | null;
}

export function TagsField({
  label,
  placeholder,
  tags,
  inputValue,
  onInputChange,
  onAdd,
  onRemove,
  tagClassName,
}: TagsFieldProps) {
  return (
    <div>
      <span className={FIELD_LABEL}>{label}</span>
      {tags.length > 0 && (
        <div className="mt-2 mb-2 flex flex-wrap gap-1.5">
          {tags.map((s) => (
            <span
              key={s}
              className={cn(
                "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                tagClassName?.(s) ?? "border-[#c5c0b1] bg-[#fffefb] text-[#36342e]",
              )}
            >
              {s}
              <Button
                unstyled
                type="button"
                onClick={() => onRemove(s)}
                aria-label={`移除 ${s}`}
                className="opacity-70 hover:opacity-100"
              >
                <X className="h-2.5 w-2.5" aria-hidden />
              </Button>
            </span>
          ))}
        </div>
      )}
      <div className="mt-2 flex gap-2">
        <input
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder={placeholder}
          className={FIELD_INPUT}
        />
        <Button
          unstyled
          type="button"
          onClick={onAdd}
          disabled={!inputValue.trim()}
          className="shrink-0 rounded-md border border-[#c5c0b1] bg-[#fffefb] px-3 py-2 text-[12px] font-medium text-[#36342e] transition-colors hover:bg-[#eceae3] hover:text-[#201515] disabled:opacity-40"
        >
          添加
        </Button>
      </div>
    </div>
  );
}

export function PreviewPane({ subject, body }: { subject: string; body: string }) {
  return (
    <div className="space-y-3 overflow-y-auto bg-[#fffdf9] p-7">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-[0.5px] text-[#939084] uppercase">
          实时预览
        </span>
        <span className="text-[11px] text-[#939084]">变量将在发送时替换</span>
      </div>
      {/* §6.5.2 Soft Surface Variant 1 — 1px ring + 极轻阴影 */}
      <article className="overflow-hidden rounded-lg bg-[#fffefb] shadow-[0_1px_2px_rgba(32,21,21,0.04),0_0_0_1px_rgba(197,192,177,0.35)]">
        <div className="flex items-center gap-3 border-b border-[#eceae3] px-5 py-3.5">
          <div
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ff4f00] text-sm font-semibold text-[#fffefb]"
          >
            S
          </div>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold text-[#201515]">
              Sarah from MyBrand
            </div>
            <div className="truncate text-[11px] text-[#939084]">marketing@mybrand.com</div>
          </div>
        </div>
        <div className="space-y-3 px-5 py-4">
          <PreviewMetaRow label="收件人">
            <span className="rounded bg-[#fff7f4] px-1 font-mono text-[11.5px] font-medium text-[#ff4f00]">
              {"{creator_name}"}
            </span>
          </PreviewMetaRow>
          <PreviewMetaRow label="主题">
            {subject ? (
              <span className="leading-relaxed text-[#201515]">{highlightVars(subject)}</span>
            ) : (
              <span className="text-[#c5c0b1] italic">（请输入邮件主题）</span>
            )}
          </PreviewMetaRow>
          <div className="border-t border-[#eceae3]" />
          <div className="text-[13px] leading-relaxed whitespace-pre-wrap text-[#201515]">
            {body ? (
              highlightVars(body)
            ) : (
              <span className="text-[#c5c0b1] italic">（请输入正文内容）</span>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}

function PreviewMetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 text-[12px]">
      <span className="w-12 shrink-0 font-semibold text-[#939084]">{label}</span>
      <span className="min-w-0 flex-1">{children}</span>
    </div>
  );
}
