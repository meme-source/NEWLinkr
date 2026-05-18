"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getCreatorTopicSummary } from "./shared";

import { Button } from "@/components/ui/button";

export function CreatorTopicSummaryRow({
  topics,
  scrapeCount,
}: {
  topics: Array<{ label: string; weight: number }>;
  scrapeCount: number;
}) {
  const { primaryTopics, remainingTopics } = getCreatorTopicSummary(topics, scrapeCount);
  const [remainingTopicsOpen, setRemainingTopicsOpen] = useState(false);
  const remainingTopicsCloseTimerRef = useRef<number | null>(null);
  const remainingTopicsTriggerRef = useRef<HTMLButtonElement>(null);
  const [remainingTopicsTooltipPosition, setRemainingTopicsTooltipPosition] = useState<{
    left: number;
    maxWidth: number;
    placement: "top" | "bottom";
    top: number;
  } | null>(null);

  const updateRemainingTopicsTooltipPosition = () => {
    const rect = remainingTopicsTriggerRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const viewportPadding = 12;
    const tooltipWidth = Math.min(176, window.innerWidth - viewportPadding * 2);
    const estimatedTooltipHeight = remainingTopics.length * 18 + 24;
    const openAbove = rect.top >= estimatedTooltipHeight + viewportPadding;

    setRemainingTopicsTooltipPosition({
      left: Math.min(
        window.innerWidth - viewportPadding,
        Math.max(viewportPadding + tooltipWidth, rect.right),
      ),
      maxWidth: tooltipWidth,
      placement: openAbove ? "top" : "bottom",
      top: openAbove ? rect.top - 8 : rect.bottom + 8,
    });
  };

  const openRemainingTopics = () => {
    if (remainingTopicsCloseTimerRef.current !== null) {
      window.clearTimeout(remainingTopicsCloseTimerRef.current);
      remainingTopicsCloseTimerRef.current = null;
    }
    updateRemainingTopicsTooltipPosition();
    setRemainingTopicsOpen(true);
  };

  const closeRemainingTopics = () => {
    if (remainingTopicsCloseTimerRef.current !== null) {
      window.clearTimeout(remainingTopicsCloseTimerRef.current);
    }
    remainingTopicsCloseTimerRef.current = window.setTimeout(() => {
      setRemainingTopicsOpen(false);
      remainingTopicsCloseTimerRef.current = null;
    }, 120);
  };

  useEffect(() => {
    return () => {
      if (remainingTopicsCloseTimerRef.current !== null) {
        window.clearTimeout(remainingTopicsCloseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!remainingTopicsOpen) {
      return;
    }

    updateRemainingTopicsTooltipPosition();

    const handleViewportChange = () => {
      updateRemainingTopicsTooltipPosition();
    };

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [remainingTopicsOpen, remainingTopics.length]);

  if (primaryTopics.length === 0) {
    return null;
  }

  return (
    <div className="min-w-0">
      <div className="flex min-w-0 items-center gap-1 whitespace-nowrap">
        {primaryTopics.map((topic) => (
          <span key={topic.label} className="group relative min-w-0 flex-1 basis-0">
            <span
              tabIndex={0}
              className="inline-flex w-full min-w-0 items-center justify-center truncate rounded-full border border-[#c5c0b1] bg-[#fffefb] px-2 py-1 text-[10.5px] font-medium text-[#36342e] transition-colors outline-none hover:border-[#b5b2aa] hover:bg-[#eceae3] focus-visible:border-[#b5b2aa] focus-visible:bg-[#eceae3]"
            >
              {topic.label}
            </span>
            <span
              role="tooltip"
              className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-1.5 -translate-x-1/2 rounded-[8px] border border-[#c5c0b1] bg-[#fffefb] px-2.5 py-1.5 text-[10px] font-medium text-[#36342e] opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
            >
              共提及 {topic.mentions} 次
            </span>
          </span>
        ))}

        {remainingTopics.length > 0 ? (
          <div
            className="shrink-0"
            onMouseEnter={openRemainingTopics}
            onMouseLeave={closeRemainingTopics}
          >
            <Button
              unstyled
              ref={remainingTopicsTriggerRef}
              type="button"
              aria-expanded={remainingTopicsOpen}
              aria-label="展开剩余话题"
              onFocus={openRemainingTopics}
              onBlur={() => setRemainingTopicsOpen(false)}
              className="inline-flex items-center rounded-full border border-[#c5c0b1] bg-[#fffefb] px-2 py-1 text-[10.5px] font-semibold tracking-[0.06em] text-[#939084] transition-colors outline-none hover:border-[#b5b2aa] hover:bg-[#eceae3] focus-visible:border-[#b5b2aa] focus-visible:bg-[#eceae3]"
            >
              ...
            </Button>
          </div>
        ) : null}
      </div>
      {remainingTopics.length > 0 &&
      remainingTopicsOpen &&
      remainingTopicsTooltipPosition &&
      typeof document !== "undefined"
        ? createPortal(
            <div
              role="tooltip"
              onMouseEnter={openRemainingTopics}
              onMouseLeave={closeRemainingTopics}
              className="pointer-events-auto fixed z-[80] w-full rounded-[8px] border border-[#c5c0b1] bg-[#fffefb] px-2.5 py-2 text-[10px] leading-[1.55] whitespace-normal text-[#36342e]"
              style={{
                left: remainingTopicsTooltipPosition.left,
                maxWidth: remainingTopicsTooltipPosition.maxWidth,
                top: remainingTopicsTooltipPosition.top,
                transform:
                  remainingTopicsTooltipPosition.placement === "top"
                    ? "translate(-100%, -100%)"
                    : "translate(-100%, 0)",
                width: remainingTopicsTooltipPosition.maxWidth,
              }}
            >
              {remainingTopics.map((topic) => `${topic.label} ×${topic.mentions}`).join("；")}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
