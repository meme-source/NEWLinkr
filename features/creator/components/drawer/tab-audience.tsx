"use client";

import { Loader2, Lock, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type { AudienceProfile, Creator } from "@/types/api";
import { cn } from "@/lib/utils";

import { AgeCard } from "./audience/age-card";
import { CredibilityCard } from "./audience/credibility-card";
import { pickCredibilitySummaries } from "./audience/credibility-summary";
import { GenderCard } from "./audience/gender-card";
import { InterestsCard } from "./audience/interests-card";
import { OverviewCard } from "./audience/overview-card";
import { PriceEstimateCard } from "./audience/price-estimate-card";
import { RegionCard } from "./audience/region-card";

interface Props {
  creator: Creator;
  onToast?: (msg: string) => void;
}

const UNLOCK_COST = 50;
// 模拟 mock 分析耗时；Phase 2 接 /api/audience/unlock 时换成轮询或流式。
const ANALYSIS_DURATION_MS = 1600;

type Phase = "idle" | "analyzing" | "unlocked";

// 「受众数据」tab：默认锁定，点击解锁触发 analyzing 阶段（spinner + 倒计时），
// 模拟分析完成后展开 audienceAnalysis。
// 没有数据的博主走同一条路径：点「发起深度分析」→ analyzing → 显示 mock 数据。
export function TabAudience({ creator, onToast }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");

  // 没有 profile 的博主分析完成后用合成数据顶上，避免空 tab。
  // Phase 2 接入真实分析后改成读 server 返回的 profile。
  const profile = useMemo<AudienceProfile>(
    () => creator.audienceAnalysis ?? buildFallbackProfile(creator),
    [creator],
  );

  useEffect(() => {
    if (phase !== "analyzing") return;
    const id = window.setTimeout(() => {
      setPhase("unlocked");
      onToast?.("深度受众分析完成");
    }, ANALYSIS_DURATION_MS);
    return () => window.clearTimeout(id);
  }, [phase, onToast]);

  const handleUnlock = () => {
    setPhase("analyzing");
    onToast?.(`已扣除 ${UNLOCK_COST} 积分，开始分析…`);
  };

  if (phase === "unlocked") {
    return (
      <div className="space-y-4">
        <OverviewCard creator={creator} profile={profile} />
        <div className="grid gap-3 md:grid-cols-[1fr_2fr]">
          <GenderCard gender={profile.gender} />
          <AgeCard buckets={profile.ageBuckets} age17PlusShare={profile.age17PlusShare} />
        </div>
        <RegionCard regions={profile.regions} />
        <PriceEstimateCard creator={creator} regions={profile.regions} />
        <CredibilityCard credibility={profile.credibility} />
        <InterestsCard interests={profile.interests} />
      </div>
    );
  }

  const variant: "empty" | "locked" = creator.audienceAnalysis ? "locked" : "empty";
  return (
    <UnlockedShell
      variant={variant}
      cost={UNLOCK_COST}
      analyzing={phase === "analyzing"}
      onUnlock={handleUnlock}
    />
  );
}

// 合成 mock 受众画像：当 creator.audienceAnalysis 为 null 时使用，让交互闭环。
// 数值参考美妆/护肤这类典型博主的分布，并基于 creator.id 做轻量伪随机扰动，
// 让不同博主之间的画像有差异，避免每张卡看起来一模一样。
function buildFallbackProfile(creator: Creator): AudienceProfile {
  const seed = stringToSeed(creator.id);
  const rand = (offset: number) => pseudoRandom(seed + offset);
  const female = clamp(0.55 + rand(1) * 0.25, 0.4, 0.85);
  const male = 1 - female;

  // 7 个年龄段（13-17 ... 65+），按性别拆分；和值 ≈ 1。
  const rawShares = [0.155, 0.45, 0.21, 0.1, 0.055, 0.025, 0.005].map(
    (base, i) => base * (0.85 + rand(10 + i) * 0.3),
  );
  const total = rawShares.reduce((acc, v) => acc + v, 0);
  const normalized = rawShares.map((v) => v / total);
  const ranges = ["13-17", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"] as const;
  const ageBuckets = normalized.map((share, i) => ({
    range: ranges[i],
    female: share * female,
    male: share * male,
  }));
  const age17PlusShare = ageBuckets.slice(1).reduce((acc, b) => acc + b.female + b.male, 0);

  return {
    sample: {
      videosAnalyzed: 10,
      commentersCollected: 1200 + Math.round(rand(2) * 600),
      followersCollected: 5000,
      totalUsers: 6200 + Math.round(rand(3) * 900),
    },
    gender: { female, male },
    ageBuckets,
    age17PlusShare,
    regions: [
      { code: "US", name: "美国", tier: "T1", share: 0.32 + rand(20) * 0.08 },
      { code: "GB", name: "英国", tier: "T1", share: 0.08 + rand(21) * 0.04 },
      { code: "CA", name: "加拿大", tier: "T1", share: 0.06 + rand(22) * 0.03 },
      { code: "AU", name: "澳大利亚", tier: "T1", share: 0.05 + rand(23) * 0.03 },
      { code: "PH", name: "菲律宾", tier: "T2", share: 0.05 + rand(24) * 0.04 },
      { code: "BR", name: "巴西", tier: "T2", share: 0.04 + rand(25) * 0.03 },
      { code: "MX", name: "墨西哥", tier: "T2", share: 0.03 + rand(26) * 0.02 },
    ],
    interests: [
      { name: "时尚", description: "穿搭、品牌合作", share: 0.28 },
      { name: "美妆", description: "化妆、护肤教程", share: 0.22 },
      { name: "生活方式", description: "Vlog、日常分享", share: 0.18 },
      { name: "美食", description: "餐厅打卡、家常菜", share: 0.16 },
      { name: "旅行", description: "目的地、酒店", share: 0.16 },
    ],
    credibility: {
      authenticFans: 0.78 + rand(30) * 0.15,
      productInterest: 0.62 + rand(31) * 0.2,
      positiveSentiment: 0.74 + rand(32) * 0.18,
      trustScore: 3.5 + rand(33) * 1.4,
      professionalismScore: 3.6 + rand(34) * 1.3,
      affinityScore: 3.8 + rand(35) * 1.2,
      summaries: pickCredibilitySummaries(creator.id),
    },
  };
}

function stringToSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

function pseudoRandom(seed: number): number {
  // 简单 LCG，仅用于 mock 数据扰动，不需要密码学强度。
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function UnlockedShell({
  variant,
  cost,
  analyzing,
  onUnlock,
}: {
  variant: "locked" | "empty";
  cost: number;
  analyzing: boolean;
  onUnlock: () => void;
}) {
  const empty = variant === "empty";
  return (
    <div className="relative overflow-hidden rounded-lg border border-[#c5c0b1] bg-[#fffefb]">
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
        <div
          className={cn(
            "grid h-12 w-12 place-items-center rounded-full bg-[#fff7f4] text-[#ff4f00]",
            analyzing && "ring-2 ring-[#ff4f00]/30",
          )}
        >
          {analyzing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
        </div>
        <div>
          <p className="text-[14px] font-semibold text-[#201515]">
            {analyzing ? "正在分析受众数据…" : "深度受众分析"}
          </p>
          <p className="mt-1 max-w-xs text-[12px] leading-relaxed text-[#36342e]">
            {analyzing
              ? "正在调取近期内容样本、解析评论与粉丝画像，请稍候。"
              : empty
                ? "该博主尚未发起深度受众分析。点击下方按钮启动一次分析（消耗积分），完成后可查看性别 / 年龄 / 地区 / 营销影响力等数据。"
                : "解锁后查看性别 / 年龄 / 地区 / 影响力 / 兴趣等完整受众画像。"}
          </p>
        </div>
        <Button
          unstyled
          type="button"
          onClick={onUnlock}
          disabled={analyzing}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#ff4f00] px-4 py-1.5 text-[12px] font-semibold text-[#fffefb] transition-colors hover:bg-[#ff4f00] disabled:cursor-wait disabled:opacity-70"
        >
          {analyzing ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              分析中…
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              {empty ? `发起深度分析（消耗 ${cost} 积分）` : `消耗 ${cost} 积分解锁`}
            </>
          )}
        </Button>
        <p className="text-[10px] text-[#939084]">
          {analyzing
            ? "首次分析约 30–60 秒（mock 环境会瞬间完成）。"
            : "解锁仅展示 mock 数据；生产环境会调用 /api/audience/unlock。"}
        </p>
      </div>
    </div>
  );
}

function PlaceholderRow({ widthClass }: { widthClass: string }) {
  return (
    <div className="space-y-2">
      <div className={`h-2 rounded-full bg-[#eceae3] ${widthClass}`} />
      <div className="h-12 rounded-lg bg-[#eceae3]" />
    </div>
  );
}
