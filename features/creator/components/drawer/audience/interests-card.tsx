import type { AudienceProfile } from "@/types/api";

const INTEREST_PALETTE = ["#2f4eb0", "#3a7bd5", "#5fb7d4", "#7fcccc", "#0a5d6a"];

// 兴趣与情感：左侧 donut + 右侧分类列表（参考截图）。
export function InterestsCard({ interests }: { interests: AudienceProfile["interests"] }) {
  if (interests.length === 0) return null;
  const segments = interests.reduce<
    {
      name: string;
      description: string;
      share: number;
      color: string;
      start: number;
      end: number;
    }[]
  >((acc, interest, idx) => {
    const start = acc.length === 0 ? 0 : acc[acc.length - 1].end;
    const end = start + interest.share * 360;
    acc.push({
      ...interest,
      color: INTEREST_PALETTE[idx % INTEREST_PALETTE.length],
      start,
      end,
    });
    return acc;
  }, []);
  const gradient = segments.map((s) => `${s.color} ${s.start}deg ${s.end}deg`).join(", ");

  return (
    <div className="rounded-2xl border border-[#c5c0b1] bg-[#fffefb] p-4">
      <p className="text-[13px] font-semibold text-[#201515]">兴趣与情感</p>
      <div className="mt-3 grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
        <div className="relative mx-auto h-32 w-32">
          <div
            className="h-full w-full rounded-full"
            style={{ background: `conic-gradient(${gradient})` }}
            aria-hidden
          />
          <div className="absolute inset-3 rounded-full bg-[#fffefb]" aria-hidden />
        </div>

        <ul className="space-y-2">
          {segments.map((s) => (
            <li key={s.name} className="flex items-start gap-2 text-[12px]">
              <span
                className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ background: s.color }}
              />
              <span className="w-14 shrink-0 font-medium text-[#201515]">{s.name}</span>
              <span className="min-w-0 flex-1 text-[#939084]">{s.description}</span>
              <span className="shrink-0 text-[#36342e] tabular-nums">
                {(s.share * 100).toFixed(0)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
