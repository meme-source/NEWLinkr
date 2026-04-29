import type { CreatorProfile } from "@/features/plugin/types";

export type VideoCategory = "viral" | "flop" | "paid" | "normal";

export type SyntheticVideo = {
  id: string;
  plays: number;
  likes: number;
  comments: number;
  erPct: number;
  days: number;
  hoursAgo: number;
  durationSec: number;
  speed: string;
  category: VideoCategory;
};

export function hashString(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateSyntheticVideos(creator: CreatorProfile, count: number): SyntheticVideo[] {
  const rand = mulberry32(hashString(creator.id));
  const speeds = ["0.8X", "1.2X", "1.4X", "1.6X", "1.8X", "1.9X", "2.2X", "2.3X"];
  const videos: SyntheticVideo[] = [];
  for (let i = 0; i < count; i += 1) {
    const plays = Math.round((0.8 + rand() * 5.5) * 1_000_000);
    const erPct = Math.round((3 + rand() * 7) * 10) / 10;
    const likes = Math.round(plays * (erPct / 100) * (0.55 + rand() * 0.35));
    const comments = Math.round(likes * (0.01 + rand() * 0.06));
    const days = 3 + Math.floor(rand() * 7);
    const hoursAgo = 1 + Math.floor(rand() * 72);
    const durationSec = 8 + Math.floor(rand() * 85);
    const speed = speeds[Math.floor(rand() * speeds.length)];
    const catRoll = rand();
    const category: VideoCategory =
      catRoll < 0.18 ? "viral" : catRoll < 0.36 ? "flop" : catRoll < 0.5 ? "paid" : "normal";
    videos.push({
      id: `${creator.id}-v${i}`,
      plays,
      likes,
      comments,
      erPct,
      days,
      hoursAgo,
      durationSec,
      speed,
      category,
    });
  }
  return videos;
}

export function formatPlays(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function formatLikes(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function formatComments(n: number): string {
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function parseMetricToNumber(value: string): number {
  const m = value.trim().match(/([\d.]+)\s*(万|千|[KkMmBb]?)/);
  if (!m) return 0;
  const num = parseFloat(m[1]);
  const unit = m[2];
  if (unit === "万") return num * 10_000;
  if (unit === "千") return num * 1_000;
  const normalizedUnit = unit.toUpperCase();
  if (normalizedUnit === "K") return num * 1_000;
  if (normalizedUnit === "M") return num * 1_000_000;
  if (normalizedUnit === "B") return num * 1_000_000_000;
  return num;
}
