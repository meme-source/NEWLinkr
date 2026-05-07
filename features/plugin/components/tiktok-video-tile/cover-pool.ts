const COVER_BASE = "https://picsum.photos/seed";
const COVER_W = 360;
const COVER_H = 480;

export function getVideoCoverUrl(seed: string): string {
  return `${COVER_BASE}/${encodeURIComponent(seed)}/${COVER_W}/${COVER_H}`;
}
