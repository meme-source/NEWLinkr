// Provider 接口定义
import type { Creator, Platform } from "@/types/api";

export type Post = {
  id: string;
  creatorId: string;
  url: string;
  caption: string;
  hashtags: string[];
  mentions: string[];
  externalLinks: string[];
  publishedAt: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
};

export interface CreatorProvider {
  getCreator(handle: string, platform: Platform): Promise<Creator>;
  getRecentPosts(creatorId: string, limit: number): Promise<Post[]>;
  searchByCategory(category: string, platform: Platform): Promise<Creator[]>;
}

// TODO: 在 ./modash.ts / ./apify.ts 中实现具体 provider
