import { cn } from "@/lib/utils";

export function SidebarCreatorTypeTag({
  type,
  compact = false,
}: {
  type: string;
  compact?: boolean;
}) {
  return (
    <span
      aria-label={`博主类型 ${type}`}
      title={type}
      className={cn(
        "inline-flex items-center rounded-full border border-[#eddcca] bg-[linear-gradient(180deg,#fff8ef_0%,#f7ecdf_100%)] text-[#9a6538] shadow-[0_1px_2px_rgba(154,101,56,0.08)]",
        compact ? "h-5 px-2" : "h-[22px] px-2.5",
      )}
    >
      <span
        className={cn(
          "font-medium leading-none",
          compact ? "text-[10px]" : "text-[11px]",
        )}
      >
        {type}
      </span>
    </span>
  );
}
