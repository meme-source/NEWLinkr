import { cn } from "@/lib/utils";

export function FloatingStatCell({
  icon: Icon,
  iconClassName,
  label,
  value,
  borderTop,
  borderRight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconClassName?: string;
  label: string;
  value: string;
  borderTop?: boolean;
  borderRight?: boolean;
}) {
  return (
    <div
      className={cn(
        "px-3 py-3 flex flex-col items-center text-center",
        borderTop && "border-t border-[#e8e6dc]",
        borderRight && "border-r border-[#e8e6dc]",
      )}
    >
      <div className="flex items-center gap-1 text-xs font-medium text-[#87867f]">
        <Icon className={cn("h-3.5 w-3.5", iconClassName)} />
        {label}
      </div>
      <div className="mt-1.5 text-lg font-semibold tracking-tight text-[#1f2937]">
        {value}
      </div>
    </div>
  );
}
