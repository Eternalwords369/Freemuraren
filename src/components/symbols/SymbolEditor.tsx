"use client";

import { Plus, Trash2 } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { GLYPHS } from "@/content/glyphs";
import { useCodex } from "@/lib/db/client";
import type { GlyphRef, SymbolEntry, TraditionReading } from "@/lib/types";
import { createId, cx } from "@/lib/utils";
import { hasErrors, validateSymbolInput, type FieldErrors, type SymbolFormInput } from "@/lib/validation";
import { useUnsavedGuard } from "../ui/DataGate";
import { Dialog } from "../ui/Dialog";
import { useConfirm, useToast } from "../ui/Feedback";
import { FormErrorSummary, ListField, TagInput, TextArea, TextField } from "../ui/Field";
import { SymbolGlyph } from "./SymbolGlyph";

interface FormState extends SymbolFormInput {
  glyphName: string;
  traditions: TraditionReading[];
  relatedConcepts: string[];
  references: string[];
  tags: string[];
}

export function SymbolEditor({
  open,
  symbol,
  onClose,
  onSaved,
}: {
  open: boolean;
  symbol?: SymbolEntry;
  onClose: () => void;
  onSaved?: (s: SymbolEntry) => void;
}) {
  return open ? <SymbolForm symbol={symbol} onClose={onClose} onSaved={onSaved} /> : null;
}

function SymbolForm({ symbol, onClose, onSaved }: { symbol?: SymbolEntry; onClose: () => void; onSaved?: (s: SymbolEntry) => void }) {
  const { state, store } = useCodex();
  const confirm = useConfirm();
  const toast = useToast();
  const uid = useId();

  const [initial] = useState<FormState>(() => ({
    name: symbol?.name ?? "",
    description: symbol?.description ?? "",
    historicalContext: symbol?.historicalContext ?? "",
    personalInterpretation: symbol?.personalInterpretation ?? "",
    glyphKind: symbol?.glyph.kind ?? "builtin",
    glyphName: symbol?.glyph.kind === "builtin" ? symbol.glyph.name : "circle",
    glyphCharacter: symbol?.glyph.kind === "character" ? symbol.glyph.value : "",
    traditions: symbol?.traditions ?? [],
    relatedConcepts: symbol?.relatedConcepts ?? [],
    references: symbol?.references ?? [],
    tags: symbol ? store.tags.namesFor(symbol.tagIds) : [],
  }));
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<FieldErrors<keyof SymbolFormInput>>({});
  const [submitted, setSubmitted] = useState(false);
  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial]);
  useUnsavedGuard(dirty);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    const next = { ...form, [key]: value };
    setForm(next);
    if (key in errors) setErrors(validateSymbolInput(next));
  };

  const glyph: GlyphRef =
    form.glyphKind === "character" ? { kind: "character", value: form.glyphCharacter.trim() || "?" } : { kind: "builtin", name: form.glyphName };

  const requestClose = async () => {
    if (dirty) {
      const ok = await confirm({
        title: "Kasta osparade ändringar?",
        message: "Det du har ändrat i symbolen försvinner.",
        confirmLabel: "Kasta ändringarna",
        cancelLabel: "Fortsätt redigera",
        tone: "danger",
      });
      if (!ok) return;
    }
    onClose();
  };

  const save = () => {
    setSubmitted(true);
    const v = validateSymbolInput(form);
    setErrors(v);
    if (hasErrors(v)) return;
    const input = {
      name: form.name,
      glyph,
      description: form.description,
      historicalContext: form.historicalContext,
      personalInterpretation: form.personalInterpretation,
      traditions: form.traditions
        .map((t) => ({ ...t, tradition: t.tradition.trim(), interpretation: t.interpretation.trim() }))
        .filter((t) => t.tradition || t.interpretation),
      relatedConcepts: form.relatedConcepts,
      references: form.references,
      tags: form.tags,
    };
    const res = symbol ? store.symbols.update(symbol.id, input) : store.symbols.create(input);
    if (!res.ok) return toast(res.error, "error");
    toast(symbol ? "Symbolen är uppdaterad." : "Symbolen är tillagd i lexikonet.");
    onSaved?.(res.value);
    onClose();
  };

  const updateTradition = (id: string, patch: Partial<TraditionReading>) =>
    set(
      "traditions",
      form.traditions.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    );

  return (
    <Dialog
      open
      variant="panel"
      onRequestClose={requestClose}
      title={symbol ? "Redigera symbol" : "Ny symbol"}
      description={symbol?.isExample ? "Det här är exempelmaterial. När du sparar räknas symbolen som din egen." : undefined}
      footer={
        <>
          {dirty && <span className="mr-auto text-xs text-ink-3">Osparade ändringar</span>}
          <button type="button" className="btn btn-ghost" onClick={requestClose}>
            Avbryt
          </button>
          <button type="submit" form="symbol-form" className="btn btn-primary">
            {symbol ? "Spara ändringar" : "Spara symbol"}
          </button>
        </>
      }
    >
      <form
        id="symbol-form"
        noValidate
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        {submitted && <FormErrorSummary count={Object.keys(errors).length} />}

        <TextField
          label="Namn"
          required
          autoFocus
          value={form.name}
          onChange={(v) => set("name", v)}
          onBlur={() => {
            const message = validateSymbolInput(form).name;
            setErrors((e) => {
              const copy = { ...e };
              if (message) copy.name = message;
              else delete copy.name;
              return copy;
            });
          }}
          error={errors.name}
        />

        <fieldset>
          <legend className="field-label">Symbolisk representation</legend>
          <div className="flex items-start gap-4">
            <div className="grid size-20 shrink-0 place-items-center rounded-[var(--radius-lg)] border border-line bg-bg text-gold">
              <SymbolGlyph glyph={glyph} className="size-14 text-[3.5rem]" label={`Förhandsvisning av ${form.name || "symbolen"}`} />
            </div>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Typ av representation">
              {(["builtin", "character"] as const).map((k) => (
                <label key={k} className="chip has-[:checked]:border-gold/60 has-[:checked]:bg-gold-soft has-[:checked]:text-gold-strong">
                  <input
                    type="radio"
                    name={`${uid}-gkind`}
                    className="sr-only"
                    checked={form.glyphKind === k}
                    onChange={() => set("glyphKind", k)}
                  />
                  {k === "builtin" ? "Geometrisk form" : "Tecken (Unicode)"}
                </label>
              ))}
            </div>
          </div>

          {form.glyphKind === "builtin" ? (
            <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6" role="radiogroup" aria-label="Välj form">
              {GLYPHS.map((g) => (
                <label
                  key={g.name}
                  title={g.label}
                  className={cx(
                    "grid aspect-square cursor-pointer place-items-center rounded-[var(--radius-md)] border p-2 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus",
                    form.glyphName === g.name ? "border-gold/70 bg-gold-soft text-gold-strong" : "border-line text-ink-2 hover:border-line-strong",
                  )}
                >
                  <input
                    type="radio"
                    name={`${uid}-glyph`}
                    className="sr-only"
                    checked={form.glyphName === g.name}
                    onChange={() => set("glyphName", g.name)}
                    aria-label={g.label}
                  />
                  <SymbolGlyph glyph={{ kind: "builtin", name: g.name }} className="size-full" />
                </label>
              ))}
            </div>
          ) : (
            <div className="mt-4 max-w-xs">
              <TextField
                label="Tecken"
                required
                value={form.glyphCharacter}
                onChange={(v) => set("glyphCharacter", v)}
                error={errors.glyphCharacter}
                hint="Till exempel ☉ ☽ ☿ ♀ ♁ ♂ ♃ ♄ ☯ ∞"
                maxLength={12}
              />
            </div>
          )}
        </fieldset>

        <TextArea label="Beskrivning" value={form.description} onChange={(v) => set("description", v)} error={errors.description} rows={3} />
        <TextArea
          label="Historiskt sammanhang"
          value={form.historicalContext}
          onChange={(v) => set("historicalContext", v)}
          error={errors.historicalContext}
          rows={4}
          hint="Vad kan beläggas: var, när och av vilka symbolen har använts."
        />

        <fieldset>
          <legend className="field-label">
            Tolkningar inom olika traditioner <span className="font-normal text-ink-3">(valfritt)</span>
          </legend>
          <div className="space-y-3">
            {form.traditions.map((t, i) => (
              <div key={t.id} className="rounded-[var(--radius-md)] border border-line p-3">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label htmlFor={`${t.id}-name`} className="field-label">
                      Tradition {i + 1}
                    </label>
                    <input
                      id={`${t.id}-name`}
                      className="input"
                      value={t.tradition}
                      placeholder="t.ex. Alkemi"
                      onChange={(e) => updateTradition(t.id, { tradition: e.target.value })}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon"
                    onClick={() => set("traditions", form.traditions.filter((x) => x.id !== t.id))}
                    aria-label={`Ta bort tradition ${i + 1}`}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
                <label htmlFor={`${t.id}-int`} className="field-label mt-3">
                  Tolkning
                </label>
                <textarea
                  id={`${t.id}-int`}
                  className="input !min-h-20"
                  rows={2}
                  value={t.interpretation}
                  onChange={(e) => updateTradition(t.id, { interpretation: e.target.value })}
                />
              </div>
            ))}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => set("traditions", [...form.traditions, { id: createId("tr"), tradition: "", interpretation: "" }])}
            >
              <Plus size={14} aria-hidden="true" /> Lägg till tradition
            </button>
          </div>
        </fieldset>

        <TextArea
          label="Personlig tolkning"
          value={form.personalInterpretation}
          onChange={(v) => set("personalInterpretation", v)}
          error={errors.personalInterpretation}
          rows={4}
          hint="Din egen läsning – den hålls skild från historiska uppgifter."
        />

        <ListField
          label="Relaterade begrepp"
          value={form.relatedConcepts}
          onChange={(v) => set("relatedConcepts", v)}
          placeholder="t.ex. Kretslopp"
        />
        <ListField
          label="Källhänvisningar"
          value={form.references}
          onChange={(v) => set("references", v)}
          placeholder="Författare, titel, år, sida"
          hint="Länka gärna även till källor i arkivet via Kopplingar på symbolens sida."
        />
        <TagInput value={form.tags} onChange={(v) => set("tags", v)} suggestions={state.db.data.tags.map((t) => t.name)} />
      </form>
    </Dialog>
  );
}
