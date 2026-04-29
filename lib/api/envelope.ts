// API 工具函数 —— 统一返回格式
import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types/api";

export function ok<T>(data: T) {
  return NextResponse.json<ApiResponse<T>>({
    success: true,
    data,
    error: null,
  });
}

export function fail(message: string, status = 400) {
  return NextResponse.json<ApiResponse<null>>(
    { success: false, data: null, error: message },
    { status },
  );
}
