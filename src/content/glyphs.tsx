import type { ReactNode } from "react";

/**
 * Egenritade geometriska tecken för Symbollexikonet. Alla är enkla SVG-former
 * i en 100×100-ruta och ritas med currentColor så att de följer temat.
 */
export interface GlyphDef {
  name: string;
  label: string;
  draw: ReactNode;
}

function spiralPath(turns = 3.25, max = 38): string {
  const pts: string[] = [];
  const steps = 160;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * turns * Math.PI * 2;
    const r = (i / steps) * max;
    pts.push(`${(50 + r * Math.cos(t)).toFixed(2)},${(50 + r * Math.sin(t)).toFixed(2)}`);
  }
  return `M${pts.join(" L")}`;
}

function polygon(n: number, r: number, rotation = -90, cx = 50, cy = 50): string {
  return Array.from({ length: n }, (_, i) => {
    const a = ((rotation + (360 / n) * i) * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
}

function star(points: number, r: number): string {
  // Pentagram: förbind varannan punkt.
  const verts = Array.from({ length: points }, (_, i) => {
    const a = ((-90 + (360 / points) * i) * Math.PI) / 180;
    return [50 + r * Math.cos(a), 50 + r * Math.sin(a)] as const;
  });
  const order = Array.from({ length: points }, (_, i) => verts[(i * 2) % points]!);
  return `M${order.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" L")} Z`;
}

const seedCircles = [0, 60, 120, 180, 240, 300].map((deg) => {
  const a = (deg * Math.PI) / 180;
  return { cx: 50 + 16 * Math.cos(a), cy: 50 + 16 * Math.sin(a) };
});

export const GLYPHS: GlyphDef[] = [
  { name: "circle", label: "Cirkel", draw: <circle cx="50" cy="50" r="36" /> },
  {
    name: "circumpunct",
    label: "Cirkumpunkt",
    draw: (
      <>
        <circle cx="50" cy="50" r="36" />
        <circle cx="50" cy="50" r="4" fill="currentColor" />
      </>
    ),
  },
  {
    name: "vesica",
    label: "Vesica piscis",
    draw: (
      <>
        <circle cx="39" cy="50" r="22" />
        <circle cx="61" cy="50" r="22" />
      </>
    ),
  },
  { name: "triangle", label: "Triangel uppåt", draw: <polygon points={polygon(3, 38)} /> },
  { name: "triangle-down", label: "Triangel nedåt", draw: <polygon points={polygon(3, 38, 90)} /> },
  { name: "square", label: "Kvadrat", draw: <rect x="22" y="22" width="56" height="56" /> },
  {
    name: "square-circle",
    label: "Kvadrat i cirkel",
    draw: (
      <>
        <circle cx="50" cy="50" r="38" />
        <rect x="23.13" y="23.13" width="53.74" height="53.74" />
      </>
    ),
  },
  {
    name: "hexagram",
    label: "Hexagram",
    draw: (
      <>
        <polygon points={polygon(3, 38)} />
        <polygon points={polygon(3, 38, 90)} />
      </>
    ),
  },
  { name: "pentagram", label: "Pentagram", draw: <path d={star(5, 38)} /> },
  {
    name: "ouroboros",
    label: "Ouroboros",
    draw: (
      <>
        <path d="M 72 26 A 34 34 0 1 1 61.5 18" strokeWidth="5" />
        <path d="M 58 12 L 75 22 L 61 28 Z" fill="currentColor" strokeLinejoin="round" />
        <circle cx="50" cy="50" r="26" opacity="0.35" />
      </>
    ),
  },
  { name: "spiral", label: "Spiral", draw: <path d={spiralPath()} /> },
  {
    name: "crescent",
    label: "Månskära",
    draw: <path d="M 62 16 A 36 36 0 1 0 62 84 A 28 28 0 1 1 62 16 Z" />,
  },
  {
    name: "cross",
    label: "Likarmat kors i cirkel",
    draw: (
      <>
        <circle cx="50" cy="50" r="36" />
        <path d="M50 14 V86 M14 50 H86" />
      </>
    ),
  },
  {
    name: "lemniscate",
    label: "Lemniskata",
    draw: <path d="M50 50 C 38 30, 14 30, 14 50 C 14 70, 38 70, 50 50 C 62 30, 86 30, 86 50 C 86 70, 62 70, 50 50 Z" />,
  },
  {
    name: "seed",
    label: "Sju cirklar",
    draw: (
      <>
        <circle cx="50" cy="50" r="16" />
        {seedCircles.map((c, i) => (
          <circle key={i} cx={c.cx.toFixed(2)} cy={c.cy.toFixed(2)} r="16" />
        ))}
      </>
    ),
  },
  {
    name: "axis",
    label: "Axel och horisont",
    draw: (
      <>
        <path d="M50 10 V90" />
        <ellipse cx="50" cy="56" rx="36" ry="10" />
        <circle cx="50" cy="28" r="6" />
      </>
    ),
  },
];

export const GLYPH_BY_NAME = new Map(GLYPHS.map((g) => [g.name, g]));
