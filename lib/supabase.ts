// Supabase 客户端封装
// Phase 0 安装 @supabase/supabase-js 后启用。
// 现在先用环境变量占位。

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

// TODO: 安装依赖后启用
// import { createClient } from "@supabase/supabase-js";
// export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
