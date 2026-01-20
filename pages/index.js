import { useMemo, useState } from "react";

const CATEGORIES = ["外装", "内装", "メニュー", "店員", "その他"];

const THEMES = [
  "看板メニュー",
  "内装の世界観",
  "外観の第一印象",
  "仕込み・手仕事",
  "店主・スタッフ",
  "おすすめドリンク",
  "季節限定",
  "お客様体験",
  "予約・導線"
];

export default function Home() {
  const [form, setForm] = useState({
    name: "",
    genre: "",
    vibe: "",
    target: "",
    price: "",
    notes: ""
  });

  // 画像：最大9枚
  // { id, dataUrl, kind, filename }
  const [images, setImages] = useState([]);

  // 生成結果：9投稿
  // { id, theme, imageDataUrl, caption }
  const [posts, setPosts] = useState([]);

  // モーダル
  const [activePost, setActivePost] = useState(null);

  // 生成演出
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);

  const onChange = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const canGenerate =
    form.name.trim() &&
    form.genre.trim() &&
    form.vibe.trim() &&
    form.target.trim() &&
    form.price.trim() &&
    images.length >= 1 &&
    images.length <= 9;

  const addFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const remaining = Math.max(0, 9 - images.length);
    const pick = files.slice(0, remaining);

    const readAll = await Promise.all(
      pick.map(async (f) => {
        const dataUrl = await readAsDataURL(f);
        return {
          id: uid("img"),
          dataUrl,
          kind: "メニュー", // デフォルト
          filename: f.name
        };
      })
    );

    setImages((prev) => [...prev, ...readAll]);
  };

  const changeKind = (id, kind) => {
    setImages((prev) => prev.map((x) => (x.id === id ? { ...x, kind } : x)));
  };

  const removeImage = (id) => {
    setImages((prev) => prev.filter((x) => x.id !== id));
  };

  const resetPreview = () => {
    setPosts([]);
    setActivePost(null);
    setLoading(false);
    setStep(0);
  };

  const generate = async () => {
    resetPreview();
    setLoading(true);
    setStep(0);

    try {
      const generated = await generateNinePosts(form, images, (n) => setStep(n));
      setPosts(generated);
    } catch (e) {
      console.error(e);
      alert("生成に失敗しました。別の画像でお試しください。");
    } finally {
      setLoading(false);
    }
  };

  const headerRight = useMemo(() => {
    if (loading) return `生成中… ${step}/9`;
    if (posts.length) return "生成完了";
    return "";
  }, [loading, step, posts.length]);

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa" }}>
      {/* Top bar（最小） */}
      <div style={styles.topBar}>
        <div style={{ fontWeight: 700 }}>営業デモ</div>
        <div style={{ fontSize: 12, color: "#666" }}>{headerRight}</div>
      </div>

      <main style={styles.main}>
        {/* 入力カード */}
        <div style={styles.card}>
          <h1 style={{ fontSize: 18, margin: 0, marginBottom: 8 }}>事前準備（わかる範囲でOK）</h1>
          <p style={styles.help}>
            営業前に「店舗情報＋画像」を入れて、<strong>9投稿の完成イメージ</strong>を先に作ります。画像は
            <strong>1枚でもOK</strong>（同じ元画像から別トリミング/別加工で9枠を埋めます）。
          </p>

          <Field label="店舗名" required>
            <input value={form.name} onChange={onChange("name")} placeholder="例）蕎麦屋 尖（とつ）" style={styles.input} />
          </Field>

          <Field label="ジャンル" required>
            <input value={form.genre} onChange={onChange("genre")} placeholder="例）蕎麦 / 和食 / イタリアン" style={styles.input} />
          </Field>

          <Field label="雰囲気（世界観）" required>
            <input value={form.vibe} onChange={onChange("vibe")} placeholder="例）落ち着いた / シック / モダン和風" style={styles.input} />
          </Field>

          <Field label="ターゲット" required>
            <input
              value={form.target}
              onChange={onChange("target")}
              placeholder="例）30代以上の食通 / 記念日利用 / 外国人も"
              style={styles.input}
            />
          </Field>

          <Field label="価格帯" required>
            <input value={form.price} onChange={onChange("price")} placeholder="例）客単価 12,000〜18,000円" style={styles.input} />
          </Field>

          <Field label="フリー情報（任意）">
            <textarea
              value={form.notes}
              onChange={onChange("notes")}
              placeholder="例）席数10、カウンター中心、日本酒のペアリングが強み…など"
              style={{ ...styles.input, height: 90, resize: "vertical", paddingTop: 10, paddingBottom: 10 }}
            />
          </Field>

          {/* 画像アップ */}
          <div style={{ marginTop: 10 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>店舗画像（最大9枚）</div>
              <div style={{ fontSize: 12, color: "#666" }}>{images.length}/9</div>
            </div>

            <div style={styles.uploader}>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => addFiles(e.target.files)}
                disabled={images.length >= 9}
              />
              <div style={{ fontSize: 12, color: "#666", lineHeight: 1.5 }}>
                登録後に各画像のカテゴリを選びます（外装/内装/メニュー/店員/その他）。
              </div>
            </div>

            {images.length > 0 && (
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                {images.map((img, idx) => (
                  <div key={img.id} style={styles.imageRow}>
                    <img src={img.dataUrl} alt="" style={styles.thumb} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
                        {idx + 1}. {img.filename || "image"}
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <select value={img.kind} onChange={(e) => changeKind(img.id, e.target.value)} style={styles.select}>
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>

                        <button onClick={() => removeImage(img.id)} style={styles.ghostBtn}>
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 14 }}>
              <button
                onClick={generate}
                disabled={!canGenerate || loading}
                style={{
                  ...styles.primaryBtn,
                  background: canGenerate && !loading ? "#0095f6" : "#b2dffc",
                  cursor: canGenerate && !loading ? "pointer" : "not-allowed"
                }}
              >
                {loading ? "生成中…" : "9投稿を生成（9グリッド表示）"}
              </button>

              <div style={{ fontSize: 12, color: "#888", marginTop: 10, lineHeight: 1.5 }}>
                ※ 保存機能はまだ入れていません（後で追加します）。いまはこのページ内で完結します。
              </div>
            </div>
          </div>
        </div>

        {/* 9グリッド（生成後に表示） */}
        {posts.length > 0 && (
          <div style={{ ...styles.card, marginTop: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>Instagram風プレビュー（9グリッド）</div>

            <div style={styles.grid}>
              {posts.map((p) => (
                <button key={p.id} onClick={() => setActivePost(p)} style={styles.gridBtn} aria-label={p.theme}>
                  <img src={p.imageDataUrl} alt={p.theme} style={styles.gridImg} />
                </button>
              ))}
            </div>

            <div style={{ fontSize: 12, color: "#888", marginTop: 10, lineHeight: 1.5 }}>
              ※ 画像をクリックすると投稿詳細（キャプション付き）を表示します。
            </div>
          </div>
        )}
      </main>

      {/* 投稿モーダル */}
      {activePost && (
        <Modal onClose={() => setActivePost(null)}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={styles.avatar} />
                <div style={{ fontSize: 13, fontWeight: 800 }}>{form.name || "store"}</div>
              </div>
              <button onClick={() => setActivePost(null)} style={styles.closeBtn} aria-label="close">
                ✕
              </button>
            </div>

            <img src={activePost.imageDataUrl} alt={activePost.theme} style={styles.modalImg} />

            <div style={styles.modalBody}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>{activePost.theme}</div>
              <textarea readOnly value={activePost.caption} style={styles.captionBox} />

              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button
                  style={styles.primaryBtn}
                  onClick={async () => {
                    await navigator.clipboard.writeText(activePost.caption);
                    alert("キャプションをコピーしました");
                  }}
                >
                  キャプションをコピー
                </button>

                <button
                  style={styles.ghostBtn}
                  onClick={async () => {
                    await navigator.clipboard.writeText(activePost.imageDataUrl);
                    alert("画像データURLをコピーしました（デモ用）");
                  }}
                >
                  画像URLをコピー
                </button>
              </div>

              <div style={{ fontSize: 12, color: "#888", marginTop: 10, lineHeight: 1.5 }}>
                ※ 本番では「画像ダウンロード」や「Instagramへの投稿導線」に置き換え可能です。
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------- UI Parts ---------------- */

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

function Modal({ children, onClose }) {
  return (
    <div style={styles.backdrop} onMouseDown={onClose} role="dialog" aria-modal="true">
      <div style={styles.modalWrap} onMouseDown={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

/* ---------------- Generation (Demo) ---------------- */

async function generateNinePosts(store, images, onStep) {
  const posts = [];
  for (let i = 0; i < 9; i++) {
    const theme = THEMES[i];

    // 画像が足りない場合でも、必ず source を用意する
    const source = pickSourceImage(images, theme) || images[0];

    // 1枚しかなくても seed を変えて別トリミング/別加工で別画像に見せる
    const imageDataUrl = await stylizeImage(source?.dataUrl ?? null, theme, i + 1, store);

    const caption = captionFor(theme, store);

    posts.push({
      id: uid("post"),
      theme,
      imageDataUrl,
      caption
    });

    onStep?.(i + 1);
    await sleep(140);
  }
  return posts;
}

function pickSourceImage(images, theme) {
  const map = {
    看板メニュー: ["メニュー"],
    内装の世界観: ["内装"],
    外観の第一印象: ["外装"],
    仕込み・手仕事: ["メニュー", "内装", "その他"],
    店主・スタッフ: ["店員"],
    おすすめドリンク: ["メニュー", "その他"],
    季節限定: ["メニュー", "その他"],
    お客様体験: ["内装", "その他"],
    予約・導線: ["外装", "内装", "その他"]
  };

  const prefer = map[theme] || ["その他"];
  for (const k of prefer) {
    const list = images.filter((i) => i.kind === k);
    if (list.length) return list[Math.floor(Math.random() * list.length)];
  }
  return images.length ? images[Math.floor(Math.random() * images.length)] : null;
}

function captionFor(theme, store) {
  const name = store.name || "お店";
  const genre = store.genre ? `（${store.genre}）` : "";
  const vibe = store.vibe ? `「${store.vibe}」` : "";
  const target = store.target ? `こんな方に：${store.target}` : "";
  const price = store.price ? `ご予算目安：${store.price}` : "";

  const baseHash = ["#東京グルメ", "#グルメ好きな人と繋がりたい", "#外食", "#週末ごはん"];
  const g = store.genre ? `#${String(store.genre).replace(/\s/g, "")}` : "#グルメ";
  const extra = [g, "#instafood", "#foodstagram"];
  const CTA = "ご予約・お問い合わせはプロフィールから。";

  const bodyByTheme = {
    看板メニュー: `本日の一皿。${name}${genre}の“らしさ”が詰まった看板メニュー。`,
    内装の世界観: `${vibe}な空間で、ゆっくりと過ごす時間。写真より実物の方がもっと素敵です。`,
    外観の第一印象: `初めてでも入りやすい外観。ふらっと立ち寄りたくなる入口、目印はこちら。`,
    仕込み・手仕事: `一つひとつ丁寧に。仕込みの工程からおいしさは始まっています。`,
    店主・スタッフ: `つくり手の温度が伝わるお店。今日もいい空気でお迎えします。`,
    おすすめドリンク: `お料理に合わせたい一杯。ペアリングの楽しさもぜひ。`,
    季節限定: `季節の移ろいを一皿に。今だけの限定メニュー、ぜひお早めに。`,
    お客様体験: `「また来たい」が自然に出る時間。特別な日にも、普段使いにも。`,
    予約・導線: `席数に限りがあります。ご予定が決まったら早めのご予約がおすすめです。`
  };

  const lines = [
    bodyByTheme[theme] || `${name}の投稿です。`,
    target ? `\n${target}` : "",
    price ? `\n${price}` : "",
    `\n${CTA}`,
    `\n${[...baseHash, ...extra].join(" ")}`
  ].filter(Boolean);

  return lines.join("");
}

async function stylizeImage(sourceDataUrl, theme, seed, store) {
  const size = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  // 背景
  ctx.fillStyle = "#eee";
  ctx.fillRect(0, 0, size, size);

  if (sourceDataUrl) {
    const img = await loadImage(sourceDataUrl);

    const iw = img.width;
    const ih = img.height;

    // seedでトリミング差分（= 1枚でも9枚に見せる）
    const s = 0.72 + (seed % 9) * 0.025; // 0.72..0.92
    const cropW = iw * s;
    const cropH = ih * s;
    const cx = (iw - cropW) * (((seed % 10) + 1) / 11);
    const cy = (ih - cropH) * (((seed % 8) + 1) / 9);

    // それっぽい補正（seedで微差）
    const brightness = 1.02 + (seed % 5) * 0.01;
    const contrast = 1.08 + (seed % 6) * 0.02;
    const saturate = 1.05 + (seed % 4) * 0.03;
    ctx.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturate})`;

    ctx.drawImage(img, cx, cy, cropW, cropH, 0, 0, size, size);
    ctx.filter = "none";
  } else {
    // 画像が無いケース（今回のUIでは基本起きないが保険）
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, hashColor(`${store.name}-${theme}-a`));
    grad.addColorStop(1, hashColor(`${store.genre}-${theme}-b`));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  // ビネット
  const vignette = ctx.createRadialGradient(size / 2, size / 2, size * 0.2, size / 2, size / 2, size * 0.8);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.18)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, size, size);

  // 微粒子ノイズ
  addNoise(ctx, size, 0.045);

  // テーマ別の薄いトーン（差分演出）
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = themeTint(theme);
  ctx.fillRect(0, 0, size, size);
  ctx.globalAlpha = 1;

  return canvas.toDataURL("image/jpeg", 0.92);
}

function themeTint(theme) {
  switch (theme) {
    case "看板メニュー":
    case "季節限定":
      return "rgba(255, 210, 160, 1)";
    case "内装の世界観":
    case "お客様体験":
      return "rgba(180, 210, 255, 1)";
    case "外観の第一印象":
    case "予約・導線":
      return "rgba(210, 255, 210, 1)";
    default:
      return "rgba(255, 255, 255, 1)";
  }
}

function addNoise(ctx, size, amount) {
  const imgData = ctx.getImageData(0, 0, size, size);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 255 * amount;
    d[i] = clamp(d[i] + n);
    d[i + 1] = clamp(d[i + 1] + n);
    d[i + 2] = clamp(d[i + 2] + n);
  }
  ctx.putImageData(imgData, 0, 0);
}

function clamp(v) {
  return Math.max(0, Math.min(255, v));
}

function hashColor(input) {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  const r = 160 + (h & 63);
  const g = 160 + ((h >>> 6) & 63);
  const b = 160 + ((h >>> 12) & 63);
  return `rgb(${r}, ${g}, ${b})`;
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

/* ---------------- Utils ---------------- */

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

/* ---------------- Styles ---------------- */

const styles = {
  topBar: {
    height: 44,
    background: "#fff",
    borderBottom: "1px solid #dbdbdb",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 12px",
    boxSizing: "border-box"
  },
  main: {
    maxWidth: 420,
    margin: "0 auto",
    padding: "12px 12px 32px",
    boxSizing: "border-box"
  },
  card: {
    background: "#fff",
    border: "1px solid #dbdbdb",
    borderRadius: 12,
    padding: 16,
    boxSizing: "border-box",
    width: "100%"
  },
  help: {
    marginTop: 0,
    color: "#666",
    lineHeight: 1.6,
    fontSize: 13
  },
  input: {
    width: "100%",
    height: 40,
    borderRadius: 10,
    border: "1px solid #dbdbdb",
    padding: "0 12px",
    outline: "none",
    background: "#fff",
    fontSize: 14,
    boxSizing: "border-box"
  },
  uploader: {
    marginTop: 8,
    border: "1px dashed #dbdbdb",
    borderRadius: 12,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 8
  },
  imageRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    border: "1px solid #eee",
    borderRadius: 12,
    padding: 10
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    objectFit: "cover",
    border: "1px solid #eee",
    background: "#f3f3f3",
    flex: "0 0 auto"
  },
  select: {
    height: 34,
    borderRadius: 10,
    border: "1px solid #dbdbdb",
    padding: "0 10px",
    background: "#fff",
    fontSize: 13
  },
  primaryBtn: {
    width: "100%",
    height: 44,
    borderRadius: 10,
    border: "1px solid #dbdbdb",
    color: "#fff",
    fontWeight: 800
  },
  ghostBtn: {
    height: 34,
    borderRadius: 10,
    border: "1px solid #dbdbdb",
    background: "#fff",
    padding: "0 12px",
    fontWeight: 700,
    cursor: "pointer"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 2
  },
  gridBtn: {
    padding: 0,
    border: 0,
    background: "transparent",
    cursor: "pointer"
  },
  gridImg: {
    width: "100%",
    aspectRatio: "1 / 1",
    objectFit: "cover",
    display: "block",
    background: "#eee"
  },

  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    zIndex: 50
  },
  modalWrap: {
    width: "min(420px, 100%)"
  },
  modalCard: {
    background: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid #dbdbdb"
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderBottom: "1px solid #eee"
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 999,
    background: "#ddd"
  },
  closeBtn: {
    border: "1px solid #dbdbdb",
    borderRadius: 10,
    background: "#fff",
    height: 32,
    width: 32,
    cursor: "pointer",
    fontWeight: 900
  },
  modalImg: {
    width: "100%",
    aspectRatio: "1 / 1",
    objectFit: "cover",
    display: "block",
    background: "#eee"
  },
  modalBody: {
    padding: 12
  },
  captionBox: {
    width: "100%",
    minHeight: 130,
    borderRadius: 10,
    border: "1px solid #dbdbdb",
    padding: 10,
    fontSize: 13,
    lineHeight: 1.5,
    boxSizing: "border-box",
    resize: "vertical"
  }
};
