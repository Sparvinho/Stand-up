import { NextResponse } from "next/server";
import OpenAI from "openai";

// OBS: Om du har skapat filen comedyTheory.ts, avkommentera raden nedan:
// import { comedyTheory } from "../../../lib/comedyTheory";
// Annars använder vi en tom sträng så länge så att appen inte kraschar:
const comedyTheory = ""; 

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { premise, isMeta } = await req.json();

    if (!premise || premise.trim() === "") {
      return NextResponse.json({ feedback: "Ingen text att analysera.", suggestedTags: [] }, { status: 400 });
    }

    const masterPrompt = `Du är "Comedy Doctor 2.0", en hänsynslös men stöttande standup-redaktör inbyggd i appen Standup Studio. Ditt mål är ordekonomi, tajming och kontrast. 

HÄR ÄR DITT TEORETISKA RAMVERK:
${comedyTheory}

[META/ANTI-HUMOR FLAGGA: ${isMeta ? 'true' : 'false'}]

[ABSOLUTA REGLER FÖR DITT BEMÖTANDE OCH INNEHÅLL]
1. Håll din persona: Var kall, analytisk och direkt. Inget "Live, laugh, love"-flams.
2. INGA WACKY PROPS ELLER PÅHITTADE ORD: Om komikern skämtar om HR, använd riktiga, stela HR-termer. Hitta aldrig på tramsord som "organbankir" eller "kontorsslav". 
3. Hitta mörkret: Standup bygger på smärta. Identifiera den faktiska misären i subtexten (t.ex. "Din kropp betraktas som medicinskt skräp").

[EXEMPEL PÅ KORREKT TON]
Om skämtet är: "Jag kallar min tjej för lilla duva, spelar ingen roll var jag släpper av henne, hon hittar ändå hem."
RÄTT undertext: "Du är en psykopat som ser kidnappning som en söt relationslek."
FEL undertext (GÖR ALDRIG SÅ HÄR): "Ibland kan kärleken leda till oväntade missförstånd!"

[JSON-STRUKTUR OCH FÄLT-INSTRUKTIONER]
Du MÅSTE svara med ett giltigt JSON-objekt enligt exakt denna struktur.

{
  "intern_tankeprocess": "<HÄR MÅSTE DU TÄNKA HÖGT FÖRST: Analysera skämtet utifrån teorin. Vilken är jargongen? Vad är den mörkaste, mest tragiska subtexten? Hur säkerställer jag att mina förslag är realistiska och inte 'wacky' eller klyschiga?>",
  "akuten": {
    "scenkaraktar": "<Beskriv karaktären utan klyschor (t.ex. 'En patetisk ensamvarg').>",
    "undertext": "<Den brutala sanningen komikern döljer.>",
    "trigger_analys": "<Analysera ordningen. Ligger triggern sist? Beröm eller korrigera.>",
    "kill_your_darlings": "<Skriv en tajtare version. Stryk bindningsord. Bevara ALLT direkt tal och form exakt.>"
  },
  "fordjupning": {
    "diagnos_och_metaskamt": "<Typ av skämt (Broken assumption, etc) samt Safety/Violation.>",
    "stilistiska_extremvarden": "<Hitta det mest iskalla, formella eller brutala ordet inom skämtets jargong. INGET TRAMS ELLER HITTEPÅ.>",
    "misplaced_sincerity": "<Hur ska kroppsspråket dölja skämtet?>",
    "overdrift_underdrift_skala": "<Skala 1-3 om relevant, annars 'Ej aktuellt.'>"
  },
  "skriv_katalysatorn": {
    "pij_q1": "<Fråga komikern vad som händer om de byter ut ETT specifikt ord mot något ännu mörkare/kallare. Ge ett konkret, realistiskt exempel i frågan.>",
    "pij_q2": "<Fråga vad som händer om man gör ett statusskifte (t.ex. byter vem som är offer/förövare).>"
  },
  "tags": ["<Tagg1>", "<Tagg2>", "<Tagg3>"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: masterPrompt },
        { role: "user", content: premise },
      ],
      temperature: 0.7, 
    });

    const aiData = JSON.parse(response.choices[0].message.content || "{}");

    // Formatera datan för ReactMarkdown i Workshopen
    const formattedFeedback = `
> **Doktorns inre monolog:** _${aiData.intern_tankeprocess || "Analyserar mörkret..."}_

### DEL 1: AKUTEN
* **Scenkaraktär:** ${aiData.akuten?.scenkaraktar || ""}
* **Undertext:** ${aiData.akuten?.undertext || ""}
* **Trigger-analys:** ${aiData.akuten?.trigger_analys || ""}
* **Kill Your Darlings:** ${aiData.akuten?.kill_your_darlings || ""}

---
### DEL 2: TEORETISK FÖRDJUPNING
* **Diagnos & Metaskämtet:** ${aiData.fordjupning?.diagnos_och_metaskamt || ""}
* **Stilistiska extremvärden:** ${aiData.fordjupning?.stilistiska_extremvarden || ""}
* **Misplaced Sincerity:** ${aiData.fordjupning?.misplaced_sincerity || ""}
* **Överdrift/Underdrift-Skala:** ${aiData.fordjupning?.overdrift_underdrift_skala || ""}

---
### DEL 3: SKRIV-KATALYSATORN
* **PIJ-Q 1:** ${aiData.skriv_katalysatorn?.pij_q1 || ""}
* **PIJ-Q 2:** ${aiData.skriv_katalysatorn?.pij_q2 || ""}
`;

    return NextResponse.json({
      feedback: formattedFeedback,
      suggestedTags: aiData.tags || []
    });

  } catch (error: any) {
    console.error("Analys API error:", error);
    return NextResponse.json({ feedback: "Kunde inte nå AI:n för analys." }, { status: 500 });
  }
}