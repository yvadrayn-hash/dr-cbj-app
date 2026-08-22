import OpenAI from "openai";

const key = process.env.OPENROUTER_API_KEY;
if (!key) {
  console.log("NO_KEY");
  process.exit(0);
}

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: key,
  defaultHeaders: {
    "X-OpenRouter-Title": "DrCBJ-Diag",
    "HTTP-Referer": "https://www.drcbjwellness.com",
  },
});

for (const model of ["openrouter/auto", "openai/gpt-4o-mini"]) {
  try {
    const r = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: "say ok" }],
      max_tokens: 5,
    });
    console.log(
      "OK model=" + model,
      "choices=" + r.choices.length,
      "content=" + (r.choices[0]?.message?.content || "").slice(0, 20)
    );
  } catch (e) {
    const status = e.status ?? (e.statusCode ? e.statusCode : "?");
    const code = e.code || e.errno || "?";
    const msg = (e.message || "").slice(0, 200);
    console.log(
      "ERR model=" + model,
      "type=" + (e.name || e.constructor.name),
      "status=" + status,
      "code=" + code,
      "msg=" + msg
    );
  }
}
