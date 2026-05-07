"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  getProjectStatusDotClass,
  getProjectStatusLabel,
  getProjectStatusPillClass,
  type WorkspaceProjectStatus,
} from "@/features/project/components/project-context";
import { cn } from "@/lib/utils";

// §3.1.1 项目状态判断规则。前端 UI 把 4 个状态都列出来并附带"何时该是这个状态"
// 的简介，让用户知道选项的含义；系统自动判断由后端实现，UI 只负责让用户能改。
// "暂停中" 标记为"仅手动"——表达系统不会主动转入该状态。
const STATUS_OPTIONS: {
  value: WorkspaceProjectStatus;
  rule: string;
  manualOnly?: boolean;
}[] = [
  { value: "draft", rule: "没有任何建联任务，或起始日期未到" },
  { value: "running", rule: "起始日期已到 · 截止未到 · 至少发送过 1 个建联邮件" },
  { value: "paused", rule: "仅手动设置，系统不会自动转入", manualOnly: true },
  { value: "completed", rule: "截止日期已过 或 用户手动归档（可恢复进行中）" },
];

export function ProjectStatusSelect({
  value,
  onChange,
  disabled = false,
}: {
  value: WorkspaceProjectStatus;
  onChange: (status: WorkspaceProjectStatus) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => {
          if (!disabled) setOpen((p) => !p);
        }}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
          getProjectStatusPillClass(value),
          disabled
            ? "cursor-default"
            : "focus-visible:ring-2 focus-visible:ring-[#ff4f00]/40 focus-visible:outline-none",
        )}
      >
        <span className={cn("h-2 w-2 rounded-full", getProjectStatusDotClass(value))} aria-hidden />
        <span>{getProjectStatusLabel(value)}</span>
        {!disabled ? <ChevronDown className="h-3 w-3" aria-hidden /> : null}
      </button>
      {open && !disabled ? (
        <div
          role="listbox"
          className="absolute top-[calc(100%+6px)] left-0 z-[95] w-[300px] overflow-hidden rounded-2xl border border-[#c5c0b1] bg-[#fffefb]"
        >
          {STATUS_OPTIONS.map((option) => {
            const isActive = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full flex-col gap-0.5 border-b border-[#eceae3] px-3.5 py-2.5 text-left transition-colors last:border-0",
                  isActive ? "bg-[#eceae3]" : "hover:bg-[#fffdf9]",
                )}
              >
                <span className="flex items-center gap-2 text-[12px] font-medium text-[#201515]">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      getProjectStatusDotClass(option.value),
                    )}
                    aria-hidden
                  />
                  {getProjectStatusLabel(option.value)}
                  {option.manualOnly ? (
                    <span className="ml-1 rounded-full bg-[#eceae3] px-1.5 py-0.5 text-[9px] font-medium tracking-wider text-[#939084] uppercase">
                      仅手动
                    </span>
                  ) : null}
                </span>
                <span className="text-[10px] leading-snug text-[#939084]">{option.rule}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
