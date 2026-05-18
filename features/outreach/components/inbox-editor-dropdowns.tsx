"use client";

import { ChevronDown, Table as TableIcon } from "lucide-react";
import { type ReactNode, type RefObject, useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { TEMPLATE_VAR_LIST } from "@/features/outreach/data/template-vars";
import { cn } from "@/lib/utils";

function useOutsideClose(
  ref: RefObject<HTMLDivElement | null>,
  open: boolean,
  onClose: () => void,
) {
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [ref, open, onClose]);
}

interface ColorDropdownProps {
  title: string;
  icon: ReactNode;
  colors: ReadonlyArray<{ label: string; value: string }>;
  onPick: (color: string) => void;
}

export function ColorDropdown({ title, icon, colors, onPick }: ColorDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const close = useCallback(() => setOpen(false), []);
  useOutsideClose(ref, open, close);

  return (
    <div ref={ref} className="relative flex items-center">
      <Button
        unstyled
        type="button"
        title={title}
        aria-label={title}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
        className="flex h-7 items-center gap-0.5 rounded px-1 text-[#36342e] transition-colors hover:bg-[#eceae3] hover:text-[#201515]"
      >
        {icon}
        <ChevronDown className="h-3 w-3" />
      </Button>
      {open ? (
        <div className="absolute top-full left-0 z-20 mt-1 grid grid-cols-5 gap-1 rounded-lg border border-[#c5c0b1] bg-[#fffefb] p-2">
          {colors.map((c) => (
            <Button
              unstyled
              key={c.value}
              type="button"
              title={c.label}
              aria-label={c.label}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onPick(c.value);
                setOpen(false);
              }}
              className="h-5 w-5 rounded border border-[#c5c0b1] transition-transform hover:scale-110"
              style={
                c.value === "transparent"
                  ? {
                      backgroundImage:
                        "repeating-linear-gradient(45deg,#fff,#fff 3px,#c5c0b1 3px,#c5c0b1 6px)",
                    }
                  : { background: c.value }
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

interface VariableDropdownProps {
  onPick: (token: string) => void;
}

export function VariableDropdown({ onPick }: VariableDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const close = useCallback(() => setOpen(false), []);
  useOutsideClose(ref, open, close);

  return (
    <div ref={ref} className="relative flex items-center">
      <Button
        unstyled
        type="button"
        title="插入变量"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
        className="flex h-7 items-center gap-1 rounded px-2 text-xs text-[#36342e] transition-colors hover:bg-[#eceae3] hover:text-[#201515]"
      >
        插入变量
        <ChevronDown className="h-3 w-3" />
      </Button>
      {open ? (
        <div className="absolute top-full left-0 z-20 mt-1 w-52 rounded-lg border border-[#c5c0b1] bg-[#fffefb] py-1">
          {(["account", "project", "creator"] as const).map((scope) => {
            const vars = TEMPLATE_VAR_LIST.filter((v) => v.scope === scope);
            if (vars.length === 0) return null;
            return (
              <div key={scope} className="py-1">
                <div className="px-3 pb-1 text-[10px] tracking-wide text-[#939084] uppercase">
                  {scope === "account" ? "账号级" : scope === "project" ? "项目级" : "博主级"}
                </div>
                {vars.map((v) => (
                  <Button
                    unstyled
                    key={v.token}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onPick(v.token);
                      setOpen(false);
                    }}
                    className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs text-[#36342e] hover:bg-[#eceae3]"
                  >
                    <span>{v.label}</span>
                    <span className="text-[10px] text-[#939084]">{v.token}</span>
                  </Button>
                ))}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

interface TableDropdownProps {
  onPick: (rows: number, cols: number) => void;
}

export function TableDropdown({ onPick }: TableDropdownProps) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);
  const close = useCallback(() => setOpen(false), []);
  useOutsideClose(ref, open, close);

  const max = 6;

  return (
    <div ref={ref} className="relative flex items-center">
      <Button
        unstyled
        type="button"
        title="插入表格"
        aria-label="插入表格"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
        className="flex h-7 items-center gap-0.5 rounded px-1 text-[#36342e] transition-colors hover:bg-[#eceae3] hover:text-[#201515]"
      >
        <TableIcon className="h-3.5 w-3.5" />
        <ChevronDown className="h-3 w-3" />
      </Button>
      {open ? (
        <div className="absolute top-full left-0 z-20 mt-1 rounded-lg border border-[#c5c0b1] bg-[#fffefb] p-2">
          <div className="grid grid-cols-6 gap-0.5" onMouseLeave={() => setHover(null)}>
            {Array.from({ length: max * max }).map((_, i) => {
              const r = Math.floor(i / max);
              const c = i % max;
              const active = hover && r <= hover.r && c <= hover.c;
              return (
                <Button
                  unstyled
                  key={i}
                  type="button"
                  onMouseEnter={() => setHover({ r, c })}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onPick(r + 1, c + 1);
                    setOpen(false);
                  }}
                  className={cn(
                    "h-3.5 w-3.5 rounded-sm border",
                    active ? "border-[#ff4f00] bg-[#fff7f4]" : "border-[#c5c0b1] bg-[#fffefb]",
                  )}
                />
              );
            })}
          </div>
          <p className="mt-1 text-center text-[10px] text-[#939084]">
            {hover ? `${hover.r + 1} × ${hover.c + 1}` : "选择表格大小"}
          </p>
        </div>
      ) : null}
    </div>
  );
}
