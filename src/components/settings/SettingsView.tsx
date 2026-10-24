"use client";

import { AlertTriangle, Check, Download, FileJson, HardDrive, Pencil, RotateCcw, ShieldCheck, Sparkles, Tags, Trash2, Upload, X } from "lucide-react";
import { useId, useRef, useState, type ReactNode } from "react";
import { parseDatabase } from "@/lib/db/migrations";
import { COLLECTION_KEYS, COLLECTION_LABEL, type CodexData, type CodexDatabase } from "@/lib/db/schema";
import type { CodexStore } from "@/lib/db/store";
import { todayIsoDay } from "@/lib/utils";
import { DataGate } from "../ui/DataGate";
import { PageHeader } from "../ui/Display";
import { useConfirm, useToast } from "../ui/Feedback";

const MAX_IMPORT_BYTES = 10 * 1024 * 1024;

export function SettingsView() {
  return (
    <>
      <PageHeader
        eyebrow="Inställningar"
        title="Data och integritet"
        lead="Ditt material ligger i den här webbläsaren. Här exporterar, importerar och rensar du det."
      />
      <DataGate>{(data, store) => <SettingsBody data={data} store={store} />}</DataGate>
    </>
  );
}

function Panel({ id, icon, title, children, tone }: { id?: string; icon: ReactNode; title: string; children: ReactNode; tone?: "danger" }) {
  const hid = useId();
  return (
    <section id={id} aria-labelledby={hid} className={tone === "danger" ? "scroll-mt-24 rounded-[var(--radius-lg)] border border-danger/35 p-6" : "card scroll-mt-24 p-6"}>
      <h2 id={hid} className="flex items-center gap-2.5 text-[1.6rem] text-ink">
        <span className={tone === "danger" ? "text-danger" : "text-gold"}>{icon}</span>
        {title}
      </h2>
      <div className="mt-3 space-y-4 text-ink-2">{children}</div>
    </section>
  );
}

function countAll(data: CodexData): number {
  return COLLECTION_KEYS.reduce((n, k) => n + data[k].length, 0);
}

function SettingsBody({ data, store }: { data: CodexData; store: CodexStore }) {
  const confirm = useConfirm();
  const toast = useToast();
  const bytes = store.storageSize();
  const exampleCount = store.examples.count();

  const exportData = () => {
    try {
      const blob = new Blob([store.exportJson()], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `living-cosmos-export-${todayIsoDay()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast("Exporten är nedladdad.");
    } catch {
      toast("Exporten kunde inte skapas.", "error");
    }
  };

  const removeExamples = async () => {
    const ok = await confirm({
      title: "Ta bort exempelmaterialet?",
      message: `${exampleCount} poster märkta som exempel tas bort, liksom deras kopplingar. Dina egna poster och exempel du har redigerat behålls.`,
      confirmLabel: "Ta bort exempel",
      tone: "danger",
    });
    if (!ok) return;
    const res = store.examples.removeAll();
    toast(res.ok ? `${res.value} exempelposter är borttagna.` : res.error, res.ok ? "success" : "error");
  };

  const restoreExamples = () => {
    const res = store.examples.restore();
    if (!res.ok) return toast(res.error, "error");
    toast(res.value > 0 ? `${res.value} exempelposter är tillagda.` : "Allt exempelmaterial finns redan.", res.value > 0 ? "success" : "info");
  };

  const clearAll = async () => {
    const ok = await confirm({
      title: "Radera all lokal data?",
      message: (
        <>
          Allt material i den här webbläsaren raderas: {countAll(data)} poster, din journal, dina mål och din aktivitetslogg. Det går inte att
          ångra. <strong className="text-ink">Exportera först</strong> om du vill kunna återställa något.
        </>
      ),
      confirmLabel: "Radera allt",
      tone: "danger",
      requireText: "RADERA",
    });
    if (!ok) return;
    const res = store.clearAll();
    toast(res.ok ? "All lokal data är raderad." : res.error, res.ok ? "success" : "error");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <Panel icon={<ShieldCheck size={20} aria-hidden="true" />} title="Så lagras ditt material">
          <ul className="space-y-2.5 text-sm">
            <li className="flex gap-2.5">
              <HardDrive size={16} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
              Allt sparas i webbläsarens lokala lagring (LocalStorage) på den här enheten och i den här webbläsarprofilen.
            </li>
            <li className="flex gap-2.5">
              <X size={16} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
              Inget synkroniseras till någon server i den här versionen. Det finns inga konton, ingen analys och ingen spårning.
            </li>
            <li className="flex gap-2.5">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
              Lagringen är inte krypterad. Den som har tillgång till webbläsarprofilen kan läsa materialet. Rensar du webbplatsdata försvinner
              det – exportera regelbundet.
            </li>
          </ul>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-[var(--radius-md)] bg-bg p-4 text-sm sm:grid-cols-3">
            {COLLECTION_KEYS.map((k) => (
              <div key={k} className="flex justify-between gap-2 sm:block">
                <dt className="text-ink-3 first-letter:uppercase">{COLLECTION_LABEL[k]}</dt>
                <dd className="text-ink tabular-nums">{data[k].length}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-ink-3">
            Använt utrymme: ungefär {(bytes / 1024).toLocaleString("sv-SE", { maximumFractionDigits: 0 })} kB av de cirka 5 MB som de flesta
            webbläsare tillåter.
          </p>
        </Panel>

        <Panel id="exempel" icon={<Sparkles size={20} aria-hidden="true" />} title="Exempelmaterial">
          <p className="text-sm">
            Exemplen visar hur arkivet, lexikonet och kartan fungerar. De är märkta ”Exempel” och utgör inte verifierade forskningsresultat. Ett
            exempel du har redigerat räknas som ditt eget.
          </p>
          <p className="text-sm text-ink">
            {exampleCount > 0 ? `${exampleCount} exempelposter finns i ditt codex.` : "Inga exempelposter finns just nu."}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-secondary" onClick={restoreExamples}>
              <RotateCcw size={16} aria-hidden="true" /> Återställ exempel
            </button>
            <button type="button" className="btn btn-ghost" onClick={removeExamples} disabled={exampleCount === 0}>
              <Trash2 size={16} aria-hidden="true" /> Ta bort exempel
            </button>
          </div>
        </Panel>

        <TagManager store={store} />
      </div>

      <div className="space-y-6">
        <Panel icon={<Download size={20} aria-hidden="true" />} title="Exportera">
          <p className="text-sm">
            Ladda ned allt material som en JSON-fil. Filen kan importeras här igen eller i en senare version av appen.
          </p>
          <button type="button" className="btn btn-primary" onClick={exportData}>
            <Download size={16} aria-hidden="true" /> Exportera som JSON
          </button>
        </Panel>

        <ImportPanel data={data} store={store} />

        <Panel id="radera" icon={<Trash2 size={20} aria-hidden="true" />} title="Radera lokal data" tone="danger">
          <p className="text-sm">
            Tar bort allt material från den här webbläsaren. Du behöver skriva RADERA för att bekräfta. Exempelmaterial läggs inte in igen
            automatiskt.
          </p>
          <button type="button" className="btn btn-danger" onClick={clearAll}>
            <Trash2 size={16} aria-hidden="true" /> Radera all lokal data
          </button>
        </Panel>
      </div>
    </div>
  );
}

/* ------------------------------- Import -------------------------------- */

type ImportState =
  | { step: "idle" }
  | { step: "reading" }
  | { step: "invalid"; fileName: string; errors: string[] }
  | { step: "ready"; fileName: string; db: CodexDatabase; migratedFrom?: number };

function ImportPanel({ data, store }: { data: CodexData; store: CodexStore }) {
  const confirm = useConfirm();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [state, setState] = useState<ImportState>({ step: "idle" });

  const reset = () => {
    setState({ step: "idle" });
    if (inputRef.current) inputRef.current.value = "";
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      return setState({ step: "invalid", fileName: file.name, errors: ["Filen är större än 10 MB och kan inte importeras."] });
    }
    setState({ step: "reading" });
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      return setState({ step: "invalid", fileName: file.name, errors: ["Filen är inte giltig JSON."] });
    }
    const res = parseDatabase(parsed);
    if (!res.ok) return setState({ step: "invalid", fileName: file.name, errors: res.errors });
    setState({ step: "ready", fileName: file.name, db: res.db, migratedFrom: res.migratedFrom });
  };

  const merge = async (db: CodexDatabase) => {
    const ok = await confirm({
      title: "Slå samman med befintligt material?",
      message:
        "Nya poster läggs till. Poster som redan finns ersätts bara om versionen i filen är senare uppdaterad. Inget av ditt nuvarande material raderas.",
      confirmLabel: "Slå samman",
    });
    if (!ok) return;
    const res = store.mergeWith(db);
    if (!res.ok) return toast(res.error, "error");
    toast(`Importen är klar: ${res.value.added} nya och ${res.value.updated} uppdaterade poster.`);
    reset();
  };

  const replace = async (db: CodexDatabase) => {
    const ok = await confirm({
      title: "Ersätta allt material?",
      message: (
        <>
          Allt nuvarande material ({countAll(data)} poster) raderas och ersätts med innehållet i filen ({countAll(db.data)} poster). Det går inte
          att ångra. Exportera först om du är osäker.
        </>
      ),
      confirmLabel: "Ersätt allt",
      tone: "danger",
      requireText: "ERSÄTT",
    });
    if (!ok) return;
    const res = store.replaceAll(db);
    if (!res.ok) return toast(res.error, "error");
    toast("Materialet är ersatt med importen.");
    reset();
  };

  return (
    <Panel icon={<Upload size={20} aria-hidden="true" />} title="Importera">
      <p className="text-sm">Välj en fil som exporterats från THE LIVING COSMOS. Filen kontrolleras innan något ändras.</p>
      <div>
        <label htmlFor={inputId} className="field-label">
          Exportfil (.json)
        </label>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="application/json,.json"
          className="block w-full text-sm text-ink-2 file:mr-3 file:min-h-10 file:cursor-pointer file:rounded-[var(--radius-md)] file:border file:border-line file:bg-elevated file:px-4 file:text-sm file:font-medium file:text-ink hover:file:border-line-strong"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>

      <div aria-live="polite">
        {state.step === "reading" && <p className="text-sm">Läser filen…</p>}

        {state.step === "invalid" && (
          <div role="alert" className="rounded-[var(--radius-md)] border border-danger/40 bg-danger-soft p-4 text-sm">
            <p className="flex items-center gap-2 font-semibold text-danger">
              <AlertTriangle size={16} aria-hidden="true" /> ”{state.fileName}” kan inte importeras
            </p>
            <ul className="mt-2 space-y-1 font-mono text-xs text-ink-2">
              {state.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
            <p className="mt-2 text-ink-2">Inget har ändrats.</p>
            <button type="button" className="btn btn-ghost btn-sm mt-2" onClick={reset}>
              Välj en annan fil
            </button>
          </div>
        )}

        {state.step === "ready" && (
          <div className="rounded-[var(--radius-md)] border border-success/40 bg-success-soft p-4 text-sm">
            <p className="flex items-center gap-2 font-semibold text-success">
              <Check size={16} aria-hidden="true" /> ”{state.fileName}” är giltig
            </p>
            {state.migratedFrom !== undefined && (
              <p className="mt-1 text-ink-2">Filen har en äldre schemaversion ({state.migratedFrom}) och uppdateras vid import.</p>
            )}
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
              {COLLECTION_KEYS.filter((k) => state.db.data[k].length > 0).map((k) => (
                <div key={k} className="flex justify-between gap-2 sm:block">
                  <dt className="text-ink-3 first-letter:uppercase">{COLLECTION_LABEL[k]}</dt>
                  <dd className="text-ink tabular-nums">{state.db.data[k].length}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary" onClick={() => merge(state.db)}>
                <FileJson size={16} aria-hidden="true" /> Slå samman
              </button>
              <button type="button" className="btn btn-danger" onClick={() => replace(state.db)}>
                Ersätt allt
              </button>
              <button type="button" className="btn btn-ghost" onClick={reset}>
                Avbryt
              </button>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}

/* -------------------------------- Taggar ------------------------------- */

function TagManager({ store }: { store: CodexStore }) {
  const confirm = useConfirm();
  const toast = useToast();
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const tags = store.tags.getAll();
  const usage = store.tags.usage();
  const unused = tags.filter((t) => !usage.has(t.id)).length;

  const saveRename = () => {
    if (!editing) return;
    const res = store.tags.rename(editing.id, editing.name);
    if (!res.ok) return toast(res.error, "error");
    setEditing(null);
    toast("Taggen är omdöpt.");
  };

  return (
    <Panel icon={<Tags size={20} aria-hidden="true" />} title="Taggar">
      {tags.length === 0 ? (
        <p className="text-sm">Inga taggar ännu. Taggar skapas när du skriver dem i ett formulär.</p>
      ) : (
        <>
          <ul className="max-h-80 divide-y divide-line overflow-y-auto rounded-[var(--radius-md)] border border-line">
            {tags.map((t) =>
              editing?.id === t.id ? (
                <li key={t.id} className="flex gap-2 p-2">
                  <label htmlFor={`tag-${t.id}`} className="sr-only">
                    Nytt namn för {t.name}
                  </label>
                  <input
                    id={`tag-${t.id}`}
                    className="input !min-h-9"
                    value={editing.name}
                    autoFocus
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveRename();
                      if (e.key === "Escape") setEditing(null);
                    }}
                  />
                  <button type="button" className="btn btn-primary btn-sm" onClick={saveRename}>
                    Spara
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>
                    Avbryt
                  </button>
                </li>
              ) : (
                <li key={t.id} className="flex items-center gap-2 px-3 py-1.5 text-sm">
                  <span className="flex-1 text-ink">#{t.name}</span>
                  <span className="text-xs text-ink-3 tabular-nums">{usage.get(t.id) ?? 0} poster</span>
                  <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditing({ id: t.id, name: t.name })} aria-label={`Byt namn på ${t.name}`}>
                    <Pencil size={14} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon btn-sm"
                    aria-label={`Radera taggen ${t.name}`}
                    onClick={async () => {
                      const ok = await confirm({
                        title: `Radera taggen ”${t.name}”?`,
                        message: "Taggen tas bort från alla poster. Posterna finns kvar.",
                        confirmLabel: "Radera taggen",
                        tone: "danger",
                      });
                      if (!ok) return;
                      const res = store.tags.delete(t.id);
                      toast(res.ok ? "Taggen är raderad." : res.error, res.ok ? "success" : "error");
                    }}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </li>
              ),
            )}
          </ul>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={unused === 0}
            onClick={() => {
              const res = store.tags.deleteUnused();
              toast(res.ok ? `${res.value} oanvända taggar är borttagna.` : res.error, res.ok ? "success" : "error");
            }}
          >
            Rensa oanvända taggar{unused > 0 && ` (${unused})`}
          </button>
        </>
      )}
    </Panel>
  );
}
