"use client";

import { useRef, useState } from "react";
import { WORD_CLOUD_COLORS, seededRandom } from "./shared";

export function TopicWordCloud({ topics }: { topics: Array<{ label: string; weight: number }> }) {
  const [hovered, setHovered] = useState<{
    label: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const maxWeight = Math.max(...topics.map((t) => t.weight));
  const minWeight = Math.min(...topics.map((t) => t.weight));

  const CONTAINER_W = 280;
  const CONTAINER_H = 160;
  const PAD = 3;

  const items = topics.map((topic, i) => {
    const rand = seededRandom(i * 97 + topic.label.charCodeAt(0) * 31);
    const ratio = (topic.weight - minWeight) / Math.max(maxWeight - minWeight, 1);
    const fontSize = Math.round(10 + ratio * 13);
    rand();
    const colorIdx = Math.floor(rand() * WORD_CLOUD_COLORS.length);
    const color = ratio >= 0.85 ? "#201515" : WORD_CLOUD_COLORS[colorIdx];
    const fontWeight = ratio >= 0.8 ? 700 : ratio >= 0.5 ? 600 : 500;
    const mentionCount = Math.round(topic.weight * 28 + topic.weight * 7 * (i % 3));
    let estW = 0;
    for (const ch of topic.label) {
      estW += ch.charCodeAt(0) > 127 ? fontSize : fontSize * 0.62;
    }
    const estH = fontSize * 1.25;
    return { ...topic, fontSize, color, fontWeight, estW, estH, mentionCount };
  });

  const sorted = [...items].sort((a, b) => b.fontSize - a.fontSize);
  const placed: Array<{ x: number; y: number; w: number; h: number }> = [];

  const overlaps = (x: number, y: number, w: number, h: number) => {
    for (const p of placed) {
      if (x < p.x + p.w + PAD && x + w + PAD > p.x && y < p.y + p.h + PAD && y + h + PAD > p.y)
        return true;
    }
    return false;
  };

  const cx = CONTAINER_W / 2;
  const cy = CONTAINER_H / 2;

  const positionedItems = sorted.map((item) => {
    const { estW, estH } = item;
    for (let step = 0; step < 300; step++) {
      const angle = step * 0.45;
      const radius = step * 1.6;
      const tx = cx + radius * Math.cos(angle) - estW / 2;
      const ty = cy + radius * Math.sin(angle) * 0.55 - estH / 2;
      const bx = Math.max(0, Math.min(CONTAINER_W - estW, tx));
      const by = Math.max(0, Math.min(CONTAINER_H - estH, ty));
      if (!overlaps(bx, by, estW, estH)) {
        placed.push({ x: bx, y: by, w: estW, h: estH });
        return { ...item, drawX: bx + estW / 2, drawY: by + estH / 2 };
      }
    }
    const last = placed[placed.length - 1] ?? { x: 0, y: 0, w: 0, h: 0 };
    const fx = Math.min(last.x, CONTAINER_W - estW);
    const fy = Math.min(last.y + last.h + PAD, CONTAINER_H - estH);
    placed.push({ x: fx, y: fy, w: estW, h: estH });
    return { ...item, drawX: fx + estW / 2, drawY: fy + estH / 2 };
  });

  const handleMouseEnter = (
    _e: React.MouseEvent<SVGTextElement>,
    item: (typeof positionedItems)[number],
  ) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scaleX = rect.width / CONTAINER_W;
    const scaleY = rect.height / CONTAINER_H;
    setHovered({
      label: item.label,
      count: item.mentionCount,
      x: item.drawX * scaleX,
      y: item.drawY * scaleY,
    });
  };

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", overflow: "visible", position: "relative" }}
      aria-label="话题词云"
    >
      <svg
        width="100%"
        height={CONTAINER_H}
        viewBox={`0 0 ${CONTAINER_W} ${CONTAINER_H}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block", overflow: "visible" }}
      >
        {positionedItems.map((item) => {
          const isHovered = hovered?.label === item.label;
          return (
            <text
              key={item.label}
              x={item.drawX}
              y={item.drawY}
              textAnchor="middle"
              dominantBaseline="middle"
              transform={
                isHovered
                  ? `translate(${item.drawX},${item.drawY}) scale(1.18) translate(${-item.drawX},${-item.drawY})`
                  : undefined
              }
              style={{
                fontSize: item.fontSize,
                fill: isHovered ? "#ff4f00" : item.color,
                fontWeight: isHovered ? 700 : item.fontWeight,
                fontFamily: "inherit",
                cursor: "pointer",
                transition: "fill 150ms",
              }}
              onMouseEnter={(e) => handleMouseEnter(e, item)}
              onMouseLeave={() => setHovered(null)}
            >
              {item.label}
            </text>
          );
        })}
      </svg>

      {hovered && (
        <div
          style={{
            position: "absolute",
            left: hovered.x,
            top: hovered.y - 36,
            transform: "translateX(-50%)",
            pointerEvents: "none",
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: "#201515",
              color: "#fff",
              borderRadius: 8,
              padding: "4px 9px",
              fontSize: 11,
              fontWeight: 500,
              whiteSpace: "nowrap",
              lineHeight: 1.5,
              border: "1px solid #c5c0b1",
            }}
          >
            提及 {hovered.count} 次
          </div>
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: "5px solid #201515",
              margin: "0 auto",
            }}
          />
        </div>
      )}
    </div>
  );
}
