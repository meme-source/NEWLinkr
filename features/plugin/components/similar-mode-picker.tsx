"use client";

import { X, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";
import type { SimilarSearchModeKey } from "./similar-search-module";

import { Button } from "@/components/ui/button";

type ModeDef = {
  key: SimilarSearchModeKey;
  emoji: string;
  label: string;
  desc: string;
  eta: string;
};

const MODES: ModeDef[] = [
  {
    key: "comprehensive",
    emoji: "🔍",
    label: "找相似",
    desc: "内容、调性、受众风格相近的博主推荐。",
    eta: "8–12s",
  },
  {
    key: "budget",
    emoji: "💰",
    label: "找平替",
    desc: "风格 / 受众相似，但报价更低的博主。",
    eta: "6–10s",
  },
  {
    key: "seed",
    emoji: "🌱",
    label: "找种子达人",
    desc: "打开后台博主发现，从零物色一批适合的种子博主。",
    eta: "跳转",
  },
];

type Props = {
  open: boolean;
  selectedMode: SimilarSearchModeKey;
  onSelect: (mode: SimilarSearchModeKey) => void;
  onClose: () => void;
  actionSubject?: ReactNode;
  actionSubjectLabel?: string;
};

export function SimilarModePicker({
  open,
  selectedMode,
  onSelect,
  onClose,
  actionSubject,
  actionSubjectLabel = "当前博主",
}: Props) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-40 rounded-[inherit] backdrop-blur-[3px]"
            style={{ backgroundColor: "rgba(250,249,245,0.72)" }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal — sits in the upper half of the sidebar */}
          <motion.div
            key="modal"
            role="dialog"
            aria-modal="true"
            aria-label="选择搜索模式"
            initial={{ opacity: 0, scale: 0.95, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 6 }}
            transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.6 }}
            className="absolute inset-x-5 z-50 overflow-hidden rounded-[8px] border border-[#c5c0b1] bg-[#fffefb]"
            style={{ top: "22%" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <div className="flex min-w-0 items-center gap-2">
                {actionSubject ? (
                  <span
                    aria-hidden="true"
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#c5c0b1] bg-[#fffdf9]"
                  >
                    {actionSubject}
                  </span>
                ) : null}
                <span className="text-[12.5px] font-semibold text-[#201515]">
                  根据 {actionSubjectLabel} 搜索
                </span>
              </div>
              <Button
                unstyled
                type="button"
                onClick={onClose}
                aria-label="取消"
                className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[#eceae3]"
                style={{ color: "#939084" }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Mode list */}
            <div className="space-y-1 px-3 pb-3">
              {MODES.map((mode) => {
                const isActive = mode.key === selectedMode;
                const isSeed = mode.key === "seed";
                return (
                  <div key={mode.key} className="group relative">
                    <Button
                      unstyled
                      type="button"
                      onClick={() => onSelect(mode.key)}
                      className={[
                        "flex w-full items-center gap-2.5 rounded-[8px] border px-3 py-2.5 text-left transition-all duration-150 active:scale-[0.99]",
                        isActive
                          ? "border-[#c5c0b1] bg-[#fff7f4]"
                          : "border-[#c5c0b1] bg-[#fffdf9] hover:bg-[#eceae3]",
                      ].join(" ")}
                    >
                      <span className="text-[16px] leading-none">{mode.emoji}</span>
                      <span
                        className={[
                          "text-[12.5px] font-semibold",
                          isActive ? "text-[#ff4f00]" : "text-[#201515]",
                        ].join(" ")}
                      >
                        {mode.label}
                      </span>
                      {isSeed ? <ArrowUpRight className="h-3 w-3 shrink-0 text-[#939084]" /> : null}
                      {isActive ? (
                        <span className="ml-auto text-[11px] font-semibold text-[#ff4f00]">✓</span>
                      ) : !isSeed ? (
                        <span className="ml-auto text-[10px] text-[#939084]">{mode.eta}</span>
                      ) : null}
                    </Button>

                    {/* Hover tooltip with description */}
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute top-full left-1/2 z-60 mt-1.5 w-max max-w-[220px] -translate-x-1/2 rounded-[8px] border border-[#c5c0b1] bg-[#fffefb] px-2.5 py-1.5 text-[11px] leading-[1.5] text-[#36342e] opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                    >
                      {mode.desc}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
