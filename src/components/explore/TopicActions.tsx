"use client";

import { Check, CircleHelp, Compass, FilePlus2 } from "lucide-react";
import Link from "next/link";
import type { ExploreTopic } from "@/content/explore";
import { INVESTIGATION_STATUS, TOPIC_LABEL } from "@/lib/constants";
import { useCodex } from "@/lib/db/client";
import type { TopicId } from "@/lib/types";
import { useToast } from "../ui/Feedback";

export function TopicActions({ topic }: { topic: ExploreTopic }) {
  const { state, store } = useCodex();
  const toast = useToast();
  const ready = state.status === "ready";
  const existing = ready ? state.db.data.investigations.find((i) => i.exploreSlug === topic.slug) : undefined;

  const investigate = () => {
    const res = store.investigations.create({
      title: topic.title,
      note: "",
      status: "planerad",
      exploreSlug: topic.slug,
    });
    toast(res.ok ? "Ämnet finns nu under Min resa." : res.error, res.ok ? "success" : "error");
  };

  const q = (type: string) =>
    `/arkiv?ny=${type}&amne=${topic.category}&titel=${encodeURIComponent(type === "fragestallning" ? "" : topic.title)}`;

  return (
    <div className="mt-7 flex flex-wrap gap-2">
      {existing ? (
        <Link href="/resa#undersokningar" className="btn btn-secondary">
          <Check size={16} className="text-success" aria-hidden="true" />
          {INVESTIGATION_STATUS.find((s) => s.id === existing.status)?.label} · Min resa
        </Link>
      ) : (
        <button type="button" className="btn btn-primary" onClick={investigate} disabled={!ready}>
          <Compass size={16} aria-hidden="true" /> Undersök ämnet
        </button>
      )}
      <Link href={q("anteckning")} className="btn btn-secondary">
        <FilePlus2 size={16} aria-hidden="true" /> Anteckning om ämnet
      </Link>
      <Link href={q("fragestallning")} className="btn btn-ghost">
        <CircleHelp size={16} aria-hidden="true" /> Formulera en fråga
      </Link>
    </div>
  );
}

export function TopicMaterial({ category }: { category: TopicId }) {
  const { state } = useCodex();
  if (state.status !== "ready") return null;
  const items = [...state.db.data.sources, ...state.db.data.notes].filter((i) => i.topics.includes(category));
  return (
    <section aria-labelledby="mat-h">
      <h2 id="mat-h" className="mb-2 text-[1.35rem]">
        I ditt arkiv
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-ink-3">Inga poster i kategorin {TOPIC_LABEL[category].toLowerCase()} ännu.</p>
      ) : (
        <>
          <ul className="space-y-1.5 text-sm">
            {items.slice(0, 5).map((i) => (
              <li key={i.id}>
                <Link href={`/arkiv/${i.id}`} className="text-ink hover:text-gold-strong">
                  {i.title}
                </Link>
                {i.isExample && <span className="ml-2 text-xs text-gold">Exempel</span>}
              </li>
            ))}
          </ul>
          <Link href={`/arkiv?amne=${category}`} className="mt-2 inline-block text-sm text-gold hover:underline">
            Visa alla {items.length} i arkivet
          </Link>
        </>
      )}
    </section>
  );
}
