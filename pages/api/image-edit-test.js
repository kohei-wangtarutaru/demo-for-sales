export const config = {
  api: { bodyParser: { sizeLimit: "12mb" } }
};

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

    const finalPrompt = `
以下の画像を参考に、プロが撮り直したように強めに再生成してください。

必須:
- SNS映えする完成度
- 光・立体感を強く改善
- 背景は大きく改善して良い
- 写真としてリアル
- 元料理の同一性はなるべく維持

ユーザー指示:
${prompt}
`.trim();

    const body = {
      model: "gpt-image-1",
      prompt: finalPrompt,
      size: "1024x1024",
      image: imageDataUrl
    };

    const resp = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
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

    return res.status(200).json({
      ok: true,
      mode: "reimagine",
      imageDataUrl: `data:image/png;base64,${b64}`
    });

  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
