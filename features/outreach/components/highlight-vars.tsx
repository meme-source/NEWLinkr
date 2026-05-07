// Shared rendering helper: replaces literal `{var}` tokens with highlighted
// chips so previews and template bodies stay legible.
export function highlightVars(text: string) {
  return text.split(/(\{[^}]+\})/).map((p, i) =>
    p.startsWith("{") && p.endsWith("}") ? (
      <span key={i} className="rounded bg-[#fff7f4] px-0.5 font-mono text-[11px] text-[#ff4f00]">
        {p}
      </span>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}
