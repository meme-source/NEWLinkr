import { cn } from "@/lib/utils";

export function SidebarAction({
  text,
  primary,
  active,
  onClick,
}: {
  text: string;
  primary?: boolean;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex rounded-full px-3 py-2 text-xs font-medium transition-all duration-150 hover:-translate-y-0.5",
        primary
          ? "bg-[#c96442] text-[#faf9f5] hover:bg-[#d97757]"
          : active
            ? "border border-emerald-300/45 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            : "border border-[#e8e6dc] bg-white text-[#5e5d59] hover:bg-[#f5f4ed]",
      )}
    >
      {text}
    </button>
  );
}
