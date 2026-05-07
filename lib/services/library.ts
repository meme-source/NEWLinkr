// 博主库服务层
//
// Phase 1：直接读 mock 数据（features/creator/data）；Phase 2 替换为 DB / API。
// service 层不接触 React，UI 通过 hook 包装调用，方便日后切换数据源。

import type {
  Collaboration,
  Creator,
  LibraryListRequest,
  UpdateCollaborationStatusRequest,
} from "@/types/api";
import { getCreators } from "@/features/creator/data";

export async function listCreators(input: LibraryListRequest): Promise<Creator[]> {
  const all = getCreators();
  if (input.scope === "all") return all;
  if (!input.projectId) return [];
  return all.filter((creator) =>
    creator.collaborations.some((collab) => collab.projectId === input.projectId),
  );
}

// Phase 1 占位：返回更新后的合作记录。真实实现会写库 + 触发关系等级演化。
export async function updateCollaborationStatus(
  input: UpdateCollaborationStatusRequest,
): Promise<Collaboration | null> {
  const all = getCreators();
  const creator = all.find((c) => c.id === input.creatorId);
  if (!creator) return null;
  const collab = creator.collaborations.find((c) => c.projectId === input.projectId);
  if (!collab) return null;
  return { ...collab, status: input.status };
}
