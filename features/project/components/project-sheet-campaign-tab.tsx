"use client";

import { Sparkles } from "lucide-react";

import type { WorkspaceProjectDraft } from "@/features/project/components/project-context";
import { FieldLabel } from "@/features/project/components/project-sheet-fields";

// 「营销方案」Tab —— 目标市场 / 投放平台 / 目标受众 / 核心卖点。
// 这几项都由「博主发现」根据后台记录自动回填，用户不需要修改，只读展示。
// 产品信息已上移到抽屉顶部的项目信息区，不在这里。

// 把一段自动回填的文本拆成「一条条」—— 兼容换行与中英文标点分隔。
function splitToItems(text: string): string[] {
  return text
    .split(/[\n、，,；;]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function ProjectSheetCampaignTab({ draft }: { draft: WorkspaceProjectDraft }) {
  const audienceItems = splitToItems(draft.targetAudience);
  const sellingItems = splitToItems(draft.sellingPoints);

  return (
    <div className="space-y-4">
      <p className="flex items-start gap-1.5 rounded-lg bg-[#fffdf9] px-3 py-2 text-[11px] leading-4 text-[#939084]">
        <Sparkles className="mt-px h-3.5 w-3.5 shrink-0 text-[#ff4f00]" />
        以下信息由「博主发现」根据你的提问与后台记录自动整理，无需手动填写。
      </p>

      <div>
        <FieldLabel label="目标市场" />
        <ChipList
          items={draft.targetMarkets}
          emptyText="发起一次博主发现后，目标市场会自动记录在这里。"
        />
      </div>

      <div>
        <FieldLabel label="投放平台" />
        {/* 只展示用户实际选择的投放平台 —— 没选的平台不出现，不再列「尚未开放」占位。 */}
        <ChipList
          items={draft.platforms}
          emptyText="发起一次博主发现并选定平台后，投放平台会记录在这里。"
        />
      </div>

      <div>
        <FieldLabel label="目标受众" />
        <StripList items={audienceItems} emptyText="博主发现过程中识别到的目标受众会列在这里。" />
      </div>

      <div>
        <FieldLabel label="核心卖点" />
        <StripList items={sellingItems} emptyText="博主发现过程中提炼的核心卖点会列在这里。" />
      </div>
    </div>
  );
}

// 标签组 —— 目标市场 / 投放平台共用，逐项展示选中值；为空时给提示。
function ChipList({ items, emptyText }: { items: string[]; emptyText: string }) {
  if (items.length === 0) {
    return <EmptyHint text={emptyText} />;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full border border-[#c5c0b1] bg-[#eceae3] px-2.5 py-0.5 text-xs text-[#36342e]"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

// 条状列表 —— 一条一条紧凑列出。
function StripList({ items, emptyText }: { items: string[]; emptyText: string }) {
  if (items.length === 0) {
    return <EmptyHint text={emptyText} />;
  }
  return (
    <ul className="space-y-1">
      {items.map((item, index) => (
        <li
          key={`${index}-${item}`}
          className="flex items-start gap-2 rounded-md bg-[#fffdf9] px-2.5 py-1.5 text-xs leading-5 text-[#36342e]"
        >
          <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff4f00]" />
          <span className="min-w-0 flex-1">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <p className="rounded-md bg-[#fffdf9] px-2.5 py-1.5 text-[11px] leading-4 text-[#b5b2aa]">
      {text}
    </p>
  );
}
