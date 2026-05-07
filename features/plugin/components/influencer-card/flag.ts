// Strict ISO-2 → flag emoji. The carousel keeps a permissive
// `countryToFlagEmoji` for free-form country names; this is the strict
// variant used after the mapper has already normalised the value.

export function flagFromCode(code?: string): string {
  if (!code || code.length !== 2) return "🏳";
  const upper = code.toUpperCase();
  const A = 0x1f1e6;
  const first = upper.charCodeAt(0) - 65;
  const second = upper.charCodeAt(1) - 65;
  if (first < 0 || first > 25 || second < 0 || second > 25) return "🏳";
  return String.fromCodePoint(A + first, A + second);
}
