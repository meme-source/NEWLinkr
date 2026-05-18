// 统一 Project 模型 ↔ 插件端 ProjectSummary 视图之间的映射。
//
// 插件端创建项目时：先走统一核心 createProject() 拿到完整 Project，
// 再用 toProjectSummary() 投影成插件 UI 用的稀疏形状。这样插件「新建项目」
// 和网页端、discovery 的创建走的是同一条逻辑，只是展示视图不同。

import type { ProjectSummary } from "@/features/plugin/types";
import type { Project } from "@/features/project/lib/project-model";

// 把完整 Project 投影成插件端的 ProjectSummary。
// createdLabel 是插件列表的友好展示文案，不属于统一模型，由调用方传入。
export function toProjectSummary(project: Project, createdLabel: string): ProjectSummary {
  return {
    id: project.id,
    name: project.name,
    productDescription: project.productDescription,
    createdAt: project.createdAt,
    createdLabel,
    uploadedListNames: project.uploadedListNames,
  };
}
