"use client";

import { useEffect, useRef } from "react";

import type { SimilarEntry } from "@/lib/discovery/similar-url";

// /workspace/discovery 接收来自插件 / 抽屉「找相似」深链时解出的入参。
// 与 lib/discovery/similar-url.ts 的 schema 对齐。
export interface SimilarDeeplinkPayload {
  entry: Extract<SimilarEntry, "quick-screen" | "sequential-screen">;
  seedId: string;
  seedHandle: string;
  seedName: string;
  platform: string;
  countries: string[];
  followersPreset: string | null;
  projectId: string | null;
  projectName: string | null;
}

// 一次性消费 URL 中的「找相似」深链，并清掉 query 防止刷新或后退重复触发。
// 调用方在 onConsume 里启动 split-view（同插件端 handleQuickScreen 的语义）。
//
// 直接读 window.location.search 而非 next/navigation 的 useSearchParams，
// 避免触发 App Router 的 Suspense 边界要求；本 hook 只在 mount 时执行一次。
export function useSimilarDeeplink(onConsume: (payload: SimilarDeeplinkPayload) => void): void {
  const consumed = useRef(false);
  const handlerRef = useRef(onConsume);
  handlerRef.current = onConsume;

  useEffect(() => {
    if (consumed.current) return;
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const entry = params.get("entry");
    if (entry !== "quick-screen" && entry !== "sequential-screen") return;

    const seedId = params.get("seedId") ?? params.get("creator");
    const seedHandle = params.get("seedHandle");
    const seedName = params.get("seedName");
    if (!seedId || !seedHandle || !seedName) return;

    consumed.current = true;

    const countriesParam = params.get("countries");
    const payload: SimilarDeeplinkPayload = {
      entry,
      seedId,
      seedHandle,
      seedName,
      platform: params.get("platform") ?? "tiktok",
      countries: countriesParam ? countriesParam.split("|").filter(Boolean) : [],
      followersPreset: params.get("fp"),
      projectId: params.get("projectId"),
      projectName: params.get("projectName"),
    };

    handlerRef.current(payload);

    // 清掉 query。用 replaceState 而非 router.replace，避免触发 Next.js
    // re-render（hook 已 consumed，重渲染也不会再次触发）。
    window.history.replaceState(null, "", "/workspace/discovery");
  }, []);
}
