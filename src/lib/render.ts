import type { DesignState, Plan } from "./types.ts";
import { SIZE_PRESETS } from "./types.ts";
import { findTemplate } from "./templates.ts";

export function sizeOf(state: DesignState) {
  return SIZE_PRESETS.find((s) => s.id === state.sizeId) ?? SIZE_PRESETS[0];
}

// 無料プランの書き出し倍率は 1x、有料(モック)は 2x
export function exportScale(plan: Plan): number {
  return plan === "pro" ? 2 : 1;
}

// 無料プランで PRO テンプレを使った場合だけ透かしを入れる
export function needsWatermark(state: DesignState, plan: Plan): boolean {
  return plan === "free" && findTemplate(state.templateId).pro;
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: DesignState,
  bgImage: HTMLImageElement | null,
) {
  if (state.background === "image" && bgImage) {
    // cover で敷き詰める
    const r = Math.max(w / bgImage.naturalWidth, h / bgImage.naturalHeight);
    const iw = bgImage.naturalWidth * r;
    const ih = bgImage.naturalHeight * r;
    ctx.drawImage(bgImage, (w - iw) / 2, (h - ih) / 2, iw, ih);
    ctx.fillStyle = `rgba(0,0,0,${state.bgDim})`;
    ctx.fillRect(0, 0, w, h);
    return;
  }
  if (state.background === "gradient") {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, state.bgColor);
    g.addColorStop(1, state.bgColor2);
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = state.bgColor;
  }
  ctx.fillRect(0, 0, w, h);
}

function drawWatermark(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 12);
  ctx.font = `800 ${w * 0.05}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 2;
  const text = "PRO テンプレート プレビュー";
  ctx.strokeText(text, 0, 0);
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

// canvas を指定倍率でリサイズして描画する
export function renderDesign(
  canvas: HTMLCanvasElement,
  state: DesignState,
  opts: { scale: number; plan: Plan; bgImage: HTMLImageElement | null },
) {
  const { width, height } = sizeOf(state);
  canvas.width = Math.round(width * opts.scale);
  canvas.height = Math.round(height * opts.scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(opts.scale, 0, 0, opts.scale, 0, 0);
  drawBackground(ctx, width, height, state, opts.bgImage);
  findTemplate(state.templateId).draw({ ctx, width, height, state });
  if (needsWatermark(state, opts.plan)) drawWatermark(ctx, width, height);
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG の生成に失敗しました"))), "image/png");
  });
}

// タイトルからファイル名を作る(OS で使えない文字を除く)
export function fileNameFor(state: DesignState, scale: number): string {
  const base = (state.title || "ogp").replace(/[\\/:*?"<>|\n\r\t]/g, "").trim().slice(0, 40) || "ogp";
  const { width, height } = sizeOf(state);
  return `${base}_${width * scale}x${height * scale}.png`;
}
