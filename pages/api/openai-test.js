export default async function handler(req, res) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ ok: false, error: "OPENAI_API_KEY is missing" });
  }

  try {
    const r = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });

    if (!r.ok) {
      const t = await r.text();
      return res.status(r.status).json({ ok: false, status: r.status, details: t });
    }

    const j = await r.json();
    // モデル一覧の先頭数だけ返す（成功判定用）
    return res.status(200).json({
      ok: true,
      models: j.data?.slice(0, 5).map((m) => m.id)
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
