import { cn } from "@/lib/utils";

export function SidebarLocationInline({
  flag,
  country,
  compact = false,
}: {
  flag: string;
  country: string;
  compact?: boolean;
}) {
  return (
    <span
      aria-label={`地区 ${country}`}
      title={country}
      className={cn(
        "inline-flex items-center rounded-full border border-[#e8e6dc] bg-[linear-gradient(180deg,#ffffff_0%,#fbf8f2_100%)] text-[#4d4c48] shadow-[0_1px_2px_rgba(20,20,19,0.04)]",
        compact ? "h-5 gap-1 px-2" : "h-[22px] gap-1.5 px-2.5",
      )}
    >
      <span
        className={cn(
          "leading-none",
          compact ? "text-[11px]" : "text-[12px]",
        )}
      >
        {flag}
      </span>
      <span
        className={cn(
          "font-medium leading-none text-[#4d4c48]",
          compact ? "text-[10px]" : "text-[11px]",
        )}
      >
        {country}
      </span>
    </span>
  );
}
