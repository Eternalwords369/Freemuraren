import { cx } from "@/lib/utils";

/**
 * Märket för THE LIVING COSMOS: en sluten cirkel (helheten), en lutad bana
 * (rörelsen), en mittpunkt (iakttagaren) och en liten kropp på väg.
 */
export function CosmosMark({ className, animated = false }: { className?: string; animated?: boolean }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cx("shrink-0", className)}
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="24" cy="24" r="21" strokeWidth="1" opacity="0.9" />
      <circle cx="24" cy="24" r="13" strokeWidth="0.75" opacity="0.45" strokeDasharray="1.5 2.5" />
      <path d="M24 3 V45 M3 24 H45" strokeWidth="0.5" opacity="0.25" />
      <g className={animated ? "animate-orbit" : undefined} style={{ transformOrigin: "24px 24px" }}>
        <ellipse cx="24" cy="24" rx="21" ry="7.5" strokeWidth="1" transform="rotate(-28 24 24)" opacity="0.85" />
        <circle cx="42.4" cy="14.2" r="2.1" fill="currentColor" stroke="none" />
      </g>
      <circle cx="24" cy="24" r="2.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Tunna astronomiska linjer som dekor i sidhuvuden. */
export function OrbitDecor({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={cx("pointer-events-none select-none", className)}
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="200" cy="200" r="190" strokeWidth="0.6" opacity="0.5" />
      <circle cx="200" cy="200" r="140" strokeWidth="0.6" opacity="0.35" strokeDasharray="2 6" />
      <circle cx="200" cy="200" r="80" strokeWidth="0.6" opacity="0.4" />
      <ellipse cx="200" cy="200" rx="190" ry="62" strokeWidth="0.6" opacity="0.4" transform="rotate(-24 200 200)" />
      <path d="M200 0 V400 M0 200 H400" strokeWidth="0.4" opacity="0.2" />
      {Array.from({ length: 24 }, (_, i) => {
        const a = (i * 15 * Math.PI) / 180;
        const r1 = i % 6 === 0 ? 178 : 184;
        return (
          <line
            key={i}
            x1={(200 + r1 * Math.cos(a)).toFixed(2)}
            y1={(200 + r1 * Math.sin(a)).toFixed(2)}
            x2={(200 + 190 * Math.cos(a)).toFixed(2)}
            y2={(200 + 190 * Math.sin(a)).toFixed(2)}
            strokeWidth="0.6"
            opacity="0.5"
          />
        );
      })}
      <circle cx="374" cy="128" r="3" fill="currentColor" stroke="none" opacity="0.7" />
      <circle cx="200" cy="200" r="2.5" fill="currentColor" stroke="none" opacity="0.8" />
    </svg>
  );
}
