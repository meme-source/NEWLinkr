"use client";

import { CheckCircle2, Mail, MessageCircle, Pencil, RefreshCw } from "lucide-react";
import type { TimelineEvent, TimelineEventType } from "@/features/library/types";
import type { CreatorProfileInput } from "../creator-profile-drawer";
import { C, EmptyHint, SectionTitle } from "./shared";

interface Props {
  creator: CreatorProfileInput;
}

// When the caller hasn't provided an explicit timeline, derive a minimal one
// from the CRM fields so the tab still has content.
function deriveTimeline(c: CreatorProfileInput): TimelineEvent[] {
  if (c.timeline?.length) return c.timeline;
  const events: TimelineEvent[] = [];
  if (c.addedAt) {
    events.push({
      id: "added",
      type: "manual",
      at: c.addedAt,
      summary: "加入博主库",
    });
  }
  if (c.lastContactAt) {
    events.push({
      id: "last-contact",
      type: "email_sent",
      at: c.lastContactAt,
      summary: "向博主发送邮件",
    });
  }
  if (c.lastResponseAt) {
    events.push({
      id: "last-response",
      type: "email_replied",
      at: c.lastResponseAt,
      summary: "博主邮件回复",
    });
  }
  return events.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

const ICONS: Record<TimelineEventType, typeof Mail> = {
  status_change: RefreshCw,
  email_sent: Mail,
  email_replied: MessageCircle,
  tracked_added: CheckCircle2,
  manual: Pencil,
};

export function TimelineTab({ creator }: Props) {
  const events = deriveTimeline(creator);
  return (
    <div className="space-y-6">
      <section>
        <SectionTitle>事件流</SectionTitle>
        {events.length === 0 ? (
          <EmptyHint>暂无事件记录</EmptyHint>
        ) : (
          <ol className="relative space-y-4 border-l pl-5" style={{ borderColor: C.border }}>
            {events.map((e) => {
              const Icon = ICONS[e.type];
              return (
                <li key={e.id} className="relative">
                  <span
                    className="absolute -left-[26px] flex h-5 w-5 items-center justify-center rounded-full border bg-background"
                    style={{ borderColor: C.border, color: C.terracotta }}
                  >
                    <Icon className="h-3 w-3" />
                  </span>
                  <div
                    className="rounded-2xl border bg-background px-4 py-3"
                    style={{ borderColor: C.border }}
                  >
                    <p className="text-[13px]" style={{ color: C.ink }}>
                      {e.summary}
                    </p>
                    <p className="mt-1 text-[11px]" style={{ color: C.stone }}>
                      {formatTime(e.at)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}
