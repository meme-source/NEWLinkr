// Anthropic Claude API 封装 —— 用于产品解析、场景推荐
// Phase 2 启用。

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";

export async function callClaude(prompt: string): Promise<string> {
  // TODO: Phase 2 实现
  // 安装 @anthropic-ai/sdk 后：
  // const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  // const res = await client.messages.create({
  //   model: "claude-sonnet-4-6",
  //   max_tokens: 1024,
  //   messages: [{ role: "user", content: prompt }],
  // });
  // return res.content[0].type === "text" ? res.content[0].text : "";
  void ANTHROPIC_API_KEY;
  void prompt;
  return "";
}
