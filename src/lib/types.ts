export type SizePresetId = "ogp" | "x" | "youtube" | "square" | "note";

export type SizePreset = {
  id: SizePresetId;
  label: string;
  width: number;
  height: number;
};

export const SIZE_PRESETS: SizePreset[] = [
  { id: "ogp", label: "OGP(ブログ・Facebook)1200×630", width: 1200, height: 630 },
  { id: "x", label: "X(旧Twitter)カード 1200×675", width: 1200, height: 675 },
  { id: "youtube", label: "YouTube サムネ 1280×720", width: 1280, height: 720 },
  { id: "note", label: "note 見出し 1280×670", width: 1280, height: 670 },
  { id: "square", label: "正方形(Instagram)1080×1080", width: 1080, height: 1080 },
];

export type BackgroundMode = "solid" | "gradient" | "image";

export type DesignState = {
  templateId: string;
  sizeId: SizePresetId;
  title: string;
  subtitle: string;
  author: string;
  background: BackgroundMode;
  bgColor: string;
  bgColor2: string;
  textColor: string;
  accentColor: string;
  // 背景画像は object URL / data URL。保存対象外
  bgImage: string | null;
  bgDim: number; // 背景画像の暗さ 0〜0.8
  fontFamily: string;
  align: "left" | "center";
};

export type Plan = "free" | "pro";

export const FONT_OPTIONS = [
  { label: "ゴシック(標準)", value: '"Hiragino Kaku Gothic ProN", "Hiragino Sans", "Noto Sans JP", "Yu Gothic", "Meiryo", sans-serif' },
  { label: "明朝", value: '"Hiragino Mincho ProN", "Noto Serif JP", "Yu Mincho", serif' },
  { label: "丸ゴシック", value: '"Hiragino Maru Gothic ProN", "M PLUS Rounded 1c", "BIZ UDPGothic", sans-serif' },
];
