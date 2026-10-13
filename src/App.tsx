import { useEffect, useRef, useState } from "react";
import type { BackgroundMode, DesignState, Plan } from "./lib/types.ts";
import { FONT_OPTIONS, SIZE_PRESETS } from "./lib/types.ts";
import { findTemplate } from "./lib/templates.ts";
import { canvasToPngBlob, exportScale, fileNameFor, needsWatermark, renderDesign, sizeOf } from "./lib/render.ts";
import { DEFAULT_STATE, localDesignStore } from "./lib/storage.ts";
import { contrastRatio, readableTextColor } from "./lib/color.ts";
import { TemplatePicker } from "./components/TemplatePicker.tsx";

function useImage(src: string | null): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!src) {
      setImg(null);
      return;
    }
    const el = new Image();
    el.onload = () => setImg(el);
    el.src = src;
  }, [src]);
  return img;
}

export default function App() {
  const [state, setState] = useState<DesignState>(() => localDesignStore.load() ?? DEFAULT_STATE);
  const [plan, setPlan] = useState<Plan>("free");
  const [message, setMessage] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgImage = useImage(state.bgImage);

  const set = <K extends keyof DesignState>(key: K, value: DesignState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  useEffect(() => {
    if (canvasRef.current) renderDesign(canvasRef.current, state, { scale: 1, plan, bgImage });
  }, [state, plan, bgImage]);

  useEffect(() => {
    localDesignStore.save(state);
  }, [state]);

  // 背景画像の object URL を不要になったら解放する
  useEffect(() => {
    const url = state.bgImage;
    return () => {
      if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
    };
  }, [state.bgImage]);

  const selectTemplate = (templateId: string) => {
    const t = findTemplate(templateId);
    setState((s) => ({
      ...s,
      ...t.defaults,
      templateId,
      // 背景画像を使っている場合はそのまま残す
      background: s.background === "image" ? "image" : (t.defaults.background ?? s.background),
      bgImage: s.bgImage,
    }));
  };

  const onBgFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    setState((s) => ({ ...s, bgImage: URL.createObjectURL(file), background: "image" }));
  };

  const download = async () => {
    const scale = exportScale(plan);
    const canvas = document.createElement("canvas");
    renderDesign(canvas, state, { scale, plan, bgImage });
    const blob = await canvasToPngBlob(canvas);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileNameFor(state, scale);
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage(`${a.download}(${Math.round(blob.size / 1024)} KB)を書き出しました`);
  };

  const size = sizeOf(state);
  const template = findTemplate(state.templateId);
  // 背景画像のときは暗くした上に置く前提で、判定は単色・グラデのみ
  const lowContrast =
    state.background !== "image" && contrastRatio(state.textColor, state.bgColor) < 3;

  return (
    <div className="app">
      <header className="header">
        <h1>OGP画像メーカー</h1>
        <p>ブログ・SNS 用のアイキャッチを、テンプレートからブラウザだけで作成。画像はどこにもアップロードされません。</p>
      </header>

      <main className="layout">
        <section className="preview-pane">
          <div className="preview-frame" style={{ aspectRatio: `${size.width} / ${size.height}`, maxWidth: `calc(70vh * ${size.width / size.height})` }}>
            <canvas ref={canvasRef} className="preview" aria-label="プレビュー" />
          </div>
          <div className="actions">
            <button type="button" className="primary" onClick={download}>
              PNG をダウンロード({size.width * exportScale(plan)}×{size.height * exportScale(plan)})
            </button>
            <label className="plan">
              <input type="checkbox" checked={plan === "pro"} onChange={(e) => setPlan(e.target.checked ? "pro" : "free")} />
              有料プラン(モック):2x 高解像度・PRO テンプレの透かしなし
            </label>
          </div>
          {needsWatermark(state, plan) && (
            <p className="note">「{template.name}」は PRO テンプレートです。無料プランでは透かし入りで書き出されます。</p>
          )}
          {message && <p className="note ok">{message}</p>}

          <h2>テンプレート</h2>
          <TemplatePicker state={state} onSelect={selectTemplate} />
        </section>

        <section className="editor">
          <h2>テキスト</h2>
          <label>
            タイトル(改行可)
            <textarea rows={3} value={state.title} maxLength={120} onChange={(e) => set("title", e.target.value)} />
          </label>
          <label>
            サブテキスト(カテゴリ・ラベル)
            <input value={state.subtitle} maxLength={40} onChange={(e) => set("subtitle", e.target.value)} />
          </label>
          <label>
            著者・サイト名
            <input value={state.author} maxLength={40} onChange={(e) => set("author", e.target.value)} />
          </label>
          <div className="row">
            <label>
              フォント
              <select value={state.fontFamily} onChange={(e) => set("fontFamily", e.target.value)}>
                {FONT_OPTIONS.map((f) => (
                  <option key={f.label} value={f.value}>{f.label}</option>
                ))}
              </select>
            </label>
            <label>
              揃え
              <select value={state.align} onChange={(e) => set("align", e.target.value as DesignState["align"])}>
                <option value="center">中央</option>
                <option value="left">左</option>
              </select>
            </label>
          </div>

          <h2>サイズ</h2>
          <select value={state.sizeId} onChange={(e) => set("sizeId", e.target.value as DesignState["sizeId"])}>
            {SIZE_PRESETS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>

          <h2>背景・色</h2>
          <div className="segmented" role="radiogroup" aria-label="背景の種類">
            {(["solid", "gradient", "image"] as BackgroundMode[]).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={state.background === m}
                className={state.background === m ? "active" : ""}
                onClick={() => set("background", m)}
              >
                {{ solid: "単色", gradient: "グラデーション", image: "画像" }[m]}
              </button>
            ))}
          </div>
          {state.background === "image" ? (
            <>
              <label>
                背景画像
                <input type="file" accept="image/*" onChange={(e) => onBgFile(e.target.files?.[0])} />
              </label>
              {!state.bgImage && <p className="note">画像を選ぶまでは単色で表示します。</p>}
              <label>
                背景の暗さ {Math.round(state.bgDim * 100)}%
                <input type="range" min={0} max={0.8} step={0.05} value={state.bgDim} onChange={(e) => set("bgDim", Number(e.target.value))} />
              </label>
            </>
          ) : (
            <div className="row">
              <label className="color">
                背景色
                <input type="color" value={state.bgColor} onChange={(e) => set("bgColor", e.target.value)} />
              </label>
              {state.background === "gradient" && (
                <label className="color">
                  背景色2
                  <input type="color" value={state.bgColor2} onChange={(e) => set("bgColor2", e.target.value)} />
                </label>
              )}
            </div>
          )}
          <div className="row">
            <label className="color">
              文字色
              <input type="color" value={state.textColor} onChange={(e) => set("textColor", e.target.value)} />
            </label>
            <label className="color">
              アクセント
              <input type="color" value={state.accentColor} onChange={(e) => set("accentColor", e.target.value)} />
            </label>
          </div>
          {lowContrast && (
            <p className="note">
              文字と背景のコントラストが低めです。
              <button type="button" className="link" onClick={() => set("textColor", readableTextColor(state.bgColor))}>
                読みやすい色にする
              </button>
            </p>
          )}

          <button type="button" className="secondary" onClick={() => setState({ ...DEFAULT_STATE })}>
            初期状態に戻す
          </button>
        </section>
      </main>

      <footer className="footer">
        <p>作成した画像は、ブログの OGP(og:image)や X・note・YouTube のサムネイルに使えます。入力内容はこの端末のブラウザにだけ保存されます。</p>
      </footer>
    </div>
  );
}
