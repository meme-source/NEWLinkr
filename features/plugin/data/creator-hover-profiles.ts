// Mock per-creator data displayed in the avatar hover panel. Independent
// from `creator-profiles.ts` because hover-panel fields are not yet
// persisted upstream — these are placeholders until the scraper exposes
// linked-account / recent-engagement data.

import type { CreatorHoverProfile } from "@/features/plugin/components/creator-avatar/types";

const FALLBACK_PROFILE: CreatorHoverProfile = {
  recentLiked: { handle: "lijianmin3", timeAgo: "2 weeks" },
  linkedAccounts: [
    { platform: "instagram", followers: "7K" },
    { platform: "tiktok", followers: "23K" },
  ],
  externalLinks: [
    { kind: "link", url: "https://amazon.com/shop/aurora", label: "amazon.com/shop/aurora" },
    { kind: "email", address: "camillecheffer@studio.co" },
  ],
};

const PROFILES_BY_HANDLE: Record<string, CreatorHoverProfile> = {
  "camping.aurora": {
    recentLiked: { handle: "lijianmin3", timeAgo: "2 weeks" },
    linkedAccounts: [
      { platform: "instagram", followers: "62K" },
      { platform: "tiktok", followers: "125K" },
    ],
    externalLinks: [
      { kind: "link", url: "https://amazon.com/shop/aurora", label: "amazon.com/shop/aurora" },
      { kind: "email", address: "camillecheffer@studio.co" },
    ],
  },
  outdoor_jane: {
    recentLiked: { handle: "trail.notes", timeAgo: "5 days" },
    linkedAccounts: [
      { platform: "instagram", followers: "48K" },
      { platform: "tiktok", followers: "98K" },
    ],
    externalLinks: [
      { kind: "link", url: "https://linktr.ee/outdoorjane", label: "linktr.ee/outdoorjane" },
      { kind: "email", address: "outdoor.jane@creatormail.com" },
    ],
  },
};

export function getCreatorHoverProfile(handle?: string): CreatorHoverProfile {
  if (!handle) return FALLBACK_PROFILE;
  const normalised = handle.replace(/^@/, "").trim().toLowerCase();
  return PROFILES_BY_HANDLE[normalised] ?? FALLBACK_PROFILE;
}
