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
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "OPENAI_API_KEY is missing" });

  try {
    const { imageDataUrl, prompt } = req.body || {};
    if (!imageDataUrl || !prompt) {
      return res.status(400).json({ error: "imageDataUrl and prompt are required" });
    }

    // 強加工（Reimagine）向けに、モデルが“作り直す”判断をしやすい指示に寄せる
    const finalPrompt = `
次の入力画像を参考に、プロが撮り直したように「別物レベル」で再生成してください。

必須:
- 写真としてリアル（AIイラスト風にしない）
- SNSで保存される完成度
- 光を整え、立体感/質感を強調
- 背景は整理し、雰囲気を大きく改善して良い
- 料理・器はできるだけ同一性を維持（ただし完成度優先）

ユーザー指示:
${prompt}
`.trim();

    // Responses API + image_generation tool（JSONで送る）
    // ※ tool_choiceで必ず画像生成ツールを呼ばせる
    const body = {
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: finalPrompt },
            { type: "input_image", image_url: imageDataUrl }
          ]
        }
      ],
      tools: [
        {
          type: "image_generation",
          size: "1024x1024",
          quality: "high",
          // 強加工なので「作る」寄りに固定（edit/autoに戻すのは後でOK）
          action: "generate"
        }
      ],
      tool_choice: { type: "image_generation" }
    };

    const resp = await fetch("https://api.openai.com/v1/responses", {
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
        error: "OpenAI responses/image_generation error",
        status: resp.status,
        details: safeJson(text)
      });
    }

    const json = safeJson(text);

    // 画像は output の image_generation_call.result に base64 で入る
    const call = Array.isArray(json?.output)
      ? json.output.find((o) => o?.type === "image_generation_call")
      : null;

    const b64 = call?.result;
    if (!b64) {
      return res.status(500).json({
        error: "No image_generation_call.result found",
        raw: json
      });
    }

    return res.status(200).json({
      ok: true,
      mode: "reimagine",
      imageDataUrl: `data:image/png;base64,${b64}`,
      revised_prompt: call?.revised_prompt || null
    });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
