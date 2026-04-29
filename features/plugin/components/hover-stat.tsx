import type { ReactNode } from "react";

export function HoverStat({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-[#e8e6dc] bg-white px-3 py-1.5 text-[#4d4c48] transition-all duration-150 hover:border-[#d1cfc5] hover:bg-[#f5f4ed] hover:text-[#141413]">
      {children}
    </span>
  );
}
