"use client";

import { Star } from "lucide-react";

import type { AudienceProfile } from "@/types/api";

import { CURRENT_PALETTE, Section } from "./current-tab-ui";

const INTEREST_PALETTE = [
  CURRENT_PALETTE.primary,
  CURRENT_PALETTE.dark,
  CURRENT_PALETTE.coral,
  CURRENT_PALETTE.graphite,
  CURRENT_PALETTE.sand,
];

// 影响人群 + 购买影响力，同 Web CredibilityCard 口径。
export function CredibilitySection({
  credibility,
}: {
  credibility: AudienceProfile["credibility"];
}) {
  return (
    <Section title="营销影响力">
      <div className="space-y-2">
        <div className="rounded-[8px] border border-[#eceae3] bg-[#fffefb] px-3 py-3">
          <p className="text-[11.5px] font-semibold text-[#201515]">影响人群</p>
          <div className="mt-2.5 space-y-2.5">
            <InfluenceBar
              label="真实粉丝"
              value={credibility.authenticFans}
              color={CURRENT_PALETTE.dark}
            />
            <InfluenceBar
              label="对产品感兴趣"
              value={credibility.productInterest}
              color={CURRENT_PALETTE.primary}
            />
            <InfluenceBar
              label="正向评价粉丝"
              value={credibility.positiveSentiment}
              color={CURRENT_PALETTE.graphite}
            />
          </div>
        </div>
        <div className="rounded-[8px] border border-[#eceae3] bg-[#fffefb] px-3 py-3">
          <p className="text-[11.5px] font-semibold text-[#201515]">购买影响力</p>
          <div className="mt-2 divide-y divide-[#eceae3]">
            <StarRow label="信任度" value={credibility.trustScore} />
            <StarRow label="专业度" value={credibility.professionalismScore} />
            <StarRow label="受喜爱程度" value={credibility.affinityScore} />
          </div>
        </div>
      </div>
    </Section>
  );
}

function InfluenceBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.min(100, value * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between text-[11px]">
        <span className="text-[#36342e]">{label}</span>
        <span className="font-semibold text-[#201515] tabular-nums">{pct.toFixed(1)}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#eceae3]">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.max(2, pct)}%`, background: color }}
        />
      </div>
    </div>
  );
}

function StarRow({ label, value }: { label: string; value: number }) {
  const full = Math.floor(value);
  const hasHalf = value - full >= 0.5;
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 text-[11px]">
      <span className="text-[#36342e]">{label}</span>
      <span className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, index) => {
          const filled = index < full;
          const isHalf = !filled && index === full && hasHalf;
          return (
            <Star
              key={index}
              className="h-3.5 w-3.5"
              style={{
                fill: filled || isHalf ? CURRENT_PALETTE.primary : "transparent",
                color: filled || isHalf ? CURRENT_PALETTE.primary : "#c5c0b1",
              }}
            />
          );
        })}
        <span className="ml-1 font-semibold text-[#201515] tabular-nums">{value.toFixed(1)}</span>
      </span>
    </div>
  );
}

// 兴趣与情感：受众兴趣占比条，同 Web InterestsCard 内容口径（侧栏改用横向条）。
export function InterestsSection({ interests }: { interests: AudienceProfile["interests"] }) {
  if (interests.length === 0) return null;
  return (
    <Section title="兴趣与情感">
      <ul className="space-y-2 rounded-[8px] border border-[#eceae3] bg-[#fffefb] px-3 py-3">
        {interests.map((interest, index) => {
          const color = INTEREST_PALETTE[index % INTEREST_PALETTE.length];
          const pct = interest.share * 100;
          return (
            <li key={interest.name} className="space-y-1">
              <div className="flex items-baseline justify-between gap-2 text-[11.5px]">
                <span className="inline-flex items-center gap-1.5 text-[#201515]">
                  <span
                    aria-hidden
                    className="h-2 w-2 rounded-full"
                    style={{ background: color }}
                  />
                  <span className="font-medium">{interest.name}</span>
                  <span className="text-[10px] text-[#939084]">{interest.description}</span>
                </span>
                <span className="shrink-0 text-[#36342e] tabular-nums">{pct.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#eceae3]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(2, pct)}%`, background: color }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
