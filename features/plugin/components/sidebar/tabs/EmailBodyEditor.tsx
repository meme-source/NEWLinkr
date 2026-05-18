"use client";

import { Bold, Italic, List, RemoveFormatting } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// 插件邮件正文编辑器 —— contentEditable + execCommand 的精简富文本编辑器。
// 只开放最常用的加粗 / 斜体 / 列表 / 清除格式，适配插件窄侧栏。
//
// 草稿是逐人独立的：父组件用 key={creatorId} 让本组件随预览博主重新挂载，
// 每次挂载从 valueHtml 载入该博主的草稿（与 outreach 的 RichEmailEditor 同一思路）。

const EDITOR_BODY_CLASSES =
  "min-h-[132px] px-3 py-2.5 text-sm leading-6 text-[#201515] break-words [&_a]:text-[#ff4f00] [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5";

export function EmailBodyEditor({
  valueHtml,
  onChange,
  readOnly = false,
}: {
  valueHtml: string;
  onChange?: (html: string) => void;
  readOnly?: boolean;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  // 冻结挂载时的初始值，让 init effect 的依赖稳定（避免 exhaustive-deps 冲突）。
  const [initialHtml] = useState(valueHtml);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    el.innerHTML = initialHtml;
    if (!readOnly) document.execCommand("styleWithCSS", false, "true");
  }, [initialHtml, readOnly]);

  const sync = useCallback(() => {
    const el = editorRef.current;
    if (el) onChange?.(el.innerHTML);
  }, [onChange]);

  const exec = useCallback(
    (command: string) => {
      editorRef.current?.focus();
      document.execCommand(command, false);
      sync();
    },
    [sync],
  );

  if (readOnly) {
    return <div ref={editorRef} className={EDITOR_BODY_CLASSES} aria-label="邮件正文" />;
  }

  return (
    <div className="bg-[#fffdf9]">
      <div className="flex items-center gap-0.5 border-b border-[#c5c0b1] bg-[#fffefb] px-2 py-1">
        <EditorButton title="加粗" onClick={() => exec("bold")}>
          <Bold className="h-3.5 w-3.5" />
        </EditorButton>
        <EditorButton title="斜体" onClick={() => exec("italic")}>
          <Italic className="h-3.5 w-3.5" />
        </EditorButton>
        <EditorButton title="无序列表" onClick={() => exec("insertUnorderedList")}>
          <List className="h-3.5 w-3.5" />
        </EditorButton>
        <span className="mx-1 h-4 w-px bg-[#c5c0b1]" aria-hidden />
        <EditorButton title="清除格式" onClick={() => exec("removeFormat")}>
          <RemoveFormatting className="h-3.5 w-3.5" />
        </EditorButton>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={sync}
        role="textbox"
        aria-label="邮件正文"
        aria-multiline="true"
        className={cn(EDITOR_BODY_CLASSES, "outline-none focus:bg-[#fffefb]")}
      />
    </div>
  );
}

function EditorButton({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      unstyled
      type="button"
      title={title}
      aria-label={title}
      // preventDefault 保住选区，否则点工具栏会丢失光标选择。
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#36342e] transition-colors hover:bg-[#eceae3] hover:text-[#201515]"
    >
      {children}
    </Button>
  );
}
