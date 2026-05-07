"use client";

import { Heart, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreatorAvatar } from "@/features/plugin/components/creator-avatar";
import type { CreatorProfile } from "@/features/plugin/types";
import { SIDEBAR_GRADIENT_CARD_CLASSES } from "./shared";
import { SidebarCreatorTypeTag, SidebarLocationInline } from "./primitives";
import { SidebarEmailCopy } from "./SidebarEmailCopy";
import { SidebarTagRow } from "./SidebarTagRow";

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
        <div className="flex min-h-[48px] min-w-0 flex-1 flex-col justify-center gap-0.5">
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
                  ? "border-[#c5c0b1] bg-[#fff7f4] text-[#ff4f00]"
                  : "text-[#939084] hover:border-[#c5c0b1] hover:bg-[#fffefb] hover:text-[#ff4f00]",
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
              className="inline-flex h-[26px] shrink-0 items-center justify-center rounded-[13px] border border-[#c5c0b1] bg-[#fffefb] px-[9px] text-[11px] font-semibold text-[#36342e] transition-all hover:border-[#c5c0b1] hover:bg-[#eceae3] active:scale-[0.97] active:bg-[#eceae3]"
            >
              <Mail className="mr-1 h-4 w-4 text-[#939084]" />
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
