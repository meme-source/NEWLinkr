import { HelpCircle } from "lucide-react";

interface Props {
  text: string;
  // 紧贴卡片顶部的标题用 below，紧贴底部的标题用 above。
  position?: "below" | "above";
}

// 标题旁的"?"图标，hover 时浮出一段补充说明。
// 用纯 CSS group-hover 实现，避免额外引入 tooltip 库。
export function InfoTooltip({ text, position = "below" }: Props) {
  return (
    <span className="group relative inline-flex align-middle">
      <HelpCircle
        className="h-3 w-3 cursor-help text-[#939084] transition-colors group-hover:text-[#36342e]"
        aria-label="说明"
      />
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-0 z-20 w-max max-w-[14rem] rounded-lg border border-[#c5c0b1] bg-[#fffefb] px-2 py-1.5 text-[10px] leading-relaxed text-[#36342e] opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 ${
          position === "above" ? "bottom-full mb-1.5" : "top-full mt-1.5"
        }`}
      >
        {text}
      </span>
    </span>
  );
}
