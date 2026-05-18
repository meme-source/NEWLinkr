export type TiktokVideoCategory = "viral" | "flop" | "paid" | "shop" | "normal";

export interface TiktokVideoTileProps {
  videoId: string;
  category: TiktokVideoCategory;
  ratio: number;
  durationSec: number;
  ageLabel: string;
  erPct: number;
  plays: number;
  likes: number;
  comments: number;
  showStats?: boolean;
  viralThreshold?: number;
  flopThreshold?: number;
  enabledCategories?: ReadonlySet<TiktokVideoCategory>;
}
