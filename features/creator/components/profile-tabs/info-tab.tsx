"use client";

import { ExternalLink, Mail } from "lucide-react";
import { SOURCE_LABEL } from "@/features/library/data/status-config";
import type { CreatorProfileInput } from "../creator-profile-drawer";
import { C, EmptyHint, PlatformBadge, SectionTitle, StatBlock } from "./shared";

interface Props {
  creator: CreatorProfileInput;
}

export function InfoTab({ creator }: Props) {
  const dms = creator.dms ?? {};
  const dmEntries = Object.entries(dms).filter(([, v]) => Boolean(v)) as [string, string][];
  const emails = creator.emails ?? [];
  const links = creator.socialLinks ?? [];

  return (
    <div className="space-y-6">
      {/* Contact */}
      <section>
        <SectionTitle>联系方式</SectionTitle>
        <div
          className="space-y-3 rounded-2xl border bg-background p-5"
          style={{ borderColor: C.border }}
        >
          {emails.length === 0 && dmEntries.length === 0 && links.length === 0 ? (
            <EmptyHint>暂未记录联系方式</EmptyHint>
          ) : (
            <>
              {emails.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px]" style={{ color: C.stone }}>
                    邮箱
                  </p>
                  <div className="space-y-1.5">
                    {emails.map((e) => (
                      <a
                        key={e}
                        href={`mailto:${e}`}
                        className="flex items-center gap-2 text-[13px]"
                        style={{ color: C.terracotta }}
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {e}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {dmEntries.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px]" style={{ color: C.stone }}>
                    平台 DM
                  </p>
                  <div className="space-y-1">
                    {dmEntries.map(([platform, handle]) => (
                      <div key={platform} className="flex items-center gap-2 text-[13px]">
                        <span
                          className="rounded-full border px-2 py-0.5 text-[10px] capitalize"
                          style={{ borderColor: C.border, color: C.stone }}
                        >
                          {platform}
                        </span>
                        <span style={{ color: C.charcoal }}>{handle}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {links.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px]" style={{ color: C.stone }}>
                    其他链接
                  </p>
                  <div className="space-y-1">
                    {links.map((l) => (
                      <a
                        key={l}
                        href={l}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[13px]"
                        style={{ color: C.terracotta }}
                      >
                        <ExternalLink className="h-3 w-3" />
                        {l}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Profile basics */}
      <section>
        <SectionTitle>账号信息</SectionTitle>
        <div
          className="space-y-3 rounded-2xl border bg-background p-5"
          style={{ borderColor: C.border }}
        >
          <Row label="账号">{creator.handle}</Row>
          <Row label="地区">{creator.region}</Row>
          <Row label="语言">{creator.language ?? "—"}</Row>
          <Row label="平台">
            <PlatformBadge platform={creator.platform ?? "tiktok"} />
          </Row>
          {creator.source && <Row label="来源">{SOURCE_LABEL[creator.source]}</Row>}
        </div>
      </section>

      {/* Platform stats */}
      <section>
        <SectionTitle>平台数据</SectionTitle>
        <div
          className="grid grid-cols-3 gap-6 rounded-2xl border bg-background p-5"
          style={{ borderColor: C.border }}
        >
          <StatBlock label="粉丝量" value={creator.followers} />
          <StatBlock label="互动率" value={creator.er} tone="good" />
          <StatBlock
            label="平均播放"
            value={creator.avgViews ? formatNum(creator.avgViews) : "—"}
            tone="mid"
          />
        </div>
      </section>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px]" style={{ color: C.stone }}>
        {label}
      </span>
      <span className="text-[13px] font-medium" style={{ color: C.ink }}>
        {children}
      </span>
    </div>
  );
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}
