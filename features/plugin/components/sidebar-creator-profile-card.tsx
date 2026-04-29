import { Heart, Mail } from "lucide-react";

import { cn } from "@/lib/utils";
import { CreatorAvatar } from "@/features/plugin/components/creator-avatar";
import { SidebarCreatorTypeTag } from "@/features/plugin/components/sidebar-creator-type-tag";
import { SidebarEmailCopy } from "@/features/plugin/components/sidebar-email-copy";
import { SidebarLocationInline } from "@/features/plugin/components/sidebar-location-inline";
import { SidebarTagRow } from "@/features/plugin/components/sidebar-tag-row";
import { SIDEBAR_GRADIENT_CARD_CLASSES } from "@/features/plugin/lib/style-constants";
import type { CreatorProfile } from "@/features/plugin/types";

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
      <div className="flex items-center gap-3">
        <div className="shrink-0">
          <CreatorAvatar creator={creator} className="h-12 w-12" labelClassName="text-base" />
        </div>
        <div className="min-w-0 flex min-h-[48px] flex-1 flex-col justify-center gap-0.5">
          <div className="flex min-w-0 items-center gap-1.5">
            <SidebarLocationInline flag={location.flag} country={location.country} />
            <SidebarCreatorTypeTag type={creatorType} />
            <button
              type="button"
              aria-label={isSaved ? `取消收藏 ${creator.name}` : `收藏 ${creator.name}`}
              aria-pressed={isSaved}
              onClick={onToggleSave}
              className={cn(
                "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-transparent bg-transparent transition-all duration-150 active:scale-[0.88]",
                isSaved
                  ? "border-[#f0d7cd] bg-[#fff7f4] text-[#c96442] shadow-[0_4px_10px_rgba(201,100,66,0.16)]"
                  : "text-[#b0aea6] hover:border-[#ece7dc] hover:bg-white hover:text-[#c96442]"
              )}
            >
              <Heart className={cn("h-4 w-4", isSaved && "fill-current")} />
            </button>
          </div>
          <div className="flex min-w-0 items-center gap-1.5">
            <SidebarEmailCopy email={email} hasEmail={Boolean(creator.email)} />
            <button
              type="button"
              aria-label="建联"
              onClick={onOpenEmailSidebar}
              className="inline-flex h-[26px] shrink-0 items-center justify-center rounded-[13px] border border-[#e8e6dc] bg-white px-[9px] text-[11px] font-semibold text-[#4d4c48] transition-all hover:border-[#d1cfc5] hover:bg-[#f5f4ed] active:scale-[0.97] active:bg-[#ede9e0]"
            >
              <Mail className="mr-1 h-4 w-4 text-[#87867f]" />
              建联
            </button>
          </div>
        </div>
      </div>

      <SidebarTagRow
        tags={tags}
        onAdd={onAddTag}
        onEdit={(oldLabel, newLabel) => {
          onRemoveTag(oldLabel);
          if (newLabel.trim()) onAddTag(newLabel.trim());
        }}
        onRemove={onRemoveTag}
      />
    </div>
  );
}
