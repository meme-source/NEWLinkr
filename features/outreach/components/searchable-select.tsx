"use client";

import { Check, ChevronsUpDown, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

// 一个最小可用的可搜索下拉框：trigger 是一颗按钮，点开会展开搜索框 + 选项
// 列表，输入会按 label / description 即时过滤。设计上贴合现有 calendar /
// schedule 的米色调色板，不引入第三方 combobox 库。

export interface SearchableSelectOption {
  value: string;
  label: string;
  // 副文本，会渲染在 label 右侧（小字），且会一同纳入搜索匹配。
  description?: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (next: string) => void;
  options: SearchableSelectOption[];
  placeholder: string;
  searchPlaceholder?: string;
  // 列表筛空时的提示。
  emptyMessage?: string;
  // 整体是否禁用（无可选项 / 父级未就绪时使用）。
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder = "搜索…",
  emptyMessage = "无匹配项",
  disabled = false,
  ariaLabel,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(() => options.find((o) => o.value === value) ?? null, [options, value]);

  // 关闭操作统一走这条路径，顺手把搜索词重置掉；放在事件处理里而非 effect，
  // 避免 setState-in-effect 触发渲染级联。
  const close = () => {
    setOpen(false);
    setQuery("");
  };

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // 打开时自动 focus 搜索框；用 setTimeout 让 popover 渲染稳定后再抢焦点，
  // 避免 click 事件还未结束就被 focus 抢走。
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 10);
    return () => clearTimeout(t);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => `${o.label} ${o.description ?? ""}`.toLowerCase().includes(q));
  }, [options, query]);

  const handleSelect = (next: string) => {
    onChange(next);
    close();
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border border-[#c5c0b1] bg-[#fffefb] px-3 py-1.5 text-left text-sm text-[#201515] focus:border-[#ff4f00] focus:outline-none",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <span className={cn("flex-1 truncate", !selected && "text-[#939084]")}>
          {selected ? selected.label : placeholder}
        </span>
        {selected?.description ? (
          <span className="shrink-0 text-[10px] text-[#939084]">{selected.description}</span>
        ) : null}
        <ChevronsUpDown size={13} className="shrink-0 text-[#939084]" aria-hidden />
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute top-full left-0 z-30 mt-1 w-full min-w-[220px] overflow-hidden rounded-lg border border-[#c5c0b1] bg-[#fffefb] shadow-[0_12px_32px_-16px_rgba(32,21,21,0.25)]"
        >
          <div className="flex items-center gap-2 border-b border-[#eceae3] px-2.5 py-1.5">
            <Search size={12} className="text-[#939084]" aria-hidden />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-xs text-[#201515] placeholder:text-[#c5c0b1] focus:outline-none"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-[11px] text-[#939084]">{emptyMessage}</div>
            ) : (
              filtered.map((opt) => {
                const isActive = opt.value === value;
                return (
                  <button
                    key={opt.value || "__empty__"}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-[#fffdf9]",
                      isActive && "bg-[#fff7f4]",
                    )}
                  >
                    <Check
                      size={11}
                      strokeWidth={3}
                      aria-hidden
                      className={cn("shrink-0", isActive ? "text-[#ff4f00]" : "text-transparent")}
                    />
                    <span className="flex-1 truncate text-[#201515]">{opt.label}</span>
                    {opt.description ? (
                      <span className="shrink-0 text-[10px] text-[#939084]">{opt.description}</span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
