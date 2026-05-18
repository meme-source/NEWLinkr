"use client";

import { Download, Heart, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCreatorProfile } from "@/features/creator/components/creator-profile-context";
import { getCreatorByHandle } from "@/features/creator/data/registry";
import { OUTREACH_CREATORS } from "@/features/outreach/data/outreach-creators";
import type { OutreachCreator } from "@/features/outreach/data/outreach-types";
import type {
  ProjectDrawerMode,
  WorkspaceProject,
} from "@/features/project/components/project-context";
import { COLLABORATION_STATUS_LABEL, COLLABORATION_STATUS_STYLE } from "@/lib/creator";
import { cn } from "@/lib/utils";
import type { CollaborationStatus } from "@/types/api";

// 「达人投放」Tab —— 项目里「已合作达人」的名单记录 + CSV 导出。
//   已合作 = 合作中（collaborating）+ 已完成（completed）—— 真正谈成并推进过的达人。
// 点头像 / 名字会弹出该达人的博主信息卡（这些达人都已入博主库）。

// 已合作的两种状态。
const COLLABORATED_STATUSES: ReadonlySet<CollaborationStatus> = new Set([
  "collaborating",
  "completed",
]);

function formatFollowers(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(count);
}

// 把名单导出成 CSV —— 加 BOM 让 Excel 正确识别中文。
function exportCreatorsCsv(projectName: string, creators: OutreachCreator[]): void {
  const header = ["达人", "账号", "平台", "粉丝数", "状态"];
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const rows = creators.map((creator) =>
    [
      creator.name,
      creator.handle,
      creator.platform,
      String(creator.followers),
      COLLABORATION_STATUS_LABEL[creator.status],
    ]
      .map(escape)
      .join(","),
  );
  const csv = `﻿${[header.map(escape).join(","), ...rows].join("\r\n")}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${projectName || "项目"}-已合作达人.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function ProjectSheetPlacementTab({
  mode,
  project,
}: {
  mode: ProjectDrawerMode;
  project?: WorkspaceProject;
}) {
  const { openCreatorProfile } = useCreatorProfile();

  if (mode === "create" || !project) {
    return (
      <p className="rounded-lg bg-[#fffdf9] px-3 py-3 text-[11px] leading-5 text-[#939084]">
        项目创建并开始建联后，这里会展示已合作的达人名单。
      </p>
    );
  }

  const creators = OUTREACH_CREATORS.filter(
    (creator) => creator.projectId === project.id && COLLABORATED_STATUSES.has(creator.status),
  );

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#201515]">
          <Users className="h-4 w-4 text-[#ff4f00]" />
          已合作达人
          {creators.length > 0 ? (
            <span className="text-xs font-normal text-[#939084]">· {creators.length}</span>
          ) : null}
        </div>
        <Button
          unstyled
          type="button"
          onClick={() => exportCreatorsCsv(project.name, creators)}
          disabled={creators.length === 0}
          className="inline-flex items-center gap-1 rounded-full border border-[#c5c0b1] bg-[#fffefb] px-3 py-1.5 text-xs font-medium text-[#36342e] transition-colors hover:bg-[#eceae3] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" />
          导出
        </Button>
      </div>

      {creators.length === 0 ? (
        <p className="rounded-lg bg-[#fffdf9] px-3 py-3 text-[11px] leading-5 text-[#939084]">
          还没有达人进入合作 —— 在建联看板里推进达人状态后，这里会同步名单。
        </p>
      ) : (
        <ul className="divide-y divide-[#eceae3] overflow-hidden rounded-lg border border-[#c5c0b1] bg-[#fffefb]">
          {creators.map((creator) => (
            <CreatorRow
              key={creator.id}
              creator={creator}
              onOpen={() => openCreatorProfile({ handle: creator.handle })}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function CreatorRow({ creator, onOpen }: { creator: OutreachCreator; onOpen: () => void }) {
  const style = COLLABORATION_STATUS_STYLE[creator.status];
  // 已合作达人都已收藏入博主库 —— 解析到库内记录即点亮红心，与博主库 / 抽屉一致。
  const favorited = getCreatorByHandle(creator.handle)?.favorited ?? false;
  return (
    <li className="flex items-center gap-2 px-2 py-1.5">
      <Button
        unstyled
        type="button"
        onClick={onOpen}
        title="查看博主信息卡"
        className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-1 py-1 text-left transition-colors hover:bg-[#fffdf9]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff7f4] text-xs font-semibold text-[#ff4f00]">
          {creator.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-xs font-semibold text-[#201515]">{creator.name}</span>
            {favorited ? (
              <Heart
                className="h-3 w-3 shrink-0 fill-[#ff4f00] text-[#ff4f00]"
                aria-label="已收藏"
              />
            ) : null}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-[#939084]">
            <span className="truncate">{creator.handle}</span>
            <span aria-hidden className="text-[#c5c0b1]">
              ·
            </span>
            <span>{creator.platform}</span>
            <span aria-hidden className="text-[#c5c0b1]">
              ·
            </span>
            <span className="tabular-nums">{formatFollowers(creator.followers)} 粉丝</span>
          </div>
        </div>
      </Button>
      <span
        className={cn(
          "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium",
          style.badge,
        )}
      >
        {COLLABORATION_STATUS_LABEL[creator.status]}
      </span>
    </li>
  );
}
