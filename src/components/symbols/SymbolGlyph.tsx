import { GLYPH_BY_NAME } from "@/content/glyphs";
import type { GlyphRef } from "@/lib/types";
import { cx } from "@/lib/utils";

export function SymbolGlyph({ glyph, className, label }: { glyph: GlyphRef; className?: string; label?: string }) {
  const a11y = label ? { role: "img" as const, "aria-label": label } : { "aria-hidden": true as const };
  if (glyph.kind === "character") {
    return (
      <span className={cx("grid place-items-center font-display leading-none", className)} {...a11y}>
        <span className="text-[0.62em]">{glyph.value}</span>
      </span>
    );
  }
  const def = GLYPH_BY_NAME.get(glyph.name) ?? GLYPH_BY_NAME.get("circle")!;
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      {...a11y}
    >
      {def.draw}
    </svg>
  );
}
