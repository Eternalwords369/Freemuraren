import { describe, expect, it } from "vitest";
import { layoutGraph } from "@/lib/graph";

describe("layoutGraph", () => {
  it("placerar alla noder inom ramen och är deterministisk", () => {
    const nodes = Array.from({ length: 12 }, (_, i) => ({ id: `n${i}` }));
    const edges = nodes.slice(1).map((n, i) => ({ source: `n${i}`, target: n.id }));
    const a = layoutGraph(nodes, edges, { width: 800, height: 600 });
    const b = layoutGraph(nodes, edges, { width: 800, height: 600 });
    expect(a.size).toBe(12);
    for (const [id, p] of a) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(800);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(600);
      expect(b.get(id)).toEqual(p);
    }
  });

  it("tål tomma grafer och relationer till okända noder", () => {
    expect(layoutGraph([], []).size).toBe(0);
    expect(layoutGraph([{ id: "a" }], [{ source: "a", target: "x" }]).get("a")).toBeDefined();
  });
});
