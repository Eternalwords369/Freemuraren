import type {
  ArchiveType,
  EpistemicCategory,
  InvestigationStatus,
  NodeKind,
  NoteType,
  RelationType,
  SourceType,
  TopicId,
} from "./types";

export const TOPICS: { id: TopicId; label: string }[] = [
  { id: "filosofi", label: "Filosofi" },
  { id: "idehistoria", label: "Idéhistoria" },
  { id: "symbolik", label: "Symbolik" },
  { id: "esoterik", label: "Esoteriska traditioner" },
  { id: "kosmologi", label: "Kosmologi" },
  { id: "medvetande", label: "Medvetandefilosofi" },
  { id: "religion", label: "Religion och jämförande traditioner" },
];

export const TOPIC_LABEL = Object.fromEntries(TOPICS.map((t) => [t.id, t.label])) as Record<
  TopicId,
  string
>;

export const SOURCE_TYPES: SourceType[] = ["kalla", "bok", "artikel", "referens"];
export const NOTE_TYPES: NoteType[] = [
  "anteckning",
  "citat",
  "fragestallning",
  "hypotes",
  "sammanfattning",
];
export const ARCHIVE_TYPES: ArchiveType[] = [...SOURCE_TYPES, ...NOTE_TYPES];

export const ARCHIVE_TYPE_LABEL: Record<ArchiveType, string> = {
  kalla: "Källa",
  bok: "Bok",
  artikel: "Artikel",
  referens: "Referens eller länk",
  anteckning: "Anteckning",
  citat: "Citat",
  fragestallning: "Frågeställning",
  hypotes: "Hypotes",
  sammanfattning: "Sammanfattning",
};

export function isSourceType(t: string): t is SourceType {
  return (SOURCE_TYPES as string[]).includes(t);
}

export function isNoteType(t: string): t is NoteType {
  return (NOTE_TYPES as string[]).includes(t);
}

export const EPISTEMIC: {
  id: EpistemicCategory;
  label: string;
  short: string;
  question: string;
}[] = [
  {
    id: "historisk-kalla",
    label: "Historisk källa",
    short: "Källa",
    question: "Vad säger en identifierbar källa faktiskt, och i vilket sammanhang?",
  },
  {
    id: "filosofisk-tolkning",
    label: "Filosofisk tolkning",
    short: "Filosofi",
    question: "Vad innebär idén, vad följer av den och hur hänger den ihop med andra?",
  },
  {
    id: "symbolisk-tolkning",
    label: "Symbolisk tolkning",
    short: "Symbolik",
    question: "Vilka betydelser har bilden fått i traditioner, konst, berättelser och för mig?",
  },
  {
    id: "vetenskapligt-perspektiv",
    label: "Modernt vetenskapligt perspektiv",
    short: "Vetenskap",
    question: "Vad stöder, stöder inte eller kan ännu inte avgöras med vetenskaplig metod?",
  },
];

export const EPISTEMIC_LABEL = Object.fromEntries(EPISTEMIC.map((e) => [e.id, e.label])) as Record<
  EpistemicCategory,
  string
>;

export const RELATION_TYPES: { id: RelationType; label: string; inverse: string }[] = [
  { id: "relaterar-till", label: "Relaterar till", inverse: "Relaterar till" },
  { id: "citerar", label: "Citerar", inverse: "Citeras av" },
  { id: "bygger-pa", label: "Bygger vidare på", inverse: "Byggs vidare av" },
  { id: "motsager", label: "Motsäger", inverse: "Motsägs av" },
  { id: "tolkar", label: "Tolkar", inverse: "Tolkas av" },
  { id: "hamtad-fran", label: "Hämtad från", inverse: "Källa till" },
];

export const RELATION_LABEL = Object.fromEntries(RELATION_TYPES.map((r) => [r.id, r.label])) as Record<
  RelationType,
  string
>;
export const RELATION_INVERSE = Object.fromEntries(
  RELATION_TYPES.map((r) => [r.id, r.inverse]),
) as Record<RelationType, string>;

export const NODE_KIND_LABEL: Record<NodeKind, string> = {
  source: "Källa",
  note: "Anteckning",
  symbol: "Symbol",
  concept: "Begrepp",
};

export const INVESTIGATION_STATUS: { id: InvestigationStatus; label: string }[] = [
  { id: "planerad", label: "Vill undersöka" },
  { id: "pagaende", label: "Pågår" },
  { id: "vilande", label: "Vilar" },
  { id: "avslutad", label: "Avslutad" },
];

export const LIMITS = {
  title: 200,
  short: 300,
  long: 20000,
  url: 2000,
  tag: 40,
} as const;
