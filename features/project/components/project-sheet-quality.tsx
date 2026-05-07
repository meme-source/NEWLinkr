"use client";

import { Sparkle } from "lucide-react";

import { summarizeProject } from "@/features/outreach/lib/project-summary";
import { cn } from "@/lib/utils";

// §3.1 投放质量小结 —— 抽屉里"投放表现"模块的项目级切片。
// 数据已经在 summarizeProject 里算好（avg ER + 趋势分布 + 合作 / 已建联）。
// 三块呈现：
//   ① 平均互动率（投放质量主指标）
//   ② 合作率（outreachSuccess ÷ outreachSent）—— 真正谈成的转化效率，比拒绝率更正向
//   ③ 趋势分布（增长 / 稳定 / 下降）以堆叠条 + 紧凑图例呈现
// 全部派生数据，零编辑。

export function ProjectSheetQualitySection({ projectId }: { projectId: string }) {
  const summary = summarizeProject(projectId);

  const erDisplay = summary.placementCount > 0 ? `${summary.placementAvgEr.toFixed(1)}%` : "—";
  // 合作率 = 进入合作 ÷ 已建联（与项目卡片"转化率"同口径，避免抽屉和卡片读数不一致）。
  const cooperationRate =
    summary.outreachSent > 0
      ? Math.round((summary.outreachSuccess / summary.outreachSent) * 100)
      : 0;
  const cooperationDisplay = summary.outreachSent > 0 ? `${cooperationRate}%` : "—";

  const total =
    summary.placementGrowthCount + summary.placementStableCount + summary.placementDeclineCount;
  const growthRatio = total > 0 ? (summary.placementGrowthCount / total) * 100 : 0;
  const stableRatio = total > 0 ? (summary.placementStableCount / total) * 100 : 0;
  const declineRatio = total > 0 ? (summary.placementDeclineCount / total) * 100 : 0;

  return (
    <section className="rounded-3xl border border-[#c5c0b1] bg-[#fffefb] p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#201515]">
        <Sparkle className="h-4 w-4 text-[#ff4f00]" />
        投放质量小结
      </div>
      <p className="mt-1 text-[11px] text-[#939084]">
        平均互动 + 趋势分布来自投放表现页，合作率来自建联看板。
      </p>

      <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <QualityCell
          label="平均互动率"
          value={erDisplay}
          sub={summary.placementCount > 0 ? `共 ${summary.placementCount} 条投放` : "暂无投放数据"}
        />
        <QualityCell
          label="合作率"
          value={cooperationDisplay}
          sub={
            summary.outreachSent > 0
              ? `共 ${summary.outreachSuccess} 位进入合作 / ${summary.outreachSent} 已建联`
              : "暂未发出建联"
          }
          tone={cooperationRate >= 50 ? "good" : "default"}
        />
      </div>

      <div className="mt-3 rounded-2xl bg-[#fffdf9] px-3 py-2.5">
        <div className="flex items-baseline justify-between text-[11px]">
          <span className="text-[#939084]">趋势分布</span>
          <span className="text-[10px] text-[#939084]">共 {total} 条</span>
        </div>
        {total > 0 ? (
          <>
            <div className="mt-2 flex h-1.5 w-full overflow-hidden rounded-full bg-[#eceae3]">
              <div className="h-full bg-[#ff4f00]" style={{ width: `${growthRatio}%` }} />
              <div className="h-full bg-[#36342e]" style={{ width: `${stableRatio}%` }} />
              <div className="h-full bg-[#c89e4f]" style={{ width: `${declineRatio}%` }} />
            </div>
            {/* 图例：每条 `dot 标签 数字` 紧贴在一起，三条左对齐排列。
                之前用 grid-cols-3 + ml-auto 把数字推到右边，导致"3"离"稳定中"
                比离"增长中"更近，视觉上容易看错归属。 */}
            <ul className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px]">
              <DistLegend
                dotClass="bg-[#ff4f00]"
                label="增长中"
                count={summary.placementGrowthCount}
              />
              <DistLegend
                dotClass="bg-[#36342e]"
                label="稳定中"
                count={summary.placementStableCount}
              />
              <DistLegend
                dotClass="bg-[#c89e4f]"
                label="下降中"
                count={summary.placementDeclineCount}
              />
            </ul>
          </>
        ) : (
          <p className="mt-2 text-[11px] text-[#939084]">暂无投放，去投放表现页发起一条试试。</p>
        )}
      </div>
    </section>
  );
}

function QualityCell({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "default" | "warn" | "good";
}) {
  const valueClass =
    tone === "warn" ? "text-[#a76b1f]" : tone === "good" ? "text-[#3a7a4a]" : "text-[#201515]";
  return (
    <div className="rounded-xl bg-[#fffdf9] p-3">
      <div className="text-[10px] tracking-wide text-[#939084] uppercase">{label}</div>
      <div className={cn("mt-1 text-base font-semibold tracking-tight tabular-nums", valueClass)}>
        {value}
      </div>
      <div className="mt-0.5 text-[10px] text-[#939084]">{sub}</div>
    </div>
  );
}

// 紧凑图例：dot · 标签 · 数字 三件紧贴在一行，gap-1.5 控制相互间距。
// 不再撑满网格 —— 三个条目用 flex-wrap 自然排列，数字始终靠在自己的标签右侧。
function DistLegend({
  dotClass,
  label,
  count,
}: {
  dotClass: string;
  label: string;
  count: number;
}) {
  return (
    <li className="inline-flex items-center gap-1.5">
      <span className={cn("h-1.5 w-1.5 rounded-full", dotClass)} aria-hidden />
      <span className="text-[#939084]">{label}</span>
      <span className="font-medium text-[#201515] tabular-nums">{count}</span>
    </li>
  );
}
