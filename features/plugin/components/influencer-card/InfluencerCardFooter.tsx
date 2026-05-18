"use client";

import { TEXT, TYPE } from "./tokens";

import { Button } from "@/components/ui/button";

interface InfluencerCardFooterProps {
  onOpenAnalysis: () => void;
}

export function InfluencerCardFooter({ onOpenAnalysis }: InfluencerCardFooterProps) {
  return (
    <div className="flex h-7 items-center justify-center">
      <Button
        unstyled
        type="button"
        onClick={onOpenAnalysis}
        className="inline-flex items-center gap-0.5 rounded-md px-2 py-0.5 transition-colors hover:bg-[#eceae3]"
        style={{
          color: TEXT.link,
          fontSize: TYPE.cta.size,
          lineHeight: `${TYPE.cta.lineHeight}px`,
          fontWeight: TYPE.cta.weight,
          letterSpacing: TYPE.cta.tracking,
        }}
      >
        查看完整档案 →
      </Button>
    </div>
  );
}
