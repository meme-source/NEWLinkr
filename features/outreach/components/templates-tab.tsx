"use client";

import { useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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

// §3.5 邮件模板 — Zaiper Design 视觉重写。
// 业务行为（state / handler / 过滤逻辑）1:1 保留，仅替换视觉与排版。

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
  const tabCounts = {
    all: SYS_TEMPLATES.length + myTemplates.length,
    system: SYS_TEMPLATES.length,
    mine: myTemplates.length,
    trash: trash.length,
  };

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
        {toast && <Toast message={toast} />}
      </>
    );
  }

  return (
    <div className="space-y-5">
      {/* 页面标题区 */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[30px] leading-[1.04] font-medium tracking-[-0.6px] text-[#201515]">
            邮件模板
          </h1>
          <p className="mt-1.5 text-[15px] tracking-[-0.2px] text-[#36342e]">
            管理项目中所有外联邮件的复用模板，系统模板不可修改，可复制后编辑
          </p>
        </div>
        <Button
          unstyled
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded border border-[#ff4f00] bg-[#ff4f00] px-4 py-2.5 text-[14px] font-semibold text-[#fffefb] transition-colors hover:border-[#e64600] hover:bg-[#e64600] focus-visible:ring-2 focus-visible:ring-[#ff4f00]/30 focus-visible:outline-none"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          新建模板
        </Button>
      </div>

      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[#c5c0b1] bg-[#fffefb] px-3 py-2.5">
        {/* 左侧 filter pills（全部 / 系统 / 我的）*/}
        <div className="flex items-center gap-1.5">
          {(["all", "system", "mine"] as const).map((key) => {
            const active = tab === key;
            const label = key === "all" ? "全部" : key === "system" ? "系统模板" : "我的模板";
            return (
              <Button
                unstyled
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium transition-colors",
                  active
                    ? "border-[#201515] bg-[#201515] text-[#fffefb]"
                    : "border-[#c5c0b1] bg-[#fffefb] text-[#36342e] hover:border-[#36342e] hover:text-[#201515]",
                )}
              >
                {label}
                <span
                  className={cn(
                    "inline-flex min-w-[18px] items-center justify-center rounded-full px-1 py-px text-[10px] font-semibold tabular-nums",
                    active ? "bg-[#fffefb]/20 text-[#fffefb]" : "bg-[#eceae3] text-[#939084]",
                  )}
                >
                  {tabCounts[key]}
                </span>
              </Button>
            );
          })}
        </div>

        {/* divider */}
        <span aria-hidden className="hidden h-5 w-px bg-[#c5c0b1] md:block" />

        {/* 归属 segmented control */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold tracking-[0.5px] text-[#939084] uppercase">
            归属
          </span>
          <div className="inline-flex items-center rounded-md bg-[#eceae3] p-[3px]">
            {(["all", "universal", "specific"] as const).map((key) => {
              const active = scopeFilter === key;
              const label = key === "all" ? "全部" : key === "universal" ? "通用" : "非通用";
              return (
                <Button
                  unstyled
                  key={key}
                  type="button"
                  onClick={() => setScopeFilter(key)}
                  className={cn(
                    "rounded-[5px] px-2.5 py-1 text-[12px] font-medium transition-all",
                    active
                      ? "bg-[#fffefb] text-[#201515] shadow-[0_0_0_1px_#c5c0b1]"
                      : "text-[#939084] hover:text-[#36342e]",
                  )}
                >
                  {label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* 右侧搜索 + 回收站 */}
        <div className="ml-auto flex items-center gap-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-[#939084]"
              aria-hidden
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索名称 / 主题 / 正文 / 标签"
              className="w-64 rounded-md border border-[#c5c0b1] bg-[#fffefb] py-1.5 pr-3 pl-8 text-[12px] text-[#201515] placeholder:text-[#939084] focus:border-[#ff4f00] focus:outline-none"
            />
          </div>
          <Button
            unstyled
            type="button"
            onClick={() => setTab("trash")}
            className="inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-[12px] font-medium text-[#939084] transition-colors hover:border-[#c5c0b1] hover:text-[#36342e]"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            回收站
            {trash.length > 0 && (
              <span className="rounded-full bg-[#eceae3] px-1.5 py-0.5 text-[10px] font-semibold text-[#36342e] tabular-nums">
                {trash.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* 模板网格 —— 3 列断点 */}
      {filteredSystem.length === 0 && filteredMine.length === 0 ? (
        <EmptyResults search={search.trim()} />
      ) : (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
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
      )}

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

      {toast && <Toast message={toast} />}
    </div>
  );
}

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-[#201515] px-5 py-2.5 text-[13px] text-[#fffefb] shadow-lg">
      {message}
    </div>
  );
}

function EmptyResults({ search }: { search: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[#c5c0b1] bg-[#fffdf9] py-16 text-center">
      <p className="text-[14px] font-semibold text-[#201515]">
        {search ? "未匹配到模板" : "还没有模板"}
      </p>
      <p className="mt-1 text-[12px] text-[#939084]">
        {search ? `没有匹配 "${search}" 的模板，换个关键词试试` : "点击右上角「新建模板」开始创建"}
      </p>
    </div>
  );
}
