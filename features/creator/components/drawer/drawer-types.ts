// 抽屉对外契约。
//
// 2026-05-07 (a)：抽屉已收敛到 "Creator 单一形态"。
// 旧的 CreatorProfileInput（接受 name/handle/followers/er 字符串 + 可选 creator）
// 被废弃；调用方现在通过 useCreatorProfile().openCreatorProfile() 传 Creator 或
// {id} / {handle, fallback?}，由 features/creator/data/registry.ts 统一解析。
// 抽屉 / 各 Tab 不再处理"降级"分支。
//
// 2026-05-07 (b)：tab 集合从 5-tab（overview/profile/timeline/collaborations/notes）
// 折叠为 4-tab：内容 / 受众 / 合作 / 备注。基础信息、状态、操作、刷新搬到固定 header。

export type DrawerTabId = "content" | "audience" | "collaborations" | "notes";
