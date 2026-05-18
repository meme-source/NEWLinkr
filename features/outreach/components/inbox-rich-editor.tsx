"use client";

import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Baseline,
  Bold,
  Highlighter,
  Image as ImageIcon,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link2,
  List,
  ListOrdered,
  Redo2,
  RemoveFormatting,
  Stamp,
  Undo2,
} from "lucide-react";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  ColorDropdown,
  TableDropdown,
  VariableDropdown,
} from "@/features/outreach/components/inbox-editor-dropdowns";

// §3.4.4: contentEditable + execCommand keeps the rich-editor self-contained
// for the Phase-0 prototype. When we introduce a backend-backed mail composer
// we'll swap this for a managed editor (Lexical / Tiptap) without changing the
// public props.
const HIGHLIGHT_COLORS: ReadonlyArray<{ label: string; value: string }> = [
  { label: "黄", value: "#eceae3" },
  { label: "绿", value: "#eceae3" },
  { label: "粉", value: "#eceae3" },
  { label: "蓝", value: "#eceae3" },
  { label: "橙", value: "#fff7f4" },
  { label: "灰", value: "#eceae3" },
  { label: "无", value: "transparent" },
];

const TEXT_COLORS: ReadonlyArray<string> = [
  "#201515",
  "#ff4f00",
  "#ff4f00",
  "#36342e",
  "#36342e",
  "#36342e",
  "#36342e",
  "#b00020",
];

const SIGNATURE_HTML =
  '<div><br></div><div>—</div><div>{my_name}</div><div style="color:#939084;font-size:12px;">{brand_name} · {project_name}</div>';

interface RichEmailEditorProps {
  defaultHtml?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
}

export function RichEmailEditor({
  defaultHtml = "",
  onChange,
  placeholder = "回复...",
}: RichEmailEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [initial] = useState(defaultHtml);
  const [isEmpty, setIsEmpty] = useState(!defaultHtml);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    el.innerHTML = initial;
    setIsEmpty(el.textContent === "");
    document.execCommand("styleWithCSS", false, "true");
  }, [initial]);

  const sync = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    onChange?.(el.innerHTML);
    setIsEmpty(el.textContent === "");
  }, [onChange]);

  const exec = useCallback(
    (command: string, value?: string) => {
      editorRef.current?.focus();
      document.execCommand(command, false, value);
      sync();
    },
    [sync],
  );

  const insertHtml = useCallback(
    (html: string) => {
      editorRef.current?.focus();
      document.execCommand("insertHTML", false, html);
      sync();
    },
    [sync],
  );

  const handleLink = useCallback(() => {
    const url = window.prompt("链接 URL");
    if (url) exec("createLink", url);
  }, [exec]);

  const handleImage = useCallback(() => {
    const url = window.prompt("图片 URL");
    if (url) exec("insertImage", url);
  }, [exec]);

  return (
    <div className="flex flex-col rounded-lg border border-[#c5c0b1] bg-[#fffefb]">
      <Toolbar
        onCommand={exec}
        onInsertHtml={insertHtml}
        onLink={handleLink}
        onImage={handleImage}
      />
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={sync}
          aria-label="邮件正文"
          role="textbox"
          className="min-h-[120px] px-3 py-2.5 text-sm leading-relaxed text-[#201515] focus:outline-none [&_a]:text-[#ff4f00] [&_a]:underline [&_img]:max-w-full [&_table]:my-2 [&_table]:border-collapse [&_td]:border [&_td]:border-[#c5c0b1] [&_td]:px-2 [&_td]:py-1"
        />
        {isEmpty ? (
          <p className="pointer-events-none absolute top-2.5 left-3 text-sm text-[#939084]">
            {placeholder}
          </p>
        ) : null}
      </div>
    </div>
  );
}

interface ToolbarProps {
  onCommand: (command: string, value?: string) => void;
  onInsertHtml: (html: string) => void;
  onLink: () => void;
  onImage: () => void;
}

function Toolbar({ onCommand, onInsertHtml, onLink, onImage }: ToolbarProps) {
  const clearFormatting = useCallback(() => {
    onCommand("removeFormat");
    onCommand("unlink");
  }, [onCommand]);

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-t-lg border-b border-[#c5c0b1] bg-[#fffdf9] px-2 py-1.5">
      <ToolButton title="撤销" onClick={() => onCommand("undo")}>
        <Undo2 className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton title="重做" onClick={() => onCommand("redo")}>
        <Redo2 className="h-3.5 w-3.5" />
      </ToolButton>
      <Divider />
      <ToolButton title="清除格式" onClick={clearFormatting}>
        <RemoveFormatting className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton title="加粗" onClick={() => onCommand("bold")}>
        <Bold className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton title="斜体" onClick={() => onCommand("italic")}>
        <Italic className="h-3.5 w-3.5" />
      </ToolButton>
      <ColorDropdown
        title="高亮颜色"
        icon={<Highlighter className="h-3.5 w-3.5" />}
        colors={HIGHLIGHT_COLORS}
        onPick={(c) => onCommand("hiliteColor", c)}
      />
      <ColorDropdown
        title="文字颜色"
        icon={<Baseline className="h-3.5 w-3.5" />}
        colors={TEXT_COLORS.map((value) => ({ label: value, value }))}
        onPick={(c) => onCommand("foreColor", c)}
      />
      <Divider />
      <VariableDropdown onPick={(token) => onInsertHtml(token)} />
      <Divider />
      <ToolButton title="左对齐" onClick={() => onCommand("justifyLeft")}>
        <AlignLeft className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton title="居中" onClick={() => onCommand("justifyCenter")}>
        <AlignCenter className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton title="右对齐" onClick={() => onCommand("justifyRight")}>
        <AlignRight className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton title="两端对齐" onClick={() => onCommand("justifyFull")}>
        <AlignJustify className="h-3.5 w-3.5" />
      </ToolButton>
      <Divider />
      <ToolButton title="无序列表" onClick={() => onCommand("insertUnorderedList")}>
        <List className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton title="有序列表" onClick={() => onCommand("insertOrderedList")}>
        <ListOrdered className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton title="减少缩进" onClick={() => onCommand("outdent")}>
        <IndentDecrease className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton title="增加缩进" onClick={() => onCommand("indent")}>
        <IndentIncrease className="h-3.5 w-3.5" />
      </ToolButton>
      <Divider />
      <ToolButton title="插入链接" onClick={onLink}>
        <Link2 className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton title="插入图片" onClick={onImage}>
        <ImageIcon className="h-3.5 w-3.5" />
      </ToolButton>
      <TableDropdown onPick={(rows, cols) => onInsertHtml(buildTableHtml(rows, cols))} />
      <ToolButton title="插入签名" onClick={() => onInsertHtml(SIGNATURE_HTML)}>
        <Stamp className="h-3.5 w-3.5" />
      </ToolButton>
    </div>
  );
}

interface ToolButtonProps {
  title: string;
  onClick: () => void;
  children: ReactNode;
}

function ToolButton({ title, onClick, children }: ToolButtonProps) {
  return (
    <Button
      unstyled
      type="button"
      title={title}
      aria-label={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded text-[#36342e] transition-colors hover:bg-[#eceae3] hover:text-[#201515]"
    >
      {children}
    </Button>
  );
}

function Divider() {
  return <span className="mx-1 h-4 w-px bg-[#c5c0b1]" aria-hidden />;
}

function buildTableHtml(rows: number, cols: number): string {
  const row =
    "<tr>" +
    Array.from({ length: cols })
      .map(() => "<td>&nbsp;</td>")
      .join("") +
    "</tr>";
  const body = Array.from({ length: rows })
    .map(() => row)
    .join("");
  return `<table>${body}</table><div><br></div>`;
}
