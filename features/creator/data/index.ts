// Creator 数据门面（facade）。
//
// UI / service 层只通过本文件取博主数据，背后是 mock 还是真实 API 由环境变量切换。
// 上线时设置 NEXT_PUBLIC_USE_MOCK=false，buildMockCreators 不再被调用，
// 整个 mock.ts 可直接删除。

import type { Creator } from "@/types/api";
import { buildMockCreators } from "./mock";

export function getCreators(): Creator[] {
  if (process.env.NEXT_PUBLIC_USE_MOCK === "false") {
    // 生产：返回空，让 service 层走真实 API；UI 自己处理空状态。
    return [];
  }
  return buildMockCreators();
}
