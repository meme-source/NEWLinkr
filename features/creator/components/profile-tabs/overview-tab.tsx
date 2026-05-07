"use client";

import { Lock, Sparkles } from "lucide-react";
import { useWorkspaceProject } from "@/features/project/components/project-context";
import {
  RELATIONSHIP_BADGE,
  RELATIONSHIP_LABEL,
  STATUS_BADGE,
  STATUS_LABEL,
  SOURCE_LABEL,
} from "@/features/library/data/status-config";
import {
  daysSince,
  deriveNextStepHint,
  formatRelativeShort,
  getCreatorCollaborationInProject,
} from "@/features/library/helpers/creator";
import type { LibraryCreator } from "@/features/library/types";
import type { CreatorProfileInput } from "../creator-profile-drawer";
import { C, EmptyHint, SectionTitle, StatBlock } from "./shared";

interface Props {
  creator: CreatorProfileInput;
}

// Build a transient LibraryCreator-shaped view from CreatorProfileInput so we
// can reuse the same helper functions. Phase 1 callers always send the rich
// CRM payload; lighter callers (discovery / inbox) get sensible empty states.
function asLibraryView(c: CreatorProfileInput): Partial<LibraryCreator> {
  return {
    relationship: c.relationship,
    owner: c.owner ?? null,
    source: c.source,
    lastContactAt: c.lastContactAt ?? null,
    lastResponseAt: c.lastResponseAt ?? null,
    nextFollowUp: c.nextFollowUp ?? null,
    addedAt: c.addedAt,
    collaborations: c.collaborations ?? [],
  };
}

export function OverviewTab({ creator }: Props) {
  const { currentProjectId, resolveProjectName } = useWorkspaceProject();
  const view = asLibraryView(creator);
  const collab =
    view.collaborations && currentProjectId
      ? getCreatorCollaborationInProject(view as LibraryCreator, currentProjectId)
      : null;
  const hint =
    view.collaborations && currentProjectId
      ? deriveNextStepHint(view as LibraryCreator, currentProjectId)
      : null;
  const lastContactDays = daysSince(view.lastContactAt ?? null);

  return (
    <div className="space-y-6">
      {/* Snapshot */}
      <section>
        <SectionTitle>关键指标快照</SectionTitle>
        <div
          className="grid grid-cols-4 gap-6 rounded-2xl border bg-background p-5"
          style={{ borderColor: C.border }}
        >
          <StatBlock label="粉丝量" value={creator.followers} />
          <StatBlock label="互动率 (ER)" value={creator.er} tone="good" />
          <StatBlock
            label="最后联系"
            value={lastContactDays !== null ? `${lastContactDays} 天前` : "未联系"}
            tone={lastContactDays !== null && lastContactDays >= 5 ? "warn" : "mid"}
          />
          <StatBlock
            label="加入时间"
            value={view.addedAt ? formatRelativeShort(view.addedAt) : "—"}
            tone="mid"
          />
        </div>
      </section>

      {/* Current project status */}
      <section>
        <SectionTitle>当前项目状态</SectionTitle>
        {!currentProjectId || !collab ? (
          <EmptyHint>该博主尚未加入当前项目</EmptyHint>
        ) : (
          <div
            className="space-y-3 rounded-2xl border bg-background p-5"
            style={{ borderColor: C.border }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[12px]" style={{ color: C.stone }}>
                项目
              </span>
              <span className="text-[13px] font-medium" style={{ color: C.ink }}>
                {resolveProjectName(collab.projectId)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px]" style={{ color: C.stone }}>
                项目内状态
              </span>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STATUS_BADGE[collab.status].badge}`}
              >
                {STATUS_LABEL[collab.status]}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px]" style={{ color: C.stone }}>
                关系层级（跨项目累计）
              </span>
              {creator.relationship && (
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${RELATIONSHIP_BADGE[creator.relationship]}`}
                >
                  {RELATIONSHIP_LABEL[creator.relationship]}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px]" style={{ color: C.stone }}>
                负责人 (Owner)
              </span>
              <span
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px]"
                style={{
                  borderColor: C.border,
                  background: C.parchment,
                  color: C.stone,
                }}
                title="团队功能即将开放"
              >
                <Lock className="h-2.5 w-2.5" />
                团队功能即将开放
              </span>
            </div>
            {creator.source && (
              <div className="flex items-center justify-between">
                <span className="text-[12px]" style={{ color: C.stone }}>
                  来源
                </span>
                <span className="text-[12px]" style={{ color: C.charcoal }}>
                  {SOURCE_LABEL[creator.source]}
                </span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Next-step suggestion */}
      <section>
        <SectionTitle>下一步建议</SectionTitle>
        {hint ? (
          <div
            className="flex items-start gap-3 rounded-2xl border p-4"
            style={{ borderColor: "#fff0e6", background: C.terracottaSoft }}
          >
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0" style={{ color: C.terracotta }} />
            <p className="text-[13px] leading-relaxed" style={{ color: C.ink }}>
              {hint}
            </p>
          </div>
        ) : (
          <EmptyHint>暂无建议</EmptyHint>
        )}
      </section>
    </div>
  );
}
