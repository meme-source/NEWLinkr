"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { EMAIL_PERSONALIZED_HIGHLIGHT_CLASSES, SIDEBAR_CARD_RADIUS } from "./shared";
import type { EmailTemplateSegment } from "@/features/plugin/types";
import { Button } from "@/components/ui/button";

export function SidebarMetricInline({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 text-center transition-colors hover:bg-[#fffdf9]">
      <div className="inline-flex items-center gap-1 text-[10.5px] text-[#939084]">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="text-[13px] leading-tight font-semibold text-[#201515]">{value}</div>
    </div>
  );
}

export function SidebarCollapsibleSection({
  icon: Icon,
  title,
  open,
  onToggle,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={`${SIDEBAR_CARD_RADIUS} overflow-hidden border border-[#c5c0b1] bg-[#fffefb]`}>
      <Button
        unstyled
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-[#fffdf9]"
      >
        <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#201515]">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#eceae3] text-[#ff4f00]">
            <Icon className="h-3.5 w-3.5" />
          </span>
          {title}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-[#939084] transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </Button>
      {open ? <div className="border-t border-[#eceae3] px-3 py-3">{children}</div> : null}
    </div>
  );
}

export function SidebarContentTabButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      unstyled
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-1 pt-1 pb-3 text-sm font-semibold transition-colors",
        active ? "text-[#201515]" : "text-[#939084] hover:text-[#36342e]",
      )}
    >
      <Icon className={cn("h-4 w-4", active ? "text-[#ff4f00]" : "text-[#939084]")} />
      {label}
    </Button>
  );
}

export function AudienceHighlightBar({
  label,
  pct,
  flag,
  flags,
}: {
  label: string;
  pct: number;
  flag?: string;
  flags?: string[];
}) {
  const visibleFlags = flags && flags.length > 0 ? flags : flag ? [flag] : [];

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="flex items-center gap-1 text-[#36342e]">
          {label}
          {visibleFlags.length > 0 ? (
            <span className="ml-1 inline-flex items-center">
              {visibleFlags.map((item, index) => (
                <span
                  key={`${label}-${item}-${index}`}
                  className={cn(
                    "inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#fffefb] bg-[#fffdf9] text-[11px] leading-none",
                    index > 0 && "-ml-1.5",
                  )}
                >
                  {item}
                </span>
              ))}
            </span>
          ) : null}
        </span>
        <span className="font-semibold text-[#201515]">{pct}%</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#c5c0b1]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#ff4f00] to-[#ff4f00]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function HighlightedEmailPreview({
  segments,
  emptyLabel,
  compact = false,
}: {
  segments: EmailTemplateSegment[];
  emptyLabel: string;
  compact?: boolean;
}) {
  if (segments.length === 0) {
    return (
      <div className="rounded-[8px] border border-dashed border-[#b5b2aa] bg-[#fffefb] px-3 py-5 text-center text-sm text-[#939084]">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-[8px] border border-[#eceae3] bg-[#fffefb] break-words whitespace-pre-wrap text-[#201515]",
        compact ? "px-3 py-2.5 text-[12px] leading-5" : "min-h-[140px] px-3 py-3 text-sm leading-6",
      )}
    >
      {segments.map((segment, index) => (
        <span
          key={`${index}-${segment.text.slice(0, 10)}`}
          className={cn(segment.personalized && EMAIL_PERSONALIZED_HIGHLIGHT_CLASSES)}
        >
          {segment.text}
        </span>
      ))}
    </div>
  );
}
