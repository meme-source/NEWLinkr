import type { EmailTemplateSegment, TemplateVarMap } from "./types";

// `{token}` substitution shared by every surface that renders a template.
// Templates use the single-curly `{name}` form (see features/outreach/data/
// template-vars.ts). Each substituted span carries the var's `personalized`
// flag so the composer can highlight per-creator content.

const TOKEN_PATTERN = /\{([a-z_]+)\}/g;

/**
 * Split `text` on `{token}` placeholders and substitute known tokens.
 * Unknown tokens are left verbatim. Adjacent plain spans are kept separate;
 * that does not affect rendering.
 */
export function renderTemplateSegments(text: string, vars: TemplateVarMap): EmailTemplateSegment[] {
  const segments: EmailTemplateSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(TOKEN_PATTERN)) {
    const matchIndex = match.index ?? 0;
    if (matchIndex > lastIndex) {
      segments.push({ text: text.slice(lastIndex, matchIndex) });
    }

    const resolved = vars[match[1]];
    if (resolved) {
      segments.push({ text: resolved.value, personalized: resolved.personalized });
    } else {
      // Unknown token — leave the literal `{token}` so it is visible, not dropped.
      segments.push({ text: match[0] });
    }

    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex) });
  }

  return segments.filter((segment) => segment.text.length > 0);
}
