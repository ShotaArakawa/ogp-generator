import { test } from "node:test";
import assert from "node:assert/strict";
import { fitFontSize, tokenize, wrapText } from "./wrap.ts";

// 1文字 = 1 の幅として計測する
const byLength = (s: string) => [...s].length;

test("英単語は途中で分割しない", () => {
  assert.deepEqual(tokenize("Hello world"), ["Hello ", "world"]);
  assert.deepEqual(wrapText("Hello world", 8, byLength), ["Hello", "world"]);
});

test("日本語は1文字単位で折り返す", () => {
  assert.deepEqual(wrapText("あいうえおかきく", 5, byLength), ["あいうえお", "かきく"]);
});

test("句読点は行頭に来ない", () => {
  assert.deepEqual(wrapText("あいうえお。かき", 5, byLength), ["あいうえお。", "かき"]);
});

test("改行はそのまま行を分ける", () => {
  assert.deepEqual(wrapText("一行目\n二行目", 10, byLength), ["一行目", "二行目"]);
});

test("収まるまでフォントサイズを下げ、最小でも溢れたら省略する", () => {
  // 幅 = 文字数 × size / 10
  const measureAt = (size: number) => (s: string) => (byLength(s) * size) / 10;
  const fit = fitFontSize("あいうえおかきくけこ", 50, 1, { max: 100, min: 40 }, measureAt);
  assert.equal(fit.size, 50);
  assert.deepEqual(fit.lines, ["あいうえおかきくけこ"]);

  const over = fitFontSize("あいうえおかきくけこさしすせそ", 20, 1, { max: 40, min: 20 }, measureAt);
  assert.equal(over.size, 20);
  assert.equal(over.lines.length, 1);
  assert.ok(over.lines[0].endsWith("…"));
});
