"use client";

import { flagFromCode } from "./flag";
import { AVATAR, BORDER, SURFACE, TEXT, TYPE } from "./tokens";
import type { EmailStatus } from "./types";

interface InfluencerCardHeaderProps {
  handle: string;
  countryCode?: string;
  countryLabel?: string;
  /** Category pill on the second line (e.g. "科技类博主"). Per the
   *  floating-creator-card reference image. */
  creatorType?: string;
  /** Retained for backwards compatibility — the email row was promoted out of
   *  the header per the reference image. The prop is kept so existing callers
   *  do not need to change; it is currently not rendered. */
  email?: EmailStatus;
  initials?: string;
  onSendEmail?: () => void;
}

export function InfluencerCardHeader({
  handle,
  countryCode,
  countryLabel,
  creatorType,
  initials,
}: InfluencerCardHeaderProps) {
  const initial = (initials ?? handle.charAt(0) ?? "?").toUpperCase();
  // The second line shows two info pills per docs/DESIGN.md §6.5.1:
  //   - Variant A (Neutral): country, with leading flag glyph
  //   - Variant B (Category): creator type
  // Either pill is conditionally hidden when its data is absent.
  const hasCountry = Boolean(countryCode || countryLabel);
  const hasType = Boolean(creatorType?.trim());

  return (
    <div className="flex items-center gap-3">
      <div
        aria-hidden
        className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full"
        style={{
          backgroundImage: AVATAR.gradient,
          boxShadow: AVATAR.shadow,
        }}
      >
        <span
          className="relative font-bold text-[#fffefb]"
          style={{
            fontFamily: '"Times New Roman", Times, serif',
            fontSize: 22,
            lineHeight: "27.5px",
            fontWeight: 700,
          }}
        >
          {initial}
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{ boxShadow: AVATAR.innerHighlight }}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p
          className="truncate"
          style={{
            color: TEXT.primary,
            fontFamily: TYPE.handle.family,
            fontSize: TYPE.handle.size,
            lineHeight: `${TYPE.handle.lineHeight}px`,
            fontWeight: TYPE.handle.weight,
            letterSpacing: TYPE.handle.tracking,
          }}
        >
          @{handle}
        </p>

        {hasCountry || hasType ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {hasCountry ? (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
                style={{
                  background: SURFACE.pill,
                  border: `1px solid ${BORDER.pill}`,
                  color: TEXT.body,
                  fontSize: TYPE.pillText.size,
                  lineHeight: `${TYPE.pillText.lineHeight}px`,
                  fontWeight: TYPE.pillText.weight,
                }}
              >
                {countryCode ? (
                  <span aria-label={countryCode}>{flagFromCode(countryCode)}</span>
                ) : null}
                {countryLabel ? <span>{countryLabel}</span> : null}
              </span>
            ) : null}
            {hasType ? (
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5"
                style={{
                  background: SURFACE.hover,
                  border: `1px solid ${BORDER.pill}`,
                  color: TEXT.body,
                  fontSize: TYPE.pillText.size,
                  lineHeight: `${TYPE.pillText.lineHeight}px`,
                  fontWeight: TYPE.pillText.weight,
                }}
              >
                {creatorType}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
