// Back-compat shim：博主库内现有 import 仍然走这里。
// 真正的实现统一在 features/creator/components/collaboration-status-cell.tsx，
// 配色 / 文案 / 顺序由 lib/creator.ts 集中维护。
export { CollaborationStatusCell as LibraryStatusCell } from "@/features/creator/components/collaboration-status-cell";
export { COLLABORATION_STATUS_LABEL as STATUS_LABEL } from "@/lib/creator";
