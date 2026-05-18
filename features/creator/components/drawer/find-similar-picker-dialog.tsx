"use client";

import { FileText, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { useWorkspaceProject } from "@/features/project/components/project-context";
import {
  buildSimilarDiscoveryUrl,
  followersToDiscoveryPreset,
  type SimilarEntry,
} from "@/lib/discovery/similar-url";
import type { Creator } from "@/types/api";

interface Props {
  open: boolean;
  creator: Creator;
  onClose: () => void;
}

// 与插件端「找相似」一致的入口选择器（plugin-path-demo.tsx 中的
// SearchResultPopup → handleQuickScreen / handleSequentialScreen）。
// 网页端没有侧边浮窗，所以多一步弹窗：用户选「快速筛选」或「逐个筛选」，
// 然后跳到对应的 discovery 路径。URL schema 与插件共用
// lib/discovery/similar-url.ts，两端 100% 一致。
export function FindSimilarPickerDialog({ open, creator, onClose }: Props) {
  if (!open || typeof document === "undefined") return null;
  return <Body creator={creator} onClose={onClose} />;
}

function Body({ creator, onClose }: { creator: Creator; onClose: () => void }) {
  const router = useRouter();
  const { currentProject } = useWorkspaceProject();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const navigate = (entry: SimilarEntry) => {
    router.push(
      buildSimilarDiscoveryUrl({
        creatorId: creator.id,
        seedHandle: creator.handle,
        seedName: creator.name,
        platform: creator.platform,
        entry,
        projectId: currentProject?.id,
        projectName: currentProject?.name,
        countries: deriveTopCountries(creator),
        followersPreset: followersToDiscoveryPreset(creator.followers),
      }),
    );
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[#201515]/26 px-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="find-similar-title"
    >
      <Button
        unstyled
        type="button"
        aria-label="关闭"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[460px] overflow-hidden rounded-lg border border-[#c5c0b1] bg-[linear-gradient(180deg,#fffefb_0%,#fffdf9_55%,#eceae3_100%)] p-6 text-[#201515]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,#ff4f0033,transparent_70%)]"
        />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c5c0b1] bg-[#fffefb] px-3 py-1 text-[11px] text-[#ff4f00]">
              找相似 · 选择筛选方式
            </div>
            <div id="find-similar-title" className="mt-3 text-[20px] leading-tight font-semibold">
              基于「{creator.name}」找相似博主
            </div>
            <p className="mt-2 text-[13px] leading-6 text-[#36342e]">
              你可以直接到博主发现页批量筛选，也可以进入逐个筛选路径，逐位查看创作者主页。
            </p>
          </div>
          <Button
            unstyled
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="relative z-10 rounded-full border border-[#c5c0b1] bg-[#fffefb] p-2 text-[#939084] transition-colors hover:bg-[#eceae3]"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative z-10 mt-5 grid gap-3 sm:grid-cols-2">
          <Button
            unstyled
            type="button"
            onClick={() => navigate("quick-screen")}
            className="rounded-lg border border-[#c5c0b1] bg-[#fffefb] p-4 text-left transition-all hover:-translate-y-0.5 hover:bg-[#eceae3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4f00]"
          >
            <div className="flex items-center gap-2 text-[13px] font-semibold text-[#201515]">
              <Users className="h-4 w-4 text-[#939084]" />
              快速筛选
            </div>
            <div className="mt-2 text-[12px] leading-5 text-[#36342e]">
              直接跳转博主发现页，以列表方式查看全部相似博主并批量管理。
            </div>
          </Button>
          <Button
            unstyled
            type="button"
            onClick={() => navigate("sequential-screen")}
            className="rounded-lg border border-[#c5c0b1] bg-[#fffefb] p-4 text-left transition-all hover:-translate-y-0.5 hover:bg-[#eceae3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4f00]"
          >
            <div className="flex items-center gap-2 text-[13px] font-semibold text-[#201515]">
              <FileText className="h-4 w-4 text-[#939084]" />
              逐个筛选
            </div>
            <div className="mt-2 text-[12px] leading-5 text-[#36342e]">
              逐一查看相似博主主页，边看边收藏 / No / 打标签，节奏由你掌控。
            </div>
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// 与插件 buildDiscoveryResultsUrl 同一选取规则：取受众分布里 T1+T2 的国家名
// 拼成 ?countries= 参数。插件用 emoji flag → name 的映射表，网页端的
// AudienceRegion 已直接带 name（中文），所以直接 filter 出来即可。
function deriveTopCountries(creator: Creator): string[] {
  const regions = creator.audienceAnalysis?.regions ?? [];
  const names = new Set<string>();
  for (const r of regions) {
    if (r.tier === "T1" || r.tier === "T2") {
      if (r.name) names.add(r.name);
    }
  }
  return Array.from(names);
}
