// §3.3 从一条 TikTok 视频链接里解析出博主 handle + 视频 id。
// 「投放追踪」弹窗与工作台 / 插件两端的包装层共用，避免各处重复正则。
//
// Phase 1+：把调用方的 parseTiktokUrl 换成 service.fetchPlacementByUrl(url)，
// 由后端拉取真实的 views / likes / 头像等字段；UI 不变。

const TIKTOK_URL_RE = /^https?:\/\/(?:www\.)?tiktok\.com\/@([\w.-]+)\/video\/(\d+)/i;

export interface ParsedTiktokLink {
  handle: string;
  videoId: string;
}

export function parseTiktokUrl(value: string): ParsedTiktokLink | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = TIKTOK_URL_RE.exec(trimmed);
  if (!match) return null;
  return { handle: match[1]!, videoId: match[2]! };
}
