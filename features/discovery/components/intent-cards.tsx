"use client";

import { Button } from "@/components/ui/button";

import type { ChatIntent } from "../chat-types";
import { INTENT_HERO, INTENT_ORDER } from "../data/intent-hero";
import { T } from "../data/tokens";

interface IntentCardsProps {
  intent: ChatIntent;
  onIntentChange: (next: ChatIntent) => void;
}

// 入口卡片：2×2 网格，挂在 InputArea 下方。点击只切换 intent；
// editorState（用户已输入的产品/品牌/时间窗）保持不变。
export function IntentCards({ intent, onIntentChange }: IntentCardsProps) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      {INTENT_ORDER.map((id) => {
        const spec = INTENT_HERO[id];
        const active = id === intent;
        return (
          <Button
            unstyled
            key={id}
            type="button"
            onClick={() => onIntentChange(id)}
            aria-pressed={active}
            className="group relative flex min-h-[112px] flex-col items-start overflow-hidden rounded-lg border px-5 pt-4 pb-5 text-left transition-all duration-200 hover:-translate-y-[1px]"
            style={{
              backgroundColor: active ? "#fff7f2" : "white",
              borderColor: active ? T.terracotta : T.border,
              boxShadow: active
                ? "0 12px 28px -18px rgba(255,79,0,0.32)"
                : "0 6px 18px -12px rgba(20,20,19,0.08)",
            }}
          >
            <span
              className="text-[15.5px] leading-[1.3] font-semibold tracking-[-0.012em]"
              style={{ color: T.nearBlack }}
            >
              {spec.tabLabel}
            </span>
            <span
              className="mt-2 max-w-[90%] text-[12.5px] leading-[1.55]"
              style={{ color: T.charcoal }}
            >
              {spec.oneLiner}
            </span>
            <IntentArt intent={id} active={active} />
          </Button>
        );
      })}
    </div>
  );
}

interface IntentArtProps {
  intent: ChatIntent;
  active: boolean;
}

// 右下角的小插画：参考用户图里"每张卡右下有一个轻量装饰图"的节奏，用
// 几何元素轻暗示每条入口的语义（不当作功能 icon）。
function IntentArt({ intent, active }: IntentArtProps) {
  const fill = active ? T.terracotta : T.stone;
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute right-4 bottom-3"
      style={{ opacity: active ? 0.85 : 0.55 }}
    >
      {intent === "competitor" ? <ArtBars fill={fill} /> : null}
      {intent === "scenario" ? <ArtPills fill={fill} /> : null}
      {intent === "trending" ? <ArtTrend fill={fill} /> : null}
      {intent === "lowFollower" ? <ArtSpark fill={fill} /> : null}
    </span>
  );
}

// 三条横向条：暗示"对标多个竞品的合作款"
function ArtBars({ fill }: { fill: string }) {
  return (
    <svg width="56" height="36" viewBox="0 0 56 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="4" width="42" height="6" rx="3" fill={fill} opacity="0.35" />
      <rect x="0" y="15" width="56" height="6" rx="3" fill={fill} opacity="0.65" />
      <rect x="0" y="26" width="30" height="6" rx="3" fill={fill} opacity="0.45" />
    </svg>
  );
}

// 三个圆角胶囊：暗示"反推内容场景标签"
function ArtPills({ fill }: { fill: string }) {
  return (
    <svg width="64" height="34" viewBox="0 0 64 34" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="2" width="28" height="11" rx="5.5" fill={fill} opacity="0.55" />
      <rect x="32" y="2" width="22" height="11" rx="5.5" fill={fill} opacity="0.35" />
      <rect x="6" y="18" width="36" height="11" rx="5.5" fill={fill} opacity="0.65" />
    </svg>
  );
}

// 折线 + 峰值点：暗示"近期爆款曲线"
function ArtTrend({ fill }: { fill: string }) {
  return (
    <svg width="62" height="32" viewBox="0 0 62 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 26 L14 22 L24 24 L34 14 L44 18 L54 6"
        stroke={fill}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <circle cx="54" cy="6" r="3" fill={fill} />
    </svg>
  );
}

// 小条 + 细折线：暗示"低粉量但有爆款峰值"
function ArtSpark({ fill }: { fill: string }) {
  return (
    <svg width="62" height="34" viewBox="0 0 62 34" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="22" width="8" height="10" rx="2" fill={fill} opacity="0.45" />
      <rect x="12" y="18" width="8" height="14" rx="2" fill={fill} opacity="0.5" />
      <rect x="24" y="14" width="8" height="18" rx="2" fill={fill} opacity="0.55" />
      <path
        d="M2 12 L14 10 L26 6 L40 2"
        stroke={fill}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
      <circle cx="40" cy="2.5" r="2.6" fill={fill} />
    </svg>
  );
}
