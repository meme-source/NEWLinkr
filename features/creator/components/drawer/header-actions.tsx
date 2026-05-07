"use client";

import { FolderInput, Mail, MoreHorizontal, Target } from "lucide-react";
import { useState } from "react";

import {
  AddPlacementDialog,
  type AddPlacementCreatorPrefill,
} from "@/features/outreach/components/add-placement-dialog";
import type { Creator } from "@/types/api";

interface Props {
  creator: Creator;
}

// 抽屉 header 第 4 行的核心操作按钮组。
// 主按钮 = 发起建联（橙色），副按钮 = 添加追踪 / 移项目 / 更多。
export function HeaderActions({ creator }: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const prefill: AddPlacementCreatorPrefill = {
    creatorHandle: creator.handle,
    creatorName: creator.name,
    creatorAvatarUrl: creator.avatar ?? "",
    creatorFollowers: creator.followers,
    creatorCategory: creator.category,
    creatorProfileUrl:
      creator.socialLinks.find((l) => l.platform === "tiktok")?.url ??
      `https://www.tiktok.com/${creator.handle.startsWith("@") ? creator.handle : "@" + creator.handle}`,
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <ActionPrimary>
        <Mail className="h-3.5 w-3.5" /> 发起建联
      </ActionPrimary>
      <ActionSecondary onClick={() => setAddOpen(true)}>
        <Target className="h-3.5 w-3.5" /> 添加追踪
      </ActionSecondary>
      <ActionSecondary>
        <FolderInput className="h-3.5 w-3.5" /> 移项目
      </ActionSecondary>
      <button
        type="button"
        className="ml-auto rounded-full border border-[#c5c0b1] bg-[#fffefb] p-1.5 text-[#939084] transition-colors hover:bg-[#fffdf9]"
        aria-label="更多"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>
      <AddPlacementDialog open={addOpen} onClose={() => setAddOpen(false)} prefill={prefill} />
    </div>
  );
}

function ActionPrimary({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-full bg-[#ff4f00] px-3 py-1.5 text-[12px] font-semibold text-[#fffefb] transition-colors hover:bg-[#ff4f00]"
    >
      {children}
    </button>
  );
}

function ActionSecondary({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-[#c5c0b1] bg-[#fffefb] px-3 py-1.5 text-[12px] font-medium text-[#36342e] transition-colors hover:bg-[#fffdf9]"
    >
      {children}
    </button>
  );
}
