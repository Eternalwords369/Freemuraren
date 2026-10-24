"use client";

import { useMemo, useState } from "react";
import {
  ARCHIVE_TYPE_LABEL,
  EPISTEMIC,
  NOTE_TYPES,
  SOURCE_TYPES,
  isNoteType,
  isSourceType,
} from "@/lib/constants";
import { useCodex } from "@/lib/db/client";
import type { ArchiveItem, ArchiveType, EpistemicCategory, ID, QuestionStatus, TopicId } from "@/lib/types";
import { compareSv } from "@/lib/utils";
import { hasErrors, validateArchiveInput, type ArchiveFormInput, type FieldErrors } from "@/lib/validation";
import { useUnsavedGuard } from "../ui/DataGate";
import { Dialog } from "../ui/Dialog";
import { useConfirm, useToast } from "../ui/Feedback";
import { FormErrorSummary, SelectField, TagInput, TextArea, TextField, TopicPicker } from "../ui/Field";

export interface ArchiveDefaults {
  type?: ArchiveType;
  topics?: TopicId[];
  sourceId?: ID;
  title?: string;
}

interface FormState extends ArchiveFormInput {
  type: ArchiveType;
  topics: TopicId[];
  tags: string[];
  epistemic: EpistemicCategory | "";
  sourceId: string;
  status: QuestionStatus;
}

function initialState(item: ArchiveItem | undefined, tagNames: string[], defaults?: ArchiveDefaults): FormState {
  if (item) {
    return {
      type: item.type,
      title: item.title,
      content: item.content,
      author: item.author ?? "",
      url: item.url ?? "",
      comment: item.comment ?? "",
      publication: item.entity === "source" ? (item.publication ?? "") : "",
      year: item.entity === "source" ? (item.year ?? "") : "",
      topics: item.topics,
      tags: tagNames,
      epistemic: item.epistemic ?? "",
      sourceId: item.entity === "note" ? (item.sourceId ?? "") : "",
      status: item.entity === "note" ? (item.status ?? "oppen") : "oppen",
    };
  }
  return {
    type: defaults?.type ?? "anteckning",
    title: defaults?.title ?? "",
    content: "",
    author: "",
    url: "",
    comment: "",
    publication: "",
    year: "",
    topics: defaults?.topics ?? [],
    tags: [],
    epistemic: "",
    sourceId: defaults?.sourceId ?? "",
    status: "oppen",
  };
}

export function ArchiveEditor({
  open,
  item,
  defaults,
  onClose,
  onSaved,
}: {
  open: boolean;
  item?: ArchiveItem;
  defaults?: ArchiveDefaults;
  onClose: () => void;
  onSaved?: (item: ArchiveItem) => void;
}) {
  // Formuläret monteras om för varje öppning så att det alltid startar från aktuell data.
  return open ? <EditorForm item={item} defaults={defaults} onClose={onClose} onSaved={onSaved} /> : null;
}

function EditorForm({
  item,
  defaults,
  onClose,
  onSaved,
}: {
  item?: ArchiveItem;
  defaults?: ArchiveDefaults;
  onClose: () => void;
  onSaved?: (item: ArchiveItem) => void;
}) {
  const { state, store } = useCodex();
  const confirm = useConfirm();
  const toast = useToast();
  const data = state.db.data;

  const [initial] = useState(() => initialState(item, item ? store.tags.namesFor(item.tagIds) : [], defaults));
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<FieldErrors<keyof ArchiveFormInput>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial]);
  useUnsavedGuard(dirty);

  const isSource = isSourceType(form.type);
  const isQuestion = form.type === "fragestallning" || form.type === "hypotes";

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    const next = { ...form, [key]: value };
    setForm(next);
    // Fel försvinner direkt när fältet blir giltigt; nya fel visas först efter blur eller sparförsök.
    if (key in errors) {
      const k = key as keyof ArchiveFormInput;
      const fresh = validateArchiveInput(next);
      setErrors((e) => {
        const copy = { ...e };
        if (fresh[k]) copy[k] = fresh[k];
        else delete copy[k];
        return copy;
      });
    }
  };

  const blur = (key: keyof ArchiveFormInput) => () => {
    const fresh = validateArchiveInput(form);
    setErrors((e) => {
      const copy = { ...e };
      if (fresh[key]) copy[key] = fresh[key];
      else delete copy[key];
      return copy;
    });
  };

  const requestClose = async () => {
    if (dirty) {
      const discard = await confirm({
        title: "Kasta osparade ändringar?",
        message: "Det du har skrivit sedan du öppnade formuläret försvinner.",
        confirmLabel: "Kasta ändringarna",
        cancelLabel: "Fortsätt redigera",
        tone: "danger",
      });
      if (!discard) return;
    }
    onClose();
  };

  const save = () => {
    setSubmitted(true);
    const v = validateArchiveInput(form);
    setErrors(v);
    if (hasErrors(v)) return;
    setSaving(true);

    const common = {
      title: form.title,
      content: form.content,
      author: form.author,
      url: form.url,
      comment: form.comment,
      topics: form.topics,
      tags: form.tags,
      epistemic: form.epistemic || undefined,
    };

    const res = isSourceType(form.type)
      ? item
        ? store.sources.update(item.id, { ...common, type: form.type, publication: form.publication, year: form.year })
        : store.sources.create({ ...common, type: form.type, publication: form.publication, year: form.year })
      : isNoteType(form.type)
        ? (() => {
            const input = {
              ...common,
              type: form.type,
              sourceId: form.sourceId || undefined,
              status: isQuestion ? form.status : undefined,
            };
            return item ? store.notes.update(item.id, input) : store.notes.create(input);
          })()
        : ({ ok: false, error: "Okänd innehållstyp." } as const);

    setSaving(false);
    if (!res.ok) {
      toast(res.error, "error");
      return;
    }
    toast(item ? "Ändringarna är sparade." : `${ARCHIVE_TYPE_LABEL[form.type]} sparad i arkivet.`);
    // Stäng först: en eventuell navigering i onSaved ska vinna över stängningens URL-städning.
    onClose();
    onSaved?.(res.value);
  };

  // Vid redigering går det inte att byta mellan källa och anteckning, eftersom
  // de lagras i olika samlingar och relationer pekar på respektive typ.
  const typeOptions = (item ? (item.entity === "source" ? SOURCE_TYPES : NOTE_TYPES) : [...NOTE_TYPES, ...SOURCE_TYPES]).map(
    (t) => ({ value: t, label: ARCHIVE_TYPE_LABEL[t] }),
  );

  const tagSuggestions = data.tags.map((t) => t.name);
  const sources = [...data.sources].sort((a, b) => compareSv(a.title, b.title));
  const errorCount = Object.keys(errors).length;

  return (
    <Dialog
      open
      variant="panel"
      onRequestClose={requestClose}
      title={item ? "Redigera post" : "Ny post i arkivet"}
      description={item?.isExample ? "Det här är exempelmaterial. När du sparar räknas posten som din egen." : undefined}
      footer={
        <>
          {dirty && <span className="mr-auto text-xs text-ink-3">Osparade ändringar</span>}
          <button type="button" className="btn btn-ghost" onClick={requestClose}>
            Avbryt
          </button>
          <button type="submit" form="archive-form" className="btn btn-primary" disabled={saving}>
            {saving ? "Sparar…" : item ? "Spara ändringar" : "Spara i arkivet"}
          </button>
        </>
      }
    >
      <form
        id="archive-form"
        noValidate
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        {submitted && <FormErrorSummary count={errorCount} />}

        <SelectField
          label="Innehållstyp"
          required
          value={form.type}
          onChange={(v) => set("type", v)}
          options={typeOptions}
          hint={item ? "Källor och anteckningar lagras separat, så typen kan bara bytas inom samma grupp." : undefined}
        />

        <TextField
          label="Titel"
          required
          autoFocus
          value={form.title}
          onChange={(v) => set("title", v)}
          onBlur={blur("title")}
          error={errors.title}
          maxLength={220}
        />

        <TextArea
          label={isSource ? "Sammanfattning" : form.type === "citat" ? "Citat" : "Innehåll"}
          value={form.content}
          onChange={(v) => set("content", v)}
          onBlur={blur("content")}
          error={errors.content}
          rows={7}
          hint={form.type === "citat" ? "Återge citatet ordagrant och ange var det finns." : undefined}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Författare eller upphovsperson"
            value={form.author}
            onChange={(v) => set("author", v)}
            onBlur={blur("author")}
            error={errors.author}
            autoComplete="off"
          />
          {isSource ? (
            <TextField label="År" value={form.year} onChange={(v) => set("year", v)} onBlur={blur("year")} error={errors.year} hint="Bara om det är känt." />
          ) : (
            <SelectField
              label="Hämtad från källa"
              value={form.sourceId}
              onChange={(v) => set("sourceId", v)}
              options={[{ value: "", label: "Ingen källa" }, ...sources.map((s) => ({ value: s.id, label: s.title }))]}
            />
          )}
        </div>

        {isSource && (
          <TextField
            label="Publiceringsuppgifter"
            value={form.publication}
            onChange={(v) => set("publication", v)}
            onBlur={blur("publication")}
            error={errors.publication}
            hint="Förlag, tidskrift, volym. Ange bara uppgifter du har kontrollerat."
          />
        )}

        <TextField
          label="Källa eller URL"
          type="url"
          inputMode="url"
          placeholder="https://"
          value={form.url}
          onChange={(v) => set("url", v)}
          onBlur={blur("url")}
          error={errors.url}
        />

        {isQuestion && (
          <SelectField<QuestionStatus>
            label="Status"
            value={form.status}
            onChange={(v) => set("status", v)}
            options={[
              { value: "oppen", label: "Öppen" },
              { value: "besvarad", label: "Besvarad eller prövad" },
            ]}
          />
        )}

        <SelectField<EpistemicCategory | "">
          label="Kunskapskategori"
          value={form.epistemic}
          onChange={(v) => set("epistemic", v)}
          options={[{ value: "", label: "Inte angiven" }, ...EPISTEMIC.map((e) => ({ value: e.id, label: e.label }))]}
          hint={
            form.epistemic
              ? EPISTEMIC.find((e) => e.id === form.epistemic)?.question
              : "Hjälper dig skilja på källa, tolkning och vetenskapligt stöd. Se Metod."
          }
        />

        <TopicPicker value={form.topics} onChange={(v) => set("topics", v)} />

        <TagInput value={form.tags} onChange={(v) => set("tags", v)} suggestions={tagSuggestions} />

        <TextArea
          label="Personlig kommentar"
          value={form.comment}
          onChange={(v) => set("comment", v)}
          onBlur={blur("comment")}
          error={errors.comment}
          rows={4}
          hint="Dina egna tankar, skilda från själva innehållet."
        />
      </form>
    </Dialog>
  );
}
