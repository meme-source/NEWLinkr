"use client";

import { useCallback, useState } from "react";
import { GripVertical, X } from "lucide-react";

import { highlightVars } from "@/features/outreach/components/highlight-vars";
import { RichEmailEditor } from "@/features/outreach/components/inbox-rich-editor";
import {
  editorHtmlToText,
  textToEditorHtml,
} from "@/features/outreach/components/template-body-bridge";
import {
  SCENE_CFG,
  type Template,
  type TemplateScope,
} from "@/features/outreach/data/outreach-types";
import { useResizableDrawer } from "@/lib/hooks/use-resizable-drawer";
import { cn } from "@/lib/utils";

const DEFAULT_WIDTH = 820;

// §3.5 template editor with scope (universal/specific) controls + binding
// area. Body is now the shared RichEmailEditor (§3.4.4) so template editing
// matches inbox composing. Template.body remains plain text in storage —
// see textToEditorHtml / editorHtmlToText below for the bridge.
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

  const { width, startResize } = useResizableDrawer({ defaultWidth: DEFAULT_WIDTH });

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

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />

      <div className="relative flex h-full max-w-[95vw] flex-col bg-[#fffefb]" style={{ width }}>
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="拖动调整宽度"
          onMouseDown={startResize}
          className="group absolute top-0 bottom-0 left-0 z-[60] flex w-2 -translate-x-1/2 cursor-col-resize items-center justify-center"
        >
          <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent transition-colors group-hover:bg-[#ff4f00]/40" />
          <span className="relative flex h-9 w-4 items-center justify-center rounded-full border border-[#c5c0b1] bg-[#fffefb] text-[#939084] transition-colors group-hover:border-[#ff4f00]/50 group-hover:text-[#ff4f00]">
            <GripVertical className="h-3 w-3" strokeWidth={2.25} />
          </span>
        </div>
        <div className="flex shrink-0 items-center justify-between border-b border-[#c5c0b1] px-6 py-4">
          <span className="font-semibold text-[#201515]">
            {isCopy ? `编辑副本 · 基于（${template?.name}）` : isCreate ? "新建模板" : "编辑模板"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#939084] hover:bg-[#eceae3]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Preview — top, compact, scrolls internally if it overflows. */}
        <div className="max-h-[280px] shrink-0 overflow-y-auto border-b border-[#c5c0b1] bg-[#fffdf9] px-6 py-4">
          <p className="mb-3 text-xs font-medium tracking-wider text-[#939084] uppercase">
            实时预览
          </p>
          <div className="rounded-2xl border border-[#c5c0b1] bg-[#fffefb]">
            <div className="flex items-center gap-3 border-b border-[#eceae3] px-5 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ff4f00] text-sm font-semibold text-[#fffefb]">
                S
              </div>
              <div>
                <div className="text-sm font-medium text-[#201515]">Sarah from MyBrand</div>
                <div className="text-[11px] text-[#939084]">marketing@mybrand.com</div>
              </div>
            </div>
            <div className="space-y-2 px-5 py-3">
              <div className="flex gap-2 text-xs">
                <span className="w-10 shrink-0 font-medium text-[#939084]">收件人</span>
                <span className="rounded bg-[#fff7f4] px-1.5 font-mono text-[#ff4f00]">
                  {"{creator_name}"}
                </span>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="w-10 shrink-0 font-medium text-[#939084]">主题</span>
                <span className="leading-relaxed text-[#201515]">
                  {subject ? (
                    highlightVars(subject)
                  ) : (
                    <span className="text-[#c5c0b1] italic">（请输入邮件主题）</span>
                  )}
                </span>
              </div>
              <div className="border-t border-[#eceae3]" />
              <div className="text-[13px] leading-relaxed whitespace-pre-wrap text-[#201515]">
                {body ? (
                  highlightVars(body)
                ) : (
                  <span className="text-[#c5c0b1] italic">（请输入正文内容）</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form — fills remaining height, scrolls internally. */}
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#36342e]">模板名称</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：首次建联 · 美妆"
              className="w-full rounded-xl border border-[#c5c0b1] bg-[#fffdf9] px-3.5 py-2.5 text-sm text-[#201515] placeholder:text-[#939084] focus:border-[#ff4f00]/40 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#36342e]">归属</label>
            <div className="space-y-2">
              <label className="flex items-start gap-2 text-xs text-[#36342e]">
                <input
                  type="radio"
                  name="scope"
                  checked={scope === "universal"}
                  onChange={() => setScope("universal")}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium text-[#201515]">通用模板</span>
                  <span className="ml-1 text-[#939084]">所有项目可见</span>
                </span>
              </label>
              <label className="flex items-start gap-2 text-xs text-[#36342e]">
                <input
                  type="radio"
                  name="scope"
                  checked={scope === "specific"}
                  onChange={() => setScope("specific")}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium text-[#201515]">非通用模板</span>
                  <span className="ml-1 text-[#939084]">绑定到具体场景</span>
                </span>
              </label>
            </div>

            {scope === "specific" ? (
              <div className="mt-3 space-y-3 rounded-xl border border-[#c5c0b1] bg-[#fffdf9] p-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-[#36342e]">
                    博主类型 / 受众标签（可多个）
                  </label>
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {audienceTags.map((s) => (
                      <span
                        key={s}
                        className="flex items-center gap-1 rounded-full border border-[#c5c0b1] bg-[#fffefb] px-2 py-0.5 text-[10px] text-[#36342e]"
                      >
                        {s}
                        <button
                          type="button"
                          onClick={() => removeAudience(s)}
                          className="opacity-60 hover:opacity-100"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={audienceInput}
                      onChange={(e) => setAudienceInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addAudience();
                        }
                      }}
                      placeholder="输入标签后按 Enter"
                      className="flex-1 rounded-lg border border-dashed border-[#c5c0b1] bg-[#fffefb] px-2.5 py-1.5 text-xs text-[#201515] placeholder:text-[#939084] focus:border-[#ff4f00]/40 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={addAudience}
                      disabled={!audienceInput.trim()}
                      className="rounded-lg border border-[#c5c0b1] px-2.5 py-1.5 text-xs text-[#36342e] hover:bg-[#eceae3] disabled:opacity-40"
                    >
                      添加
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-[#36342e]">
                    用途备注（可选）
                  </label>
                  <input
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="如：节日促销专用 / 寒暄破冰 ..."
                    className="w-full rounded-lg border border-[#c5c0b1] bg-[#fffefb] px-2.5 py-1.5 text-xs text-[#201515] placeholder:text-[#939084] focus:border-[#ff4f00]/40 focus:outline-none"
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#36342e]">使用场景标签</label>

            {scenes.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {scenes.map((s) => (
                  <span
                    key={s}
                    className={cn(
                      "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                      SCENE_CFG[s] ?? "border-[#c5c0b1] bg-[#eceae3] text-[#939084]",
                    )}
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => removeScene(s)}
                      className="ml-0.5 opacity-60 hover:opacity-100"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                value={sceneInput}
                onChange={(e) => setSceneInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addScene();
                  }
                }}
                placeholder="输入标签后按 Enter 添加"
                className="flex-1 rounded-xl border border-dashed border-[#c5c0b1] bg-[#fffdf9] px-3 py-2 text-xs text-[#201515] placeholder:text-[#939084] focus:border-[#ff4f00]/40 focus:outline-none"
              />
              <button
                type="button"
                onClick={addScene}
                disabled={!sceneInput.trim()}
                className="rounded-xl border border-[#c5c0b1] px-3 py-2 text-xs text-[#36342e] hover:bg-[#eceae3] disabled:opacity-40"
              >
                添加
              </button>
            </div>

            <div className="mt-2 flex flex-wrap gap-1">
              {Object.keys(SCENE_CFG)
                .filter((s) => !scenes.includes(s))
                .map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScenes((prev) => [...prev, s])}
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-medium opacity-50 transition-opacity hover:opacity-100",
                      SCENE_CFG[s],
                    )}
                  >
                    + {s}
                  </button>
                ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#36342e]">邮件主题</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Hi {creator_name}, ..."
              className="w-full rounded-xl border border-[#c5c0b1] bg-[#fffdf9] px-3.5 py-2.5 text-sm text-[#201515] placeholder:text-[#939084] focus:border-[#ff4f00]/40 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#36342e]">正文内容</label>
            <RichEmailEditor
              defaultHtml={bodyInitialHtml}
              onChange={handleEditorChange}
              placeholder={"Hi {creator_name},\n\n..."}
            />
          </div>
        </div>

        {/* Footer — sticky bottom, lives outside the scroll. */}
        <div className="flex shrink-0 gap-2 border-t border-[#c5c0b1] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-[#c5c0b1] py-2.5 text-sm text-[#36342e] hover:bg-[#eceae3]"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1 rounded-xl bg-[#ff4f00] py-2.5 text-sm font-medium text-[#fffefb] hover:bg-[#ff4f00] disabled:opacity-40"
          >
            {isCreate ? "创建模板" : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
