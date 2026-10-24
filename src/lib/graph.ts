/**
 * Liten, deterministisk kraftbaserad layout (Fruchterman–Reingold) för
 * Kunskapskartan. Räcker gott för några hundra noder och kräver inget
 * externt visualiseringsbibliotek.
 */
export interface LayoutNode {
  id: string;
}
export interface LayoutEdge {
  source: string;
  target: string;
}
export interface Point {
  x: number;
  y: number;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function layoutGraph(
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  {
    width = 1000,
    height = 700,
    iterations = 320,
    padX = 90,
    padY = 40,
  }: { width?: number; height?: number; iterations?: number; padX?: number; padY?: number } = {},
): Map<string, Point> {
  const pos = new Map<string, Point>();
  const n = nodes.length;
  if (n === 0) return pos;
  const cx = width / 2;
  const cy = height / 2;

  // Startpositioner: stabila per ID så att kartan inte hoppar mellan besök.
  nodes.forEach((node, i) => {
    const h = hash(node.id);
    const angle = (i / n) * Math.PI * 2 + (h % 1000) / 1000;
    const r = Math.min(width, height) * (0.2 + ((h >> 10) % 1000) / 4000);
    pos.set(node.id, { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
  });
  if (n === 1) {
    pos.set(nodes[0]!.id, { x: cx, y: cy });
    return pos;
  }

  const area = width * height;
  // Önskat avstånd mellan noder, begränsat så att etiketter får plats även i små grafer.
  const k = Math.min(160, Math.max(90, Math.sqrt(area / n) * 0.55));
  const valid = edges.filter((e) => pos.has(e.source) && pos.has(e.target) && e.source !== e.target);
  let temp = width / 8;
  const cool = temp / (iterations + 1);
  const ids = nodes.map((x) => x.id);

  for (let it = 0; it < iterations; it++) {
    const disp = new Map<string, Point>(ids.map((id) => [id, { x: 0, y: 0 }]));

    for (let i = 0; i < n; i++) {
      const a = pos.get(ids[i]!)!;
      const da = disp.get(ids[i]!)!;
      for (let j = i + 1; j < n; j++) {
        const b = pos.get(ids[j]!)!;
        const db = disp.get(ids[j]!)!;
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let dist = Math.hypot(dx, dy);
        if (dist < 0.01) {
          dx = 0.01 * (i - j);
          dy = 0.01;
          dist = 0.015;
        }
        const force = (k * k) / dist;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        da.x += fx;
        da.y += fy;
        db.x -= fx;
        db.y -= fy;
      }
    }

    for (const e of valid) {
      const a = pos.get(e.source)!;
      const b = pos.get(e.target)!;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.max(Math.hypot(dx, dy), 0.01);
      const force = (dist * dist) / k;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      disp.get(e.source)!.x -= fx;
      disp.get(e.source)!.y -= fy;
      disp.get(e.target)!.x += fx;
      disp.get(e.target)!.y += fy;
    }

    for (const id of ids) {
      const p = pos.get(id)!;
      const d = disp.get(id)!;
      // Dragning mot mitten håller ihop grafen, även delar som saknar kopplingar.
      d.x += (cx - p.x) * 0.08;
      d.y += (cy - p.y) * 0.08;
      const len = Math.max(Math.hypot(d.x, d.y), 0.01);
      p.x += (d.x / len) * Math.min(len, temp);
      p.y += (d.y / len) * Math.min(len, temp);
    }
    temp = Math.max(temp - cool, 0.5);
  }
  fitToFrame(pos, width, height, padX, padY);
  return resolveOverlaps(pos, width, height, padX, padY);
}

/**
 * Skjuter isär noder vars etikettrutor överlappar. Varje nod behandlas som en
 * rektangel (symbol plus etikett under) och flyttas längs den axel där
 * överlappet är minst.
 */
function resolveOverlaps(pos: Map<string, Point>, width: number, height: number, padX: number, padY: number): Map<string, Point> {
  const boxW = Math.min(150, Math.max(116, width / 3));
  const boxH = 48;
  const pts = [...pos.values()];
  for (let pass = 0; pass < 80; pass++) {
    let moved = false;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i]!;
        const b = pts[j]!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const ox = boxW - Math.abs(dx);
        const oy = boxH - Math.abs(dy);
        if (ox <= 0 || oy <= 0) continue;
        moved = true;
        if (ox / boxW < oy / boxH) {
          const push = (ox / 2 + 0.5) * (dx >= 0 ? 1 : -1);
          a.x -= push;
          b.x += push;
        } else {
          const push = (oy / 2 + 0.5) * (dy >= 0 ? 1 : -1);
          a.y -= push;
          b.y += push;
        }
      }
    }
    for (const p of pts) {
      p.x = Math.min(width - boxW / 2, Math.max(boxW / 2, p.x));
      p.y = Math.min(height - padY, Math.max(padY * 0.6, p.y));
    }
    if (!moved) break;
  }
  return pos;
}

/** Skalar och centrerar layouten så att den fyller ytan med marginal för etiketter. */
function fitToFrame(pos: Map<string, Point>, width: number, height: number, padX: number, padY: number): Map<string, Point> {
  const pts = [...pos.values()];
  const minX = Math.min(...pts.map((p) => p.x));
  const maxX = Math.max(...pts.map((p) => p.x));
  const minY = Math.min(...pts.map((p) => p.y));
  const maxY = Math.max(...pts.map((p) => p.y));
  const spanX = Math.max(maxX - minX, 1);
  const spanY = Math.max(maxY - minY, 1);
  const availX = width - padX * 2;
  const availY = height - padY * 2;
  // Samma skala på båda axlarna bevarar avstånden, men ytan ska ändå utnyttjas.
  const scale = Math.min(availX / spanX, availY / spanY, 1.6);
  const offX = padX + (availX - spanX * scale) / 2;
  const offY = padY + (availY - spanY * scale) / 2;
  for (const p of pts) {
    p.x = offX + (p.x - minX) * scale;
    p.y = offY + (p.y - minY) * scale;
  }
  return pos;
}
