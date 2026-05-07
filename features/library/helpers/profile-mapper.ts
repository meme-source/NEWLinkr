import type { CreatorProfileInput } from "@/features/creator/components/creator-profile-drawer";
import type { LibraryCreator } from "../types";
import { formatFollowers } from "./creator";

// Build the rich CreatorProfileInput passed into the drawer's 5-tab CRM view.
// All CRM fields (collaborations, contact info, notes, relationship) are
// forwarded so the Overview / Info / Timeline / Collaborations / Notes tabs
// can render meaningful content.
export function creatorToProfileInput(
  c: LibraryCreator,
  currentProjectId: string | null,
): CreatorProfileInput {
  const er = c.avgViews > 0 ? `${((c.avgLikes / c.avgViews) * 100).toFixed(1)}%` : "--";
  return {
    name: c.name,
    handle: c.handle,
    avatarUrl: c.avatarUrl,
    region: c.region,
    platform: c.platform,
    followers: formatFollowers(c.followers),
    er,
    tags: c.tags,
    avgViews: c.avgViews,
    avgLikes: c.avgLikes,

    // CRM context
    currentProjectId: currentProjectId ?? undefined,
    relationship: c.relationship,
    owner: c.owner,
    source: c.source,
    lastContactAt: c.lastContactAt,
    lastResponseAt: c.lastResponseAt,
    nextFollowUp: c.nextFollowUp,
    addedAt: c.addedAt,
    emails: c.emails,
    dms: c.dms,
    socialLinks: c.socialLinks,
    collaborations: c.collaborations,
    notes: c.notes,
    timeline: c.timeline,
  };
}
