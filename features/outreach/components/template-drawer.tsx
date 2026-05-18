"use client";

import { useCallback, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RichEmailEditor } from "@/features/outreach/components/inbox-rich-editor";
import {
  editorHtmlToText,
  textToEditorHtml,
} from "@/features/outreach/components/template-body-bridge";
import {
  FIELD_INPUT,
  FIELD_LABEL,
  PreviewPane,
  SCOPE_OPTIONS,
  ScopeCard,
  TagsField,
} from "@/features/outreach/components/template-drawer-parts";
import {
  SCENE_CFG,
  type Template,
  type TemplateScope,
} from "@/features/outreach/data/outreach-types";
import { cn } from "@/lib/utils";

// §3.5 全屏分屏 template 编辑 modal — Zaiper Design 视觉。
// 左：表单（模板名称 / 归属 / 场景标签 / 主题 / 正文 RichEmailEditor）。
// 右：实时预览（mock 邮件卡 + highlightVars 高亮变量）。
// 业务行为（state / handler / 校验）1:1 保留，仅重构布局与 token。
// 视觉子件抽到 ./template-drawer-parts.tsx。

export function TemplateDrawer({
  template,
  isCopy,
  onClose,
  onSave,
}: {
  template?: Template;
  isCopy?: boolean;
  onClose: () => void;
  onSave: (t: Template) => void;
}) {
  const isCreate = !template;
  const [name, setName] = useState(template?.name ?? "");
  const [scope, setScope] = useState<TemplateScope>(template?.scope ?? "universal");
  const [scenes, setScenes] = useState<string[]>(template?.scenes ?? []);
  const [subject, setSubject] = useState(template?.subject ?? "");
  const [body, setBody] = useState(template?.body ?? "");
  const [bodyInitialHtml] = useState(() => textToEditorHtml(template?.body ?? ""));
  const [sceneInput, setSceneInput] = useState("");
  const [audienceInput, setAudienceInput] = useState("");
  const [audienceTags, setAudienceTags] = useState<string[]>(template?.audienceTags ?? []);
  const [purpose, setPurpose] = useState(template?.purpose ?? "");

  const handleEditorChange = useCallback((html: string) => {
    setBody(editorHtmlToText(html));
  }, []);

  const addScene = () => {
    const s = sceneInput.trim();
    if (s && !scenes.includes(s)) setScenes((prev) => [...prev, s]);
    setSceneInput("");
  };
  const removeScene = (s: string) => setScenes((prev) => prev.filter((x) => x !== s));

  const addAudience = () => {
    const s = audienceInput.trim();
    if (s && !audienceTags.includes(s)) setAudienceTags((prev) => [...prev, s]);
    setAudienceInput("");
  };
  const removeAudience = (s: string) => setAudienceTags((prev) => prev.filter((x) => x !== s));

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: template?.id ?? Date.now(),
      name: name.trim(),
      scope,
      scenes,
      subject,
      body,
      usage: template?.usage ?? 0,
      openRate: template?.openRate ?? 0,
      replyRate: template?.replyRate ?? 0,
      lastUpdated: "04-18",
      audienceTags: scope === "specific" && audienceTags.length > 0 ? audienceTags : undefined,
      purpose: scope === "specific" && purpose.trim() ? purpose.trim() : undefined,
    });
  };

  const heading = isCopy
    ? `编辑副本 · 基于（${template?.name}）`
    : isCreate
      ? "新建模板"
      : "编辑模板";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(45,45,46,0.5)] p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={heading}
        className="flex h-[calc(100vh-48px)] w-[min(1280px,calc(100%-48px))] flex-col overflow-hidden rounded-lg border border-[#c5c0b1] bg-[#fffefb]"
      >
        {/* header */}
        <header className="flex shrink-0 items-center justify-between border-b border-[#c5c0b1] bg-[#fffefb] px-7 py-4">
          <h2 className="text-[17px] font-semibold tracking-[-0.3px] text-[#201515]">{heading}</h2>
          <Button
            unstyled
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="flex h-8 w-8 items-center justify-center rounded-md text-[#939084] transition-colors hover:bg-[#eceae3] hover:text-[#201515] focus-visible:ring-2 focus-visible:ring-[#ff4f00]/30 focus-visible:outline-none"
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </header>

        {/* body — 左右分屏 */}
        <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1.15fr_1fr]">
          {/* 左 form pane */}
          <div className="space-y-5 overflow-y-auto border-b border-[#c5c0b1] bg-[#fffefb] p-7 lg:border-r lg:border-b-0">
            {/* 模板名称 */}
            <div>
              <label className={FIELD_LABEL} htmlFor="tpl-name">
                模板名称
              </label>
              <input
                id="tpl-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="如：首次建联 · 美妆"
                className={cn(FIELD_INPUT, "mt-2")}
              />
            </div>

            {/* 归属 */}
            <div>
              <span className={FIELD_LABEL}>归属</span>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {SCOPE_OPTIONS.map((opt) => (
                  <ScopeCard
                    key={opt.key}
                    option={opt}
                    active={scope === opt.key}
                    onSelect={() => setScope(opt.key)}
                  />
                ))}
              </div>

              {scope === "specific" ? (
                <div className="mt-3 space-y-3 rounded-md border border-[#c5c0b1] bg-[#fffdf9] p-3">
                  <TagsField
                    label="博主类型 / 受众标签（可多个）"
                    placeholder="输入标签后按 Enter"
                    tags={audienceTags}
                    inputValue={audienceInput}
                    onInputChange={setAudienceInput}
                    onAdd={addAudience}
                    onRemove={removeAudience}
                  />
                  <div>
                    <label className={FIELD_LABEL} htmlFor="tpl-purpose">
                      用途备注（可选）
                    </label>
                    <input
                      id="tpl-purpose"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder="如：节日促销专用 / 寒暄破冰…"
                      className={cn(FIELD_INPUT, "mt-2")}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            {/* 使用场景标签 */}
            <div>
              <TagsField
                label="使用场景标签"
                placeholder="输入标签后按 Enter 添加"
                tags={scenes}
                inputValue={sceneInput}
                onInputChange={setSceneInput}
                onAdd={addScene}
                onRemove={removeScene}
                tagClassName={(tag) => SCENE_CFG[tag] ?? null}
              />
              <div className="mt-2 flex flex-wrap gap-1">
                {Object.keys(SCENE_CFG)
                  .filter((s) => !scenes.includes(s))
                  .map((s) => (
                    <Button
                      unstyled
                      key={s}
                      type="button"
                      onClick={() => setScenes((prev) => [...prev, s])}
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[11px] font-medium opacity-60 transition-opacity hover:opacity-100",
                        SCENE_CFG[s],
                      )}
                    >
                      + {s}
                    </Button>
                  ))}
              </div>
            </div>

            {/* 邮件主题 */}
            <div>
              <label className={FIELD_LABEL} htmlFor="tpl-subject">
                邮件主题
              </label>
              <input
                id="tpl-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Hi {creator_name}, ..."
                className={cn(FIELD_INPUT, "mt-2")}
              />
            </div>

            {/* 正文 RichEmailEditor */}
            <div>
              <span className={FIELD_LABEL}>正文内容</span>
              <div className="mt-2 overflow-hidden rounded-md border border-[#c5c0b1] bg-[#fffefb]">
                <RichEmailEditor
                  defaultHtml={bodyInitialHtml}
                  onChange={handleEditorChange}
                  placeholder={"Hi {creator_name},\n\n..."}
                />
              </div>
            </div>
          </div>

          {/* 右 preview pane */}
          <PreviewPane subject={subject} body={body} />
        </div>

        {/* footer */}
        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-[#c5c0b1] bg-[#fffefb] px-7 py-4">
          <Button
            unstyled
            type="button"
            onClick={onClose}
            className="rounded border border-[#c5c0b1] bg-[#fffefb] px-4 py-2 text-[13px] font-medium text-[#36342e] transition-colors hover:bg-[#eceae3] hover:text-[#201515]"
          >
            取消
          </Button>
          <Button
            unstyled
            type="button"
            onClick={handleSave}
            disabled={!name.trim()}
            className="rounded border border-[#ff4f00] bg-[#ff4f00] px-4 py-2 text-[13px] font-semibold text-[#fffefb] transition-colors hover:border-[#e64600] hover:bg-[#e64600] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isCreate ? "创建模板" : "保存"}
          </Button>
        </footer>
      </div>
    </div>
  );
}
