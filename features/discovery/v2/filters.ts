import type { ChatChips, FollowerBucket, ViewsStep } from "../chat-types";
import type { Creator } from "./mock-data";

// Threshold map for the views slider. Index = ViewsStep (0..6).
const VIEW_THRESHOLDS: Record<ViewsStep, number> = {
  0: 0,
  1: 1_000,
  2: 10_000,
  3: 50_000,
  4: 100_000,
  5: 500_000,
  6: 1_000_000,
};

export function applyHardFilters(creators: Creator[], chips: ChatChips): Creator[] {
  const minViews = VIEW_THRESHOLDS[chips.viewsStep];
  return creators.filter((c) => {
    if (!c.platforms.includes(chips.platform)) return false;
    if (!matchCountries(c, chips.countries)) return false;
    if (!matchFollowerBucket(c.followersRaw, chips.follower)) return false;
    if (minViews > 0 && c.medianViewsRaw < minViews) return false;
    return true;
  });
}

function matchCountries(creator: Creator, countries: ChatChips["countries"]): boolean {
  // Empty selection = 全球 (no country constraint).
  if (countries.length === 0) return true;

  const flag = creator.flag;
  return countries.some((id) => {
    switch (id) {
      case "us":
        return flag === "🇺🇸";
      case "gb":
        return flag === "🇬🇧";
      case "ca":
        return flag === "🇨🇦";
      case "au":
        return flag === "🇦🇺";
      case "sea":
        return creator.countryCode === "sea";
      case "me":
        // No middle-east mock creators yet; keep the filter honest.
        return false;
    }
  });
}

function matchFollowerBucket(followers: number, bucket: FollowerBucket): boolean {
  switch (bucket) {
    case "any":
      return true;
    case "nano":
      return followers >= 1_000 && followers < 10_000;
    case "micro":
      return followers >= 10_000 && followers < 100_000;
    case "mid":
      return followers >= 100_000 && followers < 500_000;
    case "macro":
      return followers >= 500_000 && followers < 1_000_000;
    case "mega":
      return followers >= 1_000_000;
  }
}
