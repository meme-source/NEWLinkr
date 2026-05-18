// 卡片的「维度关系区」(6 信息区里的 C 区)+ 右上角主指标徽章。
//
// 产品决策(2026-05 发现页重构讨论):卡片主指标随维度变,每个维度有自己的
// 「置信度语言」——
//   - competitor → 复刻置信度 + 给哪个竞品拍过
//   - scenario   → 场景适配度 + 达人类型 + 能拍角度 + 还适配哪些场景
//   - trending   → 近期最高播放 + 对标拍法 + 爆款条数 / 时间
//   - lowFollower→ 爆发倍数 + 预估单价 + 爆款是否可复制

import type { CreatorDimensionData, ContentSampleView, OutputCreatorView } from "../v3-view-models";

const BRAND = "#ff4f00";

function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(Math.round(n));
}

/** 右上角主指标徽章 —— 维度专属数字的浓缩。 */
export function dimensionBadge(dd: CreatorDimensionData): { label: string; value: string } {
  switch (dd.kind) {
    case "competitor":
      return { label: "复刻置信度", value: String(dd.replicaConfidence) };
    case "scenario":
      return { label: "场景适配度", value: String(dd.fitScore) };
    case "trending":
      return { label: "近期最高播放", value: compact(dd.peakViews) };
    case "lowFollower":
      return { label: "爆发倍数", value: `${dd.burstMultiple}x` };
  }
}

function ZoneLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1.5 text-[11px] font-semibold tracking-[0.06em] text-[#939084] uppercase">
      {children}
    </div>
  );
}

/** 卡片「维度关系区」—— 回答「为什么是他」,每个维度突出不同的特异字段。 */
export function CardDimensionMetric({ creator }: { creator: OutputCreatorView }) {
  const dd = creator.dimensionData;
  return (
    <div className="mt-3 rounded-lg bg-[#fafaf6] p-3 text-[12.5px] leading-relaxed text-[#36342e]">
      {dd.kind === "competitor" ? (
        <>
          <ZoneLabel>复刻依据</ZoneLabel>
          {dd.collabBrand ? (
            <p>
              已为 <strong style={{ color: BRAND }}>{dd.collabBrand}</strong> 拍过{" "}
              <strong>{dd.collabCount}</strong> 条合作内容，拍法被验证过，可直接复刻。
            </p>
          ) : (
            <p>受众画像与竞品已验证达人高度重合，暂无直接合作样本，建议作为延展候选。</p>
          )}
        </>
      ) : null}

      {dd.kind === "scenario" ? (
        <>
          <ZoneLabel>场景适配</ZoneLabel>
          <p>
            达人类型 <strong>{creator.creatorType}</strong> · 擅长用{" "}
            <strong style={{ color: BRAND }}>{dd.angle}</strong> 的角度拍这个场景。
          </p>
          {dd.alsoFits.length > 0 ? (
            <p className="mt-1 text-[#939084]">也适配：{dd.alsoFits.join(" · ")}</p>
          ) : null}
        </>
      ) : null}

      {dd.kind === "trending" ? (
        <>
          <ZoneLabel>爆款依据</ZoneLabel>
          <p>
            对标拍法 <strong style={{ color: BRAND }}>{dd.formatLabel}</strong>
          </p>
          <p className="mt-1 text-[#5d5a52]">
            {dd.viralCount} 条近期爆款 · 最近一条发布于 {dd.postedAgo}
          </p>
        </>
      ) : null}

      {dd.kind === "lowFollower" ? (
        <>
          <ZoneLabel>性价比</ZoneLabel>
          <p>
            单条最高 <strong>{compact(dd.peakViews)}</strong> ÷ 粉丝 {compact(creator.followers)} ={" "}
            <strong style={{ color: BRAND }}>{dd.burstMultiple}x</strong> 爆发
          </p>
          <p className="mt-1 text-[#5d5a52]">预估单价 {dd.estPrice}</p>
          <p className="mt-1" style={{ color: dd.repeatable ? "#3d8a5a" : "#c98a45" }}>
            {dd.repeatable ? "近期多条爆款，拍法可复制" : "目前仅单条爆款，留意是否偶然"}
          </p>
        </>
      ) : null}
    </div>
  );
}

/** 卡片「内容证据区」(D 区)—— 让用户看到达人到底拍什么。 */
export function ContentSampleStrip({ samples }: { samples: ContentSampleView[] }) {
  if (samples.length === 0) return null;
  return (
    <div className="mt-3">
      <ZoneLabel>近期作品</ZoneLabel>
      <div className="grid grid-cols-3 gap-1.5">
        {samples.map((s) => (
          <div
            key={s.thumbSeed}
            className="relative aspect-[3/4] overflow-hidden rounded-md"
            style={{
              background: `linear-gradient(150deg, hsl(${(s.thumbSeed * 7) % 360} 42% 82%), hsl(${(s.thumbSeed * 7 + 48) % 360} 46% 68%))`,
            }}
          >
            {s.isCollab ? (
              <span className="absolute top-1 left-1 rounded bg-[#ff4f00] px-1 py-[1px] text-[8.5px] font-bold text-white">
                合作
              </span>
            ) : null}
            <span className="absolute bottom-1 left-1 text-[9.5px] font-semibold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
              {s.views}
            </span>
            <span className="absolute right-1 bottom-1 text-[8.5px] text-white/85">
              {s.postedAgo}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
