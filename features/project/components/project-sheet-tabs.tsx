"use client";

import { Megaphone, Users } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type {
  ProjectDrawerMode,
  WorkspaceProject,
  WorkspaceProjectDraft,
} from "@/features/project/components/project-context";
import { ProjectSheetCampaignTab } from "@/features/project/components/project-sheet-campaign-tab";
import { ProjectSheetPlacementTab } from "@/features/project/components/project-sheet-placement-tab";
import { cn } from "@/lib/utils";

// 项目抽屉的分栏区 —— 营销方案 / 达人投放 两个 Tab。
// 「营销方案」展示由博主发现自动回填的目标市场 / 平台 / 受众 / 卖点；
// 「达人投放」展示项目里已合作的达人名单。产品信息已上移到顶部项目信息区。

type TabId = "campaign" | "placement";

const TABS = [
  { id: "campaign", label: "营销方案", Icon: Megaphone },
  { id: "placement", label: "达人投放", Icon: Users },
] as const;

export function ProjectSheetTabs({
  draft,
  mode,
  project,
}: {
  draft: WorkspaceProjectDraft;
  mode: ProjectDrawerMode;
  project?: WorkspaceProject;
}) {
  const [tab, setTab] = useState<TabId>("campaign");

  return (
    <section>
      <nav className="flex items-center gap-1 border-b border-[#c5c0b1]">
        {TABS.map((item) => {
          const active = tab === item.id;
          return (
            <Button
              unstyled
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              aria-pressed={active}
              className={cn(
                "relative inline-flex items-center gap-1.5 px-3 pt-1 pb-2.5 text-xs font-medium transition-colors",
                active ? "text-[#ff4f00]" : "text-[#36342e] hover:text-[#201515]",
              )}
            >
              <item.Icon className="h-3.5 w-3.5" />
              {item.label}
              {active ? (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-t bg-[#ff4f00]" />
              ) : null}
            </Button>
          );
        })}
      </nav>

      <div className="pt-4">
        {tab === "campaign" ? (
          <ProjectSheetCampaignTab draft={draft} />
        ) : (
          <ProjectSheetPlacementTab mode={mode} project={project} />
        )}
      </div>
    </section>
  );
}
