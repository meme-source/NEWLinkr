"use client";

import { Mail, Search, Target } from "lucide-react";
import { useState } from "react";

import {
  AddPlacementDialog,
  type AddPlacementCreatorPrefill,
} from "@/features/outreach/components/add-placement-dialog";
import { Button } from "@/components/ui/button";
import type { Creator } from "@/types/api";

import { FindSimilarPickerDialog } from "./find-similar-picker-dialog";

interface Props {
  creator: Creator;
  rightSlot?: React.ReactNode;
}

// 抽屉 header 的核心操作按钮组。
// 主按钮 = 发起建联（橙色），副按钮 = 找相似 / 添加追踪。
// 「移项目」已迁移到项目 chip 上的下拉菜单。
// rightSlot：右对齐的辅助内容（当前用于「数据更新时间 + 刷新」）。
//
// 「找相似」与插件端 onOpenSimilarSidebar 同义：以当前博主为种子，弹出
// 快速筛选 / 逐个筛选选择器，再跳转到 discovery 对应路径。
export function HeaderActions({ creator, rightSlot }: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [similarOpen, setSimilarOpen] = useState(false);

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
      <ActionSecondary onClick={() => setSimilarOpen(true)} ariaLabel="找相似">
        <Search className="h-3.5 w-3.5" /> 找相似
      </ActionSecondary>
      <ActionSecondary onClick={() => setAddOpen(true)}>
        <Target className="h-3.5 w-3.5" /> 投放追踪
      </ActionSecondary>
      {rightSlot}
      <AddPlacementDialog open={addOpen} onClose={() => setAddOpen(false)} prefill={prefill} />
      <FindSimilarPickerDialog
        open={similarOpen}
        creator={creator}
        onClose={() => setSimilarOpen(false)}
      />
    </div>
  );
}

function ActionPrimary({ children }: { children: React.ReactNode }) {
  return (
    <Button
      unstyled
      type="button"
      className="inline-flex items-center gap-1.5 rounded-full bg-[#ff4f00] px-3 py-1.5 text-[12px] font-semibold text-[#fffefb] transition-colors hover:bg-[#ff4f00]"
    >
      {children}
    </Button>
  );
}

function ActionSecondary({
  children,
  onClick,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  return (
    <Button
      unstyled
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="inline-flex items-center gap-1.5 rounded-full border border-[#c5c0b1] bg-[#fffefb] px-3 py-1.5 text-[12px] font-medium text-[#36342e] transition-colors hover:bg-[#fffdf9]"
    >
      {children}
    </Button>
  );
}
