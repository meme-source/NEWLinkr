"use client";

// 提交后的「中间交互层」—— AI 在做了有后果的判断后,先让用户确认 / 校准,
// 再去跑 agent 找达人(见 v2/dimensions.ts 的 confirmStep)。
//
//  - scenario-pick:场景维度必经。AI 反推内容场景 → 用户勾选要哪几个。
//    场景推错整个列表全错,所以这一步不能省。
//  - competitor-disambig:竞品维度按需。用户没手动指定竞品时,AI 按品类
//    自动锚定 → 让用户确认对标哪些竞品。手动指定过就跳过这一步。
//
// 爆款 / 低粉维度的 confirmStep 是 "none" —— 后果低,直接出结果,调整放到
// 结果之后(追问 + 筛选)。

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { ParsedBrief } from "./lib/parsed-brief-types";
import { proposeScenarios, type ProposedScenario } from "./lib/scenario-proposal";

const BRAND = "#ff4f00";

export interface ConfirmOption {
  id: string;
  title: string;
  description: string;
  /** 次级标签行 —— 场景维度放「能拍的达人类型」。 */
  meta: string[];
  defaultChecked: boolean;
}

export interface ConfirmStepData {
  kind: "scenario-pick" | "competitor-disambig";
  heading: string;
  subheading: string;
  /** meta 标签的前缀文字,如「可拍达人类型」。空则不显示前缀。 */
  metaLabel: string;
  options: ConfirmOption[];
  confirmLabel: string;
}

// ── 数据构造 ────────────────────────────────────────────────────────────────

export function buildScenarioConfirm(brief: ParsedBrief): {
  data: ConfirmStepData;
  scenarios: ProposedScenario[];
} {
  const scenarios = proposeScenarios(brief);
  return {
    scenarios,
    data: {
      kind: "scenario-pick",
      heading: "我从你的产品反推出这些内容场景",
      subheading:
        "勾选你想要的场景 —— 我只在选中的场景里找能拍的达人。每个场景下标注了能拍它的达人类型。",
      metaLabel: "可拍达人类型",
      options: scenarios.map((s) => ({
        id: s.id,
        title: s.name,
        description: s.rationale,
        meta: s.creatorTypes,
        defaultChecked: s.recommended,
      })),
      confirmLabel: "用选中的场景找达人",
    },
  };
}

export function buildCompetitorConfirm(brief: ParsedBrief): ConfirmStepData {
  const brands = brief.competitorBrands ?? [];
  const fallback = ["同品类头部品牌", "同品类高增长品牌", "同品类性价比品牌"];
  const list = brands.length > 0 ? [...brands] : fallback;
  return {
    kind: "competitor-disambig",
    heading: "我按你的产品品类锚定了这些竞品",
    subheading: "你没有手动指定竞品 —— 确认下要对标哪些。我会取它们近期验证过的合作款达人。",
    metaLabel: "",
    options: list.map((b, i) => ({
      id: `comp_${i}`,
      title: b,
      description: i === 0 ? "品类头部 · 合作样本最多" : "同品类 · 有近期合作记录",
      meta: [],
      defaultChecked: i < 3,
    })),
    confirmLabel: "对标选中的竞品",
  };
}

// ── 确认屏组件 ──────────────────────────────────────────────────────────────

interface ConfirmStepProps {
  data: ConfirmStepData;
  onConfirm: (selectedIds: string[]) => void;
  onCancel: () => void;
}

export function ConfirmStep({ data, onConfirm, onCancel }: ConfirmStepProps) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(data.options.filter((o) => o.defaultChecked).map((o) => o.id)),
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const canConfirm = selected.size > 0;

  return (
    <motion.div
      key="confirm"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      className="relative h-full overflow-y-auto bg-[#fffdf9]"
    >
      <div className="mx-auto flex min-h-full w-full max-w-[720px] flex-col justify-center px-5 py-12">
        <header>
          <h1 className="text-[22px] font-bold tracking-[-0.01em] text-[#201515]">
            {data.heading}
          </h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-[#5d5a52]">{data.subheading}</p>
        </header>

        <ul className="mt-6 flex flex-col gap-2.5">
          {data.options.map((opt, idx) => {
            const checked = selected.has(opt.id);
            return (
              <motion.li
                key={opt.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
              >
                <Button
                  unstyled
                  type="button"
                  onClick={() => toggle(opt.id)}
                  aria-pressed={checked}
                  className="flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors"
                  style={{
                    borderColor: checked ? BRAND : "#eceae3",
                    backgroundColor: checked ? "#fff7f2" : "white",
                  }}
                >
                  <span
                    aria-hidden
                    className="mt-0.5 inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border"
                    style={{
                      borderColor: checked ? BRAND : "#c5c0b1",
                      backgroundColor: checked ? BRAND : "white",
                    }}
                  >
                    {checked ? <Check size={12} strokeWidth={3} color="white" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-[#201515]">
                      {opt.title}
                    </span>
                    <span className="mt-0.5 block text-[12.5px] leading-relaxed text-[#5d5a52]">
                      {opt.description}
                    </span>
                    {opt.meta.length > 0 ? (
                      <span className="mt-2 flex flex-wrap items-center gap-1.5">
                        {data.metaLabel ? (
                          <span className="text-[11px] text-[#939084]">{data.metaLabel}</span>
                        ) : null}
                        {opt.meta.map((m) => (
                          <span
                            key={m}
                            className="inline-flex items-center rounded-full bg-[#f1efe9] px-2 py-0.5 text-[11.5px] text-[#36342e]"
                          >
                            {m}
                          </span>
                        ))}
                      </span>
                    ) : null}
                  </span>
                </Button>
              </motion.li>
            );
          })}
        </ul>

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            unstyled
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2.5 text-[13px] font-medium text-[#5d5a52] transition-colors hover:bg-[#f1efe9]"
          >
            返回修改输入
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-[12.5px] text-[#939084]">已选 {selected.size} 项</span>
            <Button
              unstyled
              type="button"
              disabled={!canConfirm}
              onClick={() => onConfirm([...selected])}
              className="rounded-lg px-5 py-2.5 text-[13px] font-semibold text-white transition-[filter,opacity] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ backgroundColor: BRAND }}
            >
              {data.confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
