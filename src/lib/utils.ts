import type { ID, ISODay } from "./types";

export function createId(prefix: string): ID {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return `${prefix}_${c.randomUUID()}`;
  // Reserv för miljöer utan randomUUID (t.ex. äldre webbläsare över http).
  const rand = Array.from({ length: 4 }, () => Math.random().toString(36).slice(2, 10)).join("");
  return `${prefix}_${Date.now().toString(36)}${rand}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function todayIsoDay(): ISODay {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const dateFmt = new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "short", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("sv-SE", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  return Number.isNaN(d.getTime()) ? "" : dateFmt.format(d);
}

export function formatDateTime(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : dateTimeFmt.format(d);
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return "";
  const min = Math.round(diff / 60000);
  if (min < 1) return "nyss";
  if (min < 60) return `för ${min} min sedan`;
  const h = Math.round(min / 60);
  if (h < 24) return `för ${h} tim sedan`;
  const days = Math.round(h / 24);
  if (days === 1) return "i går";
  if (days < 7) return `för ${days} dagar sedan`;
  return formatDate(iso);
}

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function normalizeText(s: string): string {
  return s.toLocaleLowerCase("sv-SE").replace(/\s+/g, " ").trim();
}

/** Enkel textmatchning: alla sökord måste finnas. Returnerar 0 vid ingen träff. */
export function matchScore(query: string, title: string, ...rest: (string | undefined)[]): number {
  const terms = normalizeText(query).split(" ").filter(Boolean);
  if (terms.length === 0) return 1;
  const t = normalizeText(title);
  const body = normalizeText(rest.filter(Boolean).join(" "));
  let score = 0;
  for (const term of terms) {
    if (t.includes(term)) score += t.startsWith(term) ? 4 : 3;
    else if (body.includes(term)) score += 1;
    else return 0;
  }
  return score;
}

export function excerpt(s: string, max = 160): string {
  const clean = s.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function compareSv(a: string, b: string): number {
  return a.localeCompare(b, "sv-SE", { sensitivity: "base" });
}
