import { cn } from "@/lib/utils";

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
        <span className="flex items-center gap-1 text-[#5e5d59]">
          {label}
          {visibleFlags.length > 0 ? (
            <span className="ml-1 inline-flex items-center">
              {visibleFlags.map((item, index) => (
                <span
                  key={`${label}-${item}-${index}`}
                  className={cn(
                    "inline-flex h-5 w-5 items-center justify-center rounded-full border border-white bg-[#faf9f5] text-[11px] leading-none shadow-sm",
                    index > 0 && "-ml-1.5",
                  )}
                >
                  {item}
                </span>
              ))}
            </span>
          ) : null}
        </span>
        <span className="font-semibold text-[#141413]">{pct}%</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#e8e6dc]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#c96442] to-[#d97757]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
