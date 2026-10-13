// テキストの折り返し。Canvas に依存しないよう、幅の計測関数を外から受け取る。

export type Measure = (text: string) => number;

// 行頭に来てはいけない文字(簡易な禁則処理)
const NO_LINE_START = "、。,.,.)」』】〕〉》!?!?ーぁぃぅぇぉっゃゅょァィゥェォッャュョ・:;:;";

// 英単語は途中で切らず、それ以外(日本語など)は1文字単位で区切る
export function tokenize(text: string): string[] {
  return text.match(/[A-Za-z0-9'’\-_.@#/]+\s*|\s+|./gu) ?? [];
}

export function wrapText(text: string, maxWidth: number, measure: Measure): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const token of tokenize(paragraph)) {
      const candidate = line + token;
      if (line === "" || measure(candidate.trimEnd()) <= maxWidth) {
        line = candidate;
        continue;
      }
      // 禁則文字は前の行にぶら下げる
      if (NO_LINE_START.includes(token)) {
        line = candidate;
        continue;
      }
      lines.push(line.trimEnd());
      line = token.trimStart();
    }
    lines.push(line.trimEnd());
  }
  return lines;
}

// 指定の行数に収まる最大のフォントサイズを探す(大きい方から順に試す)
export function fitFontSize(
  text: string,
  maxWidth: number,
  maxLines: number,
  sizes: { max: number; min: number },
  measureAt: (size: number) => Measure,
): { size: number; lines: string[] } {
  for (let size = sizes.max; size > sizes.min; size -= 2) {
    const lines = wrapText(text, maxWidth, measureAt(size));
    if (lines.length <= maxLines) return { size, lines };
  }
  const lines = wrapText(text, maxWidth, measureAt(sizes.min));
  if (lines.length <= maxLines) return { size: sizes.min, lines };
  // 最小サイズでも収まらない場合は末尾を省略
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = kept[maxLines - 1].replace(/.?$/u, "…");
  return { size: sizes.min, lines: kept };
}
