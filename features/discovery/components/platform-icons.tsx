import type { PlatformId } from "../types";

interface PlatformIconProps {
  id: PlatformId;
  colored?: boolean;
  size?: number;
}

export function PlatformIcon({ id, colored = false, size = 16 }: PlatformIconProps) {
  if (id === "tiktok") {
    if (colored) {
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
          <path
            transform="translate(-1,1)"
            fill="#25F4EE"
            d="M25.3 8.9a7.1 7.1 0 0 1-5.5-6.2V2h-5v19.9a4.2 4.2 0 1 1-3.1-4V12.8a9.3 9.3 0 1 0 8.5 9.2V12.5a12 12 0 0 0 7 2.24V9.7a7.1 7.1 0 0 1-1.9-.8z"
          />
          <path
            transform="translate(1,-1)"
            fill="#FE2C55"
            d="M25.3 8.9a7.1 7.1 0 0 1-5.5-6.2V2h-5v19.9a4.2 4.2 0 1 1-3.1-4V12.8a9.3 9.3 0 1 0 8.5 9.2V12.5a12 12 0 0 0 7 2.24V9.7a7.1 7.1 0 0 1-1.9-.8z"
          />
          <path
            fill="#201515"
            d="M25.3 8.9a7.1 7.1 0 0 1-5.5-6.2V2h-5v19.9a4.2 4.2 0 1 1-3.1-4V12.8a9.3 9.3 0 1 0 8.5 9.2V12.5a12 12 0 0 0 7 2.24V9.7a7.1 7.1 0 0 1-1.9-.8z"
          />
        </svg>
      );
    }
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="currentColor" aria-hidden>
        <path d="M25.3 8.9a7.1 7.1 0 0 1-5.5-6.2V2h-5v19.9a4.2 4.2 0 1 1-3.1-4V12.8a9.3 9.3 0 1 0 8.5 9.2V12.5a12 12 0 0 0 7 2.24V9.7a7.1 7.1 0 0 1-1.9-.8z" />
      </svg>
    );
  }
  if (id === "instagram") {
    if (colored) {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
          <defs>
            <linearGradient
              id="discoveryIgGradient"
              x1="3"
              y1="22"
              x2="21"
              y2="2"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="#FEDA75" />
              <stop offset=".35" stopColor="#FA7E1E" />
              <stop offset=".6" stopColor="#D62976" />
              <stop offset=".8" stopColor="#962FBF" />
              <stop offset="1" stopColor="#4F5BD5" />
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="20" height="20" rx="5.5" fill="url(#discoveryIgGradient)" />
          <circle cx="12" cy="12" r="4.5" stroke="#fff" strokeWidth="1.8" />
          <circle cx="17.5" cy="6.5" r="1.2" fill="#fff" />
        </svg>
      );
    }
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden
      >
        <rect x="2" y="2" width="20" height="20" rx="5.5" />
        <circle cx="12" cy="12" r="4.5" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  // youtube
  if (colored) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="1.3" y="4" width="21.4" height="16" rx="4.5" fill="#FF0000" />
        <path d="m10 8.8 6 3.2-6 3.2V8.8Z" fill="#fff" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M23 7s-.3-2-1.2-2.7C20.7 3.1 19.4 3.1 18.8 3 16.2 3 12 3 12 3S7.8 3 5.2 3.2c-.6 0-1.9 0-3 1.3C1.3 5 1 7 1 7S.7 9.2.7 11.5v2.1c0 2.3.3 4.5.3 4.5s.3 2 1.2 2.7c1.1 1.2 2.6 1.1 3.3 1.2C7.7 22 12 22 12 22s4.2 0 6.8-.2c.6-.1 1.9-.1 3-1.3.9-.7 1.2-2.7 1.2-2.7s.3-2.2.3-4.5v-2.1C23.3 9.2 23 7 23 7zm-13.3 8.5V8.4l8.1 3.6-8.1 3.5z" />
    </svg>
  );
}
