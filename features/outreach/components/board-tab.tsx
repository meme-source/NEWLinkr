"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { BoardOverview } from "@/features/outreach/components/board-overview";
import { BoardPerformance } from "@/features/outreach/components/board-performance";
import { BoardProgress } from "@/features/outreach/components/board-progress";
import { cn } from "@/lib/utils";

// §3.1 / §3.2 / §3.3 — board has three views, switched via ?view=.
export type BoardView = "overview" | "progress" | "performance";

const VIEWS: { view: BoardView; label: string }[] = [
  { view: "overview", label: "项目概览" },
  { view: "progress", label: "建联进度" },
  { view: "performance", label: "投放表现" },
];

export function BoardViewSwitcher({ current }: { current: BoardView }) {
  return (
    <div className="flex gap-1 rounded-xl bg-[#eceae3] p-1">
      {VIEWS.map((it) => (
        <Link
          key={it.view}
          href={`/workspace/outreach?tab=board&view=${it.view}`}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            current === it.view
              ? "bg-[#fffefb] text-[#201515]"
              : "text-[#939084] hover:text-[#36342e]",
          )}
        >
          {it.label}
        </Link>
      ))}
    </div>
  );
}

export function BoardTab() {
  const searchParams = useSearchParams();
  const view = (searchParams.get("view") as BoardView) ?? "overview";
  return (
    <div>
      {view === "overview" ? <BoardOverview /> : null}
      {view === "progress" ? <BoardProgress /> : null}
      {view === "performance" ? <BoardPerformance /> : null}
    </div>
  );
}
