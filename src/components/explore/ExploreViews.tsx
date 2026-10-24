import { ArrowLeft, ArrowRight, BookOpen, HelpCircle } from "lucide-react";
import Link from "next/link";
import { EXPLORE_CATEGORIES, TOPIC_BY_SLUG, topicsInCategory, type ExploreTopic } from "@/content/explore";
import { EPISTEMIC, TOPIC_LABEL } from "@/lib/constants";
import { EpistemicBadge, PageHeader, TextLink, epistemicColor } from "../ui/Display";
import { TopicActions, TopicMaterial } from "./TopicActions";

export function ExploreIndex() {
  return (
    <>
      <PageHeader
        eyebrow="Utforska"
        title="Ingångar till frågorna"
        lead="Ämnen ur filosofi, idéhistoria, symbolik och esoteriska traditioner. Varje ämne delas upp i vad källorna säger, hur idéerna tolkats och vad vetenskapen kan och inte kan avgöra."
      >
        <nav aria-label="Kategorier" className="mt-7 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <ul className="flex gap-2 sm:flex-wrap">
            {EXPLORE_CATEGORIES.map((c) => (
              <li key={c.id} className="shrink-0">
                <a href={`#${c.id}`} className="chip">
                  {c.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </PageHeader>

      <aside aria-labelledby="legend-h" className="mb-12 rounded-[var(--radius-lg)] border border-line bg-surface/60 p-5">
        <h2 id="legend-h" className="eyebrow">
          Så läser du ämnena
        </h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {EPISTEMIC.map((e) => (
            <li key={e.id} className="text-sm">
              <EpistemicBadge category={e.id} />
              <p className="mt-1.5 text-ink-2">{e.question}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-ink-3">
          Kategorierna har inte samma bevisvärde. <TextLink href="/metod" className="text-xs">Läs om metoden</TextLink>
        </p>
      </aside>

      <div className="space-y-14">
        {EXPLORE_CATEGORIES.map((c) => (
          <section key={c.id} id={c.id} aria-labelledby={`${c.id}-h`} className="scroll-mt-24">
            <div className="mb-5 max-w-[60ch]">
              <h2 id={`${c.id}-h`} className="text-[2rem] text-ink">
                {c.title}
              </h2>
              <p className="mt-1 text-ink-2">{c.intro}</p>
            </div>
            <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {topicsInCategory(c.id).map((t) => (
                <li key={t.slug}>
                  <TopicCard topic={t} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}

function TopicCard({ topic }: { topic: ExploreTopic }) {
  return (
    <Link href={`/utforska/${topic.slug}`} className="card card-link group flex h-full flex-col p-5">
      <h3 className="text-[1.45rem] text-ink group-hover:text-gold-strong">{topic.title}</h3>
      <p className="mt-2 text-sm text-ink-2">{topic.summary}</p>
      <span className="mt-auto flex items-center gap-1.5 pt-4 text-sm font-medium text-gold">
        Öppna ämnet <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </Link>
  );
}

export function ExploreTopicView({ topic }: { topic: ExploreTopic }) {
  const category = EXPLORE_CATEGORIES.find((c) => c.id === topic.category)!;
  const related = (topic.related ?? []).map((s) => TOPIC_BY_SLUG.get(s)).filter((t): t is ExploreTopic => Boolean(t));

  return (
    <article className="animate-rise">
      <TextLink href={`/utforska#${category.id}`}>
        <ArrowLeft size={16} aria-hidden="true" /> {category.title}
      </TextLink>

      <header className="mt-6 max-w-[62ch]">
        <p className="eyebrow">{TOPIC_LABEL[topic.category]}</p>
        <h1 className="mt-3 text-[2.5rem] text-ink sm:text-5xl lg:text-[3.4rem]">{topic.title}</h1>
        <p className="mt-4 text-lg text-ink-2">{topic.summary}</p>
      </header>

      <TopicActions topic={topic} />

      <div className="hairline my-10" />

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <h2 className="sr-only">Fyra perspektiv</h2>
          <ol className="space-y-5">
            {EPISTEMIC.map((e, i) => {
              const text = topic.perspectives[e.id];
              if (!text) return null;
              return (
                <li
                  key={e.id}
                  className="relative rounded-[var(--radius-lg)] border border-line bg-surface/70 p-5 pl-6 sm:p-6 sm:pl-7"
                >
                  <span aria-hidden="true" className="absolute top-5 bottom-5 left-0 w-[3px] rounded-r" style={{ background: epistemicColor(e.id) }} />
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-display text-lg text-ink-3" aria-hidden="true">
                      {["I", "II", "III", "IV"][i]}
                    </span>
                    <h3 className="text-[1.4rem] text-ink">{e.label}</h3>
                  </div>
                  <p className="mt-1 text-xs text-ink-3">{e.question}</p>
                  <p className="prose-codex mt-3">{text}</p>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 text-xs text-ink-3">
            Texten är en introduktion och ersätter inte läsning av källorna. Ämnena är inte exempeldata men inte heller uttömmande.
          </p>
        </div>

        <aside className="space-y-8" aria-label="Fördjupning">
          <section aria-labelledby="q-h">
            <h2 id="q-h" className="mb-3 flex items-center gap-2 text-[1.35rem]">
              <HelpCircle size={18} className="text-gold" aria-hidden="true" /> Frågor att bära med sig
            </h2>
            <ul className="space-y-2">
              {topic.questions.map((q) => (
                <li key={q} className="rounded-[var(--radius-md)] border border-line px-4 py-3 text-sm text-ink">
                  {q}
                </li>
              ))}
            </ul>
          </section>

          {topic.readings.length > 0 && (
            <section aria-labelledby="r-h">
              <h2 id="r-h" className="mb-3 flex items-center gap-2 text-[1.35rem]">
                <BookOpen size={18} className="text-gold" aria-hidden="true" /> Läsning
              </h2>
              <ul className="space-y-3 text-sm">
                {topic.readings.map((r) => (
                  <li key={r.title}>
                    <p className="text-ink">
                      <cite className="not-italic">{r.title}</cite>
                    </p>
                    <p className="meta">
                      {r.author} · {r.year}
                      {r.note && ` · ${r.note}`}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <TopicMaterial category={topic.category} />

          {related.length > 0 && (
            <section aria-labelledby="rel-h">
              <h2 id="rel-h" className="mb-3 text-[1.35rem]">
                Närliggande ämnen
              </h2>
              <ul className="space-y-1.5">
                {related.map((t) => (
                  <li key={t.slug}>
                    <Link href={`/utforska/${t.slug}`} className="group flex items-center justify-between gap-2 rounded-md py-1.5 text-ink hover:text-gold-strong">
                      {t.title}
                      <ArrowRight size={15} className="shrink-0 text-ink-3 group-hover:text-gold" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </article>
  );
}
