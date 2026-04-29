import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { SIDEBAR_CARD_RADIUS } from "@/features/plugin/lib/style-constants";

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
    <div
      className={`${SIDEBAR_CARD_RADIUS} overflow-hidden border border-[#e8e6dc] bg-white`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-[#faf9f5]"
      >
        <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#141413]">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#f5f4ed] text-[#c96442]">
            <Icon className="h-3.5 w-3.5" />
          </span>
          {title}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-[#87867f] transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <div className="border-t border-[#ececec] px-3 py-3">{children}</div>
      ) : null}
    </div>
  );
}
