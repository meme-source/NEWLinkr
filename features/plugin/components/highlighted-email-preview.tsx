import { cn } from "@/lib/utils";
import type { EmailTemplateSegment } from "@/features/plugin/types";

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
      <div className="rounded-[16px] border border-dashed border-[#ddd9ce] bg-white px-3 py-5 text-center text-sm text-[#87867f]">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "whitespace-pre-wrap break-words rounded-[16px] border border-[#efe6d7] bg-white text-[#141413]",
        compact
          ? "px-3 py-2.5 text-[12px] leading-5"
          : "min-h-[140px] px-3 py-3 text-sm leading-6",
      )}
    >
      {segments.map((segment, index) => (
        <span
          key={`${index}-${segment.text.slice(0, 10)}`}
          className={cn(
            segment.personalized &&
              "rounded-[5px] bg-[#fff2a8] px-0.5 font-semibold text-[#624c0b] ring-1 ring-[#edd36b]/70",
          )}
        >
          {segment.text}
        </span>
      ))}
    </div>
  );
}
