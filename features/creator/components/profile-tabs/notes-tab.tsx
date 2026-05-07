"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import type { CreatorProfileInput } from "../creator-profile-drawer";
import { C, SectionTitle } from "./shared";

interface Props {
  creator: CreatorProfileInput;
}

// Phase 1: plain-text notes, kept in component-local state. The parent drawer
// remounts NotesTab via key={creator.handle} when a different creator is
// opened, so the initial-state read covers the "new creator" reset case
// without a setState-in-effect. @mention placeholder is greyed (Phase 2).
export function NotesTab({ creator }: Props) {
  const [text, setText] = useState(creator.notes ?? "");

  return (
    <div className="space-y-6">
      <section>
        <SectionTitle>笔记</SectionTitle>
        <div
          className="space-y-3 rounded-2xl border bg-background p-4"
          style={{ borderColor: C.border }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder="记录你与该博主的沟通要点、合作要求、未来计划……"
            className="w-full resize-y rounded-xl border bg-[#fffefb] px-3 py-2.5 text-[13px] leading-relaxed text-[#201515] placeholder:text-[#c5c0b1] focus:border-[#ff4f00]/40 focus:bg-background focus:ring-2 focus:ring-[#ff4f00]/15 focus:outline-none"
            style={{ borderColor: C.border }}
          />
          <div className="flex items-center justify-between">
            <span
              className="inline-flex items-center gap-1 text-[11px]"
              style={{ color: C.stone }}
              title="团队 @ 提及功能即将开放"
            >
              <Lock className="h-3 w-3" />@ 提及团队成员（团队功能即将开放）
            </span>
            <span className="text-[11px]" style={{ color: C.stone }}>
              {text.length} 字符
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
