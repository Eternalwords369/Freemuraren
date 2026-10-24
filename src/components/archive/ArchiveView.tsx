"use client";

import { Library, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ARCHIVE_TYPE_LABEL,
  ARCHIVE_TYPES,
  EPISTEMIC,
  TOPICS,
  TOPIC_LABEL,
} from "@/lib/constants";
import type { CodexData } from "@/lib/db/schema";
import type { CodexStore } from "@/lib/db/store";
import type { ArchiveItem, ArchiveType, EpistemicCategory, TopicId } from "@/lib/types";
import { compareSv, cx, excerpt, formatDate, matchScore } from "@/lib/utils";
import { DataGate } from "../ui/DataGate";
import { EmptyState, EpistemicBadge, ExampleBadge, PageHeader, TagList, TypeBadge } from "../ui/Display";
import { ArchiveEditor, type ArchiveDefaults } from "./ArchiveEditor";

type SortKey = "uppdaterad" | "skapad" | "titel";

export function ArchiveView() {
  return <DataGate>{(data, store) => <ArchiveBrowser data={data} store={store} />}</DataGate>;
}

function ArchiveBrowser({ data, store }: { data: CodexData; store: CodexStore }) {
  const params = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [types, setTypes] = useState<ArchiveType[]>([]);
  const [topic, setTopic] = useState<TopicId | "">(() => {
    const amne = params.get("amne");
    return !params.get("ny") && amne && TOPICS.some((t) => t.id === amne) ? (amne as TopicId) : "";
  });
  const [tagId, setTagId] = useState("");
  const [epistemic, setEpistemic] = useState<EpistemicCategory | "">("");
  const [sort, setSort] = useState<SortKey>("uppdaterad");
  const [showExamples, setShowExamples] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // ?ny=<typ> öppnar redigeraren direkt, t.ex. från genvägar i resten av appen.
  const newParam = params.get("ny");
  const editorDefaults = useMemo<ArchiveDefaults | null>(() => {
    if (!newParam) return null;
    const type = (ARCHIVE_TYPES as string[]).includes(newParam) ? (newParam as ArchiveType) : "anteckning";
    const amne = params.get("amne");
    const kalla = params.get("kalla");
    return {
      type,
      topics: amne && TOPICS.some((t) => t.id === amne) ? [amne as TopicId] : [],
      sourceId: kalla && store.sources.getById(kalla) ? kalla : undefined,
      title: params.get("titel") ?? undefined,
    };
  }, [newParam, params, store]);

  const [manualEditor, setManualEditor] = useState(false);
  const editorOpen = manualEditor || Boolean(editorDefaults);

  const closeEditor = () => {
    setManualEditor(false);
    if (newParam) router.replace("/arkiv", { scroll: false });
  };

  const items: ArchiveItem[] = useMemo(() => [...data.sources, ...data.notes], [data.sources, data.notes]);
  const tagNames = useMemo(() => new Map(data.tags.map((t) => [t.id, t.name])), [data.tags]);

  const results = useMemo(() => {
    const filtered = items
      .filter((i) => showExamples || !i.isExample)
      .filter((i) => types.length === 0 || types.includes(i.type))
      .filter((i) => !topic || i.topics.includes(topic))
      .filter((i) => !tagId || i.tagIds.includes(tagId))
      .filter((i) => !epistemic || i.epistemic === epistemic)
      .map((i) => ({
        item: i,
        score: query.trim()
          ? matchScore(query, i.title, i.author, i.content, i.comment, i.tagIds.map((t) => tagNames.get(t) ?? "").join(" "))
          : 1,
      }))
      .filter((r) => r.score > 0);

    filtered.sort((a, b) => {
      if (query.trim() && a.score !== b.score) return b.score - a.score;
      if (sort === "titel") return compareSv(a.item.title, b.item.title);
      if (sort === "skapad") return b.item.createdAt.localeCompare(a.item.createdAt);
      return b.item.updatedAt.localeCompare(a.item.updatedAt);
    });
    return filtered.map((r) => r.item);
  }, [items, showExamples, types, topic, tagId, epistemic, query, sort, tagNames]);

  const activeFilterCount = types.length + (topic ? 1 : 0) + (tagId ? 1 : 0) + (epistemic ? 1 : 0) + (showExamples ? 0 : 1);
  const clearFilters = () => {
    setTypes([]);
    setTopic("");
    setTagId("");
    setEpistemic("");
    setShowExamples(true);
    setQuery("");
  };

  const toggleType = (t: ArchiveType) => setTypes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const usedTags = data.tags.filter((t) => items.some((i) => i.tagIds.includes(t.id))).sort((a, b) => compareSv(a.name, b.name));

  return (
    <>
      <PageHeader
        eyebrow="Kunskapsarkiv"
        title="Ditt bibliotek"
        lead="Källor, böcker, citat, anteckningar, frågor och hypoteser – samlade, sökbara och kopplade till varandra."
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setManualEditor(true)}>
            <Plus size={16} aria-hidden="true" /> Ny post
          </button>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={<Library size={32} strokeWidth={1.3} aria-hidden="true" />}
          title="Arkivet är tomt"
          action={
            <>
              <button type="button" className="btn btn-primary" onClick={() => setManualEditor(true)}>
                <Plus size={16} aria-hidden="true" /> Lägg till din första post
              </button>
              <Link href="/installningar#exempel" className="btn btn-secondary">
                Läs in exempelmaterial
              </Link>
            </>
          }
        >
          Börja med en källa du läser just nu, ett citat som stannat kvar eller en fråga du bär på.
        </EmptyState>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
          <section aria-labelledby="archive-results" className="min-w-0 lg:order-1">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <label htmlFor="archive-search" className="sr-only">
                  Sök i arkivet
                </label>
                <Search size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-3" aria-hidden="true" />
                <input
                  id="archive-search"
                  type="search"
                  className="input pl-10"
                  placeholder="Sök titel, innehåll, upphovsperson eller tagg"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="btn btn-secondary lg:hidden"
                aria-expanded={filtersOpen}
                aria-controls="archive-filters"
                onClick={() => setFiltersOpen((o) => !o)}
              >
                <SlidersHorizontal size={16} aria-hidden="true" />
                Filter{activeFilterCount > 0 && ` (${activeFilterCount})`}
              </button>
            </div>

            <div
              className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0"
              role="group"
              aria-label="Filtrera på innehållstyp"
            >
              {ARCHIVE_TYPES.map((t) => (
                <button key={t} type="button" className="chip shrink-0" aria-pressed={types.includes(t)} onClick={() => toggleType(t)}>
                  {ARCHIVE_TYPE_LABEL[t]}
                </button>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <h2 id="archive-results" className="font-sans text-sm text-ink-2" aria-live="polite">
                {results.length === items.length ? `${items.length} poster` : `${results.length} av ${items.length} poster`}
              </h2>
              {activeFilterCount > 0 || query ? (
                <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters}>
                  <X size={14} aria-hidden="true" /> Rensa sökning och filter
                </button>
              ) : null}
            </div>

            {results.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  compact
                  title="Inga poster matchar"
                  action={
                    <button type="button" className="btn btn-secondary" onClick={clearFilters}>
                      Rensa sökning och filter
                    </button>
                  }
                >
                  Prova ett annat sökord eller färre filter.
                </EmptyState>
              </div>
            ) : (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {results.map((item) => (
                  <li key={item.id}>
                    <ArchiveCard item={item} tags={item.tagIds.map((t) => tagNames.get(t)).filter((n): n is string => Boolean(n))} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <aside
            id="archive-filters"
            aria-label="Filter och sortering"
            className={cx("space-y-5 lg:order-2 lg:block", filtersOpen ? "block" : "hidden")}
          >
            <div className="card space-y-5 p-5 lg:sticky lg:top-8">
              <FilterSelect
                id="f-sort"
                label="Sortera"
                value={sort}
                onChange={(v) => setSort(v as SortKey)}
                options={[
                  { value: "uppdaterad", label: "Senast uppdaterad" },
                  { value: "skapad", label: "Senast skapad" },
                  { value: "titel", label: "Titel A–Ö" },
                ]}
              />
              <FilterSelect
                id="f-topic"
                label="Ämne"
                value={topic}
                onChange={(v) => setTopic(v as TopicId | "")}
                options={[{ value: "", label: "Alla ämnen" }, ...TOPICS.map((t) => ({ value: t.id, label: t.label }))]}
              />
              <FilterSelect
                id="f-epi"
                label="Kunskapskategori"
                value={epistemic}
                onChange={(v) => setEpistemic(v as EpistemicCategory | "")}
                options={[{ value: "", label: "Alla kategorier" }, ...EPISTEMIC.map((e) => ({ value: e.id, label: e.label }))]}
              />
              <FilterSelect
                id="f-tag"
                label="Tagg"
                value={tagId}
                onChange={setTagId}
                options={[{ value: "", label: "Alla taggar" }, ...usedTags.map((t) => ({ value: t.id, label: `#${t.name}` }))]}
              />
              <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-ink-2">
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--c-gold)]"
                  checked={showExamples}
                  onChange={(e) => setShowExamples(e.target.checked)}
                />
                Visa exempelmaterial
              </label>
            </div>
          </aside>
        </div>
      )}

      <ArchiveEditor
        open={editorOpen}
        defaults={editorDefaults ?? undefined}
        onClose={closeEditor}
        onSaved={(saved) => router.push(`/arkiv/${saved.id}`)}
      />
    </>
  );
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <select id={id} className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ArchiveCard({ item, tags }: { item: ArchiveItem; tags: string[] }) {
  return (
    <Link href={`/arkiv/${item.id}`} className="card card-link group flex h-full flex-col p-5">
      <div className="flex flex-wrap items-center gap-1.5">
        <TypeBadge type={item.type} />
        {item.epistemic && <EpistemicBadge category={item.epistemic} />}
        {item.isExample && <ExampleBadge />}
        {item.entity === "note" && item.status === "besvarad" && <span className="badge">Besvarad</span>}
      </div>
      <h3 className="mt-3 text-[1.4rem] text-ink group-hover:text-gold-strong">{item.title}</h3>
      {item.author && <p className="mt-0.5 text-sm text-ink-2">{item.author}</p>}
      {item.content && <p className="mt-2 text-sm text-ink-2">{excerpt(item.content, 150)}</p>}
      <div className="mt-auto pt-4">
        <TagList names={tags} />
        <p className="meta mt-2">
          Uppdaterad {formatDate(item.updatedAt)}
          {item.topics.length > 0 && ` · ${item.topics.map((t) => TOPIC_LABEL[t]).join(", ")}`}
        </p>
      </div>
    </Link>
  );
}
