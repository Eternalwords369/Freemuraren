"use client";

import { AlertTriangle, Menu, Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useCodex, useCrossTabSync } from "@/lib/db/client";
import { cx } from "@/lib/utils";
import { CosmosMark } from "../brand/CosmosMark";
import { Dialog } from "../ui/Dialog";
import { FeedbackProvider } from "../ui/Feedback";
import { NAV_ITEMS, isActive } from "./nav";
import { SearchDialog } from "./SearchDialog";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <FeedbackProvider>
      <Shell>{children}</Shell>
    </FeedbackProvider>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useCrossTabSync();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === "/" && !typing && !document.querySelector("dialog[open]")) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <a href="#main" className="skip-link">
        Hoppa till innehållet
      </a>

      {/* Sidomeny på stora skärmar */}
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-[var(--sidebar-w)] flex-col border-r border-line bg-bg/80 backdrop-blur-sm lg:flex"
        aria-label="Huvudmeny"
      >
        <Brand />
        <div className="px-4">
          <SearchButton onClick={() => setSearchOpen(true)} />
        </div>
        <nav className="mt-4 flex-1 overflow-y-auto px-3" aria-label="Huvudnavigation">
          <NavList pathname={pathname} />
        </nav>
        <div className="space-y-3 border-t border-line p-4">
          <Link href="/arkiv?ny=anteckning" className="btn btn-primary w-full">
            <Plus size={16} aria-hidden="true" /> Ny anteckning
          </Link>
          <p className="text-xs leading-relaxed text-ink-3">
            Ditt material sparas bara i den här webbläsaren.{" "}
            <Link href="/installningar" className="underline underline-offset-2 hover:text-ink-2">
              Om lagring
            </Link>
          </p>
        </div>
      </aside>

      {/* Toppfält på mobil och surfplatta */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line bg-bg/85 px-3 backdrop-blur-md sm:px-5 lg:hidden">
        <Link href="/" className="flex min-h-11 items-center gap-2.5 rounded-md pr-2 text-gold" aria-label="THE LIVING COSMOS – till översikten">
          <CosmosMark className="size-8" />
          <span className="leading-tight">
            <span className="block text-[0.65rem] font-semibold tracking-[0.2em] text-gold">THE LIVING COSMOS</span>
            <span className="block font-display text-base text-ink">Personal Codex</span>
          </span>
        </Link>
        <div className="flex-1" />
        <button type="button" className="btn btn-ghost btn-icon" onClick={() => setSearchOpen(true)} aria-label="Sök">
          <Search size={20} aria-hidden="true" />
        </button>
        <Link href="/arkiv?ny=anteckning" className="btn btn-ghost btn-icon" aria-label="Ny anteckning">
          <Plus size={20} aria-hidden="true" />
        </Link>
      </header>

      <div className="lg:pl-[var(--sidebar-w)]">
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[1180px] px-4 pt-6 pb-32 outline-none sm:px-6 lg:px-12 lg:pt-12 lg:pb-20">
          <SaveErrorBanner />
          {children}
        </main>
      </div>

      {/* Flikrad på mobil */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
        aria-label="Snabbnavigation"
      >
        <ul className="mx-auto grid max-w-xl grid-cols-5">
          {NAV_ITEMS.filter((n) => n.primaryMobile).map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "flex min-h-[60px] flex-col items-center justify-center gap-1 text-[0.68rem] font-medium",
                    active ? "text-gold" : "text-ink-3 hover:text-ink",
                  )}
                >
                  <Icon size={20} strokeWidth={active ? 2 : 1.6} aria-hidden="true" />
                  {item.label === "Kunskapsarkiv" ? "Arkiv" : item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex min-h-[60px] w-full flex-col items-center justify-center gap-1 text-[0.68rem] font-medium text-ink-3 hover:text-ink"
            >
              <Menu size={20} strokeWidth={1.6} aria-hidden="true" />
              Mer
            </button>
          </li>
        </ul>
      </nav>

      <Dialog open={menuOpen} onRequestClose={() => setMenuOpen(false)} title="Alla delar" variant="panel">
        <nav aria-label="Alla delar av appen" onClick={(e) => (e.target as HTMLElement).closest("a") && setMenuOpen(false)}>
          <NavList pathname={pathname} large />
        </nav>
        <p className="mt-6 text-sm text-ink-3">Ditt material sparas bara i den här webbläsaren och synkroniseras inte till någon server.</p>
      </Dialog>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function Brand() {
  return (
    <Link href="/" className="group flex items-center gap-3 px-5 pt-6 pb-5" aria-label="THE LIVING COSMOS – till översikten">
      <CosmosMark className="size-11 text-gold" animated />
      <span className="leading-tight">
        <span className="block text-[0.68rem] font-semibold tracking-[0.22em] text-gold">THE LIVING COSMOS</span>
        <span className="block font-display text-xl text-ink">Personal Codex</span>
      </span>
    </Link>
  );
}

function SearchButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 w-full items-center gap-2.5 rounded-[var(--radius-md)] border border-line bg-surface px-3 text-sm text-ink-3 transition-colors hover:border-line-strong hover:text-ink-2"
    >
      <Search size={16} aria-hidden="true" />
      <span className="flex-1 text-left">Sök</span>
      <kbd className="rounded border border-line px-1.5 py-0.5 font-sans text-[0.68rem] text-ink-3" title="Kortkommando: / eller Ctrl/⌘ + K">
        /
      </kbd>
    </button>
  );
}

function NavList({ pathname, large }: { pathname: string; large?: boolean }) {
  return (
    <ul className="space-y-0.5">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "relative flex items-center gap-3 rounded-[var(--radius-md)] px-3 transition-colors",
                large ? "min-h-12 text-base" : "min-h-10 text-[0.9rem]",
                active ? "bg-gold-soft text-gold-strong" : "text-ink-2 hover:bg-surface hover:text-ink",
              )}
            >
              {active && <span aria-hidden="true" className="absolute top-2 bottom-2 left-0 w-0.5 rounded-full bg-gold" />}
              <Icon size={18} strokeWidth={active ? 2 : 1.6} aria-hidden="true" />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function SaveErrorBanner() {
  const { state, store } = useCodex();
  if (!state.saveError) return null;
  return (
    <div role="alert" className="mb-6 flex items-start gap-3 rounded-[var(--radius-md)] border border-danger/40 bg-danger-soft px-4 py-3 text-sm">
      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
      <div className="flex-1 text-ink">
        <p className="font-semibold">Senaste ändringen sparades inte.</p>
        <p className="text-ink-2">{state.saveError}</p>
      </div>
      <button type="button" className="-m-1 rounded p-1 text-ink-3 hover:text-ink" onClick={() => store.dismissSaveError()} aria-label="Stäng varningen">
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
