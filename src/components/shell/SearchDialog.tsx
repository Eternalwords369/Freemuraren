"use client";

import { ArrowRight, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { useCodex } from "@/lib/db/client";
import { searchAll } from "@/lib/search";
import { cx } from "@/lib/utils";
import { Dialog } from "../ui/Dialog";

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onRequestClose={onClose} title="Sök i ditt material" className="sm:max-h-[min(640px,80dvh)]">
      {open && <SearchBody onClose={onClose} />}
    </Dialog>
  );
}

function SearchBody({ onClose }: { onClose: () => void }) {
  const { state } = useCodex();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();
  const inputId = useId();

  const hits = useMemo(
    () => (state.status === "ready" ? searchAll(state.db.data, query) : []),
    [state, query],
  );

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div>
      <label htmlFor={inputId} className="sr-only">
        Sökord
      </label>
      <div className="relative">
        <Search size={18} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-3" aria-hidden="true" />
        <input
          id={inputId}
          data-autofocus
          className="input pl-10"
          type="search"
          role="combobox"
          aria-expanded={hits.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={hits[active] ? `${listId}-${active}` : undefined}
          placeholder="Titlar, anteckningar, symboler, begrepp…"
          value={query}
          autoComplete="off"
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, hits.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && hits[active]) {
              e.preventDefault();
              go(hits[active].href);
            }
          }}
        />
      </div>

      <p className="sr-only" aria-live="polite">
        {query.trim() ? `${hits.length} träffar` : ""}
      </p>

      {!query.trim() ? (
        <p className="mt-5 text-sm text-ink-3">
          Sökningen omfattar ditt kunskapsarkiv, symboler, begrepp, Min resa och ämnena i Utforska. Använd piltangenterna och
          Enter för att öppna en träff.
        </p>
      ) : hits.length === 0 ? (
        <p className="mt-5 text-sm text-ink-2">Inga träffar för ”{query.trim()}”. Prova ett kortare eller annat ord.</p>
      ) : (
        <ul id={listId} role="listbox" aria-label="Sökträffar" className="mt-4 space-y-1">
          {hits.map((h, i) => {
            const header = i === 0 || hits[i - 1]?.group !== h.group ? h.group : null;
            return (
              <li key={h.key} role="presentation">
                {header && <p className="eyebrow mt-4 mb-1.5 px-1 first:mt-0">{header}</p>}
                <div
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  tabIndex={-1}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(h.href)}
                  className={cx(
                    "flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5",
                    i === active ? "bg-elevated-2" : "hover:bg-elevated",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-ink">
                      {h.title}
                      {h.isExample && <span className="ml-2 text-xs text-gold">Exempel</span>}
                    </p>
                    {h.subtitle && <p className="truncate text-sm text-ink-3">{h.subtitle}</p>}
                  </div>
                  <ArrowRight size={16} className={cx("shrink-0", i === active ? "text-gold" : "text-transparent")} aria-hidden="true" />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
