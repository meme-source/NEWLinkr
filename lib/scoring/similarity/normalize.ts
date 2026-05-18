// 0-100 → 0-5.0 显示制映射（spec §4.2.0）。
//
// 内部计算保持 0-100 整数（精度足够、便于排序与门槛判断），对外展示统一
// 除以 20，保留 1 位小数。用户感知"评价感"（≈ IMDB / 大众点评 4.4/5）而
// 不是"考试感"。所有边界处理在这一个文件里收敛。

export const INTERNAL_MAX = 100;
export const DISPLAY_MAX = 5.0;
export const DISPLAY_DECIMALS = 1;

export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

// 把任意分量裁到 [0, 100] 整数。subscore 子模块都用这一个出口，避免每个
// 模块单独做边界处理。
export function toInternalScore(raw: number): number {
  return Math.round(clamp(raw, 0, INTERNAL_MAX));
}

// 0-100 → 0-5.0（1 位小数）。
export function toDisplayScore(internal: number): number {
  const bounded = clamp(internal, 0, INTERNAL_MAX);
  return Math.round((bounded / 20) * 10) / 10;
}

// 加权聚合：weights 已经在 weights.ts 中保证总和为 100。
// values 与 weights 同 keys；缺失的 key 当作 0 分处理。
export function weightedAggregate<K extends string>(
  values: Record<K, number>,
  weights: Record<K, number>,
): number {
  let total = 0;
  let weightSum = 0;
  for (const key of Object.keys(weights) as K[]) {
    const w = weights[key];
    const v = values[key] ?? 0;
    total += clamp(v, 0, INTERNAL_MAX) * w;
    weightSum += w;
  }
  if (weightSum === 0) return 0;
  return toInternalScore(total / weightSum);
}
