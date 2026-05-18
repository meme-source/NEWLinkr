"use client";

import { useState } from "react";
import Image from "next/image";
import { MoreHorizontal } from "lucide-react";
import type { CollaborationStatus, Creator } from "@/types/api";
import {
  CREATOR_CATEGORY_CHIP_CLASS,
  CREATOR_CATEGORY_LABEL,
  CREATOR_SOURCE_LABEL,
  topicChipClass,
} from "@/lib/creator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LibraryScope, LibraryViewRow } from "@/features/library/types";
import type { ToggleableColumnId } from "@/features/library/hooks/use-library-columns";
import { RatingStars } from "./rating-stars";
import { LibraryStatusCell } from "./library-status-cell";
import { LibraryNotesCell } from "./library-notes-cell";

interface Props {
  row: LibraryViewRow;
  scope: LibraryScope;
  selected: boolean;
  visibleColumns: Set<ToggleableColumnId>;
  campaigns: string[]; // resolved project names this creator participates in
  onToggleSelect: (id: string) => void;
  onOpen: (creator: Creator) => void;
  onAction: (action: RowAction, creator: Creator) => void;
  onChangeStatus: (creatorId: string, status: CollaborationStatus) => void;
  onChangeNotes: (creatorId: string, notes: string) => void;
}

export type RowAction = "outreach" | "track" | "move" | "status" | "addCampaign" | "trash";

export function LibraryRow({
  row,
  scope,
  selected,
  visibleColumns,
  campaigns,
  onToggleSelect,
  onOpen,
  onAction,
  onChangeStatus,
  onChangeNotes,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { creator, displayStatus, projectCount } = row;
  const er = creator.medianViews ? `${creator.engagementRate?.toFixed(1)}%` : "--";
  const collaborationMonth = creator.lastContactAt ? formatMonth(creator.lastContactAt) : "—";
  const primaryEmail =
    creator.emails.find((e) => e.primary)?.address ?? creator.emails[0]?.address ?? "—";
  const showCampaigns = scope === "all";
  // 状态/备注只在单项目视图下可写——'全部博主' 下的 dominantStatus 与 primaryNote
  // 是从多个 collab 派生而来，没有单一目标可改。
  const editable = scope === "project";

  return (
    <div
      className={cn(
        "grid items-center gap-3 border-b border-[#eceae3]/60 px-3 py-3 text-[12px] transition-colors last:border-b-0 hover:bg-[#fffdf9]",
        selected && "bg-[#fff7f4] hover:bg-[#fff7f4]",
      )}
      style={{ gridTemplateColumns: buildGridTemplate(visibleColumns, showCampaigns) }}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggleSelect(creator.id)}
        className="h-3.5 w-3.5 cursor-pointer accent-[#ff4f00]"
      />

      {/* Creator: avatar + name + followers */}
      <Button
        unstyled
        type="button"
        onClick={() => onOpen(creator)}
        className="flex min-w-0 items-center gap-2.5 text-left"
      >
        {creator.avatar ? (
          <Image
            src={creator.avatar}
            alt={creator.name}
            width={30}
            height={30}
            className="h-[30px] w-[30px] shrink-0 rounded-full bg-[#fff7f4]"
            unoptimized
          />
        ) : (
          <span
            aria-hidden
            className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full bg-[#eceae3] text-[11px] font-medium text-[#36342e]"
          >
            {initialsOf(creator.name)}
          </span>
        )}
        <div className="min-w-0">
          <div className="truncate text-[13px] font-medium text-[#201515]">{creator.name}</div>
          <div className="mt-0.5 text-[11px] font-normal text-[#939084]">
            {fmtN(creator.followers)} 粉丝
          </div>
        </div>
      </Button>

      {visibleColumns.has("category") && (
        <div className="min-w-0">
          <span
            className={cn(
              "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium",
              CREATOR_CATEGORY_CHIP_CLASS[creator.category],
            )}
          >
            {CREATOR_CATEGORY_LABEL[creator.category]}
          </span>
        </div>
      )}

      {visibleColumns.has("status") && (
        <div className="min-w-0">
          <LibraryStatusCell
            value={displayStatus}
            onChange={
              editable && displayStatus ? (next) => onChangeStatus(creator.id, next) : undefined
            }
          />
          {scope === "all" && projectCount > 1 && (
            <div className="mt-0.5 text-[10px] text-[#939084]">参与 {projectCount} 个项目</div>
          )}
        </div>
      )}

      {visibleColumns.has("rating") &&
        // 评级是合作完成后的复盘评分。非已完成状态显示占位符 "—"。
        // 表格里只读：编辑入口在抽屉的「合作复盘 → 编辑 → 更新」（数据共享 store）。
        (displayStatus === "completed" ? (
          <RatingStars value={creator.rating} ariaLabel={`评级：${creator.rating} 星`} />
        ) : (
          <span
            className="text-[12px] text-[#bdb9ac] tabular-nums"
            title="合作完成后可评级"
            aria-label="未评级"
          >
            —
          </span>
        ))}

      {visibleColumns.has("engagement") && (
        <div className="text-right text-[12px] text-[#36342e]">{er}</div>
      )}

      {visibleColumns.has("medianViews") && (
        <div className="text-right text-[12px] text-[#36342e]">{fmtN(creator.medianViews)}</div>
      )}

      {visibleColumns.has("avgLikes") && (
        <div className="text-right text-[12px] text-[#36342e]">
          {fmtN(estimateAvgLikes(creator))}
        </div>
      )}

      {visibleColumns.has("source") && (
        <div className="text-[12px] text-[#36342e]">{CREATOR_SOURCE_LABEL[creator.source]}</div>
      )}

      {visibleColumns.has("topics") && <ChipList items={creator.topics} variant="topic" />}

      {visibleColumns.has("userTags") && <ChipList items={creator.userTags} variant="userTag" />}

      {visibleColumns.has("collaboration") && (
        <div className="text-[12px] text-[#939084]">{collaborationMonth}</div>
      )}

      {visibleColumns.has("notes") && (
        <LibraryNotesCell
          value={primaryNote(creator)}
          onChange={editable ? (next) => onChangeNotes(creator.id, next) : undefined}
        />
      )}

      {visibleColumns.has("email") && (
        <div className="truncate text-[12px] text-[#36342e]" title={primaryEmail}>
          {primaryEmail}
        </div>
      )}

      {visibleColumns.has("collaborationCount") && (
        <div className="text-right text-[12px] text-[#36342e]">{creator.collaborations.length}</div>
      )}

      {showCampaigns && (
        <div className="min-w-0 text-[12px] text-[#36342e]">
          {campaigns.length === 0 ? (
            <span className="text-[#939084]">—</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {campaigns.slice(0, 2).map((name) => (
                <span
                  key={name}
                  className="inline-flex max-w-[140px] items-center truncate rounded-full bg-[#eceae3] px-2 py-0.5 text-[11px]"
                  title={name}
                >
                  {name}
                </span>
              ))}
              {campaigns.length > 2 && (
                <span className="inline-flex items-center rounded-full bg-[#fff7f4] px-2 py-0.5 text-[11px] text-[#ff4f00]">
                  +{campaigns.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action menu */}
      <div className="relative flex justify-end">
        <Button
          unstyled
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-full border border-transparent p-1 text-[#939084] hover:border-[#c5c0b1] hover:bg-[#fffefb]"
          aria-label="更多操作"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute top-7 right-0 z-20 min-w-[140px] overflow-hidden rounded-lg border border-[#c5c0b1] bg-[#fffefb] py-1.5">
              {(
                [
                  ["outreach", "发起建联"],
                  ["track", "投放追踪"],
                  ["addCampaign", "移动项目"],
                  ["trash", "删除"],
                ] as const
              ).map(([key, label]) => (
                <Button
                  unstyled
                  key={key}
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onAction(key, creator);
                  }}
                  className={cn(
                    "block w-full px-3 py-1.5 text-left text-[12px]",
                    key === "trash"
                      ? "text-[#b00020] hover:bg-[#fdf2f2]"
                      : "text-[#36342e] hover:bg-[#fffdf9]",
                  )}
                >
                  {label}
                </Button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Grid template builder shared by header + row to keep widths in lock-step.
export function buildGridTemplate(
  visibleColumns: Set<ToggleableColumnId>,
  showCampaigns: boolean,
): string {
  const widths: string[] = ["32px", "minmax(0,2.4fr)"];
  if (visibleColumns.has("category")) widths.push("100px");
  if (visibleColumns.has("status")) widths.push("120px");
  if (visibleColumns.has("rating")) widths.push("96px");
  if (visibleColumns.has("engagement")) widths.push("74px");
  if (visibleColumns.has("medianViews")) widths.push("80px");
  if (visibleColumns.has("avgLikes")) widths.push("80px");
  if (visibleColumns.has("source")) widths.push("90px");
  if (visibleColumns.has("topics")) widths.push("minmax(0,1.1fr)");
  if (visibleColumns.has("userTags")) widths.push("minmax(0,1.1fr)");
  if (visibleColumns.has("collaboration")) widths.push("90px");
  if (visibleColumns.has("notes")) widths.push("minmax(0,1.2fr)");
  if (visibleColumns.has("email")) widths.push("minmax(0,1.2fr)");
  if (visibleColumns.has("collaborationCount")) widths.push("76px");
  if (showCampaigns) widths.push("minmax(0,1.4fr)");
  widths.push("36px");
  return widths.join(" ");
}

function primaryNote(creator: Creator): string {
  const withNote = creator.collaborations.find((c) => c.notes);
  return withNote?.notes ?? "";
}

// 话题词与用户标签都是同样形态的 chip list，但视觉上分开：
// topic 按词哈希落到一组低饱和度调色板（同一个词永远是同一种颜色），
// userTag 走品牌橙——一眼能区分系统数据 vs 用户数据。
function ChipList({ items, variant }: { items: string[]; variant: "topic" | "userTag" }) {
  if (items.length === 0) {
    return (
      <div className="min-w-0">
        <span className="text-[#939084]">—</span>
      </div>
    );
  }
  const overflowClass =
    variant === "topic" ? "bg-[#eceae3] text-[#5b574a]" : "bg-[#eceae3] text-[#939084]";
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap gap-1">
        {items.slice(0, 3).map((item) => (
          <span
            key={item}
            className={cn(
              "inline-flex max-w-[90px] items-center truncate rounded-full px-2 py-0.5 text-[11px]",
              variant === "topic"
                ? topicChipClass(item)
                : "border border-[#c5c0b1] bg-[#fff7f4] text-[#ff4f00]",
            )}
            title={item}
          >
            {item}
          </span>
        ))}
        {items.length > 3 && (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[11px]",
              overflowClass,
            )}
          >
            +{items.length - 3}
          </span>
        )}
      </div>
    </div>
  );
}

// engagementRate 用百分比表示（例如 7.1 = 7.1%），用 medianViews 估算"均点赞"。
// 实际接入后端后请改为读取真实字段。
function estimateAvgLikes(creator: Creator): number {
  if (!creator.medianViews || !creator.engagementRate) return 0;
  return Math.round((creator.medianViews * creator.engagementRate) / 100);
}

function fmtN(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// 取名字前两个有效字符（拉丁姓+名各 1）做 fallback 头像。
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// 表格中"合作时间"只展示到月份粒度（例 "2026-04"）；底层数据 lastContactAt
// 仍保留完整日期，详情抽屉等其他场景按需另行格式化。
function formatMonth(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}
