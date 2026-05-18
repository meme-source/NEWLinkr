import { Star, ThumbsUp } from "lucide-react";

import type { AudienceProfile } from "@/types/api";

import { CHART, CHART_BG } from "./chart-palette";
import { InfoTooltip } from "./info-tooltip";

// 影响人群（左侧三条进度条）+ 购买影响力（右侧三档星级）。
// 截图里左右两栏并排；这里在窄屏下竖排。
export function CredibilityCard({ credibility }: { credibility: AudienceProfile["credibility"] }) {
  const s = credibility.summaries ?? {};
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-lg border border-[#c5c0b1] bg-[#fffefb] p-4">
        <p className="text-[13px] font-semibold text-[#201515]">影响人群</p>
        <div className="mt-3 space-y-3">
          <Bar
            label="真实粉丝"
            hint="评论里有真情实感、贴近生活的互动，判定为真实粉丝。"
            value={credibility.authenticFans}
            color={CHART.dark}
            emoji="💗"
          />
          <Bar
            label="对产品感兴趣粉丝"
            hint="评论中讨论产品性能、使用感受，判定为对产品有兴趣。"
            value={credibility.productInterest}
            color={CHART.primary}
            emoji="🥰"
          />
          <Bar
            label="正向评价的粉丝"
            hint="对博主或推荐产品流露出喜爱、肯定的评论，计入正向情绪。"
            value={credibility.positiveSentiment}
            color={CHART.graphite}
            emoji="🥰"
          />
        </div>
      </div>

      <div className="rounded-lg border border-[#c5c0b1] bg-[#fffefb] p-4">
        <p className="text-[13px] font-semibold text-[#201515]">购买影响力</p>
        <div className="mt-3 space-y-3 text-[12px]">
          <Stars
            label="信任度"
            hint="评论中频繁出现「真实、客观、可信」等正面认可，得分越高。"
            summary={s.trustScore}
            value={credibility.trustScore}
          />
          <Stars
            label="专业度"
            hint="评论里常提到「专业、学到东西」，反映博主在该领域积累较深。"
            summary={s.professionalismScore}
            value={credibility.professionalismScore}
          />
          <Stars
            label="受喜爱程度"
            hint="大量评论表达喜欢博主风格 / 内容，反映粉丝粘性较强。"
            summary={s.affinityScore}
            value={credibility.affinityScore}
          />
        </div>
      </div>
    </div>
  );
}

function Bar({
  label,
  hint,
  value,
  color,
  emoji,
}: {
  label: string;
  hint: string;
  value: number;
  color: string;
  emoji: string;
}) {
  const pct = (value * 100).toFixed(2);
  return (
    <div className="rounded-lg bg-[#fdf6ee] p-3">
      <div className="flex items-baseline justify-between">
        <p className="inline-flex items-center gap-1 text-[11px] text-[#36342e]">
          {label}
          <InfoTooltip text={hint} />
        </p>
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

function Stars({
  label,
  hint,
  summary,
  value,
}: {
  label: string;
  hint: string;
  summary?: string;
  value: number;
}) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <div className="space-y-1 border-b border-[#eceae3] pb-2 last:border-b-0 last:pb-0">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-[#36342e]">
          {label}
          <InfoTooltip text={hint} />
        </span>
        <span className="flex items-center gap-1">
          {Array.from({ length: 5 }, (_, i) => {
            const filled = i < full;
            const isHalf = !filled && i === full && half;
            return (
              <Star
                key={i}
                className="h-3.5 w-3.5"
                style={{
                  fill: filled || isHalf ? CHART.primary : "transparent",
                  color: filled || isHalf ? CHART.primary : "#c5c0b1",
                }}
              />
            );
          })}
          <span
            className="ml-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px]"
            style={{ background: CHART_BG.primary, color: CHART.primary }}
          >
            <ThumbsUp className="h-3 w-3" /> 优秀
          </span>
        </span>
      </div>
      {summary ? <p className="text-[11px] leading-snug text-[#939084]">{summary}</p> : null}
    </div>
  );
}
