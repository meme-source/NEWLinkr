"use client";

import { Lock, Sparkles } from "lucide-react";
import { useState } from "react";

import type { Creator } from "@/types/api";

import { AgeCard } from "./audience/age-card";
import { CredibilityCard } from "./audience/credibility-card";
import { GenderCard } from "./audience/gender-card";
import { InterestsCard } from "./audience/interests-card";
import { RegionCard } from "./audience/region-card";
import { SampleCard } from "./audience/sample-card";

interface Props {
  creator: Creator;
}

const UNLOCK_COST = 50;

// 「受众数据」tab：默认锁定，点击解锁后展开 audienceAnalysis。
// Phase 1+ 接通积分系统时把 setUnlocked 替换为后端 mutation。
export function TabAudience({ creator }: Props) {
  const profile = creator.audienceAnalysis;
  const [unlocked, setUnlocked] = useState(false);

  if (!profile) {
    // 没有受众分析数据 → 显示"该博主尚未做过深度分析" + 解锁 CTA。
    return <UnlockedShell variant="empty" cost={UNLOCK_COST} onUnlock={() => undefined} />;
  }

  if (!unlocked) {
    return <UnlockedShell variant="locked" cost={UNLOCK_COST} onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <SampleCard sample={profile.sample} />
        <GenderCard gender={profile.gender} />
      </div>
      <AgeCard buckets={profile.ageBuckets} age17PlusShare={profile.age17PlusShare} />
      <RegionCard regions={profile.regions} />
      <CredibilityCard credibility={profile.credibility} />
      <InterestsCard interests={profile.interests} />
    </div>
  );
}

function UnlockedShell({
  variant,
  cost,
  onUnlock,
}: {
  variant: "locked" | "empty";
  cost: number;
  onUnlock: () => void;
}) {
  const empty = variant === "empty";
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#c5c0b1] bg-[#fffefb]">
      <div
        aria-hidden
        className="grid gap-3 p-4 opacity-30 blur-[3px]"
        style={{ filter: "saturate(0.6)" }}
      >
        <PlaceholderRow widthClass="w-1/3" />
        <PlaceholderRow widthClass="w-3/4" />
        <PlaceholderRow widthClass="w-2/3" />
        <PlaceholderRow widthClass="w-1/2" />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[rgba(255,254,251,0.85)] px-6 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-[#fff7f4] text-[#ff4f00]">
          <Lock className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-[#201515]">深度受众分析</p>
          <p className="mt-1 max-w-xs text-[12px] leading-relaxed text-[#36342e]">
            {empty
              ? "该博主尚未发起深度受众分析。点击下方解锁后将启动一次分析（消耗积分），完成后可查看性别 / 年龄 / 地区 / 营销影响力等数据。"
              : "解锁后查看性别 / 年龄 / 地区 / 影响力 / 兴趣等完整受众画像。"}
          </p>
        </div>
        <button
          type="button"
          onClick={onUnlock}
          disabled={empty}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#ff4f00] px-4 py-1.5 text-[12px] font-semibold text-[#fffefb] transition-colors hover:bg-[#ff4f00] disabled:cursor-not-allowed disabled:bg-[#c5c0b1]"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {empty ? `发起深度分析（消耗 ${cost} 积分）` : `消耗 ${cost} 积分解锁`}
        </button>
        {!empty && (
          <p className="text-[10px] text-[#939084]">
            解锁仅展示 mock 数据；生产环境会调用 /api/audience/unlock。
          </p>
        )}
      </div>
    </div>
  );
}

function PlaceholderRow({ widthClass }: { widthClass: string }) {
  return (
    <div className="space-y-2">
      <div className={`h-2 rounded-full bg-[#eceae3] ${widthClass}`} />
      <div className="h-12 rounded-2xl bg-[#eceae3]" />
    </div>
  );
}
