"use client";

import { Check, Loader2 } from "lucide-react";
import type { AnalysisBasis, AnalysisStep } from "../chat-types";
import { T } from "../data/tokens";

interface AnalysisCardProps {
  basis: AnalysisBasis;
  steps: AnalysisStep[];
  streaming: boolean;
}

function StepRow({ step }: { step: AnalysisStep }) {
  const done = step.status === "done";
  const running = step.status === "running";
  return (
    <li className="flex items-start gap-3 py-2">
      <span
        className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: done ? T.terracotta : running ? T.parchment : T.borderLight,
          color: done ? "white" : T.stone,
        }}
        aria-hidden
      >
        {done ? (
          <Check size={11} strokeWidth={3} />
        ) : running ? (
          <Loader2 size={11} className="animate-spin" />
        ) : null}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className="text-[13.5px] font-medium"
          style={{
            color: done || running ? T.nearBlack : T.stone,
          }}
        >
          {step.label}
        </p>
        {step.detail ? (
          <p className="mt-0.5 text-[12px] leading-[1.55]" style={{ color: T.stone }}>
            {step.detail}
          </p>
        ) : null}
      </div>
    </li>
  );
}

function BasisRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-[12px]" style={{ color: T.stone }}>
        {label}
      </span>
      <span className="text-[12.5px] font-medium" style={{ color: T.nearBlack }}>
        {value}
      </span>
    </div>
  );
}

export function AnalysisCard({ basis, steps, streaming }: AnalysisCardProps) {
  return (
    <div
      className="rounded-[18px] border bg-[#fffefb] px-5 pt-4 pb-4"
      style={{
        borderColor: T.border,
        boxShadow: "0 1px 0 rgba(20,20,19,0.02)",
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-flex h-5 items-center rounded-full px-2 text-[10.5px] font-semibold tracking-[0.06em] uppercase"
          style={{
            backgroundColor: T.parchment,
            color: T.terracotta,
          }}
        >
          搜索依据
        </span>
        <span className="text-[12px]" style={{ color: T.stone }}>
          {streaming ? "正在分析" : "分析完成"}
        </span>
      </div>

      <div
        className="mt-3 grid grid-cols-1 gap-x-6 gap-y-0 rounded-[12px] px-4 py-2 sm:grid-cols-2"
        style={{ backgroundColor: T.ivory, border: `1px solid ${T.borderLight}` }}
      >
        <BasisRow label="平台" value={basis.platformLabel} />
        <BasisRow label="国家" value={basis.countryLabel} />
        <BasisRow label="时间" value={basis.timeRange} />
        <BasisRow
          label="产品"
          value={
            basis.productLine.length > 36
              ? `${basis.productLine.slice(0, 36)}…`
              : basis.productLine || "—"
          }
        />
        {basis.brandsSearched ? (
          <div className="col-span-full flex items-center justify-between gap-3 py-1.5">
            <span className="text-[12px]" style={{ color: T.stone }}>
              反推品牌
            </span>
            <span className="text-[12.5px] font-medium" style={{ color: T.nearBlack }}>
              {basis.brandsSearched.join(" · ")}
            </span>
          </div>
        ) : null}
        {basis.baselineNote ? (
          <div className="col-span-full flex items-center justify-between gap-3 py-1.5">
            <span className="text-[12px]" style={{ color: T.stone }}>
              基线参考
            </span>
            <span className="text-[12.5px] font-medium" style={{ color: T.nearBlack }}>
              {basis.baselineNote}
            </span>
          </div>
        ) : null}
      </div>

      <ul className="mt-3 divide-y" style={{ borderColor: T.borderLight }}>
        {steps.map((step) => (
          <StepRow key={step.key} step={step} />
        ))}
      </ul>

      {!streaming && basis.candidatesFound !== undefined ? (
        <p className="mt-3 text-[12.5px]" style={{ color: T.charcoal }}>
          扫描{" "}
          <span style={{ color: T.nearBlack, fontWeight: 600 }}>
            {basis.postsAnalyzed?.toLocaleString() ?? "—"}
          </span>{" "}
          条帖子，命中{" "}
          <span style={{ color: T.nearBlack, fontWeight: 600 }}>{basis.candidatesFound}</span>{" "}
          位候选
        </p>
      ) : null}
    </div>
  );
}
