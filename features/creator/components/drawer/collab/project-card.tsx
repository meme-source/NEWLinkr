"use client";

import { CheckCircle2, Pencil } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { CollaborationStatusCell } from "@/features/creator/components/collaboration-status-cell";
import { useCreatorOverrides } from "@/features/creator/components/creator-overrides-context";
import { RatingStars, RATING_LABELS } from "@/features/library/components/rating-stars";
import { PlacementCard } from "@/features/outreach/components/board-performance-card";
import type { Placement } from "@/features/outreach/data/board-placements";
import { useWorkspaceProject } from "@/features/project/components/project-context";
import { CREATOR_SOURCE_LABEL, deriveEffectiveCollabStatus } from "@/lib/creator";
import type { Collaboration, CollaborationStatus, Creator, Rating } from "@/types/api";
import { cn } from "@/lib/utils";

const METHOD_LABEL = {
  paid: "付费",
  gifted: "寄样",
  commission: "分佣",
  barter: "互换",
  other: "其他",
} as const;

interface Props {
  creator: Creator;
  collab: Collaboration;
  placements: Placement[];
  onChangeStatus?: (next: CollaborationStatus) => void;
}

// 单个项目的合作卡：项目名 + 状态 + 合作金额三栏 + 该项目下的 placement 列表。
// 当 collab.status === "completed" 时，额外渲染「合作复盘」区块：本次合作评级 + 备注。
export function ProjectCard({ creator, collab, placements, onChangeStatus }: Props) {
  const { resolveProjectName } = useWorkspaceProject();
  const projectName = resolveProjectName(collab.projectId);
  // 调用方（tab-collaborations）已用 useCreatorPlacements 过滤掉软删，
  // 所以 placements 非空就等于"该项目有真实投放"，前置状态归一化为「合作中」。
  // 终态（completed / paused / rejected）保留用户意图，不在此处改写。
  const effectiveStatus = deriveEffectiveCollabStatus(collab.status, placements.length > 0);
  const isCompleted = collab.status === "completed";

  return (
    <article className="rounded-lg border border-[#c5c0b1] bg-[#fffefb] p-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-[14px] font-semibold text-[#201515]">{projectName}</h4>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#939084]">
            <span>加入于 {collab.joinedAt}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center rounded-full bg-[#eceae3] px-1.5 py-0.5 text-[10px] text-[#36342e]">
              来源：{CREATOR_SOURCE_LABEL[creator.source]}
            </span>
          </div>
        </div>
        <CollaborationStatusCell value={effectiveStatus} onChange={onChangeStatus} />
      </header>

      <dl className="mt-3 grid grid-cols-3 gap-3 border-t border-[#eceae3] pt-3 text-[12px]">
        <Field label="合作方式" value={collab.method ? METHOD_LABEL[collab.method] : "—"} />
        <Field
          label="预算"
          value={collab.budget !== null ? `$${collab.budget.toLocaleString()}` : "—"}
        />
        <Field
          label="实际价格"
          value={collab.finalPrice !== null ? `$${collab.finalPrice.toLocaleString()}` : "—"}
          highlight
        />
      </dl>

      {isCompleted ? (
        <CompletionReview creatorId={creator.id} collab={collab} creatorRating={creator.rating} />
      ) : (
        collab.notes && (
          <p className="mt-3 rounded-lg bg-[#fdf6ee] p-2 text-[11px] text-[#36342e]">
            {collab.notes}
          </p>
        )
      )}

      {placements.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-[#eceae3] pt-3">
          <p className="text-[11px] font-medium text-[#939084]">投放卡片（{placements.length}）</p>
          {placements.map((p) => (
            <PlacementCard key={p.id} placement={p} hideCreatorHeader />
          ))}
        </div>
      )}
    </article>
  );
}

// 合作完成后的复盘卡片：默认只读，点「编辑」进入编辑态。
// 「更新」一次性提交：评级写入 creator.rating，备注写入 collab.notes，
// 通过 CreatorOverridesContext 同步到博主库表格；「取消」回滚到原值。
function CompletionReview({
  creatorId,
  collab,
  creatorRating,
}: {
  creatorId: string;
  collab: Collaboration;
  creatorRating: Rating;
}) {
  const { commitCompletionReview } = useCreatorOverrides();
  const baseNotes = collab.notes ?? "";

  const [editing, setEditing] = useState(false);
  // draft 仅在 editing=true 时被消费；handleEdit / handleCancel 入口处会
  // 把它重置为当前最新值，所以无需 useEffect 同步上游变化。
  const [draftRating, setDraftRating] = useState<Rating>(creatorRating);
  const [draftNotes, setDraftNotes] = useState(baseNotes);
  const [justUpdated, setJustUpdated] = useState(false);

  // 「已更新」短提示自动消失。
  useEffect(() => {
    if (!justUpdated) return;
    const id = window.setTimeout(() => setJustUpdated(false), 1600);
    return () => window.clearTimeout(id);
  }, [justUpdated]);

  const dirty = draftRating !== creatorRating || draftNotes !== baseNotes;

  const handleEdit = () => {
    setDraftRating(creatorRating);
    setDraftNotes(baseNotes);
    setEditing(true);
  };
  const handleCancel = () => {
    setDraftRating(creatorRating);
    setDraftNotes(baseNotes);
    setEditing(false);
  };
  const handleUpdate = () => {
    commitCompletionReview({
      creatorId,
      collabId: collab.id,
      rating: draftRating,
      notes: draftNotes,
    });
    setEditing(false);
    setJustUpdated(true);
  };

  return (
    <div className="mt-3 rounded-lg border border-[#fdd9c5] bg-[#fff7f4] p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#ff4f00]">
          <CheckCircle2 className="h-3.5 w-3.5" />
          合作复盘
        </p>
        {!editing &&
          (justUpdated ? (
            <span className="text-[10px] text-[#939084]">已更新</span>
          ) : (
            <Button
              unstyled
              type="button"
              onClick={handleEdit}
              className="inline-flex items-center gap-1 rounded-full border border-[#fdd9c5] bg-white px-2 py-0.5 text-[10px] font-medium text-[#ff4f00] transition-colors hover:bg-[#fff7f4]"
              aria-label="编辑合作复盘"
            >
              <Pencil className="h-3 w-3" />
              编辑
            </Button>
          ))}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className="text-[11px] text-[#36342e]">本次合作评级</span>
        {editing ? (
          <RatingStars
            value={draftRating}
            size="sm"
            ariaLabel="编辑本次合作评级"
            onChange={setDraftRating}
          />
        ) : (
          <>
            <RatingStars
              value={creatorRating}
              size="sm"
              ariaLabel={`评级：${RATING_LABELS[creatorRating]}`}
            />
            <span className="text-[11px] text-[#36342e]">{RATING_LABELS[creatorRating]}</span>
          </>
        )}
      </div>

      <div className="mt-2">
        <p className="text-[10px] text-[#939084]">备注</p>
        {editing ? (
          <textarea
            value={draftNotes}
            onChange={(e) => setDraftNotes(e.target.value)}
            rows={3}
            placeholder="本次合作的反馈、复盘要点、可以延续到下次的经验…"
            className="mt-1 w-full resize-none rounded-lg border border-[#fdd9c5] bg-white px-2 py-1.5 text-[11px] leading-relaxed text-[#201515] placeholder:text-[#bdb9ac] focus:border-[#ff4f00] focus:outline-none"
          />
        ) : (
          <p className="mt-1 min-h-[1.5em] rounded-lg bg-white px-2 py-1.5 text-[11px] leading-relaxed text-[#36342e]">
            {baseNotes || <span className="text-[#bdb9ac]">尚未填写复盘备注</span>}
          </p>
        )}
      </div>

      {editing && (
        <div className="mt-3 flex items-center justify-end gap-2">
          <Button
            unstyled
            type="button"
            onClick={handleCancel}
            className="rounded-full border border-[#c5c0b1] bg-white px-3 py-1 text-[11px] font-medium text-[#36342e] transition-colors hover:bg-[#fffdf9]"
          >
            取消
          </Button>
          <Button
            unstyled
            type="button"
            onClick={handleUpdate}
            disabled={!dirty}
            className="rounded-full bg-[#ff4f00] px-3 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-[#ff4f00] disabled:cursor-not-allowed disabled:opacity-50"
          >
            更新
          </Button>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-[#939084]">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-[13px] font-semibold tabular-nums",
          highlight ? "text-[#ff4f00]" : "text-[#201515]",
        )}
      >
        {value}
      </p>
    </div>
  );
}
