# THE LIVING COSMOS — Personal Codex

*En modern karta över medvetandets evolution.*

En personlig kunskapsplattform för filosofi, symbolik, idéhistoria, esoteriska traditioner och föreställningar om medvetandet och kosmos. Gränssnittet är på svenska och allt material sparas lokalt i webbläsaren.

## Kom igång

Kräver Node.js 20.9 eller senare.

```bash
npm install
npm run dev        # http://localhost:3000
```

| Kommando            | Vad det gör                                   |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Utvecklingsserver                             |
| `npm run build`     | Produktionsbygge                              |
| `npm start`         | Kör produktionsbygget                         |
| `npm run lint`      | ESLint (Next.js core-web-vitals + TypeScript) |
| `npm run typecheck` | `tsc --noEmit` med strikt typning             |
| `npm test`          | Enhetstester (Vitest) för datalager och graf  |

## Delar av appen

| Sida          | Väg              | Innehåll                                                                                           |
| ------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| Översikt      | `/`              | Statistik, fortsätt där du slutade, senaste anteckningar och källor, aktuella undersökningar       |
| Utforska      | `/utforska`      | 7 kategorier, 19 ämnen, varje ämne uppdelat i de fyra kunskapskategorierna                         |
| Kunskapsarkiv | `/arkiv`         | CRUD för 9 innehållstyper, sökning, filter (typ, ämne, tagg, kategori), sortering                  |
| Symbollexikon | `/symboler`      | Symboler med egen SVG-form eller Unicode-tecken, traditioner, personlig tolkning, källor            |
| Kunskapskarta | `/karta`         | Interaktiv graf (SVG, egen kraftlayout) och listvy, begrepp, relationer                            |
| Min resa      | `/resa`          | Lärandemål med milstolpar, ämnen att undersöka, öppna frågor, reflektionsjournal, aktivitet         |
| Metod         | `/metod`         | Källkritik och de fyra kunskapskategorierna                                                        |
| Inställningar | `/installningar` | Export/import (JSON), exempeldata, taggar, radering av lokal data                                   |

Global sökning öppnas med `/` eller `Ctrl/⌘ + K`.

## Arkitektur

- **Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS 4, Lucide-ikoner.**
- Inga animationsbibliotek: rörelse görs med CSS och respekterar `prefers-reduced-motion`.
- Inget visualiseringsbibliotek: kunskapskartan använder en liten deterministisk Fruchterman–Reingold-layout (`src/lib/graph.ts`) med kollisionshantering för etiketter.
- Typsnitt laddas lokalt via Fontsource (EB Garamond för rubriker, Instrument Sans för gränssnitt). Inga externa nätverksanrop.
- Designbeslut ligger som CSS-variabler i `src/app/globals.css` och exponeras för Tailwind via `@theme inline`.

```
src/
  app/                 Sidor (server-komponenter som renderar klientvyer)
  components/          UI per område: archive, symbols, map, journey, explore, settings, shell, ui
  content/             Kuraterat innehåll för Utforska och symbolformer
  lib/
    types.ts           Datamodeller (Source, Note, SymbolEntry, Concept, KnowledgeRelation, Tag, …)
    validation.ts      Formulär- och strukturvalidering
    db/
      schema.ts        Databasdokument, schemaversion
      migrations.ts    Migreringar, tolkning av sparad data och exportfiler
      adapter.ts       StorageAdapter (LocalStorage, minne)
      store.ts         CodexStore: repositories per datatyp, sammanslagning, exempeldata
      client.ts        React-krokar (useSyncExternalStore) och synk mellan flikar
      examples.ts      Märkt exempelmaterial
tests/                 Vitest
```

### Datalager

`CodexStore` håller hela databasen i minnet och sparar varje ändring genom en `StorageAdapter`. Varje datatyp har ett eget repository (`store.sources`, `store.notes`, `store.symbols`, …) med `getAll`, `getById`, `create`, `update`, `delete` och `search`, plus typspecifika metoder (t.ex. `notes.openQuestions`, `goals.toggleMilestone`).

- Misslyckas en sparning (t.ex. fullt lagringsutrymme) återställs minnet och användaren får ett felmeddelande, så att gränssnittet aldrig visar data som inte överlever en omladdning.
- Raderas en post tas dess relationer och "senast besökt"-poster bort i samma ändring.
- Oläsbar sparad data skrivs aldrig över tyst: en kopia sparas och användaren får välja att ladda ned den eller börja om.
- Servern och den första klientrenderingen ser alltid tillståndet "loading", vilket förhindrar hydreringsfel.
- Ändringar i en annan flik läses in automatiskt via `storage`-händelsen.

### Migreringar

`SCHEMA_VERSION` i `schema.ts` anger aktuell version. När modellen ändras höjs versionen och en funktion läggs till i `MIGRATIONS` i `migrations.ts`. Både sparad data och importerade filer går genom samma migrering och validering.

### Framtida synkronisering

Version ett har ingen backend. En framtida Supabase-koppling kan läggas till genom att låta `CodexStore` fortsätta använda den lokala adaptern som cache och lägga en synkroniseringstjänst bredvid. Modellerna är platta med stabila ID:n och ISO-datum för att kunna mappas till tabeller.

## Integritet och lagring

- Allt sparas i webbläsarens LocalStorage under nyckeln `living-cosmos-codex:db`.
- **LocalStorage är inte krypterad.** Den som har tillgång till webbläsarprofilen kan läsa materialet.
- Inget synkroniseras, inga konton, ingen analys eller spårning.
- Exportera regelbundet från Inställningar; rensad webbplatsdata går inte att återskapa.

## Innehåll och källkritik

Exempelmaterialet är märkt "Exempel" och är inte verifierade forskningsresultat. Bibliografiska uppgifter anges bara där de är välkända och kontrollerbara, och inga citat är påhittade. Ämnena i Utforska håller isär historisk källa, filosofisk tolkning, symbolisk tolkning och modernt vetenskapligt perspektiv.

## Kända begränsningar

- LocalStorage rymmer omkring 5 MB. Det räcker för tusentals textposter men inte för bilder eller bilagor, som inte stöds.
- Ingen synkronisering mellan enheter; flytta material med export och import.
- Kunskapskartans layout är byggd för upp till några hundra noder. Zoomning sker med knappar (ingen nypzoom).
- Symboler kan bara använda de medföljande geometriska formerna eller Unicode-tecken; egen SVG-kod tas inte emot av säkerhetsskäl.
- Taggar normaliseras till gemener.
- Det finns inga automatiska webbläsartester i repot. Kärnflödena har testats manuellt med Playwright under utvecklingen.
