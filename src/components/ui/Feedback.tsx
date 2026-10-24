"use client";

import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cx } from "@/lib/utils";
import { Dialog } from "./Dialog";

/* ------------------------------ Notiser ----------------------------- */

type Tone = "success" | "error" | "info";
interface Toast {
  id: number;
  tone: Tone;
  message: string;
}

const ToastContext = createContext<(message: string, tone?: Tone) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

/* --------------------------- Bekräftelser --------------------------- */

export interface ConfirmOptions {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
  /** Kräver att användaren skriver denna text innan åtgärden kan bekräftas. */
  requireText?: string;
}

const ConfirmContext = createContext<(opts: ConfirmOptions) => Promise<boolean>>(async () => false);

export function useConfirm() {
  return useContext(ConfirmContext);
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback(
    (message: string, tone: Tone = "success") => {
      const id = nextId.current++;
      setToasts((t) => [...t.slice(-2), { id, tone, message }]);
      window.setTimeout(() => dismiss(id), tone === "error" ? 8000 : 4500);
    },
    [dismiss],
  );

  const [confirmState, setConfirmState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(
    null,
  );
  const [typed, setTyped] = useState("");

  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setTyped("");
        setConfirmState({ ...opts, resolve });
      }),
    [],
  );

  const settle = (value: boolean) => {
    confirmState?.resolve(value);
    setConfirmState(null);
  };

  const canConfirm = !confirmState?.requireText || typed.trim() === confirmState.requireText;
  const value = useMemo(() => confirm, [confirm]);

  return (
    <ToastContext.Provider value={toast}>
      <ConfirmContext.Provider value={value}>
        {children}

        <Dialog
          open={Boolean(confirmState)}
          onRequestClose={() => settle(false)}
          title={confirmState?.title ?? ""}
          initialFocusSelector={confirmState?.requireText ? "input" : "[data-cancel]"}
          footer={
            <>
              <button type="button" className="btn btn-ghost" data-cancel onClick={() => settle(false)}>
                {confirmState?.cancelLabel ?? "Avbryt"}
              </button>
              <button
                type="button"
                className={cx("btn", confirmState?.tone === "danger" ? "btn-danger" : "btn-primary")}
                disabled={!canConfirm}
                onClick={() => settle(true)}
              >
                {confirmState?.confirmLabel}
              </button>
            </>
          }
        >
          <div className="space-y-4 text-ink-2">
            <div>{confirmState?.message}</div>
            {confirmState?.requireText && (
              <div>
                <label htmlFor="confirm-text" className="field-label">
                  Skriv <span className="font-mono text-gold">{confirmState.requireText}</span> för att bekräfta
                </label>
                <input
                  id="confirm-text"
                  className="input"
                  value={typed}
                  autoComplete="off"
                  onChange={(e) => setTyped(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canConfirm) settle(true);
                  }}
                />
              </div>
            )}
          </div>
        </Dialog>

        <div
          className="pointer-events-none fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-50 flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:items-end lg:px-6"
          aria-live="polite"
          role="status"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className={cx(
                "animate-rise pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[var(--radius-md)] border bg-elevated px-4 py-3 text-sm shadow-[0_16px_40px_-16px_rgba(0,0,0,0.8)]",
                t.tone === "error" ? "border-danger/50" : t.tone === "success" ? "border-success/40" : "border-line",
              )}
            >
              {t.tone === "error" ? (
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
              ) : t.tone === "success" ? (
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
              ) : (
                <Info size={18} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
              )}
              <p className="flex-1 text-ink">{t.message}</p>
              <button
                type="button"
                className="-m-1 rounded p-1 text-ink-3 hover:text-ink"
                onClick={() => dismiss(t.id)}
                aria-label="Stäng meddelandet"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
}
