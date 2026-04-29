import { cn } from "@/lib/utils";

export function SideNavItem({ label, active }: { label: string; active?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", active ? "text-[#141413]" : "text-[#87867f]")}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      <span>{label}</span>
    </div>
  );
}
