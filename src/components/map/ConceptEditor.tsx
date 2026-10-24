"use client";

import { useMemo, useState } from "react";
import { useCodex } from "@/lib/db/client";
import type { Concept, TopicId } from "@/lib/types";
import { validateTitleOnly } from "@/lib/validation";
import { useUnsavedGuard } from "../ui/DataGate";
import { Dialog } from "../ui/Dialog";
import { useConfirm, useToast } from "../ui/Feedback";
import { TagInput, TextArea, TextField, TopicPicker } from "../ui/Field";

export function ConceptEditor({
  open,
  concept,
  onClose,
  onSaved,
}: {
  open: boolean;
  concept?: Concept;
  onClose: () => void;
  onSaved?: (c: Concept) => void;
}) {
  return open ? <ConceptForm concept={concept} onClose={onClose} onSaved={onSaved} /> : null;
}

function ConceptForm({ concept, onClose, onSaved }: { concept?: Concept; onClose: () => void; onSaved?: (c: Concept) => void }) {
  const { state, store } = useCodex();
  const confirm = useConfirm();
  const toast = useToast();
  const [initial] = useState(() => ({
    name: concept?.name ?? "",
    description: concept?.description ?? "",
    topics: concept?.topics ?? ([] as TopicId[]),
    tags: concept ? store.tags.namesFor(concept.tagIds) : ([] as string[]),
  }));
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string>();
  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial]);
  useUnsavedGuard(dirty);

  const requestClose = async () => {
    if (
      dirty &&
      !(await confirm({
        title: "Kasta osparade ändringar?",
        message: "Det du har ändrat i begreppet försvinner.",
        confirmLabel: "Kasta ändringarna",
        cancelLabel: "Fortsätt redigera",
        tone: "danger",
      }))
    )
      return;
    onClose();
  };

  const save = () => {
    const v = validateTitleOnly(form.name, "Namn").title;
    setError(v);
    if (v) return;
    const res = concept ? store.concepts.update(concept.id, form) : store.concepts.create(form);
    if (!res.ok) return toast(res.error, "error");
    toast(concept ? "Begreppet är uppdaterat." : "Begreppet är tillagt i kartan.");
    onSaved?.(res.value);
    onClose();
  };

  return (
    <Dialog
      open
      onRequestClose={requestClose}
      title={concept ? "Redigera begrepp" : "Nytt begrepp"}
      description="Begrepp är idéer som binder ihop källor, symboler och anteckningar i kartan."
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={requestClose}>
            Avbryt
          </button>
          <button type="submit" form="concept-form" className="btn btn-primary">
            {concept ? "Spara ändringar" : "Spara begrepp"}
          </button>
        </>
      }
    >
      <form
        id="concept-form"
        noValidate
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <TextField
          label="Namn"
          required
          autoFocus
          value={form.name}
          onChange={(v) => {
            setForm({ ...form, name: v });
            if (error) setError(validateTitleOnly(v, "Namn").title);
          }}
          onBlur={() => setError(validateTitleOnly(form.name, "Namn").title)}
          error={error}
        />
        <TextArea label="Beskrivning" value={form.description} onChange={(v) => setForm({ ...form, description: v })} rows={4} />
        <TopicPicker value={form.topics} onChange={(v) => setForm({ ...form, topics: v })} />
        <TagInput value={form.tags} onChange={(v) => setForm({ ...form, tags: v })} suggestions={state.db.data.tags.map((t) => t.name)} />
      </form>
    </Dialog>
  );
}
