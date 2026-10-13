import { test } from "node:test";
import assert from "node:assert/strict";
import { contrastRatio, hexToRgb, readableTextColor, withAlpha } from "./color.ts";

test("3桁・6桁の16進カラーを読み取る", () => {
  assert.deepEqual(hexToRgb("#fff"), [255, 255, 255]);
  assert.deepEqual(hexToRgb("#1e90ff"), [30, 144, 255]);
  assert.deepEqual(hexToRgb("invalid"), [0, 0, 0]);
});

test("白と黒のコントラスト比は 21", () => {
  assert.equal(Math.round(contrastRatio("#ffffff", "#000000")), 21);
});

test("背景に応じて読みやすい文字色を選ぶ", () => {
  assert.equal(readableTextColor("#0b1d3a"), "#ffffff");
  assert.equal(readableTextColor("#fde68a"), "#111111");
});

test("透明度付きの rgba を作る", () => {
  assert.equal(withAlpha("#ff0000", 0.5), "rgba(255, 0, 0, 0.5)");
});
