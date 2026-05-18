"use client";

import { Star } from "lucide-react";
import type { Rating } from "@/types/api";
import { cn } from "@/lib/utils";

export const RATING_LABELS: Record<Rating, string> = {
  1: "一般",
  2: "良好",
  3: "优秀",
};

interface Props {
  value: Rating;
  size?: "sm" | "md";
  className?: string;
  // 不传 onChange 即只读展示。传了则点击第 N 颗星把评级设为 N。
  onChange?: (next: Rating) => void;
  ariaLabel?: string;
}

const SIZES = {
  sm: { star: "h-3 w-3", gap: "gap-0.5" },
  md: { star: "h-3.5 w-3.5", gap: "gap-0.5" },
} as const;

export function RatingStars({ value, size = "md", className, onChange, ariaLabel }: Props) {
  const { star, gap } = SIZES[size];
  const readonly = !onChange;
  const label = RATING_LABELS[value];

  return (
    <div
      className={cn("inline-flex items-center", gap, className)}
      title={label}
      aria-label={ariaLabel ?? `评级：${label}`}
      role={readonly ? "img" : "radiogroup"}
    >
      {[1, 2, 3].map((tier) => {
        const filled = tier <= value;
        const StarBtn = readonly ? "span" : "button";
        const tierLabel = RATING_LABELS[tier as Rating];
        return (
          <StarBtn
            key={tier}
            type={readonly ? undefined : "button"}
            onClick={readonly ? undefined : () => onChange(tier as Rating)}
            className={cn(
              "inline-flex items-center justify-center",
              !readonly && "cursor-pointer rounded p-0.5 transition-colors hover:bg-[#fff7f4]",
            )}
            aria-label={readonly ? undefined : `设为${tierLabel}`}
            role={readonly ? undefined : "radio"}
            aria-checked={readonly ? undefined : filled}
          >
            <Star
              className={cn(star, filled ? "text-[#ff4f00]" : "text-[#b5b2aa]")}
              fill={filled ? "currentColor" : "none"}
              strokeWidth={1.6}
            />
          </StarBtn>
        );
      })}
    </div>
  );
}
