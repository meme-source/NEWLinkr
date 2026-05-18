"use client";

import { useEffect, useRef, useState } from "react";
import { BarChart3, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import type { CurrentDetailTab } from "@/features/plugin/types";

const TABS = [
  { key: "pricing", label: "内容数据", icon: BarChart3 },
  { key: "audience", label: "受众分析", icon: Users },
] as const satisfies ReadonlyArray<{
  key: CurrentDetailTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}>;

// 「内容数据 / 受众分析」顶栏：方块状分段控件 —— 暖灰底轨道内嵌一块奶白滑块，
// 随激活 tab 平滑滑动（位移 + 宽度同时过渡）。取代旧的线性下划线指示条；
// 圆角控制在 8 / 6px，与数据卡片同源，避免过圆。
export function CurrentTabBar({
  value,
  onChange,
}: {
  value: CurrentDetailTab;
  onChange: (next: CurrentDetailTab) => void;
}) {
  const tabRefs = useRef<Partial<Record<CurrentDetailTab, HTMLButtonElement | null>>>({});
  const [thumb, setThumb] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  useEffect(() => {
    const measure = () => {
      const el = tabRefs.current[value];
      if (el) setThumb({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [value]);

  return (
    <div
      className="relative z-0 flex w-full items-center rounded-[8px] bg-[#eceae3] p-1"
      role="tablist"
    >
      {/* 滑块：奶白方块，长度与位移随激活 tab 平滑过渡。 */}
      <span
        aria-hidden
        className="absolute inset-y-1 left-0 rounded-[6px] border border-[#e3ddcd] bg-[#fffefb] shadow-[0_1px_2px_rgba(20,20,19,0.06)] transition-[width,translate] duration-200 ease-out"
        style={{ width: thumb.width, translate: `${thumb.left}px 0` }}
      />
      {TABS.map((tab) => {
        const active = tab.key === value;
        const Icon = tab.icon;
        return (
          <button
            key={tab.key}
            ref={(node) => {
              tabRefs.current[tab.key] = node;
            }}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.key)}
            className={cn(
              "relative z-10 flex h-8 flex-1 shrink-0 cursor-pointer items-center justify-center gap-1.5 px-3",
              "text-sm font-medium whitespace-nowrap transition-colors duration-150 outline-none",
              active ? "text-[#201515]" : "text-[#939084] hover:text-[#36342e]",
            )}
          >
            <Icon className={cn("h-4 w-4 transition-colors", active && "text-[#ff4f00]")} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
