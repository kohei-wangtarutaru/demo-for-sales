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
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OPENAI_API_KEY is missing" });
  }

  try {
    const { imageDataUrl, prompt } = req.body || {};
    if (!imageDataUrl || !prompt) {
      return res.status(400).json({ error: "imageDataUrl and prompt are required" });
    }

    const { mime, buf } = dataUrlToBuffer(imageDataUrl);

    const form = new FormData();

    // ✅ 再生成モデル（image-to-image）
    form.append("model", "gpt-image-1");

    // 強加工のための強め指示
    const finalPrompt = `
以下の画像を参考に、プロが撮り直したように再生成してください。
- 構図を美しく整理
- 光を整え、立体感を強調
- 背景を自然に整理または改善
- SNSで保存される完成度
- 写真としてリアル（AIアート風にしない）
- 元の料理・器の同一性はできるだけ維持

追加指示:
${prompt}
`.trim();

    form.append("prompt", finalPrompt);
    form.append("size", "1024x1024");
    form.append("n", "1");
    form.append("response_format", "b64_json");

    const filename =
      mime === "image/png"
        ? "reference.png"
        : mime === "image/webp"
        ? "reference.webp"
        : "reference.jpg";

    // referenceとして元画像を渡す
    form.append("image[]", new Blob([buf], { type: mime }), filename);

    const resp = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      body: form
    });

    const text = await resp.text();
    if (!resp.ok) {
      return res.status(resp.status).json({
        error: "OpenAI image generation error",
        status: resp.status,
        details: safeJson(text)
      });
    }

    const json = safeJson(text);
    const b64 = json?.data?.[0]?.b64_json;

    if (!b64) {
      return res.status(500).json({
        error: "No b64_json returned",
        raw: json
      });
    }

    const out = `data:image/png;base64,${b64}`;
    return res.status(200).json({ ok: true, imageDataUrl: out, mode: "reimagine" });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
