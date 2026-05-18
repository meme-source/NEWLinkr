"use client";

import { Heart, Mail } from "lucide-react";

import { cn } from "@/lib/utils";
import { SidebarEmailCopy } from "@/features/plugin/components/sidebar/SidebarEmailCopy";
import { SidebarTagRow } from "@/features/plugin/components/sidebar/SidebarTagRow";
import { Button } from "@/components/ui/button";

// Unified "creator identity strip" used by all four surfaces in the plugin:
//   1. 博主分析 (SidebarCreatorProfileCard)
//   2. 找相似 (SimilarTab header)
//   3. 找相似 → 逐个筛选 (InfluencerCard header)
//   4. 悬浮卡 (FloatingCard identity row)
//
// Layout (方案 A 紧凑式)：
//   ┌───────────────────────────────────────────────┐
//   │ [Avatar 48]  @handle                       ♥  │
//   │              ⌈🇺🇸 country⌋ ⌈creator-type⌋     │
//   │  ⌈📎 email pill⌋                 [✉ 建联]     │
//   │  🏷 + 打标签                                  │
//   └───────────────────────────────────────────────┘
//
// The component does NOT wrap itself in a surface — callers supply their own
// container (gradient card / panel / floating window etc.). This keeps the
// component reusable across surfaces with different paddings & backgrounds.

interface CreatorProfileHeaderProps {
  /** Used for the avatar's first-letter fallback (mirrors CreatorAvatar). */
  name: string;
  /** Rendered as `@handle` on the first line. */
  handle: string;
  flag?: string;
  country?: string;
  creatorType?: string;
  /** Current email address text (may be empty when unknown). */
  email: string;
  /** Whether the email is a real address vs a "+ 添加邮箱" prompt. */
  hasEmail: boolean;
  /** 「建联」按钮 click — opens the email composer sidebar / drawer. */
  onOpenEmailSidebar: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
  /** 是否在标题行右侧显示收藏 ♥ 切换按钮。逐个筛选卡片底部已有独立的「收藏」
   *  按钮,传 false 可避免重复的收藏入口。默认 true。 */
  showSaveToggle?: boolean;
  tags: string[];
  onAddTag: (label: string) => void;
  onRemoveTag: (label: string) => void;
  onEditTag?: (oldLabel: string, newLabel: string) => void;
}

export function CreatorProfileHeader({
  name,
  handle,
  flag,
  country,
  creatorType,
  email,
  hasEmail,
  onOpenEmailSidebar,
  isSaved,
  onToggleSave,
  showSaveToggle = true,
  tags,
  onAddTag,
  onRemoveTag,
  onEditTag,
}: CreatorProfileHeaderProps) {
  const initial = (name?.[0] ?? handle?.[0] ?? "?").toUpperCase();
  const displayHandle = handle.startsWith("@") ? handle : `@${handle}`;
  const showCountry = Boolean(flag || country);
  const showType = Boolean(creatorType?.trim());

  const handleEditTag =
    onEditTag ??
    ((oldLabel: string, newLabel: string) => {
      onRemoveTag(oldLabel);
      const next = newLabel.trim();
      if (next) onAddTag(next);
    });

  return (
    <div className="flex flex-col gap-2">
      {/* Row 1 — avatar + (handle / heart) + (country pill / type pill) */}
      <div className="flex items-start gap-3">
        <div
          aria-hidden
          className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full"
          style={{
            backgroundImage: "linear-gradient(135deg, #eceae3 0%, #c5c0b1 100%)",
          }}
        >
          <span
            className="relative text-base font-bold text-[#fffefb]"
            style={{ fontFamily: '"Times New Roman", Times, serif' }}
          >
            {initial}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="min-w-0 flex-1 truncate text-[15px] leading-tight font-semibold text-[#201515]">
              {displayHandle}
            </span>
            {showSaveToggle ? (
              <Button
                unstyled
                type="button"
                aria-label={isSaved ? `取消收藏 ${name}` : `收藏 ${name}`}
                aria-pressed={isSaved}
                onClick={onToggleSave}
                className={cn(
                  "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-150 active:scale-[0.88]",
                  isSaved
                    ? "border-[#c5c0b1] bg-[#fff7f4] text-[#ff4f00]"
                    : "border-transparent bg-transparent text-[#939084] hover:border-[#c5c0b1] hover:bg-[#fffefb] hover:text-[#ff4f00]",
                )}
              >
                <Heart className={cn("h-4 w-4", isSaved && "fill-current")} />
              </Button>
            ) : null}
          </div>

          {showCountry || showType ? (
            <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-[12px] leading-tight text-[#36342e]">
              {showCountry ? (
                <span
                  aria-label={country ? `地区 ${country}` : undefined}
                  title={country}
                  className="inline-flex items-center gap-1"
                >
                  {flag ? <span aria-hidden>{flag}</span> : null}
                  {country ? <span>{country}</span> : null}
                </span>
              ) : null}
              {showCountry && showType ? (
                <span aria-hidden className="text-[#b5b2aa]">
                  ·
                </span>
              ) : null}
              {showType ? (
                <span aria-label={`博主类型 ${creatorType}`} title={creatorType}>
                  {creatorType}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* Row 2 — email pill + 建联. Both children share the same h-7 +
          rounded-[8px] rectangle as the tag row below, so the two rows
          read as a matched pair. */}
      <div className="flex min-w-0 items-center gap-1.5">
        <SidebarEmailCopy email={email} hasEmail={hasEmail} />
        <Button
          unstyled
          type="button"
          aria-label="建联"
          onClick={onOpenEmailSidebar}
          className="inline-flex h-7 shrink-0 items-center justify-center rounded-[8px] border border-[#c5c0b1] bg-[#fffefb] px-2 text-[11px] font-semibold text-[#36342e] transition-all hover:bg-[#eceae3] active:scale-[0.97]"
        >
          <Mail className="mr-1 h-3.5 w-3.5 text-[#939084]" />
          建联
        </Button>
      </div>

      {/* Row 3 — tags */}
      <SidebarTagRow tags={tags} onAdd={onAddTag} onEdit={handleEditTag} onRemove={onRemoveTag} />
    </div>
  );
}
