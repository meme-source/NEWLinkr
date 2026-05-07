export type LinkedAccountPlatform = "instagram" | "tiktok" | "youtube" | "twitter";

export interface LinkedAccount {
  platform: LinkedAccountPlatform;
  followers: string;
}

export type ExternalLink =
  | { kind: "link"; url: string; label?: string }
  | { kind: "email"; address: string };

export interface RecentLikedNote {
  handle: string;
  timeAgo: string;
}

export interface CreatorHoverProfile {
  recentLiked?: RecentLikedNote;
  linkedAccounts: LinkedAccount[];
  externalLinks: ExternalLink[];
}
