/**
 * Exempelmaterial som demonstrerar funktionerna. Varje post är märkt
 * isExample: true och visas med etiketten "Exempel" i gränssnittet.
 *
 * Bibliografiska uppgifter anges bara där de är välkända och verifierbara.
 * Inga citat är påhittade; det enda citatet är Descartes egen formulering.
 * Exemplen är inte verifierade forskningsresultat.
 */
import type { CodexData } from "./schema";

export const EXAMPLE_ID_PREFIX = "ex_";

export function buildExampleData(now: string): CodexData {
  const stamp = { createdAt: now, updatedAt: now, isExample: true };

  return {
    tags: [
      { id: "ex_tag_platon", name: "platon", ...stamp },
      { id: "ex_tag_medvetande", name: "medvetande", ...stamp },
      { id: "ex_tag_hermetism", name: "hermetism", ...stamp },
      { id: "ex_tag_geometri", name: "geometri", ...stamp },
      { id: "ex_tag_cirkel", name: "cirkeln", ...stamp },
    ],
    sources: [
      {
        id: "ex_src_timaios",
        entity: "source",
        type: "bok",
        title: "Timaios",
        author: "Platon",
        year: "ca 360 f.Kr.",
        content:
          "Dialog där gestalten Timaios ger en berättelse om kosmos tillkomst. En hantverkare (demiurgen) formar världen med de eviga formerna som förebild, och kosmos beskrivs som ett levande väsen med själ och förnuft. Dialogen fick stort inflytande på senantik, medeltida och renässansens kosmologi.",
        comment:
          "Läs berättelsen som en filosofisk framställning som Platon själv kallar en ”sannolik berättelse”, inte som en naturvetenskaplig rapport.",
        topics: ["filosofi", "kosmologi", "idehistoria"],
        tagIds: ["ex_tag_platon"],
        epistemic: "historisk-kalla",
        ...stamp,
      },
      {
        id: "ex_src_nagel",
        entity: "source",
        type: "artikel",
        title: "What Is It Like to Be a Bat?",
        author: "Thomas Nagel",
        publication: "The Philosophical Review, vol. 83, nr 4",
        year: "1974",
        content:
          "Nagel argumenterar för att medvetna upplevelser har en subjektiv karaktär – att det är ”något det är som” att vara en viss varelse – och att en rent objektiv, fysikalisk beskrivning inte ensam tycks fånga denna karaktär.",
        topics: ["medvetande", "filosofi"],
        tagIds: ["ex_tag_medvetande"],
        epistemic: "filosofisk-tolkning",
        ...stamp,
      },
      {
        id: "ex_src_yates",
        entity: "source",
        type: "bok",
        title: "Giordano Bruno and the Hermetic Tradition",
        author: "Frances A. Yates",
        publication: "Routledge & Kegan Paul",
        year: "1964",
        content:
          "Idéhistorisk studie av hermetismens roll i renässansens tänkande, med Giordano Bruno som centralgestalt. Yates tes om hermetismens betydelse för den tidiga vetenskapen har sedan dess diskuterats, kritiserats och nyanserats av andra forskare.",
        topics: ["idehistoria", "esoterik"],
        tagIds: ["ex_tag_hermetism"],
        epistemic: "historisk-kalla",
        ...stamp,
      },
    ],
    notes: [
      {
        id: "ex_note_cogito",
        entity: "note",
        type: "citat",
        title: "Je pense, donc je suis",
        author: "René Descartes",
        content:
          "« Je pense, donc je suis » – ”Jag tänker, alltså är jag”. Discours de la méthode (1637), fjärde delen.",
        comment:
          "Den latinska formen ”cogito, ergo sum” förekommer i Principia philosophiae (1644). Bra utgångspunkt för frågan om vad som kan vetas med säkerhet om det egna medvetandet.",
        topics: ["filosofi", "medvetande"],
        tagIds: ["ex_tag_medvetande"],
        epistemic: "historisk-kalla",
        ...stamp,
      },
      {
        id: "ex_note_fraga",
        entity: "note",
        type: "fragestallning",
        title: "Är medvetande något kosmos har – eller något det gör?",
        content:
          "Skillnaden mellan att se medvetande som en egenskap och som en process. Vilka traditioner tänker i substanser, och vilka i skeenden? Vad skulle kunna avgöra frågan, och vad kan i nuläget inte avgöra den?",
        topics: ["medvetande", "kosmologi"],
        tagIds: ["ex_tag_medvetande"],
        epistemic: "filosofisk-tolkning",
        status: "oppen",
        ...stamp,
      },
      {
        id: "ex_note_hypotes",
        entity: "note",
        type: "hypotes",
        title: "Cirkeln återkommer för att den bygger på gemensam perception",
        content:
          "Arbetshypotes: cirkulära symboler förekommer i många kulturer främst för att de utgår från gemensamma erfarenheter (sol, måne, horisont, kretslopp), inte för att de spridits från ett ursprung.",
        comment:
          "Obeprövad. Kräver jämförande material, och flera förklaringar kan gälla samtidigt. Skilj på var en symbol förekommer och varför.",
        topics: ["symbolik"],
        tagIds: ["ex_tag_cirkel"],
        epistemic: "symbolisk-tolkning",
        status: "oppen",
        ...stamp,
      },
      {
        id: "ex_note_casaubon",
        entity: "note",
        type: "sammanfattning",
        title: "Dateringen av Corpus Hermeticum",
        content:
          "Under renässansen lästes Corpus Hermeticum ofta som uråldrig egyptisk visdom. Isaac Casaubon visade 1614 med språkliga och innehållsliga argument att texterna tillkommit i efterkristen tid. Dagens forskning daterar dem i regel till de första århundradena e.Kr.",
        comment: "Ett bra exempel på skillnaden mellan vad en tradition hävdar om sig själv och vad historisk metod kan belägga.",
        topics: ["idehistoria", "esoterik"],
        tagIds: ["ex_tag_hermetism"],
        epistemic: "historisk-kalla",
        sourceId: "ex_src_yates",
        ...stamp,
      },
    ],
    symbols: [
      {
        id: "ex_sym_cirkumpunkt",
        name: "Cirkumpunkt",
        glyph: { kind: "builtin", name: "circumpunct" },
        description: "En cirkel med en markerad mittpunkt.",
        historicalContext:
          "Används som astronomisk symbol för solen och, i europeisk alkemi, som tecken för guld.",
        traditions: [
          { id: "ex_tr_1", tradition: "Astronomi", interpretation: "Tecken för solen." },
          { id: "ex_tr_2", tradition: "Alkemi", interpretation: "Tecken för guld, som förknippades med solen." },
          {
            id: "ex_tr_3",
            tradition: "Frimureri",
            interpretation:
              "Förekommer i delar av frimurarlitteraturen som ”punkten inom cirkeln”. Förklaringarna varierar mellan riter och författare.",
          },
        ],
        personalInterpretation: "",
        relatedConcepts: ["Centrum och periferi", "Solen"],
        references: [],
        tagIds: ["ex_tag_cirkel", "ex_tag_geometri"],
        ...stamp,
      },
      {
        id: "ex_sym_ouroboros",
        name: "Ouroboros",
        glyph: { kind: "builtin", name: "ouroboros" },
        description: "En orm eller drake som biter sig själv i svansen och därmed bildar en sluten ring.",
        historicalContext:
          "Tidiga belägg finns i egyptiskt material, bland annat på en förgylld helgedom ur Tutankhamons grav (1300-talet f.Kr.). Motivet återkommer senare i grekisk-egyptisk alkemi, till exempel i Kleopatras Chrysopoeia.",
        traditions: [
          {
            id: "ex_tr_4",
            tradition: "Grekisk-egyptisk alkemi",
            interpretation: "Förknippas i Chrysopoeia med inskriften ”hen to pan” – ”allt är ett”.",
          },
          {
            id: "ex_tr_5",
            tradition: "Analytisk psykologi",
            interpretation: "C. G. Jung tolkade motivet som en arketypisk bild av helhet och självförnyelse.",
          },
        ],
        personalInterpretation: "",
        relatedConcepts: ["Kretslopp", "Enhet"],
        references: [],
        tagIds: ["ex_tag_cirkel", "ex_tag_hermetism"],
        ...stamp,
      },
      {
        id: "ex_sym_vesica",
        name: "Vesica piscis",
        glyph: { kind: "builtin", name: "vesica" },
        description: "Den mandelform som uppstår där två lika stora cirklar överlappar genom varandras medelpunkter.",
        historicalContext:
          "Samma konstruktion med två cirklar används i Euklides Elementa, bok I, sats 1, för att konstruera en liksidig triangel. Formen förekommer i medeltida kyrkoarkitektur och konst.",
        traditions: [
          { id: "ex_tr_6", tradition: "Geometri", interpretation: "En grundkonstruktion med passare och linjal." },
          {
            id: "ex_tr_7",
            tradition: "Kristen ikonografi",
            interpretation: "Närbesläktad med mandorlan, den ram av ljus som omger Kristus i medeltida bilder.",
          },
        ],
        personalInterpretation: "",
        relatedConcepts: ["Skärningspunkt", "Liksidig triangel"],
        references: ["Euklides, Elementa, bok I, sats 1."],
        tagIds: ["ex_tag_geometri"],
        ...stamp,
      },
      {
        id: "ex_sym_hexagram",
        name: "Hexagram",
        glyph: { kind: "builtin", name: "hexagram" },
        description: "En sexuddig figur av två sammanflätade liksidiga trianglar.",
        historicalContext:
          "Hexagrammet förekommer i många kulturer och epoker, ofta som dekoration. Som judisk symbol – Davidsstjärnan – blev det allmänt utbrett först under senmedeltid och nytid.",
        traditions: [
          { id: "ex_tr_8", tradition: "Judendom", interpretation: "Davidsstjärnan (Magen David)." },
          {
            id: "ex_tr_9",
            tradition: "Alkemi",
            interpretation: "Uppåt- och nedåtriktad triangel läses ibland som eld och vatten i förening.",
          },
        ],
        personalInterpretation: "",
        relatedConcepts: ["Motsatsernas förening"],
        references: [],
        tagIds: ["ex_tag_geometri"],
        ...stamp,
      },
    ],
    concepts: [
      {
        id: "ex_con_animamundi",
        name: "Världssjälen (anima mundi)",
        description:
          "Föreställningen att kosmos som helhet är besjälat. Den har en viktig förebild i Platons Timaios och togs upp i nyplatonism och renässansfilosofi.",
        topics: ["filosofi", "kosmologi"],
        tagIds: ["ex_tag_platon"],
        ...stamp,
      },
      {
        id: "ex_con_hardproblem",
        name: "Det svåra problemet",
        description:
          "Frågan varför och hur fysiska processer åtföljs av subjektiv upplevelse. Termen myntades av David Chalmers på 1990-talet.",
        topics: ["medvetande"],
        tagIds: ["ex_tag_medvetande"],
        ...stamp,
      },
    ],
    relations: [
      {
        id: "ex_rel_1",
        from: { kind: "concept", id: "ex_con_animamundi" },
        to: { kind: "source", id: "ex_src_timaios" },
        type: "hamtad-fran",
        ...stamp,
      },
      {
        id: "ex_rel_2",
        from: { kind: "concept", id: "ex_con_hardproblem" },
        to: { kind: "source", id: "ex_src_nagel" },
        type: "bygger-pa",
        note: "Nagels artikel räknas ofta till bakgrunden för problemformuleringen.",
        ...stamp,
      },
      {
        id: "ex_rel_3",
        from: { kind: "note", id: "ex_note_fraga" },
        to: { kind: "concept", id: "ex_con_hardproblem" },
        type: "relaterar-till",
        ...stamp,
      },
      {
        id: "ex_rel_4",
        from: { kind: "note", id: "ex_note_casaubon" },
        to: { kind: "source", id: "ex_src_yates" },
        type: "hamtad-fran",
        ...stamp,
      },
      {
        id: "ex_rel_5",
        from: { kind: "note", id: "ex_note_hypotes" },
        to: { kind: "symbol", id: "ex_sym_cirkumpunkt" },
        type: "tolkar",
        ...stamp,
      },
      {
        id: "ex_rel_6",
        from: { kind: "symbol", id: "ex_sym_ouroboros" },
        to: { kind: "concept", id: "ex_con_animamundi" },
        type: "relaterar-till",
        ...stamp,
      },
      {
        id: "ex_rel_7",
        from: { kind: "note", id: "ex_note_cogito" },
        to: { kind: "note", id: "ex_note_fraga" },
        type: "relaterar-till",
        ...stamp,
      },
    ],
    goals: [],
    journal: [],
    investigations: [],
  };
}
