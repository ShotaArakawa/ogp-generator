import type { DesignState } from "./types.ts";
import { FONT_OPTIONS } from "./types.ts";

export const DEFAULT_STATE: DesignState = {
  templateId: "simple",
  sizeId: "ogp",
  title: "ブログのOGP画像を、30秒で作る方法",
  subtitle: "TIPS",
  author: "@your_name",
  background: "gradient",
  bgColor: "#1e3a8a",
  bgColor2: "#7c3aed",
  textColor: "#ffffff",
  accentColor: "#fbbf24",
  bgImage: null,
  bgDim: 0.45,
  fontFamily: FONT_OPTIONS[0].value,
  align: "center",
};

// 保存先の差し替えポイント(将来は Supabase 等でクラウド保存)
export interface DesignStore {
  load(): DesignState | null;
  save(state: DesignState): void;
}

const KEY = "ogp-generator:v1";

export const localDesignStore: DesignStore = {
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return { ...DEFAULT_STATE, ...(JSON.parse(raw) as Partial<DesignState>), bgImage: null };
    } catch {
      return null;
    }
  },
  save(state) {
    try {
      // 背景画像は容量が大きいので保存しない
      const { bgImage: _omit, ...rest } = state;
      void _omit;
      localStorage.setItem(KEY, JSON.stringify(rest));
    } catch {
      // 保存できない環境(プライベートブラウズ等)では何もしない
    }
  },
};
