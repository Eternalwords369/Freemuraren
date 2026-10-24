import { EXPLORE_TOPICS } from "@/content/explore";
import { ARCHIVE_TYPE_LABEL } from "./constants";
import type { CodexData } from "./db/schema";
import type { NodeRef } from "./types";
import { excerpt, matchScore } from "./utils";

export function hrefForRef(ref: NodeRef): string {
  switch (ref.kind) {
    case "source":
    case "note":
      return `/arkiv/${encodeURIComponent(ref.id)}`;
    case "symbol":
      return `/symboler/${encodeURIComponent(ref.id)}`;
    case "concept":
      return `/karta?nod=${encodeURIComponent(`concept:${ref.id}`)}`;
  }
}

export interface SearchHit {
  key: string;
  group: string;
  title: string;
  subtitle: string;
  href: string;
  score: number;
  isExample?: boolean;
}

/** Söker i allt personligt sparat material samt i Utforska. */
export function searchAll(data: CodexData, query: string, limitPerGroup = 6): SearchHit[] {
  const q = query.trim();
  if (!q) return [];
  const hits: SearchHit[] = [];
  const push = (h: Omit<SearchHit, "score">, score: number) => {
    if (score > 0) hits.push({ ...h, score });
  };

  for (const s of data.sources)
    push(
      {
        key: s.id,
        group: "Kunskapsarkiv",
        title: s.title,
        subtitle: [ARCHIVE_TYPE_LABEL[s.type], s.author].filter(Boolean).join(" · "),
        href: hrefForRef({ kind: "source", id: s.id }),
        isExample: s.isExample,
      },
      matchScore(q, s.title, s.author, s.content, s.comment, s.publication),
    );
  for (const n of data.notes)
    push(
      {
        key: n.id,
        group: "Kunskapsarkiv",
        title: n.title,
        subtitle: [ARCHIVE_TYPE_LABEL[n.type], excerpt(n.content, 70)].filter(Boolean).join(" · "),
        href: hrefForRef({ kind: "note", id: n.id }),
        isExample: n.isExample,
      },
      matchScore(q, n.title, n.author, n.content, n.comment),
    );
  for (const s of data.symbols)
    push(
      {
        key: s.id,
        group: "Symbollexikon",
        title: s.name,
        subtitle: excerpt(s.description, 80),
        href: hrefForRef({ kind: "symbol", id: s.id }),
        isExample: s.isExample,
      },
      matchScore(q, s.name, s.description, s.historicalContext, s.personalInterpretation, s.relatedConcepts.join(" ")),
    );
  for (const c of data.concepts)
    push(
      {
        key: c.id,
        group: "Begrepp",
        title: c.name,
        subtitle: excerpt(c.description, 80),
        href: hrefForRef({ kind: "concept", id: c.id }),
        isExample: c.isExample,
      },
      matchScore(q, c.name, c.description),
    );
  for (const g of data.goals)
    push(
      { key: g.id, group: "Min resa", title: g.title, subtitle: "Lärandemål", href: `/resa#mal-${g.id}` },
      matchScore(q, g.title, g.description, g.milestones.map((m) => m.title).join(" ")),
    );
  for (const j of data.journal)
    push(
      {
        key: j.id,
        group: "Min resa",
        title: j.title || excerpt(j.body, 50),
        subtitle: "Reflektion",
        href: `/resa?reflektion=${encodeURIComponent(j.id)}#journal`,
      },
      matchScore(q, j.title, j.body),
    );
  for (const i of data.investigations)
    push(
      { key: i.id, group: "Min resa", title: i.title, subtitle: "Undersökning", href: "/resa#undersokningar" },
      matchScore(q, i.title, i.note),
    );
  for (const t of EXPLORE_TOPICS)
    push(
      { key: `explore-${t.slug}`, group: "Utforska", title: t.title, subtitle: excerpt(t.summary, 80), href: `/utforska/${t.slug}` },
      matchScore(q, t.title, t.summary),
    );

  const byGroup = new Map<string, SearchHit[]>();
  for (const h of hits.sort((a, b) => b.score - a.score)) {
    const list = byGroup.get(h.group) ?? [];
    if (list.length < limitPerGroup) list.push(h);
    byGroup.set(h.group, list);
  }
  return [...byGroup.values()].flat();
}
