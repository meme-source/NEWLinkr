import type {
  Collaboration,
  CollaborationStatus,
  CreatorRelationship,
  LibraryCreator,
} from "../types";

// Resolve a creator's status in a specific project. Returns null when the
// creator has no collaboration record in that project.
export function getCreatorStatusInProject(
  creator: LibraryCreator,
  projectId: string,
): CollaborationStatus | null {
  return creator.collaborations.find((c) => c.projectId === projectId)?.status ?? null;
}

export function getCreatorCollaborationInProject(
  creator: LibraryCreator,
  projectId: string,
): Collaboration | null {
  return creator.collaborations.find((c) => c.projectId === projectId) ?? null;
}

// Auto relationship grading. The doc table:
//   added         → cold
//   first email   → warm
//   reply         → hot
//   collaborating → partner
//   90d idle      → inactive  (Phase 2)
export function inferRelationshipFromStatus(
  status: CollaborationStatus,
  current: CreatorRelationship,
): CreatorRelationship {
  // Never downgrade a partner unless explicitly going to inactive.
  if (current === "partner") return "partner";
  switch (status) {
    case "collaborating":
    case "completed":
      return "partner";
    case "responding":
    case "negotiating":
      return "hot";
    case "contacted":
      return current === "hot" ? "hot" : "warm";
    case "queued":
    case "pending":
      return current === "cold" ? "cold" : current;
    case "excluded":
      return current;
  }
}

// Derive the "next-step" suggestion the Overview tab shows.
// Returns a short Chinese hint string, or null when no suggestion applies.
export function deriveNextStepHint(creator: LibraryCreator, projectId: string): string | null {
  const collab = getCreatorCollaborationInProject(creator, projectId);
  if (!collab) return null;

  if (collab.status === "pending") return "未建联 · 评估后即可发起首次邮件";
  if (collab.status === "queued") return "已加入建联队列 · 等待发送";
  if (collab.status === "completed") return "合作已完成 · 可归档或复盘";
  if (collab.status === "excluded") return "已排除 · 不再纳入本项目";

  if (collab.status === "contacted") {
    const days = daysSince(creator.lastContactAt);
    if (days !== null && days >= 5) return `已联系 ${days} 天未回复 · 建议跟进二轮`;
    return "已建联 · 等待回复";
  }

  if (collab.status === "collaborating") {
    return "合作进行中 · 关注内容追踪";
  }

  return null;
}

export function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return null;
  const ms = Date.now() - then;
  return Math.max(0, Math.floor(ms / 86_400_000));
}

export function formatRelativeShort(iso: string | null): string {
  const d = daysSince(iso);
  if (d === null) return "—";
  if (d === 0) return "今天";
  if (d === 1) return "昨天";
  if (d < 7) return `${d} 天前`;
  if (d < 30) return `${Math.floor(d / 7)} 周前`;
  if (d < 365) return `${Math.floor(d / 30)} 个月前`;
  return `${Math.floor(d / 365)} 年前`;
}

export function formatNumberShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
