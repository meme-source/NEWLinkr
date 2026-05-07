import type { SocialPlatformKey } from "@/features/plugin/types";

export function SocialPlatformLogo({
  platform,
  className,
}: {
  platform: SocialPlatformKey;
  className?: string;
}) {
  if (platform === "youtube") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path
          fill="#FF0000"
          d="M23.5 7.1a3.08 3.08 0 0 0-2.16-2.18C19.43 4.4 12 4.4 12 4.4s-7.43 0-9.34.52A3.08 3.08 0 0 0 .5 7.1 32.7 32.7 0 0 0 0 12a32.7 32.7 0 0 0 .5 4.9 3.08 3.08 0 0 0 2.16 2.18C4.57 19.6 12 19.6 12 19.6s7.43 0 9.34-.52a3.08 3.08 0 0 0 2.16-2.18A32.7 32.7 0 0 0 24 12a32.7 32.7 0 0 0-.5-4.9Z"
        />
        <path fill="#fff" d="m9.6 15.2 6.2-3.2-6.2-3.2v6.4Z" />
      </svg>
    );
  }

  if (platform === "instagram") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <defs>
          <linearGradient id="igGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F58529" />
            <stop offset="50%" stopColor="#DD2A7B" />
            <stop offset="100%" stopColor="#515BD4" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#igGradient)" />
        <circle cx="12" cy="12" r="4.1" fill="none" stroke="#fff" strokeWidth="1.8" />
        <circle cx="17.4" cy="6.8" r="1.2" fill="#fff" />
      </svg>
    );
  }

  if (platform === "x") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="6" fill="#111" />
        <path
          fill="#fff"
          d="M14.8 5h3.1l-4.8 5.5L18.8 19h-4.4l-3.4-4.8L6.7 19H3.6l5.1-5.8L3.2 5h4.5l3 4.3L14.8 5Zm-.8 12h1.2L8.1 6.9H6.8L14 17Z"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#25F4EE"
        d="M16.4 2.5v10.2a4.4 4.4 0 1 1-4.4-4.4c.3 0 .6 0 .9.1v2.4a2.1 2.1 0 1 0 1.2 1.9V2.5h2.3Z"
      />
      <path
        fill="#FE2C55"
        d="M14.1 2.5h2.3c.7 2 2.1 3.5 4.1 4.2v2.3a8.1 8.1 0 0 1-4.1-1.6v5.3a4.4 4.4 0 1 1-4.4-4.4c.3 0 .6 0 .9.1v2.4a2.1 2.1 0 1 0 1.2 1.9V2.5Z"
        fillOpacity=".85"
      />
      <path
        fill="#fff"
        d="M14.1 2.5v10.2a2.1 2.1 0 1 1-1.2-1.9V8.4a4.7 4.7 0 0 0-.9-.1 4.4 4.4 0 1 0 4.4 4.4V7.4a8.1 8.1 0 0 0 4.1 1.6V6.7a6.5 6.5 0 0 1-4.1-4.2h-2.3Z"
      />
    </svg>
  );
}
