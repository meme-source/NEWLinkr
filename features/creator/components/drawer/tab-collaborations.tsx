"use client";

import { useMemo } from "react";

import { useCreatorPlacements } from "@/features/creator/data/use-creator-placements";
import type { CollaborationStatus, Creator } from "@/types/api";

import { ContactBlock } from "./collab/contact-block";
import { ProjectCard } from "./collab/project-card";
import { TimelineBlock } from "./collab/timeline-block";

interface Props {
  creator: Creator;
  // 抽屉外层注入；给定时每张项目卡的状态徽章可下拉编辑。
  onChangeCollaborationStatus?: (
    creatorId: string,
    projectId: string,
    next: CollaborationStatus,
  ) => void;
  // 联系方式手填姓名持久化（mock 阶段未接入；UI 仍透传出来留好接口）。
  onChangeManualContactName?: (creatorId: string, name: string | null) => void;
}

// 「项目合作」tab：联系方式 → 项目卡（含投放）→ 合作时间线。
export function TabCollaborations({
  creator,
  onChangeCollaborationStatus,
  onChangeManualContactName,
}: Props) {
  const placements = useCreatorPlacements(creator.handle);
  const placementsByProject = useMemo(() => {
    const map = new Map<string, typeof placements>();
    for (const p of placements) {
      const arr = map.get(p.projectId) ?? [];
      arr.push(p);
      map.set(p.projectId, arr);
    }
    return map;
  }, [placements]);

  return (
    <div className="space-y-5">
      <ContactBlock creator={creator} onChangeManualContactName={onChangeManualContactName} />

      <section>
        <div className="mb-2 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#ff4f00]" />
          <h3 className="text-[14px] font-semibold text-[#201515]">所属项目</h3>
          <span className="text-[11px] text-[#939084]">{creator.collaborations.length} 个</span>
        </div>
        {creator.collaborations.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#c5c0b1] py-6 text-center text-[12px] text-[#939084]">
            尚未参与任何项目
          </p>
        ) : (
          <div className="space-y-3">
            {creator.collaborations.map((collab) => {
              const projectPlacements = placementsByProject.get(collab.projectId) ?? [];
              const onChangeStatus = onChangeCollaborationStatus
                ? (next: CollaborationStatus) =>
                    onChangeCollaborationStatus(creator.id, collab.projectId, next)
                : undefined;
              return (
                <ProjectCard
                  key={collab.id}
                  creator={creator}
                  collab={collab}
                  placements={projectPlacements}
                  onChangeStatus={onChangeStatus}
                />
              );
            })}
          </div>
        )}
      </section>

      <TimelineBlock creator={creator} />
    </div>
  );
}
