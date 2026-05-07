"use client";

import { useState } from "react";

// §3.6.6 团队管理 — placeholder. Sub-item visible in sidebar so users know
// the surface is on the roadmap, but the underlying feature is unbuilt.
export function TeamTab() {
  const [sent, setSent] = useState(false);
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
      <p className="text-sm text-[#939084]">本功能正在开发中</p>
      {sent ? (
        <p className="mt-5 text-sm text-[#36342e]">我们已收到你的建议，敬请期待。</p>
      ) : (
        <button
          type="button"
          onClick={() => setSent(true)}
          className="mt-5 rounded-xl border border-[#c5c0b1] bg-[#fffefb] px-5 py-2 text-sm text-[#36342e] hover:bg-[#eceae3]"
        >
          求解锁
        </button>
      )}
    </div>
  );
}
