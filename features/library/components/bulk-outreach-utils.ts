// 批量建联弹窗的纯函数工具——把占位符插值、定时时间默认值、附件大小格式化
// 等无副作用的逻辑从主组件抽出来，方便单元测试。

import type { Creator } from "@/types/api";

// 把模板里的 {{handle}} / {{name}} / {{platform}} 占位符按一位收件人填充。
// 仅用于本地预览；批量发送时由后端按收件人逐封替换。
export function interpolate(text: string, creator: Creator): string {
  return text
    .replace(/\{\{handle\}\}/g, creator.handle)
    .replace(/\{\{name\}\}/g, creator.name)
    .replace(/\{\{platform\}\}/g, creator.platform);
}

// 默认时间：当前时间 + 2 小时，向上对齐到 15 分钟。
// 输出 datetime-local 输入框需要的本地时间字符串（YYYY-MM-DDTHH:mm）。
export function getDefaultScheduleAt(): string {
  const date = new Date();
  date.setHours(date.getHours() + 2);
  date.setMinutes(Math.ceil(date.getMinutes() / 15) * 15, 0, 0);
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join("T");
}

export function formatScheduleLabel(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}
