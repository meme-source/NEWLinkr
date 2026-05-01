// 达人详情服务层

import { NotFoundError } from "@/lib/api/errors";

export type CreatorDetail = {
  id: string;
  // Phase 1 会扩成完整的 Creator（来自 types/api.ts），加历史帖、邮箱状态等
  message: string;
};

export async function getCreatorDetail(id: string): Promise<CreatorDetail> {
  if (!id || id.trim().length === 0) {
    throw new NotFoundError("Creator id is empty");
  }
  // TODO Phase 1: 从 DB 取，没有则调 provider 拉取后存库；找不到时:
  //   throw new NotFoundError(`Creator ${id} not found`);
  return { id, message: "TODO: 实现达人详情" };
}
