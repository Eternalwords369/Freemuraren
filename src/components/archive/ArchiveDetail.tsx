"use client";

import { ArrowLeft, CheckCircle2, CircleDot, ExternalLink, FilePlus2, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ARCHIVE_TYPE_LABEL, EPISTEMIC, TOPIC_LABEL } from "@/lib/constants";
import type { CodexStore } from "@/lib/db/store";
import type { ArchiveItem } from "@/lib/types";
import { formatDate, isValidHttpUrl } from "@/lib/utils";
import { RelationsPanel } from "../relations/RelationsPanel";
import { DataGate } from "../ui/DataGate";
import { EmptyState, EpistemicBadge, ExampleBadge, TagList, TextLink, TypeBadge } from "../ui/Display";
import { useConfirm, useToast } from "../ui/Feedback";
import { ArchiveEditor } from "./ArchiveEditor";

export function ArchiveDetail({ id }: { id: string }) {
  return (
    <DataGate>
      {(_, store) => {
        const item: ArchiveItem | undefined = store.sources.getById(id) ?? store.notes.getById(id);
        if (!item)
          return (
            <EmptyState
              title="Posten finns inte"
              action={
                <Link href="/arkiv" className="btn btn-secondary">
                  Till kunskapsarkivet
                </Link>
              }
            >
              Den kan ha raderats, eller så pekar länken på material som inte finns i den här webbläsaren.
            </EmptyState>
          );
        return <DetailBody item={item} store={store} />;
      }}
    </DataGate>
  );
}

function DetailBody({ item, store }: { item: ArchiveItem; store: CodexStore }) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const ref = { kind: item.entity, id: item.id } as const;

  useEffect(() => {
    store.touch({ kind: ref.kind, id: ref.id });
  }, [store, ref.kind, ref.id]);

  const tags = store.tags.namesFor(item.tagIds);
  const source = item.entity === "note" && item.sourceId ? store.sources.getById(item.sourceId) : undefined;
  const linkedNotes = item.entity === "source" ? store.notes.getAll().filter((n) => n.sourceId === item.id) : [];
  const relationCount = store.relations.forNode(ref).length;

  const remove = async () => {
    const ok = await confirm({
      title: `Radera ”${item.title}”?`,
      message: (
        <>
          Posten raderas permanent från den här webbläsaren
          {relationCount > 0 && ` tillsammans med ${relationCount} ${relationCount === 1 ? "koppling" : "kopplingar"}`}.
          {linkedNotes.length > 0 && ` ${linkedNotes.length} anteckningar behålls men förlorar sin källhänvisning.`} Det går inte
          att ångra.
        </>
      ),
      confirmLabel: "Radera posten",
      tone: "danger",
    });
    if (!ok) return;
    const res = item.entity === "source" ? store.sources.delete(item.id) : store.notes.delete(item.id);
    if (!res.ok) return toast(res.error, "error");
    toast("Posten är raderad.");
    router.push("/arkiv");
  };

  const toggleStatus = () => {
    if (item.entity !== "note") return;
    const next = item.status === "besvarad" ? "oppen" : "besvarad";
    const res = store.notes.setStatus(item.id, next);
    toast(res.ok ? (next === "besvarad" ? "Markerad som besvarad." : "Markerad som öppen igen.") : res.error, res.ok ? "success" : "error");
  };

  const isQuestion = item.entity === "note" && (item.type === "fragestallning" || item.type === "hypotes");
  const epi = item.epistemic ? EPISTEMIC.find((e) => e.id === item.epistemic) : undefined;

  return (
    <article className="animate-rise">
      <TextLink href="/arkiv" className="mb-6">
        <ArrowLeft size={16} aria-hidden="true" /> Kunskapsarkiv
      </TextLink>

      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <TypeBadge type={item.type} />
          {item.epistemic && <EpistemicBadge category={item.epistemic} />}
          {item.isExample && <ExampleBadge />}
          {isQuestion && <span className="badge">{item.entity === "note" && item.status === "besvarad" ? "Besvarad" : "Öppen"}</span>}
        </div>
        <h1 className="mt-4 text-[2.4rem] text-ink sm:text-5xl">{item.title}</h1>
        {(item.author || (item.entity === "source" && (item.year || item.publication))) && (
          <p className="mt-3 text-lg text-ink-2">
            {[item.author, item.entity === "source" ? item.publication : undefined, item.entity === "source" ? item.year : undefined]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" className="btn btn-secondary" onClick={() => setEditing(true)}>
            <Pencil size={16} aria-hidden="true" /> Redigera
          </button>
          {isQuestion && (
            <button type="button" className="btn btn-secondary" onClick={toggleStatus}>
              {item.entity === "note" && item.status === "besvarad" ? (
                <>
                  <CircleDot size={16} aria-hidden="true" /> Markera som öppen
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} aria-hidden="true" /> Markera som besvarad
                </>
              )}
            </button>
          )}
          {item.entity === "source" && (
            <Link href={`/arkiv?ny=anteckning&kalla=${encodeURIComponent(item.id)}`} className="btn btn-secondary">
              <FilePlus2 size={16} aria-hidden="true" /> Anteckning om källan
            </Link>
          )}
          <button type="button" className="btn btn-danger" onClick={remove}>
            <Trash2 size={16} aria-hidden="true" /> Radera
          </button>
        </div>
        {item.isExample && (
          <p className="mt-4 max-w-[60ch] text-sm text-ink-3">
            Exempelmaterial som visar hur arkivet fungerar. Uppgifterna är kontrollerade men utgör inte forskningsresultat.
          </p>
        )}
      </header>

      <div className="hairline my-8" />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-10">
          {item.content ? (
            <section aria-label={item.entity === "source" ? "Sammanfattning" : "Innehåll"}>
              {item.type === "citat" ? (
                <blockquote className="border-l-2 border-gold pl-5 font-display text-2xl leading-snug text-ink">
                  {item.content}
                </blockquote>
              ) : (
                <div className="prose-codex whitespace-pre-line">{item.content}</div>
              )}
            </section>
          ) : (
            <p className="text-ink-3">Inget innehåll ännu.</p>
          )}

          {item.comment && (
            <section aria-labelledby="comment-h" className="rounded-[var(--radius-lg)] border border-line bg-surface p-5">
              <h2 id="comment-h" className="eyebrow">
                Personlig kommentar
              </h2>
              <p className="prose-codex mt-2 whitespace-pre-line text-ink-2">{item.comment}</p>
            </section>
          )}

          {linkedNotes.length > 0 && (
            <section aria-labelledby="linked-h">
              <h2 id="linked-h" className="mb-3 text-[1.5rem]">
                Anteckningar från källan
              </h2>
              <ul className="space-y-2">
                {linkedNotes.map((n) => (
                  <li key={n.id}>
                    <Link href={`/arkiv/${n.id}`} className="card card-link flex items-center justify-between gap-3 px-4 py-3">
                      <span className="text-ink">{n.title}</span>
                      <span className="meta">{ARCHIVE_TYPE_LABEL[n.type]}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <RelationsPanel node={ref} />
        </div>

        <aside className="space-y-6 text-sm" aria-label="Uppgifter om posten">
          {epi && (
            <div className="card p-4">
              <p className="eyebrow">{epi.label}</p>
              <p className="mt-2 text-ink-2">{epi.question}</p>
              <TextLink href="/metod" className="mt-2">
                Om kunskapskategorierna
              </TextLink>
            </div>
          )}
          <dl className="space-y-4">
            {item.url && (
              <div>
                <dt className="meta">Källa eller URL</dt>
                <dd className="mt-1 break-words">
                  {isValidHttpUrl(item.url) ? (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-gold hover:underline">
                      {item.url.replace(/^https?:\/\//, "")}
                      <ExternalLink size={14} aria-hidden="true" />
                      <span className="sr-only">(öppnas i ny flik)</span>
                    </a>
                  ) : (
                    item.url
                  )}
                </dd>
              </div>
            )}
            {source && (
              <div>
                <dt className="meta">Hämtad från</dt>
                <dd className="mt-1">
                  <Link href={`/arkiv/${source.id}`} className="text-gold hover:underline">
                    {source.title}
                  </Link>
                </dd>
              </div>
            )}
            {item.topics.length > 0 && (
              <div>
                <dt className="meta">Ämnen</dt>
                <dd className="mt-1 text-ink-2">{item.topics.map((t) => TOPIC_LABEL[t]).join(", ")}</dd>
              </div>
            )}
            {tags.length > 0 && (
              <div>
                <dt className="meta">Taggar</dt>
                <dd className="mt-1">
                  <TagList names={tags} className="text-ink-2" />
                </dd>
              </div>
            )}
            <div>
              <dt className="meta">Skapad</dt>
              <dd className="mt-1 text-ink-2">{formatDate(item.createdAt)}</dd>
            </div>
            <div>
              <dt className="meta">Senast uppdaterad</dt>
              <dd className="mt-1 text-ink-2">{formatDate(item.updatedAt)}</dd>
            </div>
          </dl>
        </aside>
      </div>

      <ArchiveEditor open={editing} item={item} onClose={() => setEditing(false)} />
    </article>
  );
}
