"use client";

import { ArrowRight, BookMarked, CircleHelp, Compass, FilePlus2, History, Library, NotebookPen, Shapes, Telescope } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ARCHIVE_TYPE_LABEL, INVESTIGATION_STATUS, NODE_KIND_LABEL } from "@/lib/constants";
import type { CodexData } from "@/lib/db/schema";
import type { CodexStore } from "@/lib/db/store";
import { hrefForRef } from "@/lib/search";
import { excerpt, formatDate, relativeTime } from "@/lib/utils";
import { CosmosMark, OrbitDecor } from "../brand/CosmosMark";
import { DataGate } from "../ui/DataGate";
import { ExampleBadge, SectionTitle, TextLink } from "../ui/Display";

export function Dashboard() {
  return (
    <>
      <Welcome />
      <DataGate>{(data, store) => <DashboardBody data={data} store={store} />}</DataGate>
    </>
  );
}

function Welcome() {
  return (
    <section aria-labelledby="welcome-h" className="relative isolate mb-10 overflow-hidden lg:mb-14">
      <OrbitDecor className="absolute -top-24 -right-32 -z-10 size-[360px] text-gold/45 sm:-right-16 sm:size-[460px] lg:-top-40 lg:size-[560px]" />
      <div className="flex items-center gap-3 text-gold">
        <CosmosMark className="size-6" />
        <p className="eyebrow">Översikt</p>
      </div>
      <h1 id="welcome-h" className="mt-5 max-w-[18ch] text-[2.75rem] leading-[1.05] text-ink sm:text-6xl lg:text-[4.25rem]">
        En karta över medvetandets evolution
      </h1>
      <p className="mt-5 max-w-[56ch] text-[1.0625rem] text-ink-2 sm:text-lg">
        Här samlar du källor, symboler och frågor om medvetandet och kosmos – och håller isär vad som är belagt, vad som är
        tolkning och vad som fortfarande är ett öppet mysterium.
      </p>
      <div className="mt-7 flex flex-wrap gap-2">
        <Link href="/arkiv?ny=anteckning" className="btn btn-primary">
          <FilePlus2 size={16} aria-hidden="true" /> Ny anteckning
        </Link>
        <Link href="/utforska" className="btn btn-secondary">
          <Telescope size={16} aria-hidden="true" /> Utforska ämnen
        </Link>
      </div>
    </section>
  );
}

function DashboardBody({ data, store }: { data: CodexData; store: CodexStore }) {
  const own = <T extends { isExample?: boolean }>(items: T[]) => items.filter((i) => !i.isExample);
  const exampleCount = store.examples.count();

  const visits = store
    .getState()
    .db.meta.recent.filter((v) => store.nodeExists(v.ref))
    .slice(0, 4);

  const recentNotes = own(data.notes)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 4);
  const recentSources = own(data.sources)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);
  const investigations = data.investigations.filter((i) => i.status === "pagaende" || i.status === "planerad").slice(0, 4);
  const openQuestions = own(store.notes.openQuestions()).slice(0, 4);
  const activeGoals = data.goals.filter((g) => g.status === "aktiv");

  const stats = [
    { label: "Källor", own: own(data.sources).length, total: data.sources.length, href: "/arkiv", icon: Library },
    { label: "Anteckningar", own: own(data.notes).length, total: data.notes.length, href: "/arkiv", icon: NotebookPen },
    { label: "Symboler", own: own(data.symbols).length, total: data.symbols.length, href: "/symboler", icon: Shapes },
  ];

  return (
    <div className="space-y-12">
      {exampleCount > 0 && (
        <aside className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-dashed border-gold/40 px-5 py-4 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm text-ink-2">
            Ditt codex innehåller <strong className="font-semibold text-ink">{exampleCount} exempelposter</strong> som visar hur
            funktionerna hänger ihop. De är märkta och räknas inte i din statistik.
          </p>
          <TextLink href="/installningar#exempel">Hantera exempel</TextLink>
        </aside>
      )}

      <section aria-labelledby="stats-h">
        <h2 id="stats-h" className="sr-only">
          Ditt material i siffror
        </h2>
        <ul className="grid grid-cols-3 gap-3">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <li key={s.label}>
                <Link href={s.href} className="card card-link block p-4 sm:p-5">
                  <Icon size={18} className="text-gold" aria-hidden="true" />
                  <p className="mt-3 font-display text-4xl leading-none text-ink [font-variant-numeric:lining-nums] sm:text-5xl">{s.own}</p>
                  <p className="mt-1.5 text-sm text-ink-2">{s.label}</p>
                  {s.total > s.own && <p className="meta mt-0.5 text-xs">+{s.total - s.own} exempel</p>}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="continue-h">
        <SectionTitle id="continue-h" title="Fortsätt där du slutade" />
        {visits.length === 0 ? (
          <Quiet icon={<History size={18} aria-hidden="true" />}>
            När du öppnar poster i arkivet eller lexikonet visas de senaste här.
          </Quiet>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {visits.map((v) => {
              const node = store.getNode(v.ref)!;
              const title = "title" in node ? node.title : node.name;
              return (
                <li key={`${v.ref.kind}:${v.ref.id}`}>
                  <Link href={hrefForRef(v.ref)} className="card card-link group flex items-center gap-4 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="meta">
                        {NODE_KIND_LABEL[v.ref.kind]} · öppnad {relativeTime(v.at)}
                      </p>
                      <p className="mt-0.5 truncate text-lg text-ink group-hover:text-gold-strong">{title}</p>
                    </div>
                    <ArrowRight size={18} className="shrink-0 text-ink-3 group-hover:text-gold" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="grid gap-12 lg:grid-cols-2 lg:gap-10">
        <section aria-labelledby="notes-h">
          <SectionTitle id="notes-h" title="Senaste anteckningar" action={<TextLink href="/arkiv">Hela arkivet</TextLink>} />
          {recentNotes.length === 0 ? (
            <Quiet icon={<NotebookPen size={18} aria-hidden="true" />} action={<TextLink href="/arkiv?ny=anteckning">Skriv en anteckning</TextLink>}>
              Du har inte skrivit några egna anteckningar ännu.
            </Quiet>
          ) : (
            <ItemList
              items={recentNotes.map((n) => ({
                id: n.id,
                href: `/arkiv/${n.id}`,
                title: n.title,
                meta: `${ARCHIVE_TYPE_LABEL[n.type]} · redigerad ${relativeTime(n.updatedAt)}`,
                body: excerpt(n.content, 100),
              }))}
            />
          )}
        </section>

        <section aria-labelledby="sources-h">
          <SectionTitle id="sources-h" title="Senast tillagda källor" action={<TextLink href="/arkiv">Hela arkivet</TextLink>} />
          {recentSources.length === 0 ? (
            <Quiet icon={<BookMarked size={18} aria-hidden="true" />} action={<TextLink href="/arkiv?ny=bok">Lägg till en källa</TextLink>}>
              Inga egna källor ännu. Börja med en bok eller artikel du läser.
            </Quiet>
          ) : (
            <ItemList
              items={recentSources.map((s) => ({
                id: s.id,
                href: `/arkiv/${s.id}`,
                title: s.title,
                meta: [ARCHIVE_TYPE_LABEL[s.type], s.author, `tillagd ${formatDate(s.createdAt)}`].filter(Boolean).join(" · "),
              }))}
            />
          )}
        </section>
      </div>

      <section aria-labelledby="current-h">
        <SectionTitle id="current-h" title="Aktuella undersökningar" action={<TextLink href="/resa">Min resa</TextLink>} />
        {investigations.length === 0 && openQuestions.length === 0 && activeGoals.length === 0 ? (
          <Quiet
            icon={<Compass size={18} aria-hidden="true" />}
            action={
              <>
                <TextLink href="/utforska">Hitta ett ämne</TextLink>
                <TextLink href="/arkiv?ny=fragestallning">Formulera en fråga</TextLink>
              </>
            }
          >
            Här samlas ämnen du undersöker, öppna frågor och lärandemål.
          </Quiet>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            <Column title="Ämnen">
              {investigations.length === 0 ? (
                <p className="text-sm text-ink-3">Inga pågående ämnen.</p>
              ) : (
                investigations.map((i) => (
                  <Link key={i.id} href={i.exploreSlug ? `/utforska/${i.exploreSlug}` : "/resa#undersokningar"} className="block rounded-md py-1.5 hover:text-gold-strong">
                    <span className="block text-ink">{i.title}</span>
                    <span className="meta">{INVESTIGATION_STATUS.find((s) => s.id === i.status)?.label}</span>
                  </Link>
                ))
              )}
            </Column>
            <Column title="Öppna frågor">
              {openQuestions.length === 0 ? (
                <p className="text-sm text-ink-3">Inga öppna frågor.</p>
              ) : (
                openQuestions.map((q) => (
                  <Link key={q.id} href={`/arkiv/${q.id}`} className="flex items-start gap-2 rounded-md py-1.5 text-ink hover:text-gold-strong">
                    <CircleHelp size={16} className="mt-1 shrink-0 text-gold" aria-hidden="true" />
                    {q.title}
                  </Link>
                ))
              )}
            </Column>
            <Column title="Lärandemål">
              {activeGoals.length === 0 ? (
                <p className="text-sm text-ink-3">Inga aktiva mål.</p>
              ) : (
                activeGoals.slice(0, 4).map((g) => {
                  const done = g.milestones.filter((m) => m.done).length;
                  return (
                    <Link key={g.id} href={`/resa#mal-${g.id}`} className="block rounded-md py-1.5 hover:text-gold-strong">
                      <span className="block text-ink">{g.title}</span>
                      {g.milestones.length > 0 && (
                        <span className="meta">
                          {done} av {g.milestones.length} milstolpar
                        </span>
                      )}
                    </Link>
                  );
                })
              )}
            </Column>
          </div>
        )}
      </section>
    </div>
  );
}

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="card p-5">
      <h3 className="eyebrow mb-2">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function ItemList({ items }: { items: { id: string; href: string; title: string; meta: string; body?: string; example?: boolean }[] }) {
  return (
    <ul className="divide-y divide-line rounded-[var(--radius-lg)] border border-line bg-surface/60">
      {items.map((i) => (
        <li key={i.id}>
          <Link href={i.href} className="group block px-4 py-3.5 transition-colors hover:bg-elevated">
            <p className="text-ink group-hover:text-gold-strong">
              {i.title} {i.example && <ExampleBadge />}
            </p>
            <p className="meta mt-0.5">{i.meta}</p>
            {i.body && <p className="mt-1 text-sm text-ink-2">{i.body}</p>}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Quiet({ icon, children, action }: { icon: ReactNode; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-dashed border-line px-5 py-5 text-sm text-ink-2 sm:flex-row sm:items-center">
      <span className="text-gold">{icon}</span>
      <p className="flex-1">{children}</p>
      {action && <div className="flex flex-wrap gap-4">{action}</div>}
    </div>
  );
}
