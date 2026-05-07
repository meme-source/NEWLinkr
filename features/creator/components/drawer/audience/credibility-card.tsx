import { Star, ThumbsUp } from "lucide-react";

import type { AudienceProfile } from "@/types/api";

// 影响人群（左侧三条进度条）+ 购买影响力（右侧三档星级）。
// 截图里左右两栏并排；这里在窄屏下竖排。
export function CredibilityCard({ credibility }: { credibility: AudienceProfile["credibility"] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-2xl border border-[#c5c0b1] bg-[#fffefb] p-4">
        <p className="text-[13px] font-semibold text-[#201515]">影响人群</p>
        <div className="mt-3 space-y-3">
          <Bar label="真实粉丝" value={credibility.authenticFans} color="#2f6bff" emoji="💗" />
          <Bar
            label="对产品感兴趣粉丝"
            value={credibility.productInterest}
            color="#e91e63"
            emoji="🥰"
          />
          <Bar
            label="正向评价的粉丝"
            value={credibility.positiveSentiment}
            color="#13a07a"
            emoji="🥰"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-[#c5c0b1] bg-[#fffefb] p-4">
        <p className="text-[13px] font-semibold text-[#201515]">购买影响力</p>
        <div className="mt-3 space-y-3 text-[12px]">
          <Stars label="信任度" value={credibility.trustScore} />
          <Stars label="专业度" value={credibility.professionalismScore} />
          <Stars label="受喜爱程度" value={credibility.affinityScore} />
        </div>
      </div>
    </div>
  );
}

function Bar({
  label,
  value,
  color,
  emoji,
}: {
  label: string;
  value: number;
  color: string;
  emoji: string;
}) {
  const pct = (value * 100).toFixed(2);
  return (
    <div className="rounded-xl bg-[#fdf6ee] p-3">
      <div className="flex items-baseline justify-between">
        <p className="text-[11px] text-[#36342e]">{label}</p>
        <span className="text-[12px]" aria-hidden>
          {emoji}
        </span>
      </div>
      <p className="mt-0.5 text-[18px] font-bold text-[#201515] tabular-nums">{pct}%</p>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#eceae3]">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.max(2, value * 100)}%`, background: color }}
        />
      </div>
    </div>
  );
}

function Stars({ label, value }: { label: string; value: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <div className="flex items-center justify-between gap-2 border-b border-[#eceae3] pb-2 last:border-b-0 last:pb-0">
      <span className="text-[#36342e]">{label}</span>
      <span className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => {
          const filled = i < full;
          const isHalf = !filled && i === full && half;
          return (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${
                filled || isHalf ? "fill-[#e91e63] text-[#e91e63]" : "text-[#c5c0b1]"
              }`}
            />
          );
        })}
        <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-[#dff5ec] px-1.5 py-0.5 text-[10px] text-[#13a07a]">
          <ThumbsUp className="h-3 w-3" /> 优秀
        </span>
      </span>
    </div>
  );
}
