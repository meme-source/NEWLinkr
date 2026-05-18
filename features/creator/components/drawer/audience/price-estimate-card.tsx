"use client";

import { Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { AudienceProfile, Creator } from "@/types/api";

import { TIER_LABEL, TIER_STYLE, computeAudiencePrice, formatUsd, formatViews } from "./pricing";

interface Props {
  creator: Creator;
  regions: AudienceProfile["regions"];
  onConfigure?: () => void;
}

export function PriceEstimateCard({ creator, regions, onConfigure }: Props) {
  const router = useRouter();
  const { bloggerTier, medianViews, lines, total } = computeAudiencePrice(creator, regions);

  const handleConfigure = () => {
    if (onConfigure) {
      onConfigure();
      return;
    }
    router.push("/workspace/settings?tab=cpm");
  };

  return (
    <div className="rounded-lg border border-[#c5c0b1] bg-[#fffefb] p-4">
      <div className="flex items-baseline justify-between">
        <p className="text-[13px] font-semibold text-[#201515]">根据受众分布预估报价</p>
        <p className="text-[10px] text-[#939084]">
          博主所在地档位 <span className="font-medium text-[#36342e]">{bloggerTier}</span>
        </p>
      </div>

      <div className="mt-3 flex flex-col items-center gap-2">
        <p className="text-[28px] font-bold text-[#201515] tabular-nums">{formatUsd(total)}</p>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {lines.map((line, idx) => (
            <div key={line.tier} className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tabular-nums ${TIER_STYLE[line.tier].pill} ${TIER_STYLE[line.tier].pillText}`}
              >
                {formatUsd(line.value)}
              </span>
              {idx < lines.length - 1 && <span className="text-[11px] text-[#939084]">+</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-baseline justify-between">
          <p className="text-[12px] font-semibold text-[#201515]">计算逻辑</p>
          <Button
            unstyled
            type="button"
            onClick={handleConfigure}
            className="inline-flex items-center gap-1 text-[11px] text-[#ff4f00] hover:underline"
          >
            <Settings2 className="h-3 w-3" />
            设置各地区 CPM
          </Button>
        </div>
        <p className="mt-1.5 text-[11px] text-[#939084]">
          该博主中位数播放：
          <span className="ml-1 font-medium text-[#36342e] tabular-nums">
            {formatViews(medianViews)}
          </span>
        </p>
        <ul className="mt-2 space-y-1.5 text-[11px] text-[#36342e]">
          {lines.map((line) => (
            <li key={line.tier} className="flex items-center justify-between gap-2">
              <span className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5 tabular-nums">
                <span>{TIER_LABEL[line.tier]}地区播放价值：</span>
                <span>
                  {formatViews(medianViews)} × {(line.share * 100).toFixed(2)}% ×
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-1.5 py-0 text-[10px] font-medium ${TIER_STYLE[line.tier].chipBg} ${TIER_STYLE[line.tier].chipText}`}
                  title="该 tier 当前 CPM，可在 Settings → CPM 设置中修改"
                >
                  {formatUsd(line.cpm)}
                </span>
                <span>=</span>
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${TIER_STYLE[line.tier].pill} ${TIER_STYLE[line.tier].pillText}`}
              >
                {formatUsd(line.value)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
