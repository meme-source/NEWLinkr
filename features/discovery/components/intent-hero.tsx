"use client";

import type { ChatIntent } from "../chat-types";
import { INTENT_HERO } from "../data/intent-hero";
import { T } from "../data/tokens";

interface IntentHeroProps {
  intent: ChatIntent;
}

export function IntentHero({ intent }: IntentHeroProps) {
  const spec = INTENT_HERO[intent];
  return (
    <div className="mx-auto w-full max-w-[820px] px-4 pb-8">
      <p className="text-[12px] font-medium tracking-[0.18em] uppercase" style={{ color: T.stone }}>
        Discovery
      </p>
      <h1
        className="mt-2 text-[26px] leading-[1.22] font-semibold tracking-[-0.02em]"
        style={{ color: T.nearBlack }}
      >
        {spec.question}
      </h1>
      <p className="mt-3 max-w-[640px] text-[14.5px] leading-[1.7]" style={{ color: T.charcoal }}>
        {spec.oneLiner}
      </p>
    </div>
  );
}
