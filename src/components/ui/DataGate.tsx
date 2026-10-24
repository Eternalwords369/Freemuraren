"use client";

import { AlertTriangle, Download, RotateCcw } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { BACKUP_KEY } from "@/lib/db/adapter";
import { useCodex } from "@/lib/db/client";
import type { CodexData } from "@/lib/db/schema";
import type { CodexStore } from "@/lib/db/store";
import { useConfirm, useToast } from "./Feedback";
import { Skeleton } from "./Display";

/**
 * Visar innehållet först när lokal data är inläst. Hanterar laddnings- och
 * feltillstånd på ett ställe så att sidorna slipper upprepa logiken.
 */
export function DataGate({ children }: { children: (data: CodexData, store: CodexStore) => ReactNode }) {
  const { state, store } = useCodex();

  if (state.status === "loading") {
    return (
      <div aria-busy="true" aria-live="polite" className="space-y-4">
        <span className="sr-only">Läser in ditt material…</span>
        <Skeleton className="h-24" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  if (state.status === "error") return <LoadError errors={state.loadErrors ?? []} store={store} />;

  return <>{children(state.db.data, store)}</>;
}

function LoadError({ errors, store }: { errors: string[]; store: CodexStore }) {
  const confirm = useConfirm();
  const toast = useToast();

  const downloadBackup = () => {
    const raw = window.localStorage.getItem(BACKUP_KEY);
    if (!raw) return toast("Det finns ingen säkerhetskopia att ladda ned.", "info");
    const url = URL.createObjectURL(new Blob([raw], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "living-cosmos-oläsbar-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = async () => {
    const ok = await confirm({
      title: "Börja om med ett tomt arkiv?",
      message: "Den oläsbara datan sparas som en säkerhetskopia som du kan ladda ned, men den används inte längre av appen.",
      confirmLabel: "Börja om",
      tone: "danger",
    });
    if (!ok) return;
    const res = store.resetAfterError();
    if (res.ok) toast("Ett nytt, tomt arkiv har skapats.");
    else toast(res.error, "error");
  };

  return (
    <div role="alert" className="card max-w-2xl p-6">
      <div className="flex items-center gap-3 text-danger">
        <AlertTriangle size={22} aria-hidden="true" />
        <h2 className="text-2xl text-ink">Ditt sparade material kunde inte läsas</h2>
      </div>
      <p className="mt-3 text-ink-2">
        Inget har raderats. Ladda ned en kopia av datan innan du gör något annat. Du kan sedan börja om med ett tomt arkiv och
        importera en tidigare export från Inställningar.
      </p>
      {errors.length > 0 && (
        <ul className="mt-4 space-y-1 rounded-[var(--radius-md)] bg-bg p-4 font-mono text-xs text-ink-2">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" className="btn btn-secondary" onClick={downloadBackup}>
          <Download size={16} aria-hidden="true" /> Ladda ned kopia
        </button>
        <button type="button" className="btn btn-danger" onClick={reset}>
          <RotateCcw size={16} aria-hidden="true" /> Börja om med tomt arkiv
        </button>
      </div>
    </div>
  );
}

/** Varnar innan sidan lämnas eller laddas om med osparade ändringar. */
export function useUnsavedGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
}
