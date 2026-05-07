"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
} from "react";
import {
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  MessageSquareHeart,
  Paperclip,
  Sparkles,
  Star,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

// 反馈聚焦的功能模块：和左侧导航的主线保持一致，方便我们后续做漏斗分析。
const FEEDBACK_TOPICS = [
  { id: "similar", label: "找相似" },
  { id: "discovery", label: "博主发现" },
  { id: "library", label: "博主库" },
  { id: "project", label: "项目管理" },
  { id: "feature-wish", label: "功能许愿" },
  { id: "other", label: "其他" },
] as const;

type FeedbackAttachment = {
  id: string;
  file: File;
};

interface Props {
  // 由父组件 mount/unmount 控制开合，组件内部不再持有 open 状态——
  // 这样关闭再打开时所有评分/草稿会重新初始化，避免脏数据。
  onClose: () => void;
}

export function FeedbackDialog({ onClose }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const [rating, setRating] = useState(0);
  const [topic, setTopic] = useState<string>("discovery");
  const [comment, setComment] = useState("");
  const [attachments, setAttachments] = useState<FeedbackAttachment[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ESC 关闭。
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const canSubmit = rating > 0 || comment.trim().length > 0 || attachments.length > 0;

  function addAttachments(files: File[] | FileList) {
    const nextFiles = Array.from(files).filter((file) => file.size > 0);
    if (nextFiles.length === 0) return;

    setAttachments((prev) => [
      ...prev,
      ...nextFiles.map((file) => ({
        id: createAttachmentId(file),
        file,
      })),
    ]);
  }

  function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    if (event.currentTarget.files) {
      addAttachments(event.currentTarget.files);
      event.currentTarget.value = "";
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const imageFiles = Array.from(event.clipboardData.items)
      .filter((item) => item.kind === "file")
      .flatMap((item) => {
        const file = item.getAsFile();
        return file && file.type.startsWith("image/") ? [file] : [];
      });

    if (imageFiles.length === 0) return;

    event.preventDefault();
    addAttachments(imageFiles);
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    if (!hasDraggedFiles(event)) return;
    event.preventDefault();
    dragDepthRef.current += 1;
    setDragActive(true);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (!hasDraggedFiles(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setDragActive(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (!hasDraggedFiles(event)) return;
    event.preventDefault();
    dragDepthRef.current -= 1;
    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0;
      setDragActive(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    if (!hasDraggedFiles(event)) return;
    event.preventDefault();
    dragDepthRef.current = 0;
    setDragActive(false);
    addAttachments(event.dataTransfer.files);
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((attachment) => attachment.id !== id));
  }

  function handleSubmit() {
    if (!canSubmit) return;
    setSubmitted(true);
    // 真实接口接入前先用本地反馈兜住交互，避免按钮按下去毫无回应。
    window.setTimeout(onClose, 1600);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#201515]/40 px-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative w-full max-w-[560px] rounded-2xl border border-[#c5c0b1] bg-[#fffefb] p-6"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-dialog-title"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭"
          className="absolute top-4 right-4 inline-flex h-7 w-7 items-center justify-center rounded-full text-[#939084] transition-colors hover:bg-[#eceae3] hover:text-[#201515]"
        >
          <X className="h-4 w-4" />
        </button>

        {submitted ? (
          <SubmittedPanel />
        ) : (
          <>
            <Header />

            <div className="mt-5">
              <p className="mb-2 text-[12px] font-medium text-[#36342e]">最想说的部分</p>
              <div className="-mx-0.5 flex flex-nowrap gap-1.5 overflow-x-auto px-0.5 pb-1">
                {FEEDBACK_TOPICS.map((t) => {
                  const active = topic === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTopic(t.id)}
                      className={cn(
                        "shrink-0 rounded-full border px-3 py-1 text-[12px] whitespace-nowrap transition-colors",
                        active
                          ? "border-[#ff4f00] bg-[#fff7f4] text-[#ff4f00]"
                          : "border-[#c5c0b1] bg-[#fffefb] text-[#36342e] hover:border-[#b5b2aa] hover:bg-[#fffdf9]",
                      )}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3">
                <StarPicker value={rating} onChange={setRating} />
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-[12px] font-medium text-[#36342e]">
                想吐槽或想夸的，都说说看
              </p>
              <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "relative rounded-xl border bg-[#fffdf9] transition-colors",
                  dragActive ? "border-[#ff4f00] bg-[#fff7f4]" : "border-[#c5c0b1]",
                )}
              >
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  onPaste={handlePaste}
                  rows={4}
                  maxLength={500}
                  placeholder="比如：AI 推荐的博主匹配度怎么样？建联流程顺不顺？还有什么功能你希望我们做？"
                  className="block min-h-[120px] w-full resize-y rounded-xl bg-transparent px-3 py-2.5 text-[13px] leading-[1.55] text-[#201515] placeholder:text-[#939084] focus:outline-none"
                />
                {dragActive ? (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl border border-dashed border-[#ff4f00] bg-[#fff7f4]/90 text-[12px] font-medium text-[#ff4f00]">
                    松开添加附件
                  </div>
                ) : null}
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFilesSelected}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex h-7 items-center gap-1.5 rounded-full border border-[#c5c0b1] bg-[#fffefb] px-2.5 text-[11px] text-[#36342e] transition-colors hover:border-[#ff4f00] hover:bg-[#fff7f4] hover:text-[#ff4f00]"
                >
                  <Paperclip className="h-3 w-3" />
                  添加附件
                </button>
                <div className="text-right text-[11px] text-[#939084]">{comment.length}/500</div>
              </div>
              {attachments.length > 0 ? (
                <AttachmentList attachments={attachments} onRemove={removeAttachment} />
              ) : null}
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="flex items-center gap-1.5 text-[11px] text-[#939084]">
                <Sparkles className="h-3 w-3 text-[#ff4f00]" />
                我们会认真读完每一条反馈
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-[#c5c0b1] bg-[#fffefb] px-3.5 py-1.5 text-[12px] text-[#36342e] transition-colors hover:bg-[#fffdf9]"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors",
                    canSubmit
                      ? "bg-[#ff4f00] text-[#fffefb] hover:bg-[#ff4f00]"
                      : "bg-[#c5c0b1] text-[#939084]",
                  )}
                >
                  发送反馈
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function hasDraggedFiles(event: DragEvent<HTMLDivElement>) {
  return Array.from(event.dataTransfer.types).includes("Files");
}

function createAttachmentId(file: File) {
  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${file.name}-${file.size}-${file.lastModified}-${randomId}`;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

function AttachmentList({
  attachments,
  onRemove,
}: {
  attachments: FeedbackAttachment[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {attachments.map((attachment) => (
        <AttachmentItem key={attachment.id} attachment={attachment} onRemove={onRemove} />
      ))}
    </div>
  );
}

function AttachmentItem({
  attachment,
  onRemove,
}: {
  attachment: FeedbackAttachment;
  onRemove: (id: string) => void;
}) {
  const { file } = attachment;
  const image = isImageFile(file);
  const [previewUrl] = useState(() => (image ? URL.createObjectURL(file) : ""));
  const fileName = file.name || "图片";

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-lg border border-[#eceae3] bg-[#fffdf9] py-1 pr-1.5 pl-1 text-[11px] text-[#36342e]">
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#eceae3] bg-[#fffefb] text-[#939084]">
        {image && previewUrl ? (
          <span
            aria-hidden
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${previewUrl})` }}
          />
        ) : image ? (
          <ImageIcon className="h-3.5 w-3.5" />
        ) : (
          <FileText className="h-3.5 w-3.5" />
        )}
      </span>
      <span className="max-w-[190px] min-w-0">
        <span className="block truncate" title={fileName}>
          {fileName}
        </span>
        <span className="block text-[10px] text-[#939084]">{formatFileSize(file.size)}</span>
      </span>
      <button
        type="button"
        aria-label={`移除附件 ${fileName}`}
        onClick={() => onRemove(attachment.id)}
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[#939084] transition-colors hover:bg-[#eceae3] hover:text-[#36342e]"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function Header() {
  return (
    <div className="mb-4 pr-7">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#fff7f4]">
          <MessageSquareHeart className="h-4 w-4 text-[#ff4f00]" />
        </span>
        <h2 id="feedback-dialog-title" className="text-[14px] font-semibold text-[#201515]">
          聊聊你用 Linkr 的感受
        </h2>
      </div>
      <p className="text-[12px] leading-[1.55] text-[#939084]">
        哪里好用、哪里别扭、还差点什么，都告诉我们。
      </p>
    </div>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(value === n ? 0 : n)}
            aria-label={`${n} 星`}
            className="rounded-md p-1 transition-colors hover:bg-[#fffdf9]"
          >
            <Star
              className={cn(
                "h-6 w-6 transition-colors",
                filled ? "text-[#ff4f00]" : "text-[#b5b2aa]",
              )}
              fill={filled ? "#ff4f00" : "none"}
            />
          </button>
        );
      })}
      <span className="ml-2 text-[12px] text-[#939084]">{ratingHint(value)}</span>
    </div>
  );
}

function ratingHint(value: number) {
  if (value === 0) return "点星打分";
  if (value <= 2) return "我们改";
  if (value === 3) return "中规中矩";
  if (value === 4) return "用得顺手";
  return "继续推荐给朋友";
}

function SubmittedPanel() {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#fff7f4]">
        <CheckCircle2 className="h-6 w-6 text-[#ff4f00]" />
      </span>
      <h3 className="text-[15px] font-semibold text-[#201515]">反馈已收到</h3>
      <p className="max-w-[280px] text-[12px] leading-[1.6] text-[#939084]">
        谢谢你帮 Linkr 长大。我们会把这条反馈分发给对应的产品同学，必要时会通过站内通知联系你。
      </p>
    </div>
  );
}
