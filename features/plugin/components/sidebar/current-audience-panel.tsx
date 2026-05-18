"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Loader2, Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import type { CreatorProfile } from "@/features/plugin/types";
import { Button } from "@/components/ui/button";

import {
  buildPluginAudienceProfile,
  computePluginAudiencePrice,
  formatUsd,
} from "./current-audience-data";
import {
  AgeSection,
  GenderSection,
  OverviewSection,
  PriceEstimateSection,
  RegionSection,
} from "./current-audience-sections";
import { CredibilitySection, InterestsSection } from "./current-audience-extras";

const AUDIENCE_UNLOCK_COST = 2;
// 与 Web 端 tab-audience 的 analyzing 阶段保持一致的 mock 分析耗时。
const ANALYSIS_DURATION_MS = 1400;

interface AudiencePanelProps {
  creator: CreatorProfile;
  isUnlocked: boolean;
  onUnlock: () => void;
  onOpenWorkspace: () => void;
}

// 「受众分析」面板 — 与 Web 端受众数据 tab 内容逻辑一致：
// 锁定 → 分析中 → 解锁后展示 数据概览 / 性别 / 年龄 / 地区 / 营销影响力 / 兴趣。
// 解锁状态由父级 isUnlocked 单一持有；本地仅保留 analyzing 这个瞬时态。
export function AudiencePanel({
  creator,
  isUnlocked,
  onUnlock,
  onOpenWorkspace,
}: AudiencePanelProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const timerRef = useRef<number | null>(null);

  const profile = useMemo(() => buildPluginAudienceProfile(creator), [creator]);
  const price = useMemo(
    () => computePluginAudiencePrice(creator, profile.regions),
    [creator, profile.regions],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleUnlock = () => {
    if (analyzing || isUnlocked) return;
    setAnalyzing(true);
    timerRef.current = window.setTimeout(() => {
      setAnalyzing(false);
      onUnlock();
    }, ANALYSIS_DURATION_MS);
  };

  if (!isUnlocked) {
    return <AudienceGate analyzing={analyzing} onUnlock={handleUnlock} />;
  }

  return (
    <div className="space-y-4">
      <OverviewSection priceLabel={formatUsd(price.total)} profile={profile} />
      <GenderSection gender={profile.gender} />
      <AgeSection buckets={profile.ageBuckets} age17PlusShare={profile.age17PlusShare} />
      <RegionSection regions={profile.regions} />
      <PriceEstimateSection price={price} />
      <CredibilitySection credibility={profile.credibility} />
      <InterestsSection interests={profile.interests} />
      <Button
        unstyled
        type="button"
        onClick={onOpenWorkspace}
        className="inline-flex w-full items-center justify-center gap-1 rounded-[8px] border border-[#c5c0b1] bg-[#fffefb] py-2 text-[11.5px] text-[#36342e] transition-colors hover:border-[#ff4f00] hover:text-[#ff4f00]"
      >
        <ExternalLink className="h-3 w-3" />
        在工作台查看完整受众画像
      </Button>
    </div>
  );
}

function AudienceGate({ analyzing, onUnlock }: { analyzing: boolean; onUnlock: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-[8px] border border-[#c5c0b1] bg-[#fffefb]">
      <div aria-hidden className="space-y-3 p-4 opacity-30 blur-[3px]">
        <PlaceholderRow widthClass="w-1/3" />
        <PlaceholderRow widthClass="w-3/4" />
        <PlaceholderRow widthClass="w-2/3" />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-[rgba(255,254,251,0.86)] px-5 text-center">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full bg-[#fff1ea] text-[#ff4f00]",
            analyzing && "ring-2 ring-[#ff4f00]/30",
          )}
        >
          {analyzing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-4 w-4" />}
        </div>
        <div>
          <p className="text-[13.5px] font-semibold text-[#201515]">
            {analyzing ? "正在分析受众数据…" : "深度受众分析"}
          </p>
          <p className="mt-1 max-w-[260px] text-[11.5px] leading-[1.55] text-[#54514a]">
            {analyzing
              ? "正在调取内容样本、解析评论与粉丝画像，请稍候。"
              : "深扫互动粉丝、剔除水军，输出性别 / 年龄 / 地区 / 影响力 / 兴趣完整画像。"}
          </p>
        </div>
        <Button
          unstyled
          type="button"
          onClick={onUnlock}
          disabled={analyzing}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-[8px] bg-[#ff4f00] px-4 py-2 text-[12px] font-semibold text-[#fffefb] transition-transform hover:bg-[#ff4f00] active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
        >
          {analyzing ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              分析中…
            </>
          ) : (
            <>
              <Lock className="h-3.5 w-3.5" />
              消耗 {AUDIENCE_UNLOCK_COST} 积分解锁
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function PlaceholderRow({ widthClass }: { widthClass: string }) {
  return (
    <div className="space-y-1.5">
      <div className={`h-2 rounded-full bg-[#eceae3] ${widthClass}`} />
      <div className="h-10 rounded-[8px] bg-[#eceae3]" />
    </div>
  );
}
