import type { Creator } from "@/types/api";

const YEAR_PREFIX = "year:";
const MONTH_PREFIX = "month:";

export type CollaborationTimeOption = {
  value: string;
  label: string;
};

type YearMonth = {
  year: string;
  month: string;
};

export const COLLABORATION_MONTH_OPTIONS: CollaborationTimeOption[] = Array.from(
  { length: 12 },
  (_, index) => {
    const month = String(index + 1).padStart(2, "0");
    return { value: `${MONTH_PREFIX}${month}`, label: `${index + 1} 月` };
  },
);

export function buildCollaborationYearOptions(creators: Creator[]): CollaborationTimeOption[] {
  const years = new Set<string>();
  creators.forEach((creator) => {
    const parts = parseYearMonth(creator.lastContactAt);
    if (parts) years.add(parts.year);
  });

  return Array.from(years)
    .sort((a, b) => Number(b) - Number(a))
    .map((year) => ({ value: `${YEAR_PREFIX}${year}`, label: `${year} 年` }));
}

export function matchCollaborationTime(creator: Creator, selectedValues: readonly string[]) {
  if (selectedValues.length === 0) return true;

  const selectedYears = selectedValues
    .filter((value) => value.startsWith(YEAR_PREFIX))
    .map((value) => value.slice(YEAR_PREFIX.length));
  const selectedMonths = selectedValues
    .filter((value) => value.startsWith(MONTH_PREFIX))
    .map((value) => value.slice(MONTH_PREFIX.length));

  const parts = parseYearMonth(creator.lastContactAt);
  if (!parts) return false;

  if (selectedYears.length > 0 && !selectedYears.includes(parts.year)) return false;
  if (selectedMonths.length > 0 && !selectedMonths.includes(parts.month)) return false;
  return true;
}

function parseYearMonth(value: string | null): YearMonth | null {
  if (!value) return null;

  const match = /^(\d{4})-(\d{2})/.exec(value);
  if (match) {
    return { year: match[1], month: match[2] };
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return {
    year: String(date.getFullYear()),
    month: String(date.getMonth() + 1).padStart(2, "0"),
  };
}
