"use client";

import { chipToneFor } from "./chip-palette";
import { BORDER, TEXT, TYPE } from "./tokens";

interface InfluencerCardChipsProps {
  features: string[];
}

export function InfluencerCardChips({ features }: InfluencerCardChipsProps) {
  if (features.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      <span
        style={{
          color: TEXT.muted,
          fontSize: TYPE.metricLabel.size,
          lineHeight: "15px",
          letterSpacing: TYPE.metricLabel.tracking,
        }}
      >
        核心特征
      </span>
      <div className="flex flex-wrap gap-1.5">
        {features.map((label) => {
          const tone = chipToneFor(label);
          return (
            <span
              key={label}
              className="inline-flex items-center rounded-full px-2 py-[2px]"
              style={{
                background: tone.bg,
                color: tone.text,
                border: `1px solid ${BORDER.pill}`,
                fontSize: TYPE.chip.size,
                lineHeight: `${TYPE.chip.lineHeight}px`,
                letterSpacing: TYPE.chip.tracking,
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
