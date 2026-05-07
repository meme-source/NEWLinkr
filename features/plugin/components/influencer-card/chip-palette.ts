// Influencer-card info pills.
//
// Per docs/DESIGN.md §6.5.1, info pills come in two visual variants — Neutral
// (cream) or Category (light sand). The semantic categorisation here is the
// "Category" variant, since these labels describe creator attributes (price /
// audience / format / visual / niche). The previous six-tone pastel palette
// has been retired: a multi-pastel rotation is incompatible with the warm
// monochrome + Linkr Orange accent system, and §6.5.1 forbids using orange as
// decorative text fill on pills.
//
// `chipToneFor(label)` is kept as the public surface so consumers don't need
// to change. The semantic-rules + hash-rotation logic is intentionally gone —
// every chip resolves to the same Category style for visual consistency.

export type ChipTone = {
  bg: string;
  text: string;
};

const CATEGORY_TONE: ChipTone = {
  bg: "#eceae3",
  text: "#36342e",
} as const;

export function chipToneFor(_label: string): ChipTone {
  return CATEGORY_TONE;
}
