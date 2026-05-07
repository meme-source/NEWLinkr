"use client";

import { useId } from "react";

// §3.3 投放卡片头部的播放量趋势小图。SVG 轻量自绘，无第三方依赖。
//   - 区域填充：状态色 5%
//   - 折线：状态色，stroke 1.5
//   - 末点：实心圆 + 半透明光晕
// 设计上与 docs/DESIGN.md 一致（橙色主调，淡米底）。

interface Props {
  data: number[];
  // 折线主色，由调用方按状态映射给。
  color: string;
  // 状态对应的"末点光晕"色。可选，默认与 color 同色。
  haloColor?: string;
  // 高度，宽度始终撑满父容器。
  height?: number;
  className?: string;
}

const PAD_X = 2;
const PAD_Y = 6;

export function PlacementTrendChart({ data, color, haloColor, height = 70, className }: Props) {
  const reactId = useId();
  const gradId = `${reactId}-grad`;

  if (data.length < 2) {
    return <div className={className} style={{ height }} aria-label="趋势数据不足" />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 320;
  const innerW = width - PAD_X * 2;
  const innerH = height - PAD_Y * 2;
  const stepX = innerW / (data.length - 1);

  const points = data.map((v, i) => {
    const x = PAD_X + stepX * i;
    const y = PAD_Y + (1 - (v - min) / range) * innerH;
    return [x, y] as const;
  });

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");

  const lastY = innerH + PAD_Y;
  const areaPath =
    `${linePath} L ${points[points.length - 1]![0].toFixed(1)} ${lastY.toFixed(1)} ` +
    `L ${points[0]![0].toFixed(1)} ${lastY.toFixed(1)} Z`;

  const last = points[points.length - 1]!;
  const halo = haloColor ?? color;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      style={{ width: "100%", height }}
      role="img"
      aria-label="播放量趋势"
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.18} />
          <stop offset="100%" stopColor={color} stopOpacity={0.0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r={5} fill={halo} fillOpacity={0.18} />
      <circle cx={last[0]} cy={last[1]} r={2.5} fill={color} />
    </svg>
  );
}
