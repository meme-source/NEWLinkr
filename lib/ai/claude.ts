// Anthropic Claude API wrapper — used for product parsing, scenario matching, etc.
// Phase 2 placeholder: the real client will live here once @anthropic-ai/sdk is installed.

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export async function callClaude(_prompt: string): Promise<string> {
  // Fail loudly: a silent empty string would let calling code "succeed" with bad data.
  // Replace this body in Phase 2 with a real Anthropic client invocation.
  if (!ANTHROPIC_API_KEY) {
    throw new Error("[stub] callClaude not implemented and ANTHROPIC_API_KEY missing — wire up @anthropic-ai/sdk in Phase 2");
  }
  throw new Error("[stub] callClaude not implemented — wire up @anthropic-ai/sdk in Phase 2");
}
