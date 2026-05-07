"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CollaborationStatus, Creator, Rating } from "@/types/api";
import { useWorkspaceProject } from "@/features/project/components/project-context";
import { useCreatorProfile } from "@/features/creator/components/creator-profile-context";
import { LibraryOverview } from "@/features/library/components/library-overview";
import { LibraryStatusTabs } from "@/features/library/components/library-status-tabs";
import { LibraryToolbar } from "@/features/library/components/library-toolbar";
import { LibraryTable } from "@/features/library/components/library-table";
import { LibraryBulkBar } from "@/features/library/components/library-bulk-bar";
import { LibraryImportFlow } from "@/features/library/components/library-import-flow";
import {
  LibraryBulkOutreach,
  type BulkOutreachPayload,
} from "@/features/library/components/library-bulk-outreach";
import {
  LibraryRowActionDialog,
  type RowDialogState,
} from "@/features/library/components/library-row-action-dialog";
import { LibraryToast } from "@/features/library/components/library-toast";
import type { RowAction } from "@/features/library/components/library-row";
import {
  bucketCounts,
  filterByBucket,
  useLibraryRows,
} from "@/features/library/hooks/use-library-data";
import { applyLibraryFilter, useLibraryFilter } from "@/features/library/hooks/use-library-filter";
import { useLibrarySelection } from "@/features/library/hooks/use-library-selection";
import { useLibraryColumns } from "@/features/library/hooks/use-library-columns";
import { buildCollaborationYearOptions } from "@/features/library/data/collaboration-time-filter";
import type { StatusTab } from "@/features/library/types";

export default function LibraryPage() {
  const { currentProject, isAllProjects, projects, resolveProjectName } = useWorkspaceProject();
  const { openCreatorProfile } = useCreatorProfile();
  const router = useRouter();

  // §2.3.x library scope is derived from the global ProjectBar selection so
  // we don't expose a duplicate toggle here.
  const scope = isAllProjects ? "all" : "project";
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [importOpen, setImportOpen] = useState(false);
  const [bulkOutreachOpen, setBulkOutreachOpen] = useState(false);
  // 行级三点菜单的二级动作（移项目 / 删除）需要二次确认或选择，统一在 page 层持有状态。
  const [rowDialog, setRowDialog] = useState<RowDialogState>(null);
  // toast 用于行级"投放追踪 / 移项目 / 删除"等需要轻量反馈的动作。
  const [toast, setToast] = useState<{ message: string; actionLabel?: string } | null>(null);

  const filter = useLibraryFilter();
  const selection = useLibrarySelection();
  const columns = useLibraryColumns();

  // 用户标签的会话级 override：抽屉编辑 / 批量打标签 都从这里写入。
  // 渲染表格 + 抽屉时把 override 合到 creator.userTags，让"博主库列 / 个人详情 / 批量"
  // 三处看到的标签是同一份数据。Phase 1+ 改为 service 调用即可。
  const [userTagsOverride, setUserTagsOverride] = useState<Record<string, string[]>>({});
  const effectiveCreator = useCallback(
    (c: Creator): Creator => {
      const extra = userTagsOverride[c.id];
      if (!extra || extra.length === 0) return c;
      return { ...c, userTags: dedupe([...c.userTags, ...extra]) };
    },
    [userTagsOverride],
  );

  // Clear bulk selection whenever scope flips so we don't carry stale ids
  // between "全部博主" and a specific project's filtered list. selection.clear
  // is stable (useCallback []), so depending on it won't loop.
  const clearSelection = selection.clear;
  useEffect(() => {
    clearSelection();
  }, [scope, clearSelection]);

  const rows = useLibraryRows(scope, currentProject.id);

  // 系统话题词 + 用户标签是两个独立来源；候选项也分开聚合给筛选面板使用。
  const topicOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((row) => row.creator.topics.forEach((topic) => set.add(topic)));
    return Array.from(set).sort();
  }, [rows]);
  const userTagOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((row) => effectiveCreator(row.creator).userTags.forEach((tag) => set.add(tag)));
    return Array.from(set).sort();
  }, [rows, effectiveCreator]);
  const collaborationYearOptions = useMemo(
    () => buildCollaborationYearOptions(rows.map((row) => row.creator)),
    [rows],
  );

  const filteredCreators = useMemo(
    () =>
      applyLibraryFilter(
        rows.map((r) => r.creator),
        filter.state,
        columns.visible,
      ),
    [rows, filter.state, columns.visible],
  );
  const allowedIds = useMemo(() => new Set(filteredCreators.map((c) => c.id)), [filteredCreators]);

  const filteredRows = useMemo(
    () => rows.filter((row) => allowedIds.has(row.creator.id)),
    [rows, allowedIds],
  );

  const counts = useMemo(() => bucketCounts(filteredRows), [filteredRows]);
  const visibleRowsRaw = useMemo(
    () => filterByBucket(filteredRows, statusTab),
    [filteredRows, statusTab],
  );
  // 把 userTags override 在最后一道 mapping 里合并进 creator，这样表格 + 抽屉
  // 拿到的 creator 已经带最新标签，无需各处分别融合。
  const visibleRows = useMemo(
    () => visibleRowsRaw.map((row) => ({ ...row, creator: effectiveCreator(row.creator) })),
    [visibleRowsRaw, effectiveCreator],
  );

  const selectedCreators = useMemo(
    () => visibleRows.filter((row) => selection.ids.has(row.creator.id)).map((row) => row.creator),
    [visibleRows, selection.ids],
  );

  const handleOpen = (creator: Creator) => {
    // 抽屉拿的 creator 已经经过 row-mapping 合并 override；直接传 Creator 即可。
    openCreatorProfile(creator);
  };

  const handleAction = (action: RowAction, creator: Creator) => {
    if (action === "outreach") {
      selection.setAll([creator.id]);
      setBulkOutreachOpen(true);
      return;
    }
    if (action === "track") {
      // mock 阶段：直接打日志 + 给一个带"查看看板"动作的 toast。
      // Phase 1+ 改为 service 调用 tracking.add。
      console.info("library row track", { creatorId: creator.id });
      setToast({
        message: `已将 ${creator.name} 加入追踪看板`,
        actionLabel: "查看看板",
      });
      return;
    }
    if (action === "addCampaign") {
      setRowDialog({ kind: "move", creator });
      return;
    }
    if (action === "trash") {
      setRowDialog({ kind: "trash", creator });
      return;
    }
    console.info("library row action", action, creator.id);
  };

  const handleRowMove = (projectId: string) => {
    if (rowDialog?.kind !== "move") return;
    const { creator } = rowDialog;
    console.info("library row move", {
      creatorId: creator.id,
      from: currentProject.id,
      to: projectId,
    });
    const projectName = projects.find((p) => p.id === projectId)?.name ?? "目标项目";
    setRowDialog(null);
    setToast({ message: `已将 ${creator.name} 移至「${projectName}」` });
  };

  const handleRowTrash = () => {
    if (rowDialog?.kind !== "trash") return;
    const { creator } = rowDialog;
    console.info("library row trash", { creatorId: creator.id });
    setRowDialog(null);
    setToast({ message: `已将 ${creator.name} 移到回收站` });
  };

  const handleToastAction = () => {
    if (toast?.actionLabel === "查看看板") {
      router.push("/workspace/outreach?tab=board");
    }
    setToast(null);
  };

  const handleImport = (handles: string[]) => {
    console.info("library import handles", handles);
    setImportOpen(false);
  };

  const handleBulkSend = (payload: BulkOutreachPayload) => {
    // Phase 0：mock 阶段只打日志；Phase 1+ 改为 service 调用即可。
    console.info("library bulk outreach", {
      ...payload,
      recipientCount: payload.recipientIds.length,
    });
    setBulkOutreachOpen(false);
    selection.clear();
  };

  // 评级 / 状态 / 备注目前都是本地交互（mock 阶段不持久化）。Phase 1+ 接通
  // 真实后端时改写为 service 调用即可。
  const handleRate = (creatorId: string, rating: Rating) => {
    console.info("library rate", { creatorId, rating });
  };

  const handleChangeStatus = (creatorId: string, status: CollaborationStatus) => {
    console.info("library status", { creatorId, projectId: currentProject.id, status });
  };

  const handleChangeNotes = (creatorId: string, notes: string) => {
    console.info("library notes", { creatorId, projectId: currentProject.id, notes });
  };

  // ── 批量动作 ────────────────────────────────────────────────────────────
  // 这些 handler 都接受"当前已选博主 id 列表"作为隐式上下文，对外只暴露动作所需参数。

  const selectedIds = useMemo(() => selectedCreators.map((c) => c.id), [selectedCreators]);

  const handleBulkAddUserTags = (tags: string[]) => {
    if (tags.length === 0 || selectedIds.length === 0) return;
    console.info("library bulk add user tags", { creatorIds: selectedIds, tags });
    setUserTagsOverride((prev) => {
      const next = { ...prev };
      for (const id of selectedIds) {
        next[id] = dedupe([...(next[id] ?? []), ...tags]);
      }
      return next;
    });
    // 不清空选区——用户可能想接着应用更多标签。
  };

  const handleBulkMoveToProject = (projectId: string) => {
    console.info("library bulk move", {
      creatorIds: selectedIds,
      from: currentProject.id,
      to: projectId,
    });
    selection.clear();
  };

  const handleBulkChangeStatus = (status: CollaborationStatus) => {
    console.info("library bulk status", {
      creatorIds: selectedIds,
      projectId: currentProject.id,
      status,
    });
    selection.clear();
  };

  const handleBulkAddToTracking = () => {
    console.info("library bulk track", { creatorIds: selectedIds });
    selection.clear();
  };

  const handleOpenTrackingBoard = () => {
    router.push("/workspace/outreach?tab=board");
  };

  return (
    <div className="space-y-5">
      <LibraryOverview creators={filteredCreators} />

      <LibraryStatusTabs active={statusTab} counts={counts} onChange={setStatusTab} />

      <LibraryToolbar
        search={filter.state.search}
        filter={filter.state}
        availableTopics={topicOptions}
        availableUserTags={userTagOptions}
        availableCollaborationYears={collaborationYearOptions}
        visibleColumns={columns.visible}
        onSearch={filter.setSearch}
        onToggleDimension={filter.toggleDimension}
        onToggleColumn={columns.toggle}
        onAddCreator={() => setImportOpen(true)}
        onReset={filter.reset}
        hasAny={filter.hasAny}
      />

      <LibraryTable
        rows={visibleRows}
        scope={scope}
        selectedIds={selection.ids}
        visibleColumns={columns.visible}
        resolveProjectName={resolveProjectName}
        onToggleAll={selection.setAll}
        onToggle={selection.toggle}
        onOpen={handleOpen}
        onAction={handleAction}
        onRate={handleRate}
        onChangeStatus={handleChangeStatus}
        onChangeNotes={handleChangeNotes}
      />

      <LibraryBulkBar
        count={selection.count}
        availableUserTags={userTagOptions}
        projects={projects}
        currentProjectId={currentProject.id}
        isAllProjectsScope={isAllProjects}
        onOutreach={() => setBulkOutreachOpen(true)}
        onAddUserTags={handleBulkAddUserTags}
        onMoveToProject={handleBulkMoveToProject}
        onChangeStatus={handleBulkChangeStatus}
        onAddToTracking={handleBulkAddToTracking}
        onOpenTrackingBoard={handleOpenTrackingBoard}
        onTrash={() => console.info("bulk trash", { creatorIds: selectedIds })}
        onClear={selection.clear}
      />

      <LibraryImportFlow
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
      />

      <LibraryBulkOutreach
        open={bulkOutreachOpen}
        creators={selectedCreators}
        onClose={() => setBulkOutreachOpen(false)}
        onSend={handleBulkSend}
      />

      <LibraryRowActionDialog
        state={rowDialog}
        projects={projects}
        currentProjectId={currentProject.id}
        onClose={() => setRowDialog(null)}
        onMove={handleRowMove}
        onTrash={handleRowTrash}
      />

      <LibraryToast
        message={toast?.message ?? null}
        actionLabel={toast?.actionLabel}
        onAction={handleToastAction}
        onDismiss={() => setToast(null)}
      />
    </div>
  );
}

function dedupe<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}
