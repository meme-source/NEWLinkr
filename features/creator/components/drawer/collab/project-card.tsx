"use client";

import { ExternalLink, Link2 } from "lucide-react";

import { CollaborationStatusCell } from "@/features/creator/components/collaboration-status-cell";
import {
  cpeOf,
  cpmOf,
  fmtCount,
  fmtMoney,
  PAUSED_DOT,
  PAUSED_TEXT_TONE,
  STATUS_DOT,
  STATUS_TEXT_TONE,
} from "@/features/outreach/components/board-performance-shared";
import { useOutreachState } from "@/features/outreach/components/outreach-state-context";
import { PlacementTrendChart } from "@/features/outreach/components/placement-trend-chart";
import type { Placement } from "@/features/outreach/data/board-placements";
import { useWorkspaceProject } from "@/features/project/components/project-context";
import { CREATOR_SOURCE_LABEL } from "@/lib/creator";
import type { Collaboration, CollaborationStatus, Creator } from "@/types/api";
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
export function ProjectCard({ creator, collab, placements, onChangeStatus }: Props) {
  const { resolveProjectName } = useWorkspaceProject();
  const projectName = resolveProjectName(collab.projectId);

  return (
    <article className="rounded-2xl border border-[#c5c0b1] bg-[#fffefb] p-4">
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
        <CollaborationStatusCell value={collab.status} onChange={onChangeStatus} />
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

      {collab.notes && (
        <p className="mt-3 rounded-xl bg-[#fdf6ee] p-2 text-[11px] text-[#36342e]">
          {collab.notes}
        </p>
      )}

      {placements.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-[#eceae3] pt-3">
          <p className="text-[11px] font-medium text-[#939084]">投放卡片（{placements.length}）</p>
          {placements.map((p) => (
            <PlacementMini key={p.id} placement={p} />
          ))}
        </div>
      )}
    </article>
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

function PlacementMini({ placement: p }: { placement: Placement }) {
  const { isPlacementPaused } = useOutreachState();
  const paused = isPlacementPaused(p.id);
  const dotColor = paused ? PAUSED_DOT : STATUS_DOT[p.status];
  const textTone = paused ? PAUSED_TEXT_TONE : STATUS_TEXT_TONE[p.status];
  const label = paused ? "已暂停" : p.status;
  return (
    <div className="rounded-xl border border-[#eceae3] bg-[#fdf6ee] p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px]">
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: dotColor }}
            />
            <span className={cn("font-medium", textTone)}>{label}</span>
            <span className="text-[#939084]" aria-hidden>
              ·
            </span>
            <span className="text-[#939084]">发布 {p.postedAt}</span>
          </div>
          <p className="mt-0.5 text-[10px] text-[#939084] tabular-nums">
            费用 {fmtMoney(p.spendUsd, 0)} · {p.platform}
          </p>
        </div>
        <a
          href={p.postUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex shrink-0 items-center gap-1 text-[10px] text-[#36342e] hover:text-[#ff4f00]"
        >
          原帖 <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <PlacementTrendChart
        data={p.viewsTrend7d}
        color={dotColor}
        haloColor={dotColor}
        height={32}
        className="mt-2"
      />
      <dl className="mt-2 grid grid-cols-4 gap-1 text-[10px]">
        <Mini label="曝光" value={fmtCount(p.views)} />
        <Mini label="ER" value={`${p.er.toFixed(1)}%`} />
        <Mini label="CPM" value={fmtMoney(cpmOf(p), 2)} />
        <Mini label="CPE" value={fmtMoney(cpeOf(p), 3)} />
      </dl>
      <div className="mt-2 flex items-center gap-2 border-t border-[#eceae3] pt-2 text-[10px]">
        <Link2 className="h-3 w-3 shrink-0 text-[#939084]" aria-hidden />
        <a
          href={p.postUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="min-w-0 flex-1 truncate text-[#36342e] hover:text-[#ff4f00]"
          title={p.postUrl}
        >
          {p.postUrl}
        </a>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[#939084]">{label}</p>
      <p className="font-semibold text-[#201515] tabular-nums">{value}</p>
    </div>
  );
}
