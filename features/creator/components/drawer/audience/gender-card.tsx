import type { AudienceProfile } from "@/types/api";

// 性别分布：用 conic-gradient 渲染一个简化的环状图（无第三方库依赖）。
export function GenderCard({ gender }: { gender: AudienceProfile["gender"] }) {
  const femalePercent = Math.round(gender.female * 1000) / 10;
  const malePercent = Math.round(gender.male * 1000) / 10;
  const female = gender.female * 360;
  return (
    <div className="rounded-2xl border border-[#c5c0b1] bg-[#fffefb] p-4">
      <p className="text-[13px] font-semibold text-[#201515]">性别</p>
      <div className="mt-3 grid grid-cols-[auto_1fr] items-center gap-4">
        <div className="relative h-28 w-28">
          <div
            className="h-full w-full rounded-full"
            style={{
              background: `conic-gradient(#ff4f00 0deg ${female}deg, #2f6bff ${female}deg 360deg)`,
            }}
            aria-hidden
          />
          <div className="absolute inset-3 rounded-full bg-[#fffefb]" aria-hidden />
        </div>
        <div className="space-y-1.5 text-[12px]">
          <Row dot="#ff4f00" label="女性" value={`${femalePercent}%`} />
          <Row dot="#2f6bff" label="男性" value={`${malePercent}%`} />
        </div>
      </div>
      <p className="mt-3 text-[10px] leading-snug text-[#939084]">
        基于网红受众特征 / 区域特点 / 粉丝特点，通过机器算法不断优化估算而得。
      </p>
    </div>
  );
}

function Row({ dot, label, value }: { dot: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2 w-2 rounded-full" style={{ background: dot }} />
      <span className="font-semibold text-[#201515]">{value}</span>
      <span className="text-[#939084]">{label}</span>
    </div>
  );
}
