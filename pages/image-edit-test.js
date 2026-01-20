import { useState } from "react";

export default function ImageEditTest() {
  const [inputDataUrl, setInputDataUrl] = useState("");
  const [outputDataUrl, setOutputDataUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState("");

  const [prompt, setPrompt] = useState(
    "素人写真っぽさを消して、Instagramで映えるように強めに編集してください。光を整え、背景の散らかりや不要物を自然に整理し、質感と立体感を出してください。ただし料理や店の同一性は保ち、別の料理に変えたりロゴや文字を捏造しないでください。1:1の正方形。写真としてリアルで自然、AIアート風にしない。"
  );

  const onPick = async (file) => {
    setOutputDataUrl("");
    setLog("");
    if (!file) return;

    const dataUrl = await fileToResizedDataURL(file, 1024, 0.86); // 軽量化
    setInputDataUrl(dataUrl);
  };

  const run = async () => {
    if (!inputDataUrl) {
      alert("先に画像を選んでください");
      return;
    }

    setLoading(true);
    setLog("リクエスト送信中…");
    setOutputDataUrl("");

    try {
      const r = await fetch("/api/image-edit-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl: inputDataUrl,
          prompt
        })
      });

      const j = await r.json();
      if (!r.ok) {
        setLog(`失敗: status=${r.status}\n${JSON.stringify(j, null, 2)}`);
        return;
      }

      setOutputDataUrl(j.imageDataUrl);
      setLog("成功：AI編集画像を受け取りました");
    } catch (e) {
      setLog(`例外: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa" }}>
      <div
        style={{
          height: 44,
          background: "#fff",
          borderBottom: "1px solid #dbdbdb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700
        }}
      >
        画像編集テスト
      </div>

      <main style={{ maxWidth: 820, margin: "0 auto", padding: 16, boxSizing: "border-box" }}>
        <div
          style={{
            background: "#fff",
            border: "1px solid #dbdbdb",
            borderRadius: 12,
            padding: 16,
            boxSizing: "border-box"
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>1枚アップ → AI編集 → 結果確認</div>
          <div style={{ fontSize: 12, color: "#666", lineHeight: 1.5, marginBottom: 12 }}>
            ここで「本当にAIが写真を強めに編集できるか」を単体で検証します。
            成功したら次に、あなたの営業デモ（9グリッド）へ統合します。
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                border: "1px dashed #dbdbdb",
                borderRadius: 12,
                background: "#fff",
                cursor: "pointer"
              }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onPick(e.target.files?.[0])}
                style={{ display: "none" }}
              />
              <span style={{ fontWeight: 800 }}>画像を選ぶ</span>
              <span style={{ fontSize: 12, color: "#666" }}>（長辺1024に縮小して送信）</span>
            </label>

            <button
              onClick={run}
              disabled={loading || !inputDataUrl}
              style={{
                height: 42,
                padding: "0 14px",
                borderRadius: 12,
                border: "1px solid #dbdbdb",
                background: loading || !inputDataUrl ? "#b2dffc" : "#0095f6",
                color: "#fff",
                fontWeight: 900,
                cursor: loading || !inputDataUrl ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "編集中…" : "AIで編集する"}
            </button>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>編集指示（プロンプト）</div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              style={{
                width: "100%",
                minHeight: 110,
                borderRadius: 12,
                border: "1px solid #dbdbdb",
                padding: 12,
                fontSize: 13,
                lineHeight: 1.5,
                boxSizing: "border-box",
                resize: "vertical"
              }}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: "#666", whiteSpace: "pre-wrap" }}>{log}</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
          <div style={panelStyle}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>元画像</div>
            {inputDataUrl ? (
              <img
                src={inputDataUrl}
                alt="input"
                style={{ width: "100%", borderRadius: 12, border: "1px solid #eee" }}
              />
            ) : (
              <div style={{ fontSize: 12, color: "#888" }}>まだ画像が選ばれていません</div>
            )}
          </div>

          <div style={panelStyle}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>AI編集後</div>
            {outputDataUrl ? (
              <img
                src={outputDataUrl}
                alt="output"
                style={{ width: "100%", borderRadius: 12, border: "1px solid #eee" }}
              />
            ) : (
              <div style={{ fontSize: 12, color: "#888" }}>まだAI編集結果がありません</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

const panelStyle = {
  background: "#fff",
  border: "1px solid #dbdbdb",
  borderRadius: 12,
  padding: 12,
  boxSizing: "border-box"
};

async function fileToResizedDataURL(file, maxSide = 1024, jpegQuality = 0.86) {
  const src = await readAsDataURL(file);
  const img = await loadImage(src);

  const iw = img.width;
  const ih = img.height;
  const scale = Math.min(1, maxSide / Math.max(iw, ih));
  const w = Math.max(1, Math.round(iw * scale));
  const h = Math.max(1, Math.round(ih * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);

  return canvas.toDataURL("image/jpeg", jpegQuality);
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.crossOrigin = "anonymous";
    img.src = src;
  });
}
