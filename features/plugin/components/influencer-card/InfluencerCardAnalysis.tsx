"use client";

import { analysisTintFor, TEXT, TYPE } from "./tokens";
import type { InfluencerCardAnalysisTag } from "./types";

interface InfluencerCardAnalysisProps {
  tags: InfluencerCardAnalysisTag[];
}

// 深度分析:把博主的客观特征摆成一片胶囊 tag。取代旧雷达图与逐行解释段 ——
// 维度名不写出来,每个 tag 的浅底色标示它属于哪个内容维度,同维度的 tag
// 相邻、底色聚成一族。所有 tag 连成一片流式排列。它是【辅助信息】,只摆事
// 实,不替用户下「推荐 / 该选谁」结论。
//
// 排版:与「核心数据」一样,标题左对齐、直接落在卡片内容区,不再用白底框包
// 起来 —— 深度分析和核心数据是同级的两块信息,视觉上应当并列。
export function InfluencerCardAnalysis({ tags }: InfluencerCardAnalysisProps) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      <span
        style={{
          color: TEXT.heading,
          fontSize: TYPE.analysisHeading.size,
          lineHeight: `${TYPE.analysisHeading.lineHeight}px`,
          fontWeight: TYPE.analysisHeading.weight,
          letterSpacing: TYPE.analysisHeading.tracking,
        }}
      >
        深度分析
      </span>

      <div className="flex flex-wrap gap-1">
        {tags.map((item, idx) => (
          <span
            key={`${item.tag}-${idx}`}
            className="inline-flex items-center rounded-full px-2 py-[3px]"
            style={{
              background: analysisTintFor(item.dimension),
              color: TEXT.body,
              fontSize: TYPE.chip.size,
              lineHeight: `${TYPE.chip.lineHeight}px`,
              fontWeight: TYPE.chip.weight,
              letterSpacing: TYPE.chip.tracking,
              whiteSpace: "nowrap",
            }}
          >
            {item.tag}
          </span>
        ))}
      </div>
    </div>
  );
}
