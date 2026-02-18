import { useState } from "react";

export default function ImageEditTest() {
  const [inputDataUrl, setInputDataUrl] = useState("");
  const [outputDataUrl, setOutputDataUrl] = useState("");
  const [outputUrl, setOutputUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState("");

  const [prompt, setPrompt] = useState(
    "素人写真っぽさを消して、Instagramで映えるように強めに編集してください。光を整え、背景の散らかりや不要物を自然に整理し、質感と立体感を出してください。ただし料理や店の同一性は保ち、別の料理に変えたりロゴや文字を捏造しないでください。1:1の正方形。写真としてリアルで自然、AIアート風にしない。"
  );

  const onPick = async (file) => {
    setOutputDataUrl("");
    setOutputUrl("");
    setInputDataUrl("");
    setLog("");

    if (!file) return;

    try {
      // ★ここで失敗しやすい（HEIC等）
      setLog(`読み込み中… filename=${file.name} type=${file.type || "(unknown)"} size=${file.size} bytes`);

      // ✅ DALL·E 2 edits向け：正方形PNG(1024)化
      const dataUrl = await fileToSquarePngDataURL(file, 1024);

      if (!dataUrl?.startsWith("data:image/png;base64,")) {
        throw new Error("PNG dataURL の生成に失敗しました（想定外の形式）");
      }

      setInputDataUrl(dataUrl);
      setLog("画像を登録しました（正方形PNGに変換済み）");
    } catch (e) {
      setLog(
        "画像登録に失敗しました。\n\n" +
          "よくある原因：\n" +
          "- HEIC形式（iPhoneの写真）がブラウザで読めない\n" +
          "- 画像が壊れている/巨大すぎる\n\n" +
          "対処：\n" +
          "- 画像を一度「JPEG/PNG」で書き出してから選び直す\n" +
          "- 別の画像で試す\n\n" +
          `エラー詳細: ${String(e?.message || e)}`
      );
    }
  };

  const run = async () => {
    if (!inputDataUrl) {
      alert("先に画像を選んでください");
      return;
    }

    setLoading(true);
    setLog("リクエスト送信中…");
    setOutputDataUrl("");
    setOutputUrl("");

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

      setOutputDataUrl(j.imageDataUrl || "");
      setOutputUrl(j.imageUrl || "");
      setLog(`成功：AI編集画像を受け取りました（mode=${j.mode}）`);
    } catch (e) {
      setLog(`例外: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  const showOutput = outputDataUrl || outputUrl;

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
            ※ アップした画像は自動で <strong>正方形PNG(1024×1024)</strong> に変換して送信します。
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
              <span style={{ fontSize: 12, color: "#666" }}>（正方形PNGに変換）</span>
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
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>元画像（送信するPNG）</div>
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
            {showOutput ? (
              <img
                src={showOutput}
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

// 中央を正方形に切り出し → 1024x1024 PNG にする
async function fileToSquarePngDataURL(file, size = 1024) {
  const src = await readAsDataURL(file);
  const img = await loadImage(src);

  const iw = img.width;
  const ih = img.height;
  if (!iw || !ih) throw new Error("画像サイズを取得できませんでした（形式非対応の可能性）");

  const side = Math.min(iw, ih);
  const sx = Math.floor((iw - side) / 2);
  const sy = Math.floor((ih - side) / 2);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);

  return canvas.toDataURL("image/png");
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
    img.onerror = () => reject(new Error("画像を読み込めませんでした（形式非対応の可能性）"));
    img.crossOrigin = "anonymous";
    img.src = src;
  });
}
