"use client";

// Shared design tokens + atoms used by the 5 CRM tabs in the creator drawer.

export const C = {
  ivory: "#fffefb",
  parchment: "#eceae3",
  surface: "#fffdf9",
  ink: "#201515",
  charcoal: "#36342e",
  stone: "#939084",
  terracotta: "#ff4f00",
  terracottaSoft: "#fffdf9",
  border: "#c5c0b1",
  borderLight: "#eceae3",
  emerald: "#7a8a6a",
  amber: "#c98a42",
  sky: "#5b7a8a",
};

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="h-2 w-2 rounded-full" style={{ background: C.terracotta }} />
      <h3 className="text-[15px] font-semibold" style={{ color: C.ink }}>
        {children}
      </h3>
    </div>
  );
}

export function StatBlock({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "good" | "warn" | "mid";
}) {
  const toneColor =
    tone === "good"
      ? "text-emerald-600"
      : tone === "warn"
        ? "text-amber-600"
        : tone === "mid"
          ? "text-[#939084]"
          : "text-[#201515]";
  return (
    <div className="min-w-0 flex-1">
      <p className="mb-1 text-[11px]" style={{ color: C.stone }}>
        {label}
      </p>
      <p className={`text-[22px] leading-none font-bold ${toneColor}`}>{value}</p>
      {sub && (
        <p className="mt-1 text-[10px]" style={{ color: C.stone }}>
          {sub}
        </p>
      )}
    </div>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "ok" | "warn";
}) {
  const map = {
    neutral: { bg: C.parchment, fg: C.charcoal, bd: C.border },
    accent: { bg: C.terracottaSoft, fg: C.terracotta, bd: "#fff0e6" },
    ok: { bg: "#eef3ea", fg: C.emerald, bd: "#d8e2d0" },
    warn: { bg: "#fbf1e1", fg: C.amber, bd: "#ecdcc0" },
  } as const;
  const t = map[tone];
  return (
    <span
      className="rounded-full border px-2 py-0.5 text-[11px]"
      style={{ background: t.bg, color: t.fg, borderColor: t.bd }}
    >
      {children}
    </span>
  );
}

export function PlatformBadge({ platform }: { platform: "youtube" | "tiktok" | "instagram" }) {
  const map = {
    youtube: { label: "YouTube", bg: "#fff0ef", fg: "#e53e3e" },
    tiktok: { label: "TikTok", bg: "#201515", fg: "#fffefb" },
    instagram: { label: "Instagram", bg: "#fdf0f5", fg: "#c0387a" },
  } as const;
  const p = map[platform];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
      style={{ background: p.bg, color: p.fg }}
    >
      {p.label}
    </span>
  );
}

export function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#c5c0b1] bg-background/60 p-5 text-center text-[12px] text-[#939084]">
      {children}
    </div>
  );
}
