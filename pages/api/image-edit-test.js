export const config = {
  api: { bodyParser: { sizeLimit: "12mb" } }
};

function dataUrlToBuffer(dataUrl) {
  const match = /^data:(.+);base64,(.*)$/.exec(dataUrl || "");
  if (!match) throw new Error("Invalid dataUrl");
  const mime = match[1];
  const b64 = match[2];
  const buf = Buffer.from(b64, "base64");
  return { mime, buf };
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "OPENAI_API_KEY is missing" });

  try {
    const { imageDataUrl, prompt } = req.body || {};
    if (!imageDataUrl || !prompt) {
      return res.status(400).json({ error: "imageDataUrl and prompt are required" });
    }

    const { mime, buf } = dataUrlToBuffer(imageDataUrl);

    const form = new FormData();
    // ✅ この環境では edits の model は dall-e-2 指定が必要
    form.append("model", "dall-e-2");
    form.append("prompt", prompt);
    form.append("size", "1024x1024");
    form.append("n", "1");
    // ✅ response_format は送らない（Unknown parameter回避）

    const filename =
      mime === "image/png" ? "input.png" : mime === "image/webp" ? "input.webp" : "input.jpg";
    form.append("image", new Blob([buf], { type: mime }), filename);

    const resp = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form
    });

    const text = await resp.text();
    if (!resp.ok) {
      return res.status(resp.status).json({
        error: "OpenAI image edit error",
        status: resp.status,
        details: safeJson(text)
      });
    }

    const json = safeJson(text);

    // 返りが url の場合が多い
    const url = json?.data?.[0]?.url;
    if (url) return res.status(200).json({ ok: true, imageUrl: url, mode: "url" });

    // 念のため b64_json も見ておく
    const b64 = json?.data?.[0]?.b64_json;
    if (b64) return res.status(200).json({ ok: true, imageDataUrl: `data:image/png;base64,${b64}`, mode: "b64_json" });

    return res.status(500).json({ error: "Unexpected response format", raw: json });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
