"use client";

import { useRouter } from "next/navigation";
import { Mail, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CollaborationStatusCell } from "@/features/creator/components/collaboration-status-cell";
import type { OUTREACH_CREATORS } from "@/features/outreach/data/outreach-creators";
import {
  OUTREACH_ALLOWED_STATUSES,
  type OutreachLifecycleStatus,
} from "@/features/outreach/data/outreach-types";
import { COLLABORATION_STATUS_LABEL } from "@/lib/creator";
import type { CollaborationStatus } from "@/types/api";
import { cn } from "@/lib/utils";

// §3.2 建联进度表格 — 2026-05 redesign focuses the table on the "what should I
// do next" question. Cooperation/publish columns moved to the 投放表现 page.
//
// Columns:
//   博主            who
//   建联状态        what state — 现在是可下拉编辑的徽章
//   轮次            第几轮跟进
//   建联方式        which channel (links semantically to inbox vs external DM)
//   最后联系        recency context
//   下次跟进        the actionable signal — links to the schedule calendar
//   发文时间        scheduled publish — editable via date input
//   操作            「查看」跳转到对应博主的聊天页

type CreatorList = typeof OUTREACH_CREATORS;
type Creator = CreatorList[number];

// Today is hard-pinned to the project's `currentDate` so the followup labels
// stay deterministic against the mock data set. Once a real backend lands,
// swap to `new Date()`.
// TODO(progress-today): 与 board-progress.tsx 共用同一份 mock 当日，真实日期接入后两处统一删除。
const TODAY_ISO = "2026-05-06";

function followupView(creator: Creator): {
  label: string;
  tone: "alert" | "soon" | "future" | "muted";
} {
  const next = creator.nextFollowUpAt;
  if (!next) {
    if (creator.status === "sent") return { label: "等待回复", tone: "muted" };
    return { label: "—", tone: "muted" };
  }
  const todayMs = new Date(`${TODAY_ISO}T00:00:00`).getTime();
  const targetMs = new Date(`${next}T00:00:00`).getTime();
  const diffDays = Math.round((targetMs - todayMs) / 86_400_000);
  if (diffDays < 0) return { label: `逾期 ${Math.abs(diffDays)} 天`, tone: "alert" };
  if (diffDays === 0) return { label: "今日跟进", tone: "alert" };
  if (diffDays <= 3) return { label: `${diffDays} 天后`, tone: "soon" };
  // Future-dated reminder: show as a friendly month-day label.
  const [, m, d] = next.split("-");
  return { label: `${Number(m)}月${Number(d)}日`, tone: "future" };
}

const FOLLOWUP_TONE_CLS: Record<"alert" | "soon" | "future" | "muted", string> = {
  alert: "text-[#ff4f00] font-medium",
  soon: "text-[#36342e] font-medium",
  future: "text-[#36342e]",
  muted: "text-[#c5c0b1]",
};

// 状态视角 tab 的展示顺序。
const STATUS_TABS: readonly OutreachLifecycleStatus[] = OUTREACH_ALLOWED_STATUSES;

interface BoardProgressTableProps {
  creators: CreatorList;
  totalCount: number;
  statusCounts: Record<OutreachLifecycleStatus, number>;
  selectedStatus: OutreachLifecycleStatus | null;
  onSelectStatus: (status: OutreachLifecycleStatus | null) => void;
  onChangeStatus: (creatorId: string, next: CollaborationStatus) => void;
  onChangePublishAt: (creatorId: string, next: string | null) => void;
}

export function BoardProgressTable({
  creators,
  totalCount,
  statusCounts,
  selectedStatus,
  onSelectStatus,
  onChangeStatus,
  onChangePublishAt,
}: BoardProgressTableProps) {
  const router = useRouter();

  const goToChat = (creator: Creator) => {
    const params = new URLSearchParams({
      tab: "inbox",
      handle: creator.handle,
    });
    router.push(`/workspace/outreach?${params.toString()}`);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-[#c5c0b1] bg-[#fffefb]">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[#c5c0b1] px-3 py-2">
        <StatusTab
          label="全部"
          count={totalCount}
          active={selectedStatus === null}
          onClick={() => onSelectStatus(null)}
        />
        {STATUS_TABS.map((s) => (
          <StatusTab
            key={s}
            label={COLLABORATION_STATUS_LABEL[s]}
            count={statusCounts[s]}
            active={selectedStatus === s}
            onClick={() => onSelectStatus(selectedStatus === s ? null : s)}
          />
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-[#c5c0b1] bg-[#fffdf9] text-[11px] text-[#939084]">
            <tr>
              <th className="px-4 py-2 text-left font-medium">博主</th>
              <th className="px-4 py-2 text-left font-medium">建联状态</th>
              <th className="px-4 py-2 text-left font-medium">轮次</th>
              <th className="px-4 py-2 text-left font-medium">建联方式</th>
              <th className="px-4 py-2 text-left font-medium">最后联系</th>
              <th className="px-4 py-2 text-left font-medium">下次跟进</th>
              <th className="px-4 py-2 text-left font-medium">发文时间</th>
              <th className="px-4 py-2 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {creators.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-[#939084]">
                  暂无符合条件的博主
                </td>
              </tr>
            ) : (
              creators.map((c) => {
                const fu = followupView(c);
                const isEmail = c.method === "Email";
                return (
                  <tr key={c.id} className="border-b border-[#eceae3] last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ff4f00] text-[11px] font-semibold text-[#fffefb]">
                          {c.name[0]}
                        </div>
                        <div>
                          <div className="font-medium text-[#201515]">{c.handle}</div>
                          <div className="text-[10px] text-[#939084]">
                            {c.platform} · {(c.followers / 1000).toFixed(0)}K
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <CollaborationStatusCell
                        value={c.status}
                        onChange={(next) => onChangeStatus(c.id, next)}
                        allowedStatuses={OUTREACH_ALLOWED_STATUSES}
                      />
                    </td>
                    <td className="px-4 py-3 text-xs text-[#36342e] tabular-nums">
                      第 {c.round} 轮
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#36342e]">
                        {isEmail ? (
                          <Mail className="h-3 w-3 text-[#939084]" aria-hidden />
                        ) : (
                          <MessageCircle className="h-3 w-3 text-[#939084]" aria-hidden />
                        )}
                        {c.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#939084]">{c.lastContact}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className={cn("tabular-nums", FOLLOWUP_TONE_CLS[fu.tone])}>
                        {fu.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <PublishDateInput
                        value={c.scheduledPublishAt ?? ""}
                        onChange={(next) => onChangePublishAt(c.id, next === "" ? null : next)}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        unstyled
                        type="button"
                        onClick={() => goToChat(c)}
                        className="rounded-lg border border-[#c5c0b1] px-2.5 py-1 text-[11px] text-[#36342e] hover:bg-[#eceae3]"
                      >
                        查看
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface StatusTabProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}

function StatusTab({ label, count, active, onClick }: StatusTabProps) {
  return (
    <Button
      unstyled
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full px-3 py-1 text-[11px] transition-colors",
        active
          ? "bg-[#fff7f4] font-medium text-[#ff4f00] ring-1 ring-[#ff4f00]/40"
          : "text-[#36342e] hover:bg-[#eceae3]",
      )}
    >
      <span>{label}</span>
      <span className={cn("ml-1.5 tabular-nums", active ? "text-[#ff4f00]" : "text-[#939084]")}>
        {count}
      </span>
    </Button>
  );
}

interface PublishDateInputProps {
  value: string;
  onChange: (next: string) => void;
}

function PublishDateInput({ value, onChange }: PublishDateInputProps) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-[120px] rounded-md border border-[#c5c0b1] bg-[#fffdf9] px-2 py-1 text-[11px] tabular-nums focus:border-[#ff4f00] focus:outline-none",
        value ? "text-[#36342e]" : "text-[#c5c0b1]",
      )}
      aria-label="发文时间"
    />
  );
}
