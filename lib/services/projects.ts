// 项目服务层
//
// Phase 1 会接 Supabase Auth + DB。当前实现保持与原 stub 等价：
// listProjects 返回空数组，createProject 返回 stub 标记。

import type { CreateProjectInput, Project } from "@/types/api";

export async function listProjects(): Promise<Project[]> {
  // TODO Phase 1: 接 Supabase Auth 取 user_id，从 DB 查
  return [];
}

export type CreateProjectResult = {
  message: string;
  input: CreateProjectInput;
};

export async function createProject(input: CreateProjectInput): Promise<CreateProjectResult> {
  // TODO Phase 1: 写入数据库并返回创建后的 Project（含 id / createdAt）。
  return { message: "TODO: 实现创建项目", input };
}
