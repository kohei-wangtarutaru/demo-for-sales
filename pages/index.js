import { useState } from "react";

export default function Home() {
  const [form, setForm] = useState({
    name: "",
    genre: "",
    vibe: "",
    target: "",
    price: "",
    notes: ""
  });

  const onChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const canNext =
    form.name.trim() &&
    form.genre.trim() &&
    form.vibe.trim() &&
    form.target.trim() &&
    form.price.trim();

  const next = () => {
    // 次のステップで /confirm に遷移させます（まだ作らない）
    alert(
      "OK! 次は確認画面（/confirm）を作って、入力内容→画像追加→プレビューへ進みます。\n\n" +
        "入力内容:\n" +
        `店舗名: ${form.name}\n` +
        `ジャンル: ${form.genre}\n` +
        `雰囲気: ${form.vibe}\n` +
        `ターゲット: ${form.target}\n` +
        `価格帯: ${form.price}\n` +
        (form.notes ? `メモ: ${form.notes}\n` : "")
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa" }}>
      {/* 上部バー（インスタっぽい雰囲気作り：まだ最小） */}
      <div
        style={{
          height: 44,
          background: "#fff",
          borderBottom: "1px solid #dbdbdb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 600
        }}
      >
        営業デモ（入力）
      </div>

      {/* ✅ ここ：スマホ幅で安定させる */}
      <main
        style={{
          maxWidth: 420,
          margin: "0 auto",
          padding: "16px 12px",
          boxSizing: "border-box"
        }}
      >
        {/* ✅ ここ：padding込みでもはみ出さない */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #dbdbdb",
            borderRadius: 12,
            padding: 16,
            boxSizing: "border-box",
            width: "100%"
          }}
        >
          <h1 style={{ fontSize: 18, margin: 0, marginBottom: 8 }}>
            店舗情報を入力（わかる範囲でOK）
          </h1>
          <p style={{ marginTop: 0, color: "#666", lineHeight: 1.6, fontSize: 13 }}>
            営業中は「一緒に埋める」想定です。ここで入れた内容をもとに、
            次のステップで画像追加→Instagram風プレビューを生成します。
          </p>

          <Field label="店舗名" required>
            <input
              value={form.name}
              onChange={onChange("name")}
              placeholder="例）蕎麦屋 尖（とつ）"
              style={inputStyle}
            />
          </Field>

          <Field label="ジャンル" required>
            <input
              value={form.genre}
              onChange={onChange("genre")}
              placeholder="例）蕎麦 / 和食 / イタリアン"
              style={inputStyle}
            />
          </Field>

          <Field label="雰囲気（世界観）" required>
            <input
              value={form.vibe}
              onChange={onChange("vibe")}
              placeholder="例）落ち着いた / シック / モダン和風"
              style={inputStyle}
            />
          </Field>

          <Field label="ターゲット" required>
            <input
              value={form.target}
              onChange={onChange("target")}
              placeholder="例）30代以上の食通 / 記念日利用 / 外国人も"
              style={inputStyle}
            />
          </Field>

          <Field label="価格帯" required>
            <input
              value={form.price}
              onChange={onChange("price")}
              placeholder="例）客単価 12,000〜18,000円"
              style={inputStyle}
            />
          </Field>

          <Field label="フリー情報（任意）">
            <textarea
              value={form.notes}
              onChange={onChange("notes")}
              placeholder="例）席数10、カウンター中心、日本酒のペアリングが強み…など"
              style={{ ...inputStyle, height: 90, resize: "vertical", paddingTop: 10, paddingBottom: 10 }}
            />
          </Field>

          <button
            onClick={next}
            disabled={!canNext}
            style={{
              width: "100%",
              height: 44,
              borderRadius: 10,
              border: "1px solid #dbdbdb",
              background: canNext ? "#0095f6" : "#b2dffc",
              color: "#fff",
              fontWeight: 700,
              cursor: canNext ? "pointer" : "not-allowed"
            }}
          >
            次へ（確認画面へ）
          </button>

          <p style={{ color: "#888", fontSize: 12, marginTop: 10, lineHeight: 1.5 }}>
            ※ 次のステップで「確認画面 → 画像追加 → 9グリッド表示」を作ります。
          </p>
        </div>
      </main>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{label}</div>
        {required ? (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#fff",
              background: "#ed4956",
              padding: "2px 6px",
              borderRadius: 6
            }}
          >
            必須
          </span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  height: 40,
  borderRadius: 10,
  border: "1px solid #dbdbdb",
  padding: "0 12px",
  outline: "none",
  background: "#fff",
  fontSize: 14,
  boxSizing: "border-box"
};
