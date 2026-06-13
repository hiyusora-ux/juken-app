// Vercel Serverless Function: Anthropic Messages API proxy
// クライアントから送られたペイロード（messages, model, tools等）をそのまま転送し、
// APIキーだけサーバー側で付与する。これによりキーがブラウザに露出しない。
export const config = { runtime: "nodejs", maxDuration: 30 };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "サーバー設定エラー：ANTHROPIC_API_KEY が未設定です" });
  }
  try {
    const body = req.body || {};
    // モデルが未指定なら既定値を入れる
    if (!body.model) body.model = "claude-sonnet-4-6";
    if (!body.max_tokens) body.max_tokens = 1024;
    // web_search ツールが含まれている場合のために、anthropic-beta は付けない（最新APIは不要）

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (!r.ok) {
      const msg = (data && data.error && data.error.message) || "AIサービスでエラーが発生しました";
      return res.status(r.status).json({ error: msg });
    }
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: "サーバーエラー：" + (e.message || "unknown") });
  }
}
