// Discovery domain types — shared by app/(workspace)/workspace/discovery/page.tsx
// and supporting modules.

export type PlatformId = "tiktok" | "instagram" | "youtube";

export type ModeId = "competitor" | "scenario" | "viral";

export type FindSimilarMode = "找相似" | "找平替" | "找种子达人";

export type DiscoveryEntrySource = "quick-screen" | "seed-finder" | null;

export type DiscoveryFilters = {
  region: string;
  language: string;
  followers: string;
  verified: string;
  email: string;
};

export type VideoClip = {
  age: string;
  er: string;
  plays: string;
  likes: string | number;
  seed: string;
};

export type Creator = {
  id: string;
  name: string;
  handle: string;
  avatarImg: number;
  region: string;
  followers: string;
  er: string;
  verified: boolean;
  email: string;
  smartTags: string[];
  videos: VideoClip[];
  status: "pending" | "no" | "saved";
};

export type DiscoveryAnchor = {
  id: string;
  name: string;
  handle: string;
  avatarSeed: string;
};
