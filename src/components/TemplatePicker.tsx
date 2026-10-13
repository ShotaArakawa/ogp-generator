import { useEffect, useRef } from "react";
import type { DesignState } from "../lib/types.ts";
import { TEMPLATES } from "../lib/templates.ts";
import { renderDesign } from "../lib/render.ts";

type Props = {
  state: DesignState;
  onSelect: (templateId: string) => void;
};

// テンプレごとに、現在の文言で小さなサムネを描く
function Thumb({ state, templateId }: { state: DesignState; templateId: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const template = TEMPLATES.find((t) => t.id === templateId)!;
  useEffect(() => {
    if (!ref.current) return;
    const preview: DesignState = { ...state, ...template.defaults, templateId, sizeId: "ogp", background: template.defaults.background ?? "solid" };
    renderDesign(ref.current, preview, { scale: 0.2, plan: "pro", bgImage: null });
  }, [state.title, state.subtitle, state.author, state.fontFamily, templateId]); // eslint-disable-line react-hooks/exhaustive-deps
  return <canvas ref={ref} className="thumb" />;
}

export function TemplatePicker({ state, onSelect }: Props) {
  return (
    <div className="templates">
      {TEMPLATES.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`template ${state.templateId === t.id ? "active" : ""}`}
          onClick={() => onSelect(t.id)}
          aria-pressed={state.templateId === t.id}
        >
          <Thumb state={state} templateId={t.id} />
          <span>
            {t.name}
            {t.pro && <em className="pro">PRO</em>}
          </span>
        </button>
      ))}
    </div>
  );
}
