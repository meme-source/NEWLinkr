"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink, Link as LinkIcon, Mail } from "lucide-react";

import type {
  CreatorHoverProfile,
  ExternalLink as ExternalLinkData,
  LinkedAccount,
  LinkedAccountPlatform,
} from "./types";

import { Button } from "@/components/ui/button";

interface CreatorAvatarHoverPanelProps {
  profile: CreatorHoverProfile;
}

const PANEL_BG = "#fffefb";
const PANEL_BORDER = "#c5c0b1";
const ROW_BORDER = "rgba(197, 192, 177, 0.4)";
const TEXT_PRIMARY = "#201515";
const TEXT_SECONDARY = "#36342e";
const TEXT_MUTED = "#939084";
const HOVER_BG = "#eceae3";

function InstagramIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <radialGradient id="ig-gradient" cx="30%" cy="107%" r="150%" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fdf497" />
          <stop offset="0.05" stopColor="#fdf497" />
          <stop offset="0.45" stopColor="#fd5949" />
          <stop offset="0.6" stopColor="#d6249f" />
          <stop offset="0.9" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig-gradient)" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth="1.6" />
      <circle cx="17.4" cy="6.6" r="1" fill="#fff" />
    </svg>
  );
}

function TikTokIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="12" cy="12" r="11" fill="#0a0a0a" />
      <path
        d="M15.6 7.6c.6.7 1.5 1.2 2.5 1.3v1.9c-1 0-2-.3-2.8-.8v3.9c0 2-1.6 3.6-3.6 3.6s-3.6-1.6-3.6-3.6 1.6-3.6 3.6-3.6c.2 0 .4 0 .5.1v2c-.2-.1-.3-.1-.5-.1-.9 0-1.6.7-1.6 1.6s.7 1.6 1.6 1.6 1.6-.7 1.6-1.6V6.5h2c0 .4.1.8.3 1.1z"
        fill="#fff"
      />
    </svg>
  );
}

function YouTubeIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="2" y="5" width="20" height="14" rx="3" fill="#ff0000" />
      <path d="M10 9.2L15 12l-5 2.8z" fill="#fff" />
    </svg>
  );
}

function TwitterIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="12" cy="12" r="11" fill="#0a0a0a" />
      <path
        d="M16.5 7h2L14 12.2l5.4 6.8h-4.4l-3.5-4.5L7.6 19H5.7l4.9-5.6L5.5 7h4.5l3.1 4.1z"
        fill="#fff"
      />
    </svg>
  );
}

function platformIcon(platform: LinkedAccountPlatform) {
  if (platform === "instagram") return <InstagramIcon />;
  if (platform === "tiktok") return <TikTokIcon />;
  if (platform === "youtube") return <YouTubeIcon />;
  return <TwitterIcon />;
}

function platformLabel(platform: LinkedAccountPlatform): string {
  if (platform === "instagram") return "Instagram";
  if (platform === "tiktok") return "TikTok";
  if (platform === "youtube") return "YouTube";
  return "Twitter";
}

interface PanelRowProps {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
}

function PanelRow({ children, onClick, title }: PanelRowProps) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      title={title}
      className="flex h-7 w-full min-w-0 items-center gap-1.5 rounded-md px-2 text-left transition-colors"
      style={{
        background: PANEL_BG,
        border: `1px solid ${ROW_BORDER}`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = HOVER_BG;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = PANEL_BG;
      }}
    >
      {children}
    </Wrapper>
  );
}

function LinkedAccountRow({ account }: { account: LinkedAccount }) {
  return (
    <PanelRow title={`${account.followers} ${platformLabel(account.platform)} followers`}>
      <span className="shrink-0">{platformIcon(account.platform)}</span>
      <span
        className="min-w-0 flex-1 truncate"
        style={{ color: TEXT_PRIMARY, fontSize: 11, fontWeight: 500 }}
      >
        {account.followers} Followers
      </span>
      <span className="sr-only">{platformLabel(account.platform)}</span>
    </PanelRow>
  );
}

function ExternalLinkRow({ link }: { link: ExternalLinkData }) {
  if (link.kind === "email") {
    return (
      <PanelRow
        title={link.address}
        onClick={() => {
          window.location.href = `mailto:${link.address}`;
        }}
      >
        <Mail size={12} strokeWidth={1.75} color={TEXT_MUTED} className="shrink-0" />
        <span
          className="min-w-0 flex-1 truncate"
          style={{ color: TEXT_SECONDARY, fontSize: 11, fontWeight: 400 }}
        >
          {link.address}
        </span>
      </PanelRow>
    );
  }
  return (
    <PanelRow
      title={link.url}
      onClick={() => window.open(link.url, "_blank", "noopener,noreferrer")}
    >
      <LinkIcon size={12} strokeWidth={1.75} color={TEXT_MUTED} className="shrink-0" />
      <span
        className="min-w-0 flex-1 truncate"
        style={{ color: TEXT_SECONDARY, fontSize: 11, fontWeight: 400 }}
      >
        {link.label ?? link.url}
      </span>
    </PanelRow>
  );
}

export function CreatorAvatarHoverPanel({ profile }: CreatorAvatarHoverPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const hasExpandable = profile.linkedAccounts.length > 0 || profile.externalLinks.length > 0;

  return (
    <div
      role="dialog"
      aria-label="博主链接面板"
      className="flex w-[140px] min-w-0 flex-col gap-1 rounded-[8px] p-2"
      style={{
        background: PANEL_BG,
        border: `1px solid ${PANEL_BORDER}`,
      }}
    >
      {profile.recentLiked ? (
        <div
          className="flex min-w-0 items-center gap-1.5 rounded-md px-2 py-1"
          style={{ background: PANEL_BG, border: `1px solid ${ROW_BORDER}` }}
        >
          <div className="flex min-w-0 flex-1 flex-col">
            <span
              style={{
                color: TEXT_PRIMARY,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.5px",
                lineHeight: "12px",
              }}
            >
              LIKED
            </span>
            <span
              className="truncate"
              style={{ color: TEXT_MUTED, fontSize: 9, fontWeight: 400, lineHeight: "12px" }}
              title={`${profile.recentLiked.handle} · ${profile.recentLiked.timeAgo}`}
            >
              {profile.recentLiked.handle} · {profile.recentLiked.timeAgo}
            </span>
          </div>
          <ExternalLink size={10} strokeWidth={1.75} color={TEXT_MUTED} className="shrink-0" />
        </div>
      ) : null}

      <Button
        unstyled
        type="button"
        onClick={() => setExpanded((v) => !v)}
        disabled={!hasExpandable}
        aria-expanded={expanded}
        className="flex h-7 w-full min-w-0 items-center justify-between rounded-md px-2 transition-colors disabled:cursor-default"
        style={{ background: PANEL_BG, border: `1px solid ${ROW_BORDER}` }}
        onMouseEnter={(e) => {
          if (hasExpandable) (e.currentTarget as HTMLElement).style.background = HOVER_BG;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = PANEL_BG;
        }}
      >
        <span style={{ color: TEXT_PRIMARY, fontSize: 11, fontWeight: 600 }}>LinkScan</span>
        <ChevronDown
          size={12}
          strokeWidth={1.75}
          color={TEXT_MUTED}
          className="transition-transform"
          style={{ transform: expanded ? "rotate(180deg)" : undefined }}
        />
      </Button>

      {expanded && hasExpandable ? (
        <>
          <div className="my-0.5 h-px w-full" style={{ background: ROW_BORDER }} aria-hidden />
          {profile.linkedAccounts.map((account) => (
            <LinkedAccountRow key={account.platform} account={account} />
          ))}
          {profile.externalLinks.map((link) => (
            <ExternalLinkRow key={link.kind === "email" ? link.address : link.url} link={link} />
          ))}
        </>
      ) : null}
    </div>
  );
}
