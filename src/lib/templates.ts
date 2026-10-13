import type { DesignState } from "./types.ts";
import { withAlpha } from "./color.ts";
import { fitFontSize } from "./wrap.ts";

export type DrawContext = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  state: DesignState;
};

export type Template = {
  id: string;
  name: string;
  pro: boolean;
  // テンプレ選択時に適用する初期値
  defaults: Partial<DesignState>;
  // 背景の上に文字や装飾を描く
  draw: (d: DrawContext) => void;
};

function font(state: DesignState, size: number, weight = 700): string {
  return `${weight} ${size}px ${state.fontFamily}`;
}

// タイトルを箱に収めて描画し、使った高さを返す
function drawTitle(
  d: DrawContext,
  box: { x: number; y: number; w: number; maxLines: number; max: number; min: number },
  align: CanvasTextAlign,
  color: string,
  valign: "top" | "middle" = "top",
  boxHeight = 0,
): number {
  const { ctx, state } = d;
  const fit = fitFontSize(state.title || "タイトルを入力", box.w, box.maxLines, box, (size) => {
    return (text: string) => {
      ctx.font = font(state, size, 800);
      return ctx.measureText(text).width;
    };
  });
  const lineHeight = fit.size * 1.35;
  const total = lineHeight * fit.lines.length;
  let y = valign === "middle" ? box.y + (boxHeight - total) / 2 : box.y;
  ctx.font = font(state, fit.size, 800);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "top";
  const x = align === "center" ? box.x + box.w / 2 : box.x;
  for (const line of fit.lines) {
    ctx.fillText(line, x, y + (lineHeight - fit.size) / 2);
    y += lineHeight;
  }
  return total;
}

function drawSmall(
  d: DrawContext,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: CanvasTextAlign,
  maxWidth?: number,
) {
  if (!text) return;
  const { ctx, state } = d;
  ctx.font = font(state, size, 600);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "top";
  ctx.fillText(text, x, y, maxWidth);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export const TEMPLATES: Template[] = [
  {
    id: "simple",
    name: "シンプル",
    pro: false,
    defaults: { background: "gradient", bgColor: "#1e3a8a", bgColor2: "#7c3aed", textColor: "#ffffff", accentColor: "#fbbf24", align: "center" },
    draw: (d) => {
      const { width: w, height: h, state } = d;
      const pad = w * 0.08;
      const center = state.align === "center";
      const x = center ? w / 2 : pad;
      const align: CanvasTextAlign = center ? "center" : "left";
      drawSmall(d, state.subtitle, x, h * 0.16, w * 0.026, state.accentColor, align, w - pad * 2);
      drawTitle(d, { x: pad, y: h * 0.16, w: w - pad * 2, maxLines: 3, max: w * 0.07, min: w * 0.035 }, align, state.textColor, "middle", h * 0.62);
      drawSmall(d, state.author, x, h * 0.84, w * 0.022, withAlpha(state.textColor, 0.85), align);
    },
  },
  {
    id: "card",
    name: "カード",
    pro: false,
    defaults: { background: "solid", bgColor: "#0ea5e9", bgColor2: "#22d3ee", textColor: "#0f172a", accentColor: "#0ea5e9", align: "left" },
    draw: (d) => {
      const { ctx, width: w, height: h, state } = d;
      const m = Math.min(w, h) * 0.07;
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.18)";
      ctx.shadowBlur = m * 0.6;
      ctx.shadowOffsetY = m * 0.15;
      ctx.fillStyle = "#ffffff";
      roundRect(ctx, m, m, w - m * 2, h - m * 2, m * 0.5);
      ctx.fill();
      ctx.restore();
      const pad = m * 2;
      const center = state.align === "center";
      const x = center ? w / 2 : pad;
      const align: CanvasTextAlign = center ? "center" : "left";
      // 上部のアクセント線
      ctx.fillStyle = state.accentColor;
      ctx.fillRect(center ? w / 2 - w * 0.04 : pad, m * 1.6, w * 0.08, Math.max(4, h * 0.01));
      drawTitle(d, { x: pad, y: m * 2, w: w - pad * 2, maxLines: 3, max: w * 0.06, min: w * 0.032 }, align, state.textColor, "middle", h - m * 4.4);
      drawSmall(d, [state.author, state.subtitle].filter(Boolean).join("  |  "), x, h - m * 2.4, w * 0.022, withAlpha(state.textColor, 0.7), align, w - pad * 2);
    },
  },
  {
    id: "band",
    name: "ライン",
    pro: false,
    defaults: { background: "solid", bgColor: "#fffbeb", bgColor2: "#fde68a", textColor: "#1c1917", accentColor: "#f97316", align: "left" },
    draw: (d) => {
      const { ctx, width: w, height: h, state } = d;
      const pad = w * 0.08;
      ctx.fillStyle = state.accentColor;
      ctx.fillRect(0, 0, w * 0.025, h);
      ctx.fillRect(0, h - h * 0.03, w, h * 0.03);
      if (state.subtitle) {
        const size = w * 0.022;
        const ctx2 = d.ctx;
        ctx2.font = font(state, size, 700);
        const tw = ctx2.measureText(state.subtitle).width;
        ctx2.fillStyle = state.accentColor;
        roundRect(ctx2, pad, h * 0.14, tw + size * 1.6, size * 1.9, size * 0.4);
        ctx2.fill();
        drawSmall(d, state.subtitle, pad + size * 0.8, h * 0.14 + size * 0.45, size, "#ffffff", "left");
      }
      drawTitle(d, { x: pad, y: h * 0.26, w: w - pad * 2, maxLines: 3, max: w * 0.065, min: w * 0.034 }, "left", state.textColor, "middle", h * 0.5);
      drawSmall(d, state.author, pad, h * 0.82, w * 0.024, withAlpha(state.textColor, 0.75), "left");
    },
  },
  {
    id: "split",
    name: "スプリット",
    pro: true,
    defaults: { background: "solid", bgColor: "#111827", bgColor2: "#374151", textColor: "#f9fafb", accentColor: "#22c55e", align: "left" },
    draw: (d) => {
      const { ctx, width: w, height: h, state } = d;
      const left = w * 0.32;
      ctx.fillStyle = state.accentColor;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(left, 0);
      ctx.lineTo(left - w * 0.06, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
      drawSmall(d, state.subtitle || "BLOG", w * 0.05, h * 0.44, w * 0.03, "#ffffff", "left", left - w * 0.14);
      const x = left + w * 0.02;
      drawTitle(d, { x, y: h * 0.12, w: w - x - w * 0.06, maxLines: 4, max: w * 0.058, min: w * 0.03 }, "left", state.textColor, "middle", h * 0.64);
      drawSmall(d, state.author, x, h * 0.84, w * 0.022, withAlpha(state.textColor, 0.75), "left");
    },
  },
  {
    id: "frame",
    name: "フレーム",
    pro: true,
    defaults: { background: "gradient", bgColor: "#fdf2f8", bgColor2: "#e0e7ff", textColor: "#312e81", accentColor: "#db2777", align: "center" },
    draw: (d) => {
      const { ctx, width: w, height: h, state } = d;
      const m = Math.min(w, h) * 0.05;
      ctx.strokeStyle = state.accentColor;
      ctx.lineWidth = m * 0.25;
      ctx.strokeRect(m, m, w - m * 2, h - m * 2);
      ctx.lineWidth = m * 0.06;
      ctx.strokeRect(m * 1.5, m * 1.5, w - m * 3, h - m * 3);
      const pad = m * 3;
      const center = state.align === "center";
      const x = center ? w / 2 : pad;
      const align: CanvasTextAlign = center ? "center" : "left";
      drawSmall(d, state.subtitle, x, m * 3, w * 0.024, state.accentColor, align, w - pad * 2);
      drawTitle(d, { x: pad, y: m * 3, w: w - pad * 2, maxLines: 3, max: w * 0.064, min: w * 0.034 }, align, state.textColor, "middle", h - m * 6);
      drawSmall(d, state.author, x, h - m * 4, w * 0.022, withAlpha(state.textColor, 0.8), align);
    },
  },
];

export function findTemplate(id: string): Template {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
