import { cn } from "@/lib/utils";

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
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 border-b-2 px-1 pb-3 pt-1 text-sm font-semibold transition-colors",
        active
          ? "border-[#c96442] text-[#141413]"
          : "border-transparent text-[#87867f] hover:text-[#4d4c48]",
      )}
    >
      <Icon
        className={cn("h-4 w-4", active ? "text-[#c96442]" : "text-[#9b9a93]")}
      />
      {label}
    </button>
  );
}
