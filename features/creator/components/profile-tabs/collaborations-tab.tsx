"use client";

import { useWorkspaceProject } from "@/features/project/components/project-context";
import { STATUS_BADGE, STATUS_LABEL } from "@/features/library/data/status-config";
import { formatRelativeShort } from "@/features/library/helpers/creator";
import type { CreatorProfileInput } from "../creator-profile-drawer";
import { C, EmptyHint, SectionTitle } from "./shared";

interface Props {
  creator: CreatorProfileInput;
}

export function CollaborationsTab({ creator }: Props) {
  const { resolveProjectName, currentProjectId } = useWorkspaceProject();
  const collabs = creator.collaborations ?? [];

  return (
    <div className="space-y-6">
      <section>
        <SectionTitle>合作记录</SectionTitle>
        {collabs.length === 0 ? (
          <EmptyHint>暂无合作记录</EmptyHint>
        ) : (
          <div className="space-y-3">
            {collabs.map((c) => {
              const isCurrent = c.projectId === currentProjectId;
              return (
                <div
                  key={c.id}
                  className="rounded-2xl border bg-background p-4"
                  style={{
                    borderColor: isCurrent ? "#fff0e6" : C.border,
                    background: isCurrent ? C.terracottaSoft : "#fff",
                  }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold" style={{ color: C.ink }}>
                        {resolveProjectName(c.projectId)}
                      </span>
                      {isCurrent && (
                        <span
                          className="rounded-full border px-1.5 py-px text-[10px]"
                          style={{
                            borderColor: "#fff0e6",
                            color: C.terracotta,
                            background: "#fff",
                          }}
                        >
                          当前项目
                        </span>
                      )}
                    </div>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE[c.status].badge}`}
                    >
                      {STATUS_LABEL[c.status]}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-[11px]" style={{ color: C.stone }}>
                    <Field label="加入时间" value={formatRelativeShort(c.joinedAt)} />
                    <Field label="最后联系" value={formatRelativeShort(c.lastContactAt)} />
                    <Field
                      label="追踪内容"
                      value={
                        c.trackedContentIds.length > 0 ? `${c.trackedContentIds.length} 条` : "—"
                      }
                    />
                  </div>
                  {c.notes && (
                    <p
                      className="mt-3 border-t pt-2 text-[12px] leading-relaxed"
                      style={{ borderColor: C.borderLight, color: C.charcoal }}
                    >
                      {c.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px]" style={{ color: C.stone }}>
        {label}
      </p>
      <p className="mt-0.5 truncate text-[12px]" style={{ color: C.charcoal }}>
        {value}
      </p>
    </div>
  );
}
