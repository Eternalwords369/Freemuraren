import Link from "next/link";
import type { ReactNode } from "react";
import { ARCHIVE_TYPE_LABEL, EPISTEMIC_LABEL } from "@/lib/constants";
import type { ArchiveType, EpistemicCategory } from "@/lib/types";
import { cx } from "@/lib/utils";
import { OrbitDecor } from "../brand/CosmosMark";

export function PageHeader({
  eyebrow,
  title,
  lead,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  lead?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="relative isolate mb-8 overflow-hidden pt-2 lg:mb-10">
      <OrbitDecor className="absolute -top-28 -right-24 -z-10 size-[300px] text-gold/40 sm:size-[380px] lg:-top-40 lg:size-[440px]" />
      <p className="eyebrow">{eyebrow}</p>
      <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[2.5rem] text-ink sm:text-5xl lg:text-[3.5rem]">{title}</h1>
          {lead && <div className="mt-3 max-w-[60ch] text-[1.0625rem] text-ink-2">{lead}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
      <div className="hairline mt-8" />
    </header>
  );
}

export function SectionTitle({ title, action, id }: { title: string; action?: ReactNode; id?: string }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-4">
      <h2 id={id} className="text-[1.65rem] text-ink">
        {title}
      </h2>
      {action}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  children,
  action,
  compact,
}: {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cx(
        "flex flex-col items-center rounded-[var(--radius-lg)] border border-dashed border-line text-center",
        compact ? "px-5 py-7" : "px-6 py-12",
      )}
    >
      {icon && <div className="mb-3 text-gold">{icon}</div>}
      <h3 className="text-xl text-ink">{title}</h3>
      {children && <div className="mt-2 max-w-[44ch] text-sm text-ink-2">{children}</div>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function ExampleBadge() {
  return (
    <span className="badge badge-example" title="Exempelmaterial – inte verifierad forskning">
      Exempel
    </span>
  );
}

const EPI_VAR: Record<EpistemicCategory, string> = {
  "historisk-kalla": "var(--c-epi-historisk)",
  "filosofisk-tolkning": "var(--c-epi-filosofisk)",
  "symbolisk-tolkning": "var(--c-epi-symbolisk)",
  "vetenskapligt-perspektiv": "var(--c-epi-vetenskap)",
};

export function EpistemicBadge({ category }: { category: EpistemicCategory }) {
  return (
    <span className="badge" style={{ color: EPI_VAR[category], borderColor: `color-mix(in srgb, ${EPI_VAR[category]} 45%, transparent)` }}>
      <span aria-hidden="true" className="size-1.5 rounded-full" style={{ background: EPI_VAR[category] }} />
      {EPISTEMIC_LABEL[category]}
    </span>
  );
}

export function epistemicColor(category: EpistemicCategory): string {
  return EPI_VAR[category];
}

export function TypeBadge({ type }: { type: ArchiveType }) {
  return <span className="badge">{ARCHIVE_TYPE_LABEL[type]}</span>;
}

export function TagList({ names, className }: { names: string[]; className?: string }) {
  if (names.length === 0) return null;
  return (
    <ul className={cx("flex flex-wrap gap-x-3 gap-y-1 text-[0.8125rem] text-ink-3", className)} aria-label="Taggar">
      {names.map((n) => (
        <li key={n}>#{n}</li>
      ))}
    </ul>
  );
}

export function TextLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={cx("inline-flex items-center gap-1 text-sm font-medium text-gold underline-offset-4 hover:text-gold-strong hover:underline", className)}
    >
      {children}
    </Link>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-[var(--radius-md)] bg-elevated", className)} />;
}
