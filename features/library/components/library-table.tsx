"use client";

import { useMemo } from "react";
import type { CollaborationStatus, Creator } from "@/types/api";
import type { LibraryScope, LibraryViewRow } from "@/features/library/types";
import type { ToggleableColumnId } from "@/features/library/hooks/use-library-columns";
import { LibraryRow, buildGridTemplate, type RowAction } from "./library-row";

interface Props {
  rows: LibraryViewRow[];
  scope: LibraryScope;
  selectedIds: Set<string>;
  visibleColumns: Set<ToggleableColumnId>;
  resolveProjectName: (projectId: string) => string;
  onToggleAll: (ids: string[]) => void;
  onToggle: (id: string) => void;
  onOpen: (creator: Creator) => void;
  onAction: (action: RowAction, creator: Creator) => void;
  onChangeStatus: (creatorId: string, status: CollaborationStatus) => void;
  onChangeNotes: (creatorId: string, notes: string) => void;
}

export function LibraryTable({
  rows,
  scope,
  selectedIds,
  visibleColumns,
  resolveProjectName,
  onToggleAll,
  onToggle,
  onOpen,
  onAction,
  onChangeStatus,
  onChangeNotes,
}: Props) {
  const visibleIds = useMemo(() => rows.map((row) => row.creator.id), [rows]);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const showCampaigns = scope === "all";
  const gridTemplate = buildGridTemplate(visibleColumns, showCampaigns);

  // 表格整体作为合并卡片的内层模块：去掉外框；表头淡米色背景 + 圆角；
  // 表头与数据行之间加一条浅米分隔线作为内容分层；行间用极淡的 divider 区分。
  return (
    <div>
      <div
        className="grid items-center gap-3 rounded-lg border-b border-[#eceae3] bg-[#fffdf9] px-3 py-2.5 text-[12px] font-normal text-[#939084]"
        style={{ gridTemplateColumns: gridTemplate }}
      >
        <input
          type="checkbox"
          checked={allSelected}
          onChange={() => onToggleAll(allSelected ? [] : visibleIds)}
          className="h-3.5 w-3.5 cursor-pointer accent-[#ff4f00]"
          aria-label="全选"
        />
        <span>博主</span>
        {visibleColumns.has("category") && <span>类型</span>}
        {visibleColumns.has("status") && <span>状态</span>}
        {visibleColumns.has("rating") && <span>评级</span>}
        {visibleColumns.has("engagement") && <span className="text-right">互动率</span>}
        {visibleColumns.has("medianViews") && <span className="text-right">均播放</span>}
        {visibleColumns.has("avgLikes") && <span className="text-right">均点赞</span>}
        {visibleColumns.has("source") && <span>来源</span>}
        {visibleColumns.has("topics") && <span>话题词</span>}
        {visibleColumns.has("userTags") && <span>标签</span>}
        {visibleColumns.has("collaboration") && <span>合作时间</span>}
        {visibleColumns.has("notes") && <span>备注</span>}
        {visibleColumns.has("email") && <span>邮箱</span>}
        {visibleColumns.has("collaborationCount") && <span className="text-right">合作次数</span>}
        {showCampaigns && <span>推广活动</span>}
        <span />
      </div>
      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-1 py-12 text-center">
          <p className="text-[14px] text-[#36342e]">没有符合条件的博主</p>
          <p className="text-[12px] text-[#939084]">尝试切换分桶或重置筛选</p>
        </div>
      ) : (
        rows.map((row) => (
          <LibraryRow
            key={row.creator.id}
            row={row}
            scope={scope}
            selected={selectedIds.has(row.creator.id)}
            visibleColumns={visibleColumns}
            campaigns={resolveCampaignsFor(row, resolveProjectName)}
            onToggleSelect={onToggle}
            onOpen={onOpen}
            onAction={onAction}
            onChangeStatus={onChangeStatus}
            onChangeNotes={onChangeNotes}
          />
        ))
      )}
    </div>
  );
}

function resolveCampaignsFor(
  row: LibraryViewRow,
  resolveProjectName: (projectId: string) => string,
): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const collab of row.creator.collaborations) {
    if (collab.projectId === "unassigned") continue;
    if (seen.has(collab.projectId)) continue;
    seen.add(collab.projectId);
    names.push(resolveProjectName(collab.projectId));
  }
  return names;
}
