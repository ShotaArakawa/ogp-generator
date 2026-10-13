import { test } from "node:test";
import assert from "node:assert/strict";
import { exportScale, fileNameFor, needsWatermark, sizeOf } from "./render.ts";
import { DEFAULT_STATE } from "./storage.ts";

test("サイズプリセットを引き当てる", () => {
  assert.deepEqual(sizeOf({ ...DEFAULT_STATE, sizeId: "youtube" }).width, 1280);
});

test("有料プランだけ 2x で書き出す", () => {
  assert.equal(exportScale("free"), 1);
  assert.equal(exportScale("pro"), 2);
});

test("無料プランで PRO テンプレを使った時だけ透かしが入る", () => {
  assert.equal(needsWatermark({ ...DEFAULT_STATE, templateId: "simple" }, "free"), false);
  assert.equal(needsWatermark({ ...DEFAULT_STATE, templateId: "split" }, "free"), true);
  assert.equal(needsWatermark({ ...DEFAULT_STATE, templateId: "split" }, "pro"), false);
});

test("ファイル名から使えない文字を除き、サイズを付ける", () => {
  const name = fileNameFor({ ...DEFAULT_STATE, title: 'A/B: "比較"\n記事', sizeId: "ogp" }, 2);
  assert.equal(name, "AB 比較記事_2400x1260.png");
});
