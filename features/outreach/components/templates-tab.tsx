"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";

import { TemplateCard } from "@/features/outreach/components/template-card";
import { TemplateDrawer } from "@/features/outreach/components/template-drawer";
import { SystemTemplateModal, TrashView } from "@/features/outreach/components/template-trash";
import { INIT_MY_TEMPLATES, INIT_TRASH, SYS_TEMPLATES } from "@/features/outreach/data/templates";
import {
  type MyTemplate,
  type Template,
  type TemplateTab as TemplateTabKey,
  type TrashItem,
} from "@/features/outreach/data/outreach-types";
import { cn } from "@/lib/utils";

export function TemplatesTab() {
  const [tab, setTab] = useState<TemplateTabKey>("all");
  const [scopeFilter, setScopeFilter] = useState<"all" | "universal" | "specific">("all");
  const [search, setSearch] = useState("");
  const [myTemplates, setMyTemplates] = useState<MyTemplate[]>(INIT_MY_TEMPLATES);
  const [trash, setTrash] = useState<TrashItem[]>(INIT_TRASH);
  const [sysModalFor, setSysModalFor] = useState<Template | null>(null);
  const [editTarget, setEditTarget] = useState<{ template: MyTemplate; isCopy?: boolean } | null>(
    null,
  );
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleSysEdit = (t: Template) => setSysModalFor(t);

  const handleCopyEdit = () => {
    if (!sysModalFor) return;
    const copy: MyTemplate = {
      ...sysModalFor,
      id: Date.now(),
      name: `${sysModalFor.name}·复制`,
      basedOn: sysModalFor.name,
      usage: 0,
      openRate: 0,
      replyRate: 0,
      lastUpdated: "04-18",
      wordCount: sysModalFor.body.split(" ").length,
    };
    setSysModalFor(null);
    setEditTarget({ template: copy, isCopy: true });
  };

  const handleMyEdit = (t: MyTemplate) => setEditTarget({ template: t });

  const handleSave = (updated: Template) => {
    const mine = updated as MyTemplate;
    setMyTemplates((prev) => {
      const exists = prev.find((t) => t.id === mine.id);
      return exists ? prev.map((t) => (t.id === mine.id ? mine : t)) : [...prev, mine];
    });
    setEditTarget(null);
    setCreating(false);
    showToast(editTarget?.isCopy ? "副本已保存到「我的模板」" : "模板已保存");
  };

  const handleDelete = (id: number, name: string) => {
    setMyTemplates((prev) => prev.filter((t) => t.id !== id));
    setTrash((prev) => [...prev, { id, name, deletedDaysAgo: 0 }]);
    showToast("已移入回收站，30 天内可恢复");
  };

  const handleRestore = (id: number) => {
    const item = trash.find((t) => t.id === id);
    setTrash((prev) => prev.filter((t) => t.id !== id));
    if (item) {
      setMyTemplates((prev) => [
        ...prev,
        {
          id: item.id,
          name: item.name,
          scope: "universal",
          scenes: [],
          subject: "",
          body: "",
          usage: 0,
          openRate: 0,
          replyRate: 0,
          lastUpdated: "04-18",
          wordCount: 0,
        },
      ]);
    }
    showToast("已恢复");
  };

  const handlePermDelete = (id: number) => setTrash((prev) => prev.filter((t) => t.id !== id));
  const handleClearAll = () => setTrash([]);

  const matchesFilters = (t: Template) => {
    if (scopeFilter !== "all" && t.scope !== scopeFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const hay =
        `${t.name} ${t.subject} ${t.body} ${t.scenes.join(" ")} ${t.audienceTags?.join(" ") ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  };

  const filteredSystem = SYS_TEMPLATES.filter(matchesFilters);
  const filteredMine = myTemplates.filter(matchesFilters);
  const tabCount =
    tab === "all"
      ? filteredSystem.length + filteredMine.length
      : tab === "system"
        ? filteredSystem.length
        : tab === "mine"
          ? filteredMine.length
          : trash.length;

  if (tab === "trash") {
    return (
      <>
        <TrashView
          trash={trash}
          onRestore={handleRestore}
          onPermDelete={handlePermDelete}
          onClearAll={handleClearAll}
          onBack={() => setTab("all")}
        />
        {toast && (
          <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-[#201515] px-5 py-2.5 text-sm text-[#fffefb]">
            {toast}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-[#939084]">{tabCount} 个模板</span>

        <div className="flex gap-1 rounded-xl bg-[#eceae3] p-1">
          {(["all", "system", "mine"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                tab === t ? "bg-[#fffefb] text-[#201515]" : "text-[#939084] hover:text-[#36342e]",
              )}
            >
              {t === "all" ? "全部" : t === "system" ? "系统模板" : "我的模板"}
            </button>
          ))}
        </div>

        <div className="flex gap-1 rounded-xl bg-[#eceae3] p-1">
          {(["all", "universal", "specific"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScopeFilter(s)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                scopeFilter === s
                  ? "bg-[#fffefb] text-[#201515]"
                  : "text-[#939084] hover:text-[#36342e]",
              )}
            >
              {s === "all" ? "全部" : s === "universal" ? "通用" : "非通用"}
            </button>
          ))}
        </div>

        <div className="relative ml-2">
          <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-[#939084]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索名称/主题/正文/标签"
            className="w-56 rounded-lg border border-[#c5c0b1] py-1.5 pr-3 pl-8 text-xs text-[#201515] placeholder:text-[#939084] focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={() => setTab("trash")}
          className="text-xs text-[#939084] hover:text-[#ff4f00]"
        >
          回收站
          {trash.length > 0 && (
            <span className="ml-1 rounded-full bg-[#eceae3] px-1.5 py-0.5 text-[10px]">
              {trash.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setCreating(true)}
          className="ml-auto flex items-center gap-1.5 rounded-xl bg-[#201515] px-3.5 py-2 text-sm font-medium text-[#fffefb] hover:bg-[#201515]"
        >
          <Plus className="h-3.5 w-3.5" />
          新建模板
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {(tab === "all" || tab === "system") &&
          filteredSystem.map((t) => (
            <TemplateCard
              key={`sys-${t.id}`}
              template={t}
              isSystem
              onEdit={() => handleSysEdit(t)}
            />
          ))}

        {(tab === "all" || tab === "mine") &&
          filteredMine.map((t) => (
            <TemplateCard
              key={`mine-${t.id}`}
              template={t}
              isSystem={false}
              onEdit={() => handleMyEdit(t)}
              onDelete={() => handleDelete(t.id, t.name)}
            />
          ))}
      </div>

      {sysModalFor && (
        <SystemTemplateModal
          templateName={sysModalFor.name}
          onClose={() => setSysModalFor(null)}
          onCopyEdit={handleCopyEdit}
        />
      )}

      {editTarget?.template && (
        <TemplateDrawer
          template={editTarget.template}
          isCopy={editTarget.isCopy}
          onClose={() => setEditTarget(null)}
          onSave={handleSave}
        />
      )}

      {creating && (
        <TemplateDrawer
          onClose={() => setCreating(false)}
          onSave={(t) => handleSave({ ...t, id: Date.now() } as MyTemplate)}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-[#201515] px-5 py-2.5 text-sm text-[#fffefb]">
          {toast}
        </div>
      )}
    </div>
  );
}
