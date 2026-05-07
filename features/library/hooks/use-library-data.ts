"use client";

import { useMemo } from "react";
import type { Creator } from "@/types/api";
import { dominantStatus, getActiveCollaboration } from "@/lib/creator";
import { getCreators } from "@/features/creator/data";
import type { LibraryScope, LibraryViewRow, StatusTab } from "@/features/library/types";

// scope=project：只看包含 projectId 的博主
// scope=all：返回全部博主，列表中的状态用 dominantStatus
export function useLibraryRows(scope: LibraryScope, projectId: string): LibraryViewRow[] {
  return useMemo(() => buildRows(getCreators(), scope, projectId), [scope, projectId]);
}

export function buildRows(
  creators: Creator[],
  scope: LibraryScope,
  projectId: string,
): LibraryViewRow[] {
  if (scope === "project") {
    return creators
      .filter((c) => c.collaborations.some((collab) => collab.projectId === projectId))
      .map((creator) => {
        const collab = getActiveCollaboration(creator, projectId);
        const projectCount = collab ? 1 : 0;
        return {
          creator,
          displayStatus: collab?.status ?? null,
          projectCount,
          rating: creator.rating,
        };
      });
  }
  return creators.map((creator) => ({
    creator,
    displayStatus: dominantStatus(creator),
    projectCount: new Set(creator.collaborations.map((c) => c.projectId)).size,
    rating: creator.rating,
  }));
}

// 7 个 CollaborationStatus + "all" 的计数
export function bucketCounts(rows: LibraryViewRow[]): Record<StatusTab, number> {
  const counts: Record<StatusTab, number> = {
    all: rows.length,
    pending: 0,
    queued: 0,
    sent: 0,
    collaborating: 0,
    completed: 0,
    paused: 0,
    rejected: 0,
  };
  for (const row of rows) {
    if (!row.displayStatus) continue;
    counts[row.displayStatus] += 1;
  }
  return counts;
}

export function filterByBucket(rows: LibraryViewRow[], tab: StatusTab): LibraryViewRow[] {
  if (tab === "all") return rows;
  return rows.filter((r) => r.displayStatus === tab);
}
