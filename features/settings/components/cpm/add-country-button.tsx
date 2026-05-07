"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, X } from "lucide-react";

import { tierLabel } from "@/features/settings/components/cpm/types";
import {
  CPM_COUNTRY_DICT,
  type CpmCountry,
  type CpmTier,
} from "@/features/settings/data/cpm-countries";
import { cn } from "@/lib/utils";

interface AddCountryButtonProps {
  currentTier: CpmTier;
  assignedMap: Map<string, CpmTier>;
  onPick: (name: string) => void;
}

export function AddCountryButton({ currentTier, assignedMap, onPick }: AddCountryButtonProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const score = (c: CpmCountry): number => {
      if (!q) return 0;
      if (c.name === query) return 0;
      if (c.name.startsWith(query)) return 1;
      if (c.name.includes(query)) return 2;
      const aliasHit = c.aliases?.find((a) => a.toLowerCase().includes(q));
      if (aliasHit) return 3;
      return -1;
    };
    return CPM_COUNTRY_DICT.map((c) => ({ c, s: score(c) }))
      .filter(({ s }) => s >= 0)
      .sort((a, b) => a.s - b.s)
      .slice(0, 8)
      .map(({ c }) => c);
  }, [query]);

  const handlePick = (name: string) => {
    onPick(name);
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#ff4f00]/45 bg-[#fffefb] px-2.5 py-1 text-[11px] font-medium text-[#ff4f00] transition-colors hover:border-[#ff4f00]/80 hover:bg-[#fff7f4]"
      >
        <Plus className="h-3 w-3" />
        添加国家
      </button>
      {open ? (
        <div className="absolute left-0 z-30 mt-2 w-72 overflow-hidden rounded-2xl border border-[#c5c0b1] bg-[#fffefb] shadow-xl">
          <div className="flex items-center gap-2 border-b border-[#eceae3] px-3 py-2">
            <Search className="h-3.5 w-3.5 text-[#939084]" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="输入国家名（如：土耳）"
              className="w-full bg-transparent text-xs text-[#201515] placeholder:text-[#939084] focus:outline-none"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="rounded-full p-0.5 text-[#939084] transition-colors hover:bg-[#eceae3]"
              >
                <X className="h-3 w-3" />
              </button>
            ) : null}
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {suggestions.length === 0 ? (
              <div className="px-3 py-6 text-center text-[11px] text-[#939084]">
                未找到匹配的国家
              </div>
            ) : (
              suggestions.map((c) => {
                const assigned = assignedMap.get(c.name);
                const isHere = assigned === currentTier;
                return (
                  <button
                    key={c.name}
                    type="button"
                    disabled={isHere}
                    onClick={() => handlePick(c.name)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors",
                      isHere
                        ? "cursor-not-allowed text-[#939084]"
                        : "text-[#36342e] hover:bg-[#fff7f4]",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span aria-hidden className="text-base leading-none">
                        {c.flag}
                      </span>
                      <span className="font-medium text-[#201515]">{c.name}</span>
                      {c.aliases?.[0] ? (
                        <span className="text-[10px] text-[#939084]">{c.aliases[0]}</span>
                      ) : null}
                    </span>
                    {assigned ? (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px]",
                          isHere ? "bg-[#eceae3] text-[#939084]" : "bg-[#fff7f4] text-[#ff4f00]",
                        )}
                      >
                        {isHere ? "已在此档" : `${tierLabel(assigned)} → 迁移`}
                      </span>
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
