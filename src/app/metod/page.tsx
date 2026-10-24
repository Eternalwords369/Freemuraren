import type { Metadata } from "next";
import { EpistemicBadge, PageHeader, TextLink } from "@/components/ui/Display";
import { EPISTEMIC } from "@/lib/constants";
import type { EpistemicCategory } from "@/lib/types";

export const metadata: Metadata = { title: "Metod" };

const DETAILS: Record<EpistemicCategory, { asks: string[]; strength: string; pitfall: string }> = {
  "historisk-kalla": {
    asks: [
      "Vem skrev texten, när, var och för vem?",
      "Vad står det faktiskt – i original eller i vilken översättning?",
      "Är uppgiften förstahand eller andrahand?",
    ],
    strength: "Kan visa vad människor har tänkt och gjort. Säger inte i sig om det de tänkte var sant.",
    pitfall: "Att en idé är gammal eller förekommer i en tradition gör den inte belagd som faktum om världen.",
  },
  "filosofisk-tolkning": {
    asks: ["Vad betyder begreppen?", "Vad följer logiskt av idén?", "Vilka invändningar finns och hur kan de mötas?"],
    strength: "Klargör, prövar och sammanför idéer. Kan visa vad som är motsägelsefullt eller väl underbyggt som resonemang.",
    pitfall: "Ett elegant resonemang är inte ett empiriskt belägg.",
  },
  "symbolisk-tolkning": {
    asks: [
      "I vilka sammanhang förekommer symbolen?",
      "Hur har den tolkats inom en viss tradition?",
      "Vad betyder den för mig – och hur skiljer sig det från traditionens läsning?",
    ],
    strength: "Fångar mening, upplevelse och kulturell betydelse som inte går att mäta.",
    pitfall: "Att läsa in en universell betydelse i en form, eller att ta den egna tolkningen för en historisk upplysning.",
  },
  "vetenskapligt-perspektiv": {
    asks: [
      "Vad stöder relevanta studier och översikter?",
      "Vad talar emot, och hur stark är evidensen?",
      "Vilka frågor kan metoden inte avgöra?",
    ],
    strength: "Prövar påståenden om världen systematiskt och offentligt, och ändrar sig när belägg tillkommer.",
    pitfall: "Att låta vetenskaplig vokabulär ge en tolkning sken av bevis, eller att tro att det som inte går att mäta saknar betydelse.",
  },
};

export default function MethodPage() {
  return (
    <>
      <PageHeader
        eyebrow="Metod"
        title="Hur kunskapen ordnas"
        lead="Plattformen är byggd för att undersöka idéer öppet, utan att sudda ut skillnaden mellan historiska belägg, filosofi, symbolik och empirisk forskning."
      />

      <figure className="mx-auto mb-14 max-w-3xl text-center">
        <blockquote className="font-display text-[1.9rem] leading-snug text-ink sm:text-[2.4rem]">
          ”Vi förvandlar inte mysterium till dogm. Vi använder mysteriet för att fördjupa frågan.”
        </blockquote>
        <figcaption className="eyebrow mt-4">Central princip</figcaption>
      </figure>

      <section aria-labelledby="cat-h" className="mb-14">
        <h2 id="cat-h" className="mb-2 text-[2rem]">
          Fyra kunskapskategorier
        </h2>
        <p className="mb-6 max-w-[64ch] text-ink-2">
          Varje post i arkivet kan märkas med en kategori. Kategorierna har <strong className="font-semibold text-ink">inte samma bevisvärde</strong>,
          och de svarar på olika slags frågor. Att hålla isär dem är inte att rangordna människors erfarenheter, utan att vara tydlig med vad
          man påstår.
        </p>
        <ol className="grid gap-4 md:grid-cols-2">
          {EPISTEMIC.map((e, i) => {
            const d = DETAILS[e.id];
            return (
              <li key={e.id} className="card flex flex-col p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-display text-3xl text-ink-3" aria-hidden="true">
                    {i + 1}
                  </span>
                  <EpistemicBadge category={e.id} />
                </div>
                <h3 className="mt-3 text-[1.6rem] text-ink">{e.label}</h3>
                <p className="mt-1 text-ink-2">{e.question}</p>
                <h4 className="eyebrow mt-5 mb-2">Frågor att ställa</h4>
                <ul className="space-y-1.5 text-sm text-ink">
                  {d.asks.map((a) => (
                    <li key={a} className="flex gap-2">
                      <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-gold" />
                      {a}
                    </li>
                  ))}
                </ul>
                <dl className="mt-5 space-y-3 border-t border-line pt-4 text-sm">
                  <div>
                    <dt className="font-semibold text-ink">Vad den kan ge</dt>
                    <dd className="text-ink-2">{d.strength}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-ink">Vanlig fallgrop</dt>
                    <dd className="text-ink-2">{d.pitfall}</dd>
                  </div>
                </dl>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="grid gap-12 lg:grid-cols-2">
        <section aria-labelledby="crit-h" className="prose-codex">
          <h2 id="crit-h">Källkritik i praktiken</h2>
          <ul>
            <li>
              <strong className="text-ink">Äkthet:</strong> är källan vad den utger sig för att vara? Hermetiska texter lästes länge som uråldriga,
              tills språkliga argument visade att de var yngre.
            </li>
            <li>
              <strong className="text-ink">Närhet:</strong> hur nära händelsen eller idén står källan i tid och rum?
            </li>
            <li>
              <strong className="text-ink">Beroende:</strong> bygger källan på andra källor, och i så fall vilka?
            </li>
            <li>
              <strong className="text-ink">Tendens:</strong> vilket intresse kan ha format framställningen?
            </li>
          </ul>
          <p>
            Ange bara publiceringsuppgifter du har kontrollerat. Ett osäkert årtal kan skrivas som ”ca” eller lämnas tomt. Hitta inte på citat –
            skriv hellre en egen sammanfattning.
          </p>
        </section>

        <section aria-labelledby="doc-h" className="prose-codex">
          <h2 id="doc-h">Dokumentation och tolkning</h2>
          <p>
            Arkivet håller isär <em>innehåll</em> (vad källan säger) och <em>personlig kommentar</em> (vad du tänker). I symbollexikonet skiljs
            historiskt sammanhang, traditionernas tolkningar och din egen tolkning åt.
          </p>
          <p>
            Hypoteser och frågeställningar är egna innehållstyper. De får vara spekulativa – det är därför de är märkta som hypoteser. Markera
            dem som besvarade när du har prövat dem.
          </p>
          <p>
            Kopplingar i kunskapskartan beskriver hur du ser sambanden: något <em>bygger vidare på</em>, <em>tolkar</em> eller{" "}
            <em>motsäger</em> något annat. Kartan är en bild av ditt tänkande, inte av världen.
          </p>
          <p>
            <TextLink href="/arkiv?ny=hypotes">Skriv en hypotes</TextLink>
          </p>
        </section>
      </div>
    </>
  );
}
