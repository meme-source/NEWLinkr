"use client";

import { Mail, MessageCircle, Tag, Target } from "lucide-react";

import { useWorkspaceProject } from "@/features/project/components/project-context";
import type { Creator } from "@/types/api";

interface Props {
  creator: Creator;
}

type TimelineEvent = {
  at: string;
  kind: "status" | "email-sent" | "email-replied" | "track";
  text: string;
};

// 合并自原 tab-timeline.tsx：把博主整个合作时间线挪进合作 tab。
export function TimelineBlock({ creator }: Props) {
  const { resolveProjectName } = useWorkspaceProject();
  const events = buildEvents(creator, resolveProjectName);
  if (events.length === 0) {
    return (
      <section>
        <Title />
        <p className="rounded-lg border border-dashed border-[#c5c0b1] py-6 text-center text-[12px] text-[#939084]">
          尚未产生任何事件
        </p>
      </section>
    );
  }
  return (
    <section>
      <Title />
      <ol className="space-y-3">
        {events.map((event, idx) => (
          <li key={idx} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#fff7f4] text-[#ff4f00]">
                <Icon kind={event.kind} />
              </span>
              {idx < events.length - 1 && <span className="w-px flex-1 bg-[#c5c0b1]" />}
            </div>
            <div className="-mt-0.5 min-w-0 flex-1 rounded-lg border border-[#c5c0b1] bg-[#fffefb] p-3">
              <p className="text-[12px] text-[#201515]">{event.text}</p>
              <p className="mt-1 text-[11px] text-[#939084]">{event.at}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Title() {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="h-2 w-2 rounded-full bg-[#ff4f00]" />
      <h3 className="text-[14px] font-semibold text-[#201515]">合作时间线</h3>
    </div>
  );
}

function Icon({ kind }: { kind: TimelineEvent["kind"] }) {
  switch (kind) {
    case "status":
      return <Tag className="h-3.5 w-3.5" />;
    case "email-sent":
      return <Mail className="h-3.5 w-3.5" />;
    case "email-replied":
      return <MessageCircle className="h-3.5 w-3.5" />;
    case "track":
      return <Target className="h-3.5 w-3.5" />;
  }
}

function buildEvents(
  creator: Creator,
  resolveProjectName: (id: string) => string,
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  for (const collab of creator.collaborations) {
    const projectName = resolveProjectName(collab.projectId);
    events.push({
      at: collab.joinedAt,
      kind: "status",
      text: `加入项目「${projectName}」（状态：${collab.status}）`,
    });
    if (collab.lastContactAt) {
      events.push({
        at: collab.lastContactAt,
        kind: "email-sent",
        text: `项目「${projectName}」：发送建联邮件`,
      });
    }
  }
  if (creator.lastResponseAt) {
    events.push({
      at: creator.lastResponseAt,
      kind: "email-replied",
      text: "收到博主回复",
    });
  }
  return events.sort((a, b) => (a.at < b.at ? 1 : -1));
}
