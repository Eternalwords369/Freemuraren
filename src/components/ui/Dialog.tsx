"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { cx } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  /** Anropas vid Esc, klick på bakgrunden eller stängknappen. Föräldern avgör om dialogen stängs. */
  onRequestClose: () => void;
  title: string;
  description?: string;
  variant?: "center" | "panel";
  children: ReactNode;
  footer?: ReactNode;
  /** Element att fokusera när dialogen öppnas. Standard är första fältet. */
  initialFocusSelector?: string;
  className?: string;
}

/**
 * Tillgänglig dialog byggd på <dialog>. showModal() ger fokusfälla och gör
 * resten av sidan inert. Fokus återställs till det element som öppnade den.
 */
export function Dialog({
  open,
  onRequestClose,
  title,
  description,
  variant = "center",
  children,
  footer,
  initialFocusSelector,
  className,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();
  const closeRef = useRef(onRequestClose);

  useEffect(() => {
    closeRef.current = onRequestClose;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      returnFocus.current = document.activeElement as HTMLElement | null;
      el.showModal();
      const target =
        (initialFocusSelector && el.querySelector<HTMLElement>(initialFocusSelector)) ||
        el.querySelector<HTMLElement>("[data-autofocus]") ||
        el.querySelector<HTMLElement>("input:not([type=hidden]), textarea, select") ||
        el.querySelector<HTMLElement>("button");
      target?.focus();
    } else if (!open && el.open) {
      el.close();
      returnFocus.current?.focus?.();
    }
  }, [open, initialFocusSelector]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      closeRef.current();
    };
    el.addEventListener("cancel", onCancel);
    return () => el.removeEventListener("cancel", onCancel);
  }, []);

  const isPanel = variant === "panel";

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onMouseDown={(e) => {
        // Klick utanför innehållet (på ::backdrop) träffar själva dialogelementet.
        if (e.target === ref.current) closeRef.current();
      }}
      className={cx(
        "m-0 max-h-none max-w-none bg-transparent p-0 backdrop:bg-transparent",
        isPanel
          ? "fixed inset-0 h-dvh w-full sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[min(640px,100vw)]"
          : "fixed inset-0 m-auto h-fit w-[min(520px,calc(100vw-2rem))]",
      )}
    >
      {open && (
        <div
          className={cx(
            "flex flex-col border-line bg-surface shadow-[0_24px_80px_-24px_rgba(0,0,0,0.8)]",
            isPanel
              ? "h-full border-l [animation:slide-in-right_var(--dur-base)_var(--ease-out)_both]"
              : "animate-fade max-h-[calc(100dvh-2rem)] rounded-[var(--radius-lg)] border",
            className,
          )}
        >
          <header className="flex items-start gap-4 border-b border-line px-5 py-4 sm:px-6">
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="text-2xl text-ink">
                {title}
              </h2>
              {description && (
                <p id={descId} className="mt-1 text-sm text-ink-2">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-icon -mr-2 shrink-0"
              onClick={() => closeRef.current()}
              aria-label="Stäng"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
          {footer && (
            <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-3 sm:px-6">
              {footer}
            </footer>
          )}
        </div>
      )}
    </dialog>
  );
}
