"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CPM_CURRENCY_OPTIONS, type CpmCurrency } from "@/features/settings/data/cpm-countries";
import { cn } from "@/lib/utils";

interface CurrencySelectProps {
  value: CpmCurrency;
  onChange: (c: CpmCurrency) => void;
}

export function CurrencySelect({ value, onChange }: CurrencySelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const current = CPM_CURRENCY_OPTIONS.find((c) => c.code === value) ?? CPM_CURRENCY_OPTIONS[0];

  return (
    <div ref={ref} className="relative">
      <Button
        unstyled
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-[#c5c0b1] bg-[#fffefb] px-3 py-1.5 text-xs text-[#36342e] shadow-sm transition-colors hover:border-[#ff4f00]/40 hover:text-[#201515]"
      >
        <span className="text-[#939084]">货币</span>
        <span className="font-medium text-[#201515]">{current.label}</span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 text-[#939084] transition-transform", open && "rotate-180")}
        />
      </Button>
      {open ? (
        <div className="absolute right-0 z-20 mt-1.5 w-44 overflow-hidden rounded-lg border border-[#c5c0b1] bg-[#fffefb] shadow-lg">
          {CPM_CURRENCY_OPTIONS.map((c) => (
            <Button
              unstyled
              key={c.code}
              type="button"
              onClick={() => {
                onChange(c.code);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between px-3 py-2 text-xs transition-colors hover:bg-[#fff7f4]",
                c.code === value ? "text-[#ff4f00]" : "text-[#36342e]",
              )}
            >
              <span>{c.label}</span>
              <span className="text-[#939084]">{c.symbol}</span>
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
