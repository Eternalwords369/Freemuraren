"use client";

import { Check, CircleHelp, Flag, History, NotebookPen, Pencil, Plus, Target, Trash2, Undo2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useId, useMemo, useState, type ReactNode } from "react";
import { INVESTIGATION_STATUS } from "@/lib/constants";
import type { CodexData } from "@/lib/db/schema";
import type { CodexStore } from "@/lib/db/store";
import type { ActivityEvent, InvestigationStatus, JournalEntry, LearningGoal } from "@/lib/types";
import { cx, formatDate, relativeTime, todayIsoDay } from "@/lib/utils";
import { validateTitleOnly } from "@/lib/validation";
import { DataGate, useUnsavedGuard } from "../ui/DataGate";
import { Dialog } from "../ui/Dialog";
import { EmptyState, PageHeader, TagList } from "../ui/Display";
import { useConfirm, useToast } from "../ui/Feedback";
import { TagInput, TextArea, TextField } from "../ui/Field";

export function JourneyView() {
  return (
    <>
      <PageHeader
        eyebrow="Min resa"
        title="Lärande och reflektion"
        lead="Mål du sätter själv, ämnen du vill undersöka, frågor som ännu saknar svar och en journal för det du tänker. Inga poäng, inga streaks – bara en överblick."
      >
        <nav aria-label="Avsnitt på sidan" className="mt-6 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <ul className="flex gap-2">
            {[
              ["#mal", "Lärandemål"],
              ["#undersokningar", "Ämnen"],
              ["#fragor", "Öppna frågor"],
              ["#journal", "Journal"],
              ["#aktivitet", "Aktivitet"],
            ].map(([href, label]) => (
              <li key={href} className="shrink-0">
                <a href={href} className="chip">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </PageHeader>
      <DataGate>{(data, store) => <JourneyBody data={data} store={store} />}</DataGate>
    </>
  );
}

function JourneyBody({ data, store }: { data: CodexData; store: CodexStore }) {
  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:gap-10">
      <div className="min-w-0 space-y-14">
        <Goals goals={data.goals} store={store} />
        <Journal entries={store.journal.getAll()} store={store} tags={data.tags.map((t) => t.name)} />
      </div>
      <div className="min-w-0 space-y-14">
        <Investigations data={data} store={store} />
        <OpenQuestions store={store} />
        <Activity events={store.getState().db.meta.activity} />
      </div>
    </div>
  );
}

function SectionHead({ id, icon, title, children }: { id: string; icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h2 id={`${id}-h`} className="flex items-center gap-2.5 text-[1.75rem] text-ink">
        <span className="text-gold">{icon}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}

/* ---------------------------- Lärandemål ------------------------------ */

function Goals({ goals, store }: { goals: LearningGoal[]; store: CodexStore }) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string>();
  const [showDone, setShowDone] = useState(false);
  const inputId = useId();

  const active = goals.filter((g) => g.status === "aktiv");
  const done = goals.filter((g) => g.status === "klar");

  const add = () => {
    const v = validateTitleOnly(title, "Målet").title;
    setError(v);
    if (v) return;
    const res = store.goals.create({ title, description: "", status: "aktiv", milestones: [], topics: [] });
    if (!res.ok) return toast(res.error, "error");
    setTitle("");
    toast("Målet är tillagt.");
  };

  return (
    <section id="mal" aria-labelledby="mal-h" className="scroll-mt-24">
      <SectionHead id="mal" icon={<Target size={20} aria-hidden="true" />} title="Lärandemål" />
      <form
        className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <div className="flex-1">
          <label htmlFor={inputId} className="sr-only">
            Nytt lärandemål
          </label>
          <input
            id={inputId}
            className="input"
            placeholder="t.ex. Läsa Platons Timaios med kommentar"
            value={title}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${inputId}-err` : undefined}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(undefined);
            }}
          />
          {error && (
            <p id={`${inputId}-err`} className="field-error" role="alert">
              {error}
            </p>
          )}
        </div>
        <button type="submit" className="btn btn-primary">
          <Plus size={16} aria-hidden="true" /> Lägg till mål
        </button>
      </form>

      {active.length === 0 ? (
        <EmptyState compact title={done.length ? "Inga aktiva mål" : "Inga mål ännu"}>
          Formulera vad du vill förstå bättre. Dela gärna upp målet i milstolpar som du bockar av själv.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {active.map((g) => (
            <li key={g.id}>
              <GoalCard goal={g} store={store} />
            </li>
          ))}
        </ul>
      )}

      {done.length > 0 && (
        <div className="mt-5">
          <button type="button" className="btn btn-ghost btn-sm" aria-expanded={showDone} onClick={() => setShowDone((s) => !s)}>
            {showDone ? "Dölj" : "Visa"} avslutade mål ({done.length})
          </button>
          {showDone && (
            <ul className="mt-3 space-y-3">
              {done.map((g) => (
                <li key={g.id}>
                  <GoalCard goal={g} store={store} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

function GoalCard({ goal, store }: { goal: LearningGoal; store: CodexStore }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [milestone, setMilestone] = useState("");
  const [editing, setEditing] = useState(false);
  const msId = useId();
  const doneCount = goal.milestones.filter((m) => m.done).length;
  const isDone = goal.status === "klar";

  const report = (res: { ok: boolean; error?: string }, success?: string) => {
    if (!res.ok) toast(res.error ?? "Något gick fel.", "error");
    else if (success) toast(success);
  };

  const remove = async () => {
    const ok = await confirm({
      title: `Radera målet ”${goal.title}”?`,
      message: "Målet och dess milstolpar raderas permanent.",
      confirmLabel: "Radera målet",
      tone: "danger",
    });
    if (ok) report(store.goals.delete(goal.id), "Målet är raderat.");
  };

  return (
    <article id={`mal-${goal.id}`} className={cx("card scroll-mt-24 p-5", isDone && "opacity-80")} aria-labelledby={`${goal.id}-t`}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 id={`${goal.id}-t`} className={cx("text-[1.35rem] text-ink", isDone && "line-through decoration-gold/50")}>
            {goal.title}
          </h3>
          {goal.description && <p className="mt-1 text-sm text-ink-2">{goal.description}</p>}
          <p className="meta mt-1">
            {isDone && goal.completedAt ? `Markerat som klart ${formatDate(goal.completedAt)}` : `Skapat ${formatDate(goal.createdAt)}`}
            {goal.milestones.length > 0 && ` · ${doneCount} av ${goal.milestones.length} milstolpar`}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditing(true)} aria-label={`Redigera målet ${goal.title}`}>
            <Pencil size={15} aria-hidden="true" />
          </button>
          <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={remove} aria-label={`Radera målet ${goal.title}`}>
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      {goal.milestones.length > 0 && (
        <ul className="mt-4 space-y-1">
          {goal.milestones.map((m) => (
            <li key={m.id} className="group flex items-center gap-2">
              <label className="flex min-h-10 flex-1 cursor-pointer items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--c-gold)]"
                  checked={m.done}
                  onChange={() => report(store.goals.toggleMilestone(goal.id, m.id))}
                />
                <span className={cx(m.done ? "text-ink-3 line-through" : "text-ink")}>{m.title}</span>
              </label>
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm opacity-60 group-hover:opacity-100 focus:opacity-100"
                onClick={() => report(store.goals.removeMilestone(goal.id, m.id))}
                aria-label={`Ta bort milstolpen ${m.title}`}
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {!isDone && (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const res = store.goals.addMilestone(goal.id, milestone);
            report(res);
            if (res.ok) setMilestone("");
          }}
        >
          <label htmlFor={msId} className="sr-only">
            Ny milstolpe för {goal.title}
          </label>
          <input id={msId} className="input !min-h-10 text-sm" placeholder="Ny milstolpe" value={milestone} onChange={(e) => setMilestone(e.target.value)} />
          <button type="submit" className="btn btn-secondary btn-sm shrink-0" disabled={!milestone.trim()}>
            <Flag size={14} aria-hidden="true" /> Lägg till
          </button>
        </form>
      )}

      <div className="mt-4 flex justify-end">
        {isDone ? (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => report(store.goals.setDone(goal.id, false), "Målet är aktivt igen.")}>
            <Undo2 size={14} aria-hidden="true" /> Återöppna
          </button>
        ) : (
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => report(store.goals.setDone(goal.id, true), "Målet är markerat som klart.")}>
            <Check size={14} aria-hidden="true" /> Markera som klart
          </button>
        )}
      </div>

      <GoalEditor open={editing} goal={goal} store={store} onClose={() => setEditing(false)} />
    </article>
  );
}

function GoalEditor({ open, goal, store, onClose }: { open: boolean; goal: LearningGoal; store: CodexStore; onClose: () => void }) {
  return open ? <GoalEditorForm goal={goal} store={store} onClose={onClose} /> : null;
}

function GoalEditorForm({ goal, store, onClose }: { goal: LearningGoal; store: CodexStore; onClose: () => void }) {
  const toast = useToast();
  const [title, setTitle] = useState(goal.title);
  const [description, setDescription] = useState(goal.description);
  const [error, setError] = useState<string>();

  const save = () => {
    const v = validateTitleOnly(title, "Målet").title;
    setError(v);
    if (v) return;
    const res = store.goals.update(goal.id, { title, description, topics: goal.topics });
    if (!res.ok) return toast(res.error, "error");
    toast("Målet är uppdaterat.");
    onClose();
  };

  return (
    <Dialog
      open
      onRequestClose={onClose}
      title="Redigera lärandemål"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Avbryt
          </button>
          <button type="submit" form={`goal-${goal.id}`} className="btn btn-primary">
            Spara
          </button>
        </>
      }
    >
      <form
        id={`goal-${goal.id}`}
        noValidate
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <TextField label="Mål" required autoFocus value={title} onChange={setTitle} error={error} />
        <TextArea label="Beskrivning" value={description} onChange={setDescription} rows={4} hint="Varför vill du förstå detta? Vad vore ett bra nästa steg?" />
      </form>
    </Dialog>
  );
}

/* --------------------------- Undersökningar ---------------------------- */

function Investigations({ data, store }: { data: CodexData; store: CodexStore }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [title, setTitle] = useState("");
  const inputId = useId();
  const items = [...data.investigations].sort(
    (a, b) =>
      INVESTIGATION_STATUS.findIndex((s) => s.id === a.status) - INVESTIGATION_STATUS.findIndex((s) => s.id === b.status) ||
      b.updatedAt.localeCompare(a.updatedAt),
  );

  return (
    <section id="undersokningar" aria-labelledby="undersokningar-h" className="scroll-mt-24">
      <SectionHead id="undersokningar" icon={<CompassIcon />} title="Ämnen att undersöka" />
      <form
        className="mb-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          const res = store.investigations.create({ title, note: "", status: "planerad" });
          if (!res.ok) return toast(res.error, "error");
          setTitle("");
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          Nytt ämne att undersöka
        </label>
        <input id={inputId} className="input" placeholder="Ett ämne du vill undersöka" value={title} onChange={(e) => setTitle(e.target.value)} />
        <button type="submit" className="btn btn-secondary shrink-0" disabled={!title.trim()}>
          <Plus size={16} aria-hidden="true" /> Lägg till
        </button>
      </form>
      {items.length === 0 ? (
        <EmptyState compact title="Inga ämnen ännu" action={<Link href="/utforska" className="btn btn-secondary btn-sm">Hitta ämnen i Utforska</Link>}>
          Lägg till ämnen här eller välj ”Undersök ämnet” i Utforska.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-line rounded-[var(--radius-lg)] border border-line">
          {items.map((i) => (
            <li key={i.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                {i.exploreSlug ? (
                  <Link href={`/utforska/${i.exploreSlug}`} className={cx("text-ink hover:text-gold-strong", i.status === "avslutad" && "text-ink-3 line-through")}>
                    {i.title}
                  </Link>
                ) : (
                  <span className={cx("text-ink", i.status === "avslutad" && "text-ink-3 line-through")}>{i.title}</span>
                )}
                <p className="meta">Uppdaterad {relativeTime(i.updatedAt)}</p>
              </div>
              <div className="flex items-center gap-1">
                <label htmlFor={`st-${i.id}`} className="sr-only">
                  Status för {i.title}
                </label>
                <select
                  id={`st-${i.id}`}
                  className="input !min-h-9 !w-auto !py-1 text-sm"
                  value={i.status}
                  onChange={(e) => {
                    const res = store.investigations.update(i.id, { status: e.target.value as InvestigationStatus });
                    if (!res.ok) toast(res.error, "error");
                  }}
                >
                  {INVESTIGATION_STATUS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon btn-sm"
                  aria-label={`Ta bort ${i.title}`}
                  onClick={async () => {
                    const ok = await confirm({
                      title: "Ta bort ämnet?",
                      message: `”${i.title}” tas bort från Min resa.`,
                      confirmLabel: "Ta bort",
                      tone: "danger",
                    });
                    if (ok) {
                      const res = store.investigations.delete(i.id);
                      if (!res.ok) toast(res.error, "error");
                    }
                  }}
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CompassIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(-28 12 12)" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ----------------------------- Öppna frågor ---------------------------- */

function OpenQuestions({ store }: { store: CodexStore }) {
  const questions = store.notes.openQuestions();
  return (
    <section id="fragor" aria-labelledby="fragor-h" className="scroll-mt-24">
      <SectionHead id="fragor" icon={<CircleHelp size={20} aria-hidden="true" />} title="Frågor utan svar">
        <Link href="/arkiv?ny=fragestallning" className="btn btn-secondary btn-sm">
          <Plus size={14} aria-hidden="true" /> Ny fråga
        </Link>
      </SectionHead>
      {questions.length === 0 ? (
        <EmptyState compact title="Inga öppna frågor">
          Frågeställningar och hypoteser du skapar i arkivet visas här tills du markerar dem som besvarade.
        </EmptyState>
      ) : (
        <ul className="space-y-2">
          {questions.map((q) => (
            <li key={q.id}>
              <Link href={`/arkiv/${q.id}`} className="card card-link flex items-start gap-3 px-4 py-3">
                <CircleHelp size={16} className="mt-1 shrink-0 text-gold" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-ink">{q.title}</span>
                  <span className="meta">
                    {q.type === "hypotes" ? "Hypotes" : "Frågeställning"}
                    {q.isExample && " · Exempel"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ------------------------------- Journal ------------------------------- */

function Journal({ entries, store, tags }: { entries: JournalEntry[]; store: CodexStore; tags: string[] }) {
  const params = useSearchParams();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const highlight = params.get("reflektion");

  return (
    <section id="journal" aria-labelledby="journal-h" className="scroll-mt-24">
      <SectionHead id="journal" icon={<NotebookPen size={20} aria-hidden="true" />} title="Reflektionsjournal">
        {!creating && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCreating(true)}>
            <Plus size={14} aria-hidden="true" /> Ny reflektion
          </button>
        )}
      </SectionHead>

      {creating && <JournalForm store={store} tags={tags} onDone={() => setCreating(false)} />}

      {entries.length === 0 && !creating ? (
        <EmptyState compact title="Journalen är tom" action={<button type="button" className="btn btn-primary btn-sm" onClick={() => setCreating(true)}>Skriv första reflektionen</button>}>
          Skriv om vad du läst, vad som förvånade dig eller vad du fortfarande inte förstår.
        </EmptyState>
      ) : (
        <ol className="mt-4 space-y-3">
          {entries.map((j) =>
            editingId === j.id ? (
              <li key={j.id}>
                <JournalForm store={store} tags={tags} entry={j} onDone={() => setEditingId(null)} />
              </li>
            ) : (
              <li key={j.id}>
                <JournalCard entry={j} store={store} highlighted={highlight === j.id} onEdit={() => setEditingId(j.id)} />
              </li>
            ),
          )}
        </ol>
      )}
    </section>
  );
}

function JournalCard({ entry, store, highlighted, onEdit }: { entry: JournalEntry; store: CodexStore; highlighted: boolean; onEdit: () => void }) {
  const confirm = useConfirm();
  const toast = useToast();
  return (
    <article className={cx("card p-5", highlighted && "border-gold/60")}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="meta">
            <time dateTime={entry.entryDate}>{formatDate(entry.entryDate)}</time>
          </p>
          {entry.title && <h3 className="mt-0.5 text-[1.3rem] text-ink">{entry.title}</h3>}
        </div>
        <div className="flex shrink-0 gap-1">
          <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={onEdit} aria-label="Redigera reflektionen">
            <Pencil size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm"
            aria-label="Radera reflektionen"
            onClick={async () => {
              const ok = await confirm({
                title: "Radera reflektionen?",
                message: "Reflektionen raderas permanent från den här webbläsaren.",
                confirmLabel: "Radera",
                tone: "danger",
              });
              if (!ok) return;
              const res = store.journal.delete(entry.id);
              toast(res.ok ? "Reflektionen är raderad." : res.error, res.ok ? "success" : "error");
            }}
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
      <p className="prose-codex mt-2 whitespace-pre-line text-ink-2">{entry.body}</p>
      <TagList names={store.tags.namesFor(entry.tagIds)} className="mt-3" />
    </article>
  );
}

function JournalForm({ store, tags, entry, onDone }: { store: CodexStore; tags: string[]; entry?: JournalEntry; onDone: () => void }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [initial] = useState(() => ({
    title: entry?.title ?? "",
    body: entry?.body ?? "",
    entryDate: entry?.entryDate ?? todayIsoDay(),
    tags: entry ? store.tags.namesFor(entry.tagIds) : ([] as string[]),
  }));
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string>();
  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial]);
  useUnsavedGuard(dirty);

  const cancel = async () => {
    if (
      dirty &&
      !(await confirm({
        title: "Kasta osparad text?",
        message: "Det du har skrivit i reflektionen försvinner.",
        confirmLabel: "Kasta texten",
        cancelLabel: "Fortsätt skriva",
        tone: "danger",
      }))
    )
      return;
    onDone();
  };

  const save = () => {
    if (!form.body.trim()) return setError("Skriv något i reflektionen innan du sparar.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.entryDate)) return setError("Välj ett giltigt datum.");
    const res = entry ? store.journal.update(entry.id, form) : store.journal.create(form);
    if (!res.ok) return toast(res.error, "error");
    toast(entry ? "Reflektionen är uppdaterad." : "Reflektionen är sparad.");
    onDone();
  };

  return (
    <form
      className="card space-y-4 p-5"
      aria-label={entry ? "Redigera reflektion" : "Ny reflektion"}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
        <TextField label="Rubrik" value={form.title} onChange={(v) => setForm({ ...form, title: v })} autoFocus={!entry} />
        <TextField label="Datum" required type="date" value={form.entryDate} onChange={(v) => setForm({ ...form, entryDate: v })} />
      </div>
      <TextArea
        label="Reflektion"
        required
        rows={6}
        value={form.body}
        onChange={(v) => {
          setForm({ ...form, body: v });
          if (error && v.trim()) setError(undefined);
        }}
        error={error}
      />
      <TagInput value={form.tags} onChange={(v) => setForm({ ...form, tags: v })} suggestions={tags} />
      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-ghost" onClick={cancel}>
          Avbryt
        </button>
        <button type="submit" className="btn btn-primary">
          {entry ? "Spara ändringar" : "Spara reflektion"}
        </button>
      </div>
    </form>
  );
}

/* ------------------------------ Aktivitet ------------------------------ */

const ACTION_LABEL: Record<ActivityEvent["action"], string> = {
  skapade: "Skapade",
  uppdaterade: "Uppdaterade",
  raderade: "Raderade",
  slutforde: "Slutförde",
  importerade: "Importerade",
};

const KIND_LABEL: Record<string, string> = {
  source: "källa",
  note: "anteckning",
  symbol: "symbol",
  concept: "begrepp",
  relation: "koppling",
  tag: "tagg",
  goal: "mål",
  journal: "reflektion",
  investigation: "ämne",
  data: "data",
};

function Activity({ events }: { events: ActivityEvent[] }) {
  const recent = events.slice(0, 12);
  return (
    <section id="aktivitet" aria-labelledby="aktivitet-h" className="scroll-mt-24">
      <SectionHead id="aktivitet" icon={<History size={20} aria-hidden="true" />} title="Senaste aktiviteter" />
      {recent.length === 0 ? (
        <p className="text-sm text-ink-3">Här visas det du skapar, ändrar och slutför. Inget har hänt ännu.</p>
      ) : (
        <ol className="relative space-y-3 border-l border-line pl-5">
          {recent.map((e) => (
            <li key={e.id} className="relative text-sm">
              <span aria-hidden="true" className="absolute top-2 -left-[23.5px] size-2 rounded-full border border-gold bg-bg" />
              <p className="text-ink">
                {ACTION_LABEL[e.action]} {KIND_LABEL[e.kind] ?? ""}: <span className="text-ink-2">{e.title}</span>
              </p>
              <p className="meta">
                <time dateTime={e.at}>{relativeTime(e.at)}</time>
              </p>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-4 text-xs text-ink-3">Aktivitetsloggen sparar de 100 senaste händelserna lokalt. Den används inte för att värdera dig.</p>
    </section>
  );
}
