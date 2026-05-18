"use client";

import { CreatorProfileHeader } from "@/features/plugin/components/creator-profile-header";
import type { CreatorProfile } from "@/features/plugin/types";
import { SIDEBAR_GRADIENT_CARD_CLASSES } from "./shared";

export function SidebarCreatorProfileCard({
  creator,
  email,
  location,
  creatorType,
  isSaved,
  onToggleSave,
  onOpenEmailSidebar,
  tags,
  onAddTag,
  onRemoveTag,
}: {
  creator: CreatorProfile;
  email: string;
  location: { flag: string; country: string };
  creatorType: string;
  isSaved: boolean;
  onToggleSave: () => void;
  onOpenEmailSidebar: () => void;
  tags: string[];
  onAddTag: (label: string) => void;
  onRemoveTag: (label: string) => void;
}) {
  return (
    <div className={SIDEBAR_GRADIENT_CARD_CLASSES}>
      <CreatorProfileHeader
        name={creator.name}
        handle={creator.handle}
        flag={location.flag}
        country={location.country}
        creatorType={creatorType}
        email={email}
        hasEmail={Boolean(creator.email)}
        onOpenEmailSidebar={onOpenEmailSidebar}
        isSaved={isSaved}
        onToggleSave={onToggleSave}
        tags={tags}
        onAddTag={onAddTag}
        onRemoveTag={onRemoveTag}
      />
    </div>
  );
}
