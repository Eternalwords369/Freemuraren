"use client";

import { useEffect, useSyncExternalStore } from "react";
import { LocalStorageAdapter, MemoryAdapter, STORAGE_KEY } from "./adapter";
import { emptyDatabase } from "./schema";
import { CodexStore, type StoreState } from "./store";

let store: CodexStore | null = null;

export function getStore(): CodexStore {
  if (!store) {
    store = new CodexStore(typeof window !== "undefined" ? new LocalStorageAdapter() : new MemoryAdapter());
  }
  return store;
}

/** Servern och första klientrenderingen ser alltid "loading" – det förhindrar hydreringsfel. */
const SERVER_STATE: StoreState = { status: "loading", db: emptyDatabase() };
const getServerState = () => SERVER_STATE;

export function useCodex(): { state: StoreState; store: CodexStore } {
  const s = getStore();
  const state = useSyncExternalStore(s.subscribe, s.getState, getServerState);
  return { state, store: s };
}

/** Lyssnar på ändringar från andra flikar så att datan hålls i synk. */
export function useCrossTabSync(): void {
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) getStore().reload();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
}
