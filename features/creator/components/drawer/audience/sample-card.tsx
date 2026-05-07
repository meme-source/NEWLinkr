import type { AudienceProfile } from "@/types/api";

// 截图左上角："本次分析数据范围"卡片。
export function SampleCard({ sample }: { sample: AudienceProfile["sample"] }) {
  return (
    <div className="rounded-2xl border border-[#c5c0b1] bg-[#fffefb] p-4">
      <p className="text-[12px] font-medium text-[#201515]">本次分析数据范围</p>
      <p className="mt-0.5 text-[10px] text-[#939084]">展示本次受众分析实际采集到的数据规模。</p>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-[11px]">
        <Cell label="已分析视频数" value={sample.videosAnalyzed.toLocaleString()} />
        <Cell label="采集评论用户数" value={sample.commentersCollected.toLocaleString()} />
        <Cell label="采集粉丝用户数" value={sample.followersCollected.toLocaleString()} />
        <Cell label="参与分析总用户数" value={sample.totalUsers.toLocaleString()} />
      </dl>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#fdf6ee] p-2">
      <p className="text-[10px] text-[#939084]">{label}</p>
      <p className="mt-0.5 text-[14px] font-bold text-[#201515] tabular-nums">{value}</p>
    </div>
  );
}
