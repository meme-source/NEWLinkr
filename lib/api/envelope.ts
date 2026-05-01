// API utility helpers — uniform response envelope for every route.
import { NextResponse } from "next/server";
import type { ZodError } from "zod";
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

// Format a zod ZodError into the same envelope as `fail`.
// Status defaults to 400 (Bad Request) since validation errors are caller mistakes.
export function failValidation(error: ZodError) {
  const message = error.issues
    .map((issue) => {
      const path = issue.path.join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join("; ");
  return fail(message || "Invalid request body", 400);
}
