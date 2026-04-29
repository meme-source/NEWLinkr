import {
  noteTagPresets,
  tagToneOrder,
} from "@/features/plugin/data/projects";
import type { TagTone } from "@/features/plugin/types";

export function getTagTone(label: string): TagTone {
  const preset = noteTagPresets.find(
    (item) => item.label.toLowerCase() === label.toLowerCase(),
  );
  if (preset) {
    return preset.tone;
  }

  const hash = Array.from(label).reduce(
    (total, char) => total + char.charCodeAt(0),
    0,
  );
  return tagToneOrder[hash % tagToneOrder.length];
}

export function getTagChipClasses(tone: TagTone) {
  switch (tone) {
    case "amber":
      return "border-amber-300/45 bg-amber-50 text-amber-800 hover:bg-amber-100";
    case "blue":
      return "border-sky-300/45 bg-sky-50 text-sky-800 hover:bg-sky-100";
    case "emerald":
      return "border-emerald-300/45 bg-emerald-50 text-emerald-800 hover:bg-emerald-100";
    case "violet":
      return "border-violet-300/45 bg-violet-50 text-violet-800 hover:bg-violet-100";
    case "rose":
      return "border-rose-300/45 bg-rose-50 text-rose-800 hover:bg-rose-100";
    default:
      return "border-[#e8e6dc] bg-white text-[#4d4c48] hover:bg-[#f5f4ed]";
  }
}
