/**
 * Datamodeller för THE LIVING COSMOS — Personal Codex.
 *
 * Alla ID:n är stabila strängar med prefix (t.ex. "src_…") och alla tidsstämplar
 * är ISO 8601-strängar. Modellerna är medvetet platta så att de senare kan
 * mappas mot tabeller i t.ex. Supabase utan omstrukturering.
 */

export type ID = string;
/** ISO 8601, t.ex. "2026-10-24T09:12:00.000Z". */
export type ISODateString = string;
/** Kalenderdatum, "YYYY-MM-DD". */
export type ISODay = string;

export interface BaseEntity {
  id: ID;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  /** Sant för medföljande exempelmaterial. Exempel är aldrig verifierad forskning. */
  isExample?: boolean;
}

/** Ämneskategorier som delas av Utforska, Kunskapsarkivet och Min resa. */
export type TopicId =
  | "filosofi"
  | "idehistoria"
  | "symbolik"
  | "esoterik"
  | "kosmologi"
  | "medvetande"
  | "religion";

/** De fyra kunskapskategorierna från metodsidan. */
export type EpistemicCategory =
  | "historisk-kalla"
  | "filosofisk-tolkning"
  | "symbolisk-tolkning"
  | "vetenskapligt-perspektiv";

export type SourceType = "kalla" | "bok" | "artikel" | "referens";
export type NoteType = "anteckning" | "citat" | "fragestallning" | "hypotes" | "sammanfattning";
export type ArchiveType = SourceType | NoteType;

interface ArchiveFields {
  title: string;
  /** Innehåll eller sammanfattning. */
  content: string;
  author?: string;
  url?: string;
  topics: TopicId[];
  tagIds: ID[];
  /** Personlig kommentar, skild från innehållet. */
  comment?: string;
  epistemic?: EpistemicCategory;
}

export interface Source extends BaseEntity, ArchiveFields {
  entity: "source";
  type: SourceType;
  /** Förlag, tidskrift eller annan publiceringsuppgift – bara om den är känd. */
  publication?: string;
  year?: string;
}

export type QuestionStatus = "oppen" | "besvarad";

export interface Note extends BaseEntity, ArchiveFields {
  entity: "note";
  type: NoteType;
  /** Valfri koppling till en källa i arkivet. */
  sourceId?: ID;
  /** Används för frågeställningar och hypoteser. */
  status?: QuestionStatus;
}

export type ArchiveItem = Source | Note;

export interface TraditionReading {
  id: ID;
  tradition: string;
  interpretation: string;
}

export type GlyphRef =
  | { kind: "builtin"; name: string }
  | { kind: "character"; value: string };

export interface SymbolEntry extends BaseEntity {
  name: string;
  glyph: GlyphRef;
  description: string;
  historicalContext: string;
  traditions: TraditionReading[];
  personalInterpretation: string;
  relatedConcepts: string[];
  references: string[];
  tagIds: ID[];
}

export interface Concept extends BaseEntity {
  name: string;
  description: string;
  topics: TopicId[];
  tagIds: ID[];
}

export type NodeKind = "source" | "note" | "symbol" | "concept";

export interface NodeRef {
  kind: NodeKind;
  id: ID;
}

export type RelationType =
  | "relaterar-till"
  | "citerar"
  | "bygger-pa"
  | "motsager"
  | "tolkar"
  | "hamtad-fran";

export interface KnowledgeRelation extends BaseEntity {
  from: NodeRef;
  to: NodeRef;
  type: RelationType;
  note?: string;
}

export interface Tag extends BaseEntity {
  name: string;
}

export interface Milestone {
  id: ID;
  title: string;
  done: boolean;
  doneAt?: ISODateString;
}

export type GoalStatus = "aktiv" | "klar";

export interface LearningGoal extends BaseEntity {
  title: string;
  description: string;
  status: GoalStatus;
  completedAt?: ISODateString;
  milestones: Milestone[];
  topics: TopicId[];
}

export interface JournalEntry extends BaseEntity {
  title: string;
  body: string;
  entryDate: ISODay;
  tagIds: ID[];
}

export type InvestigationStatus = "planerad" | "pagaende" | "vilande" | "avslutad";

export interface InvestigationTopic extends BaseEntity {
  title: string;
  note: string;
  status: InvestigationStatus;
  /** Slug för ett ämne i Utforska, om undersökningen startade där. */
  exploreSlug?: string;
}

export type EntityKind =
  | NodeKind
  | "relation"
  | "tag"
  | "goal"
  | "journal"
  | "investigation";

export type ActivityAction = "skapade" | "uppdaterade" | "raderade" | "slutforde" | "importerade";

export interface ActivityEvent {
  id: ID;
  at: ISODateString;
  action: ActivityAction;
  kind: EntityKind | "data";
  entityId?: ID;
  title: string;
}

export interface RecentVisit {
  ref: NodeRef;
  at: ISODateString;
}
