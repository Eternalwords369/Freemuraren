/**
 * Kuraterade ingångar för Utforska.
 *
 * Varje ämne delar upp innehållet i de fyra kunskapskategorierna från
 * metodsidan, så att det framgår vad som är historiskt belagt, vad som är
 * tolkning och vad vetenskapen kan eller inte kan säga. Litteraturtips anges
 * bara med välkända och kontrollerbara uppgifter. Texterna är introduktioner,
 * inte uttömmande framställningar.
 */
import type { EpistemicCategory, TopicId } from "@/lib/types";

export interface Reading {
  author: string;
  title: string;
  year: string;
  note?: string;
}

export interface ExploreTopic {
  slug: string;
  category: TopicId;
  title: string;
  summary: string;
  perspectives: Partial<Record<EpistemicCategory, string>>;
  questions: string[];
  readings: Reading[];
  related?: string[];
}

export interface ExploreCategory {
  id: TopicId;
  title: string;
  intro: string;
}

export const EXPLORE_CATEGORIES: ExploreCategory[] = [
  {
    id: "filosofi",
    title: "Filosofi",
    intro: "Grundfrågor om verklighet, kunskap och det goda – och hur tänkare har försökt besvara dem.",
  },
  {
    id: "idehistoria",
    title: "Idéhistoria",
    intro: "Hur föreställningar om människan och kosmos har uppstått, spridits och förändrats.",
  },
  {
    id: "symbolik",
    title: "Symbolik",
    intro: "Bilder och tecken som bär betydelse – och frågan om hur sådan betydelse uppstår.",
  },
  {
    id: "esoterik",
    title: "Esoteriska traditioner",
    intro: "Strömningar som betonar dold kunskap, initiation och inre förvandling, studerade både inifrån och historiskt.",
  },
  {
    id: "kosmologi",
    title: "Kosmologi",
    intro: "Kosmos som idé: från antikens sfärer till dagens fysikaliska modeller och deras filosofiska följder.",
  },
  {
    id: "medvetande",
    title: "Medvetandefilosofi",
    intro: "Vad är upplevelse, och hur förhåller den sig till hjärnan, kroppen och världen?",
  },
  {
    id: "religion",
    title: "Religion och jämförande traditioner",
    intro: "Likheter och skillnader mellan traditioner, och de metodfrågor som jämförelser väcker.",
  },
];

export const EXPLORE_TOPICS: ExploreTopic[] = [
  /* ----------------------------- Filosofi ----------------------------- */
  {
    slug: "grottliknelsen",
    category: "filosofi",
    title: "Grottliknelsen och kunskapens nivåer",
    summary:
      "Platons bild av fångar som tar skuggor för verklighet har blivit en av filosofins mest använda liknelser för skillnaden mellan sken och kunskap.",
    perspectives: {
      "historisk-kalla":
        "Liknelsen finns i Platons dialog Staten, bok VII. Där låter Platon Sokrates beskriva fångar i en grotta, en befrielse och en mödosam väg upp mot solljuset. Den hänger samman med solliknelsen och linjeliknelsen i bok VI.",
      "filosofisk-tolkning":
        "Liknelsen brukar läsas som en teori om kunskapsnivåer och om bildning som en omvändning av hela själen, inte bara en överföring av information. Den väcker också frågor om den som återvänder och försöker berätta för de andra.",
      "symbolisk-tolkning":
        "Motivet med uppstigning från mörker till ljus återkommer i många senare traditioner, både religiösa och initiatoriska. Att se ett direkt platonskt inflytande i varje sådant fall är en tolkning som behöver prövas mot källorna.",
      "vetenskapligt-perspektiv":
        "Kognitionsforskning beskriver ofta perception som en aktiv konstruktion snarare än en passiv avbildning. Det bekräftar inte Platons lära om formerna, men ger frågan om skillnaden mellan upplevelse och verklighet ett empiriskt sammanhang.",
    },
    questions: [
      "Vad motsvarar skuggorna i mitt eget tänkande?",
      "Går det att veta att man har lämnat grottan?",
      "Vilket ansvar har den som återvänder?",
    ],
    readings: [{ author: "Platon", title: "Staten", year: "ca 375 f.Kr.", note: "Bok VI–VII" }],
    related: ["nyplatonismen", "cirkeln-och-centrum"],
  },
  {
    slug: "nyplatonismen",
    category: "filosofi",
    title: "Nyplatonismen och det Ena",
    summary:
      "En senantik filosofi där all verklighet flödar ut ur en enda, obeskrivbar princip – och där människan kan vända tillbaka mot den.",
    perspectives: {
      "historisk-kalla":
        "Plotinos (ca 204–270) undervisade i Rom. Hans lärjunge Porfyrios ordnade texterna i sex grupper om nio, Enneaderna. Marsilio Ficinos latinska översättning trycktes i Florens 1492 och gjorde Plotinos tillgänglig för renässansen.",
      "filosofisk-tolkning":
        "Systemet beskriver nivåer: det Ena, intellektet (nous) och själen. Det Ena är inte ett ting bland andra utan förutsättningen för att något alls finns. Frågan hur man kan tala om något som enligt teorin ligger bortom språket är central.",
      "symbolisk-tolkning":
        "Bilder av ljuskälla och utstrålning används för att beskriva emanationen. Ljusmetaforiken fick stort inflytande på kristen, judisk och islamisk mystik.",
      "vetenskapligt-perspektiv":
        "Nyplatonismen är metafysik och gör inga empiriskt prövbara påståenden i vanlig mening. Vetenskapen kan varken bekräfta eller vederlägga läran om det Ena; däremot kan idéhistorisk forskning spåra dess inflytande.",
    },
    questions: ["Är enhet en upplevelse, en princip eller båda?", "Hur skiljer sig emanation från skapelse?"],
    readings: [{ author: "Plotinos", title: "Enneaderna", year: "300-talet (sammanställda av Porfyrios)" }],
    related: ["grottliknelsen", "hermetismen"],
  },
  {
    slug: "spinoza",
    category: "filosofi",
    title: "Spinoza: Gud eller naturen",
    summary:
      "En rationalistisk filosofi där Gud och naturen är samma oändliga substans – ett av de mest radikala försöken att tänka kosmos som en helhet.",
    perspectives: {
      "historisk-kalla":
        "Baruch de Spinozas Ethica, uppställd på geometriskt vis med definitioner och satser, utgavs postumt 1677. Uttrycket ”Deus sive Natura” (Gud, eller naturen) förekommer i verket.",
      "filosofisk-tolkning":
        "Spinoza menar att det bara finns en substans med oändligt många attribut, varav vi känner två: tanke och utsträckning. Tolkningarna går isär om detta är panteism, naturalism eller något tredje.",
      "symbolisk-tolkning":
        "Spinozas Gud saknar personliga drag, och hans filosofi har blivit en symbol för en religiositet utan dogm. Det är en senare användning som inte alltid stämmer med hans egna begrepp.",
      "vetenskapligt-perspektiv":
        "Spinozas tanke om en lagbunden natur utan undantag ligger nära naturvetenskapens arbetsantaganden. Albert Einstein skrev 1929 att han trodde på ”Spinozas Gud”. Det säger något om Einstein, inte om att fysiken har bekräftat Spinozas metafysik.",
    },
    questions: ["Kan en helhet vara helig utan att vara en person?", "Vad betyder frihet i ett lagbundet universum?"],
    readings: [{ author: "Baruch de Spinoza", title: "Ethica", year: "1677" }],
    related: ["nyplatonismen", "svara-problemet"],
  },

  /* ---------------------------- Idéhistoria ---------------------------- */
  {
    slug: "varldskedjan",
    category: "idehistoria",
    title: "Den stora världskedjan",
    summary:
      "Föreställningen om en obruten rangordning från Gud via änglar och människor ned till stenar präglade europeiskt tänkande i nästan två tusen år.",
    perspectives: {
      "historisk-kalla":
        "Idéhistorikern Arthur O. Lovejoy gav idén dess klassiska framställning i The Great Chain of Being (1936). Han spårade den från Platon och Aristoteles via nyplatonismen till 1700-talet.",
      "filosofisk-tolkning":
        "Kedjan bygger på principer om fullhet och kontinuitet: allt som kan finnas finns, och övergångarna är gradvisa. Den gav samtidigt en ordning för samhället, vilket gör den både kosmologisk och politisk.",
      "symbolisk-tolkning":
        "Stegen, trappan och kedjan är återkommande bilder för andlig utveckling. I många traditioner beskrivs inre arbete som att stiga uppåt i en ordnad hierarki.",
      "vetenskapligt-perspektiv":
        "Evolutionsbiologin ersatte den fasta rangordningen med ett förgrenat släktträd utan högre och lägre arter. Bilden av evolution som en stege mot människan är en kvarleva som biologer brukar varna för.",
    },
    questions: ["Lever världskedjan kvar i hur vi talar om andlig utveckling?", "Kan man tänka sig nivåer utan rangordning?"],
    readings: [{ author: "Arthur O. Lovejoy", title: "The Great Chain of Being", year: "1936" }],
    related: ["nyplatonismen", "kopernikanska-vandningen"],
  },
  {
    slug: "kopernikanska-vandningen",
    category: "idehistoria",
    title: "Den kopernikanska vändningen",
    summary:
      "När jorden flyttades från centrum förändrades inte bara astronomin utan också människans bild av sin plats i kosmos.",
    perspectives: {
      "historisk-kalla":
        "Nicolaus Copernicus De revolutionibus orbium coelestium trycktes 1543. Johannes Kepler publicerade Astronomia nova 1609 och Harmonices mundi 1619. Galileo Galileis teleskopiska iakttagelser kom i Sidereus nuncius 1610.",
      "filosofisk-tolkning":
        "Vändningen brukar beskrivas som en förlust av centrum. Men i den äldre kosmologin var centrum inte självklart en hedersplats, så berättelsen om en förödmjukelse är delvis en senare konstruktion.",
      "symbolisk-tolkning":
        "Kepler drevs bland annat av en övertygelse om att kosmos är byggt efter geometriska och harmoniska proportioner. Hans fall visar hur symboliska och religiösa motiv kan samexistera med noggrann empirisk metod.",
      "vetenskapligt-perspektiv":
        "Keplers lagar för planetbanorna håller fortfarande som beskrivningar och förklarades senare av Newtons gravitationsteori. Hans harmoniska spekulationer om varför banorna ser ut som de gör har däremot inte fått stöd.",
    },
    questions: ["Måste en motivering vara rationell för att leda till rätt resultat?", "Vad betyder det att sakna centrum?"],
    readings: [
      { author: "Nicolaus Copernicus", title: "De revolutionibus orbium coelestium", year: "1543" },
      { author: "Johannes Kepler", title: "Harmonices mundi", year: "1619" },
    ],
    related: ["sfarernas-harmoni", "varldskedjan"],
  },
  {
    slug: "axeltiden",
    category: "idehistoria",
    title: "Axeltiden",
    summary:
      "Tanken att flera stora tanketraditioner uppstod parallellt under några århundraden före vår tideräkning.",
    perspectives: {
      "historisk-kalla":
        "Karl Jaspers lanserade begreppet Achsenzeit i Vom Ursprung und Ziel der Geschichte (1949). Han pekade ut ungefär 800–200 f.Kr. som en period då nya reflexiva traditioner växte fram i Kina, Indien, Persien, Israel och Grekland.",
      "filosofisk-tolkning":
        "Begreppet lyfter fram en gemensam förändring: kritisk reflektion över människans villkor och en transcendent måttstock för det goda. Kritiker menar att det jämnar ut stora skillnader mellan traditionerna.",
      "symbolisk-tolkning":
        "Själva ordet axel är en bild av en vändpunkt som historien roterar kring. Bilden säger lika mycket om hur moderna tänkare vill förstå historien som om historien själv.",
      "vetenskapligt-perspektiv":
        "Historiker och religionsvetare diskuterar om perioden är en verklig brytpunkt eller en efterhandskonstruktion. Dateringar av flera av de berörda texterna är osäkra, vilket gör tesen svår att pröva strikt.",
    },
    questions: ["Är parallella idéer ett tecken på gemensamma orsaker eller på hur vi grupperar historien?"],
    readings: [{ author: "Karl Jaspers", title: "Vom Ursprung und Ziel der Geschichte", year: "1949" }],
    related: ["mystikens-karna"],
  },

  /* ------------------------------ Symbolik ----------------------------- */
  {
    slug: "vad-ar-en-symbol",
    category: "symbolik",
    title: "Vad är en symbol?",
    summary:
      "Innan man tolkar enskilda symboler hjälper det att fråga hur tecken över huvud taget får betydelse.",
    perspectives: {
      "historisk-kalla":
        "Charles S. Peirce skilde mellan ikon (liknar det den står för), index (har ett orsakssamband med det) och symbol (betyder genom konvention). Ernst Cassirer beskrev i Philosophie der symbolischen Formen (1923–1929) människan som ett symbolskapande väsen.",
      "filosofisk-tolkning":
        "Om en symbols betydelse vilar på konvention kan den inte avläsas ur formen ensam. Det talar emot påståenden om att en viss form har en enda, universell innebörd.",
      "symbolisk-tolkning":
        "Inom många traditioner sägs symboler rymma mer än det som kan sägas i ord. Det är en beskrivning av hur symboler fungerar för de som använder dem, och den kan tas på allvar utan att man tar ställning till metafysiken.",
      "vetenskapligt-perspektiv":
        "Kognitionsforskning och antropologi studerar hur människor lär sig och sprider symboler. Vissa former kan vara lättare att uppfatta och minnas, men det är något annat än att de bär samma betydelse överallt.",
    },
    questions: ["Vilka av mina symboler är konventioner jag har lärt mig?", "Kan en symbol betyda något som ingen har avsett?"],
    readings: [{ author: "Ernst Cassirer", title: "Philosophie der symbolischen Formen", year: "1923–1929" }],
    related: ["cirkeln-och-centrum", "alkemins-bildsprak"],
  },
  {
    slug: "cirkeln-och-centrum",
    category: "symbolik",
    title: "Cirkeln och centrum",
    summary:
      "Cirkeln och mittpunkten hör till de enklaste geometriska formerna – och till dem som har laddats med flest betydelser.",
    perspectives: {
      "historisk-kalla":
        "Religionshistorikern Mircea Eliade beskrev i Das Heilige und das Profane (1957) hur heliga platser ofta förstås som ett centrum eller en världsaxel (axis mundi) som förbinder himmel, jord och underjord.",
      "filosofisk-tolkning":
        "Centrum kan förstås rumsligt, men också som en bild för det som ger orientering. Frågan är om behovet av centrum är allmänmänskligt eller kulturellt format.",
      "symbolisk-tolkning":
        "Cirkeln läses ofta som helhet, oändlighet eller kretslopp, och punkten som ursprung eller medvetande. Sådana läsningar är rika men bör inte förväxlas med historiska belägg för vad en viss cirkel betydde för dem som ritade den.",
      "vetenskapligt-perspektiv":
        "Eliades jämförande metod har kritiserats för att generalisera och välja exempel som passar teorin. Dagens religionsvetenskap betonar ofta det lokala sammanhanget framför universella mönster.",
    },
    questions: ["Var går gränsen mellan ett mönster och en projektion?", "Vad är mitt eget centrum, och hur vet jag det?"],
    readings: [{ author: "Mircea Eliade", title: "Das Heilige und das Profane", year: "1957" }],
    related: ["vad-ar-en-symbol", "sfarernas-harmoni"],
  },
  {
    slug: "alkemins-bildsprak",
    category: "symbolik",
    title: "Alkemins bildspråk",
    summary:
      "Alkemin lämnade efter sig ett av de rikaste bildspråken i europeisk historia. Men vad handlade den egentligen om?",
    perspectives: {
      "historisk-kalla":
        "Alkemiska texter och bildserier från medeltid och tidigmodern tid beskriver processer med bilder av drakar, kungar, drottningar och bröllop. Många av dem var arbetsinstruktioner skrivna i chiffer för initierade läsare.",
      "filosofisk-tolkning":
        "Föreställningen om att materia kan förädlas byggde på antik naturfilosofi om elementen och om en gemensam urmateria. Förvandling av ämnen och av människan kunde tänkas som parallella processer.",
      "symbolisk-tolkning":
        "C. G. Jung tolkade i Psychologie und Alchemie (1944) alkemins bilder som uttryck för psykologiska förvandlingsprocesser. Tolkningen har varit inflytelserik i psykologi och konst.",
      "vetenskapligt-perspektiv":
        "Vetenskapshistoriker som Lawrence M. Principe och William R. Newman har visat att mycket alkemi var laborativ kemi, och har återskapat recept i laboratoriet. Det gör den rent psykologiska läsningen till en av flera tolkningar, inte en historisk förklaring.",
    },
    questions: ["Kan en bild vara både instruktion och meditation?", "Vad händer när en senare tolkning tar över ett äldre material?"],
    readings: [
      { author: "C. G. Jung", title: "Psychologie und Alchemie", year: "1944" },
      { author: "Lawrence M. Principe", title: "The Secrets of Alchemy", year: "2013" },
    ],
    related: ["hermetismen", "vad-ar-en-symbol"],
  },

  /* ------------------------------ Esoterik ----------------------------- */
  {
    slug: "hermetismen",
    category: "esoterik",
    title: "Hermetismen",
    summary:
      "Texter tillskrivna Hermes Trismegistos lästes under renässansen som urgammal visdom. Historisk forskning har gett en annan bild.",
    perspectives: {
      "historisk-kalla":
        "Marsilio Ficino översatte Corpus Hermeticum till latin på uppdrag av Cosimo de’ Medici, och översättningen trycktes 1471. Isaac Casaubon visade 1614 att texterna tillkommit i efterkristen tid. Forskningen daterar dem i regel till de första århundradena e.Kr.",
      "filosofisk-tolkning":
        "Texterna förenar platonska och stoiska idéer med religiös vördnad för kosmos. Människan beskrivs som ett väsen som kan känna Gud genom att förstå världen och sig själv.",
      "symbolisk-tolkning":
        "Formeln ”så ovan, så nedan”, som brukar hämtas från den senare Smaragdtavlan, har blivit en sammanfattning av hermetisk tanke om motsvarigheter mellan kosmos och människa.",
      "vetenskapligt-perspektiv":
        "Hermetismen gör påståenden om motsvarigheter som inte har stöd i naturvetenskaplig forskning. Däremot är dess historiska inflytande på renässansens kultur väldokumenterat och livligt diskuterat.",
    },
    questions: ["Förändras en texts värde när dess ålder visar sig vara en annan?", "Vad betyder ”motsvarighet” om det inte är orsakssamband?"],
    readings: [{ author: "Frances A. Yates", title: "Giordano Bruno and the Hermetic Tradition", year: "1964" }],
    related: ["nyplatonismen", "esoterism-som-forskningsfalt"],
  },
  {
    slug: "frimureriet",
    category: "esoterik",
    title: "Frimureriet: historia och symbolspråk",
    summary:
      "Ett ordenssällskap som använder byggnadshantverkets verktyg som bilder för moraliskt och andligt arbete – med en historia som ofta blandas samman med dess egna legender.",
    perspectives: {
      "historisk-kalla":
        "Storlogen i London räknas traditionellt från 1717, men det årtalet bygger på en senare redogörelse och har ifrågasatts av forskare. James Andersons Constitutions trycktes 1723. Historikern David Stevenson har lyft fram skotska logers betydelse under 1600-talet. I Sverige bildades den första kända logen i Stockholm 1735.",
      "filosofisk-tolkning":
        "Frimureriet växte fram i upplysningens sällskapsliv och betonade broderskap, självförbättring och samtal över ståndsgränser. Hur dessa ideal har tolkats skiljer sig mellan länder och riter.",
      "symbolisk-tolkning":
        "Verktyg som vinkelhake och passare används som bilder för dygder och för att forma sig själv. Inom orden ges symbolerna mening genom ritualer, och betydelserna varierar mellan system.",
      "vetenskapligt-perspektiv":
        "Berättelser om ursprung i Salomos tempel eller det forntida Egypten hör till ordens legendariska historia och kan inte beläggas med historisk metod. Frimureriets faktiska historia är i dag ett etablerat akademiskt forskningsfält.",
    },
    questions: ["Vad skiljer en ursprungslegend från ett historiskt påstående?", "Hur kan ett verktyg bli en dygd?"],
    readings: [
      { author: "David Stevenson", title: "The Origins of Freemasonry: Scotland’s Century, 1590–1710", year: "1988" },
    ],
    related: ["rosenkreuzarna", "esoterism-som-forskningsfalt"],
  },
  {
    slug: "rosenkreuzarna",
    category: "esoterik",
    title: "Rosenkreuzarmanifesten",
    summary:
      "Tre anonyma skrifter i början av 1600-talet beskrev ett hemligt brödraskap – och utlöste en debatt som var mer verklig än brödraskapet själv.",
    perspectives: {
      "historisk-kalla":
        "Fama Fraternitatis trycktes i Kassel 1614, Confessio Fraternitatis 1615 och Chymische Hochzeit Christiani Rosencreutz 1616. Den lutherske teologen Johann Valentin Andreae angav senare att han skrivit Chymische Hochzeit.",
      "filosofisk-tolkning":
        "Manifesten förenade kristen reformiver, naturfilosofi och förhoppningar om en allmän reform av kunskapen. De kan läsas som ett program snarare än som en rapport om en existerande organisation.",
      "symbolisk-tolkning":
        "Rosen och korset har tolkats på många sätt: som förening av själ och ande, av liv och död, eller av natur och nåd. Senare rosenkreuzariska sällskap har gett symbolen egna betydelser.",
      "vetenskapligt-perspektiv":
        "Det saknas belägg för att ett organiserat brödraskap av det slag som beskrivs fanns vid tiden. Senare sällskap som tagit namnet uppstod från 1700-talet och framåt.",
    },
    questions: ["Kan en fiktion skapa en verklig tradition?"],
    readings: [{ author: "Frances A. Yates", title: "The Rosicrucian Enlightenment", year: "1972" }],
    related: ["frimureriet", "hermetismen"],
  },
  {
    slug: "esoterism-som-forskningsfalt",
    category: "esoterik",
    title: "Västerländsk esoterism som forskningsfält",
    summary:
      "Hur studerar man traditioner som gör anspråk på dold kunskap, utan att varken avfärda eller okritiskt anamma dem?",
    perspectives: {
      "historisk-kalla":
        "Antoine Faivre föreslog i början av 1990-talet en uppsättning kännetecken för esoterism som tankeform, bland dem idén om motsvarigheter och om en levande natur. Wouter J. Hanegraaff har i Esotericism and the Academy (2012) beskrivit hur området länge ställdes utanför den akademiska historieskrivningen.",
      "filosofisk-tolkning":
        "En central metodfråga är skillnaden mellan att beskriva vad en tradition hävdar och att själv hävda att det är sant. Forskningen strävar efter metodologisk agnosticism.",
      "symbolisk-tolkning":
        "Fältet studerar symboler som historiska fenomen: vem använde dem, hur och varför. Det utesluter inte personliga tolkningar, men skiljer dem från historiska slutsatser.",
      "vetenskapligt-perspektiv":
        "Esoterismforskning är i dag etablerad vid flera universitet, bland annat i Amsterdam. Den använder historiska och religionsvetenskapliga metoder, inte metoder för att pröva esoteriska påståenden om verkligheten.",
    },
    questions: ["Kan man förstå en tradition inifrån utan att tro på den?"],
    readings: [{ author: "Wouter J. Hanegraaff", title: "Esotericism and the Academy", year: "2012" }],
    related: ["hermetismen", "frimureriet"],
  },

  /* ------------------------------ Kosmologi ---------------------------- */
  {
    slug: "sfarernas-harmoni",
    category: "kosmologi",
    title: "Sfärernas harmoni",
    summary:
      "Idén att himlakropparnas rörelser följer musikaliska proportioner förenade matematik, musik och kosmologi i över två tusen år.",
    perspectives: {
      "historisk-kalla":
        "Idén förknippas med pytagoréerna, men källäget för de tidigaste pytagoréerna är svårt. Platon låter i myten om Er i Staten, bok X, sirener sjunga på himlasfärerna. Kepler sökte i Harmonices mundi (1619) harmoniska förhållanden i planeternas hastigheter.",
      "filosofisk-tolkning":
        "Tanken att kosmos är ordnat enligt tal är en föregångare till idén om matematiska naturlagar. Skillnaden ligger i om ordningen också förstås som skönhet och mening.",
      "symbolisk-tolkning":
        "Harmonin har varit en bild för samklang mellan människa och kosmos, och för själens inre ordning. I renässansens konst och musikteori spelade bilden en viktig roll.",
      "vetenskapligt-perspektiv":
        "Det finns ingen hörbar sfärmusik, och planeterna rör sig inte i sfärer. Däremot förekommer banresonanser med enkla talförhållanden, till exempel 1:2:4 mellan Jupitermånarna Io, Europa och Ganymedes. Det är ett gravitationellt fenomen, inte en bekräftelse av den antika läran.",
    },
    questions: ["Är matematikens användbarhet i naturen ett mysterium?", "Vad vore skillnaden mellan ordning och mening?"],
    readings: [{ author: "Johannes Kepler", title: "Harmonices mundi", year: "1619" }],
    related: ["kopernikanska-vandningen", "cirkeln-och-centrum"],
  },
  {
    slug: "skapelse-och-big-bang",
    category: "kosmologi",
    title: "Skapelseberättelser och Big Bang",
    summary:
      "Människor har alltid berättat om hur allt började. Den moderna kosmologin ger en annan sorts svar – och lämnar vissa frågor öppna.",
    perspectives: {
      "historisk-kalla":
        "Skapelseberättelser som det babyloniska Enuma elish och Första Mosebokens inledning beskriver ordning som växer fram ur kaos eller ur ett gudomligt ord. Georges Lemaître föreslog 1927 och 1931 de idéer som senare utvecklades till Big Bang-teorin.",
      "filosofisk-tolkning":
        "Skapelseberättelser svarar ofta på frågor om mening och ordning snarare än om fysikaliska förlopp. Att läsa dem som tidiga försök till fysik riskerar att missa vad de handlar om.",
      "symbolisk-tolkning":
        "Ägget, urhavet, ordet och ljuset är återkommande bilder för begynnelsen. De säger något om hur människor har förstått tillblivelse.",
      "vetenskapligt-perspektiv":
        "Observationer av den kosmiska bakgrundsstrålningen ger en ålder för det observerbara universum på omkring 13,8 miljarder år. Big Bang-teorin beskriver utvecklingen från ett mycket hett och tätt tillstånd. Om det fanns ett absolut början, och vad som i så fall föregick det, kan teorin inte i nuläget avgöra.",
    },
    questions: ["Vilka frågor kan en berättelse besvara som en teori inte kan – och tvärtom?"],
    readings: [],
    related: ["antropiska-principen", "sfarernas-harmoni"],
  },
  {
    slug: "antropiska-principen",
    category: "kosmologi",
    title: "Den antropiska principen",
    summary:
      "Universums egenskaper tycks förenliga med att observatörer kan finnas. Är det en förklaring, en tautologi eller en ledtråd?",
    perspectives: {
      "historisk-kalla":
        "Astrofysikern Brandon Carter formulerade den antropiska principen vid ett symposium i Kraków 1973, till minne av Copernicus 500-årsdag.",
      "filosofisk-tolkning":
        "Den svaga formen säger att vi bara kan observera ett universum som tillåter observatörer – ett urvalsargument. Starkare former hävdar mer, och där går meningarna isär mellan förklaringar som design, multiversum eller rent sammanträffande.",
      "symbolisk-tolkning":
        "Principen läses ibland som ett tecken på att medvetande har en särställning i kosmos. Det är en tolkning som går utöver vad principen själv säger.",
      "vetenskapligt-perspektiv":
        "Hur finjusterade naturkonstanterna egentligen är, och om det kräver en förklaring, är omdiskuterat bland fysiker och filosofer. Det saknas i dag sätt att pröva hypoteser om andra universum direkt.",
    },
    questions: ["När är ett sammanträffande förklaringskrävande?"],
    readings: [],
    related: ["skapelse-och-big-bang", "svara-problemet"],
  },

  /* ----------------------------- Medvetande ---------------------------- */
  {
    slug: "svara-problemet",
    category: "medvetande",
    title: "Det svåra problemet",
    summary:
      "Varför åtföljs vissa fysiska processer av upplevelse? Frågan har blivit en av filosofins mest diskuterade.",
    perspectives: {
      "historisk-kalla":
        "Thomas Nagel publicerade ”What Is It Like to Be a Bat?” i The Philosophical Review 1974. David Chalmers skilde 1995, i artikeln ”Facing Up to the Problem of Consciousness” i Journal of Consciousness Studies, mellan de ”lätta” problemen och det svåra problemet.",
      "filosofisk-tolkning":
        "De lätta problemen gäller funktioner som uppmärksamhet och rapportering. Det svåra gäller varför det känns som något alls. Svaren spänner från fysikalism och illusionism till dualism och panpsykism.",
      "symbolisk-tolkning":
        "Bilden av ett inre ljus eller en iakttagare i centrum återkommer i många traditioner. Filosofer varnar för att bilden kan smyga in en liten människa i huvudet som själv skulle behöva förklaras.",
      "vetenskapligt-perspektiv":
        "Neurovetenskapen har gjort stora framsteg i att hitta korrelat till medvetna tillstånd. Om sådana korrelat i princip kan förklara upplevelsen, eller bara följa den, är en öppen fråga.",
    },
    questions: ["Vad skulle räknas som en förklaring av upplevelse?", "Är det svåra problemet ett problem med världen eller med våra begrepp?"],
    readings: [
      { author: "Thomas Nagel", title: "What Is It Like to Be a Bat?", year: "1974" },
      { author: "David J. Chalmers", title: "Facing Up to the Problem of Consciousness", year: "1995" },
    ],
    related: ["medvetandeteorier", "spinoza"],
  },
  {
    slug: "medvetandeteorier",
    category: "medvetande",
    title: "Vetenskapliga teorier om medvetande",
    summary:
      "Flera konkurrerande teorier försöker förklara vad som skiljer medveten från omedveten bearbetning i hjärnan.",
    perspectives: {
      "historisk-kalla":
        "Bernard Baars lade fram teorin om en global arbetsyta i A Cognitive Theory of Consciousness (1988). Giulio Tononi formulerade integrerad informationsteori i början av 2000-talet.",
      "filosofisk-tolkning":
        "Teorierna skiljer sig i vad de förklarar: tillgång till information för styrning och tal, eller upplevelsens inre struktur. Integrerad informationsteori har följder som liknar panpsykism, vilket har väckt kritik.",
      "symbolisk-tolkning":
        "Metaforer som scen, strålkastare och arbetsyta formar hur vi tänker om medvetande. De är användbara men kan också styra vad forskare letar efter.",
      "vetenskapligt-perspektiv":
        "Teorierna prövas i dag i experiment där forskare med olika uppfattningar i förväg kommer överens om vilka resultat som skulle tala för eller emot respektive teori. Ingen teori har ännu brett stöd som den rätta.",
    },
    questions: ["Kan en teori om medvetande prövas utan att man redan vet vem som är medveten?"],
    readings: [{ author: "Bernard J. Baars", title: "A Cognitive Theory of Consciousness", year: "1988" }],
    related: ["svara-problemet"],
  },

  /* ------------------------------ Religion ----------------------------- */
  {
    slug: "mystikens-karna",
    category: "religion",
    title: "Finns en gemensam kärna i mystiken?",
    summary:
      "Beskriver mystiker i olika traditioner samma erfarenhet – eller formar varje tradition sina egna erfarenheter?",
    perspectives: {
      "historisk-kalla":
        "William James beskrev i The Varieties of Religious Experience (1902) fyra kännetecken på mystiska tillstånd: outsäglighet, kunskapskaraktär, flyktighet och passivitet. Aldous Huxley argumenterade i The Perennial Philosophy (1945) för en gemensam kärna.",
      "filosofisk-tolkning":
        "Den så kallade konstruktivismen, med Steven T. Katz artikel ”Language, Epistemology, and Mysticism” (1978) som en viktig text, menar att alla erfarenheter förmedlas av begrepp och förväntningar. Debatten gäller om det finns ren, oförmedlad erfarenhet.",
      "symbolisk-tolkning":
        "Bilder av enhet, ljus, tystnad och mörker återkommer, men de används på olika sätt och ingår i olika läror. Likheter i bilder behöver inte betyda likheter i erfarenhet.",
      "vetenskapligt-perspektiv":
        "Psykologisk forskning har utvecklat skalor för att mäta självrapporterade mystiska upplevelser, och neurovetenskap studerar deras korrelat. Sådan forskning kan beskriva upplevelserna men inte avgöra om de ger kunskap om en verklighet bortom dem.",
    },
    questions: ["Kan jag skilja min erfarenhet från de ord jag har för den?"],
    readings: [
      { author: "William James", title: "The Varieties of Religious Experience", year: "1902" },
      { author: "Aldous Huxley", title: "The Perennial Philosophy", year: "1945" },
    ],
    related: ["axeltiden", "nyplatonismen"],
  },
];

export const TOPIC_BY_SLUG = new Map(EXPLORE_TOPICS.map((t) => [t.slug, t]));

export function topicsInCategory(category: TopicId): ExploreTopic[] {
  return EXPLORE_TOPICS.filter((t) => t.category === category);
}
