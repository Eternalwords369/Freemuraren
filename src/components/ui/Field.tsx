"use client";

import { X } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { TOPICS } from "@/lib/constants";
import type { TopicId } from "@/lib/types";
import { cx } from "@/lib/utils";

interface BaseFieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

function FieldShell({
  id,
  label,
  hint,
  error,
  required,
  className,
  children,
}: BaseFieldProps & { id: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
        {required ? (
          <span className="ml-1 text-gold" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="ml-1.5 font-normal text-ink-3">(valfritt)</span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, hint?: string, error?: string) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}

type InputProps = BaseFieldProps & {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  list?: string;
  maxLength?: number;
  autoFocus?: boolean;
};

export function TextField({ value, onChange, onBlur, type = "text", placeholder, autoComplete, inputMode, list, maxLength, autoFocus, ...shell }: InputProps) {
  const id = useId();
  return (
    <FieldShell id={id} {...shell}>
      <input
        id={id}
        className="input"
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete ?? "off"}
        inputMode={inputMode}
        list={list}
        maxLength={maxLength}
        data-autofocus={autoFocus ? "" : undefined}
        required={shell.required}
        aria-invalid={shell.error ? true : undefined}
        aria-describedby={describedBy(id, shell.hint, shell.error)}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
    </FieldShell>
  );
}

type AreaProps = BaseFieldProps & {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  rows?: number;
  placeholder?: string;
};

export function TextArea({ value, onChange, onBlur, rows = 5, placeholder, ...shell }: AreaProps) {
  const id = useId();
  return (
    <FieldShell id={id} {...shell}>
      <textarea
        id={id}
        className="input"
        rows={rows}
        value={value}
        placeholder={placeholder}
        required={shell.required}
        aria-invalid={shell.error ? true : undefined}
        aria-describedby={describedBy(id, shell.hint, shell.error)}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
    </FieldShell>
  );
}

type SelectProps<T extends string> = BaseFieldProps & {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  disabled?: boolean;
};

export function SelectField<T extends string>({ value, onChange, options, disabled, ...shell }: SelectProps<T>) {
  const id = useId();
  return (
    <FieldShell id={id} {...shell}>
      <select
        id={id}
        className="input"
        value={value}
        disabled={disabled}
        aria-describedby={describedBy(id, shell.hint, shell.error)}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

/** Taggfält: skriv och tryck Enter eller komma. Förslag hämtas från befintliga taggar. */
export function TagInput({
  value,
  onChange,
  suggestions,
  label = "Taggar",
  hint = "Skriv en tagg och tryck Enter eller komma.",
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
  label?: string;
  hint?: string;
}) {
  const id = useId();
  const listId = useId();
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const name = raw.trim().replace(/^#/, "").toLocaleLowerCase("sv-SE");
    if (name && !value.includes(name)) onChange([...value, name]);
    setDraft("");
  };

  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label} <span className="ml-1 font-normal text-ink-3">(valfritt)</span>
      </label>
      <div className="flex flex-wrap items-center gap-1.5 rounded-[var(--radius-md)] border border-line-strong bg-bg p-1.5 focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-focus">
        {value.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-elevated py-1 pr-1 pl-2.5 text-sm text-ink">
            #{tag}
            <button
              type="button"
              className="grid size-7 place-items-center rounded-full text-ink-3 hover:bg-elevated-2 hover:text-ink"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              aria-label={`Ta bort taggen ${tag}`}
            >
              <X size={14} aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          id={id}
          className="min-h-9 min-w-[8rem] flex-1 bg-transparent px-1.5 outline-none placeholder:text-ink-3"
          value={draft}
          list={listId}
          placeholder={value.length ? "" : "t.ex. hermetism"}
          aria-describedby={`${id}-hint`}
          onChange={(e) => {
            const v = e.target.value;
            if (v.endsWith(",")) add(v.slice(0, -1));
            else setDraft(v);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => draft && add(draft)}
        />
        <datalist id={listId}>
          {suggestions
            .filter((s) => !value.includes(s))
            .map((s) => (
              <option key={s} value={s} />
            ))}
        </datalist>
      </div>
      <p id={`${id}-hint`} className="field-hint">
        {hint}
      </p>
    </div>
  );
}

export function TopicPicker({
  value,
  onChange,
  legend = "Ämneskategorier",
}: {
  value: TopicId[];
  onChange: (topics: TopicId[]) => void;
  legend?: string;
}) {
  return (
    <fieldset>
      <legend className="field-label">
        {legend} <span className="ml-1 font-normal text-ink-3">(valfritt)</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {TOPICS.map((t) => {
          const active = value.includes(t.id);
          return (
            <button
              key={t.id}
              type="button"
              className="chip"
              aria-pressed={active}
              onClick={() => onChange(active ? value.filter((x) => x !== t.id) : [...value, t.id])}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function ListField({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  hint?: string;
}) {
  const id = useId();
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setDraft("");
  };
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label} <span className="ml-1 font-normal text-ink-3">(valfritt)</span>
      </label>
      {value.length > 0 && (
        <ul className="mb-2 space-y-1.5">
          {value.map((item) => (
            <li key={item} className="flex items-start gap-2 rounded-[var(--radius-md)] bg-elevated px-3 py-2 text-sm">
              <span className="flex-1">{item}</span>
              <button
                type="button"
                className="grid size-7 shrink-0 place-items-center rounded text-ink-3 hover:text-ink"
                onClick={() => onChange(value.filter((x) => x !== item))}
                aria-label={`Ta bort ${item}`}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          id={id}
          className="input"
          value={draft}
          placeholder={placeholder}
          aria-describedby={hint ? `${id}-hint` : undefined}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" className="btn btn-secondary shrink-0" onClick={add} disabled={!draft.trim()}>
          Lägg till
        </button>
      </div>
      {hint && (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      )}
    </div>
  );
}

export function FormErrorSummary({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <p role="alert" className={cx("rounded-[var(--radius-md)] border border-danger/40 bg-danger-soft px-4 py-3 text-sm text-danger")}>
      {count === 1 ? "Ett fält behöver rättas innan du kan spara." : `${count} fält behöver rättas innan du kan spara.`}
    </p>
  );
}
