import type { AudienceProfile } from "@/types/api";

// 年龄分布柱状图：每段年龄都给出男女双柱。
export function AgeCard({
  buckets,
  age17PlusShare,
}: {
  buckets: AudienceProfile["ageBuckets"];
  age17PlusShare: number;
}) {
  // y 轴最大值：所有柱子里的最大值，做归一化。
  const max = Math.max(0.001, ...buckets.flatMap((b) => [b.female, b.male]));
  return (
    <div className="rounded-2xl border border-[#c5c0b1] bg-[#fffefb] p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[13px] font-semibold text-[#201515]">年龄统计</p>
        <p className="text-[10px] text-[#939084]">
          大于 17 年龄
          <span className="ml-1 font-medium text-[#36342e]">
            {(age17PlusShare * 100).toFixed(1)}%
          </span>
        </p>
      </div>

      <div className="mt-3 flex items-center gap-3 text-[11px]">
        <Legend dot="#ff4f00" label="女性" />
        <Legend dot="#2f6bff" label="男性" />
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {buckets.map((bucket) => (
          <BucketColumn key={bucket.range} bucket={bucket} max={max} />
        ))}
      </div>
    </div>
  );
}

function BucketColumn({
  bucket,
  max,
}: {
  bucket: AudienceProfile["ageBuckets"][number];
  max: number;
}) {
  const fHeight = (bucket.female / max) * 100;
  const mHeight = (bucket.male / max) * 100;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex h-24 w-full items-end justify-center gap-0.5">
        <Bar pct={fHeight} value={bucket.female} color="#ff4f00" />
        <Bar pct={mHeight} value={bucket.male} color="#2f6bff" />
      </div>
      <p className="text-[10px] text-[#939084]">{bucket.range}</p>
    </div>
  );
}

function Bar({ pct, value, color }: { pct: number; value: number; color: string }) {
  return (
    <div className="relative flex w-3 flex-col items-center justify-end">
      <span className="absolute -top-3 text-[9px] text-[#36342e] tabular-nums">
        {(value * 100).toFixed(1)}%
      </span>
      <div
        className="w-full rounded-t-full"
        style={{ height: `${Math.max(2, pct)}%`, background: color }}
      />
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-2 w-2 rounded-full" style={{ background: dot }} />
      <span className="text-[#36342e]">{label}</span>
    </span>
  );
}
