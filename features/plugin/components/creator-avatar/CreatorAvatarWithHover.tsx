"use client";

import { useEffect, useRef, useState } from "react";

import { getCreatorHoverProfile } from "@/features/plugin/data/creator-hover-profiles";
import type { CreatorProfile } from "@/features/plugin/types";

import { CreatorAvatar } from "./CreatorAvatar";
import { CreatorAvatarHoverPanel } from "./CreatorAvatarHoverPanel";

interface CreatorAvatarWithHoverProps {
  creator: CreatorProfile;
  className?: string;
  labelClassName?: string;
  /** Pass `false` to render the avatar without hover behavior (e.g. on
   *  non-current carousel cards that animate in 3D). Default: true. */
  hoverEnabled?: boolean;
}

const PANEL_WIDTH = 140;
const PANEL_TOP_GAP = 6;
// Grace period after the cursor leaves both the avatar and the panel.
// Keeps the panel open while the user crosses the gap so the rows below
// (LinkScan toggle / followers / external links) are actually clickable.
const HOVER_BRIDGE_MS = 150;

export function CreatorAvatarWithHover({
  creator,
  className,
  labelClassName,
  hoverEnabled = true,
}: CreatorAvatarWithHoverProps) {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  const cancelClose = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, HOVER_BRIDGE_MS);
  };

  useEffect(() => {
    return () => cancelClose();
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  if (!hoverEnabled) {
    return (
      <CreatorAvatar creator={creator} className={className} labelClassName={labelClassName} />
    );
  }

  const profile = getCreatorHoverProfile(creator.handle);
  const handleEnter = () => {
    cancelClose();
    setOpen(true);
  };

  return (
    <div className="relative inline-flex" onMouseEnter={handleEnter} onMouseLeave={scheduleClose}>
      <CreatorAvatar creator={creator} className={className} labelClassName={labelClassName} />
      {open ? (
        <div
          className="absolute z-40"
          style={{
            top: `calc(100% + ${PANEL_TOP_GAP}px)`,
            left: "50%",
            transform: "translateX(-50%)",
            width: PANEL_WIDTH,
          }}
          onMouseEnter={handleEnter}
          onMouseLeave={scheduleClose}
        >
          <CreatorAvatarHoverPanel profile={profile} />
        </div>
      ) : null}
    </div>
  );
}
