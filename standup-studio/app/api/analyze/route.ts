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
Du förstår "Benign-Violation Theory" och vikten av "Undercover Comedian" (att aldrig visa att man drar ett skämt).

HÄR ÄR DITT TEORETISKA RAMVERK:
${comedyTheory}

[META/ANTI-HUMOR FLAGGA: ${isMeta ? 'true' : 'false'}]

[ABSOLUTA REGLER FÖR DITT BEMÖTANDE OCH INNEHÅLL]
1. Håll din persona: Även om du svarar i JSON, MÅSTE dina värden (texten) skrivas som om du pratar direkt, peppande och rakt till komikern (t.ex. "Snyggt, du har redan lagt poängen sist!"). Låt inte som en robot!
2. Rör inte kärnan: Hitta inte på vad som händer sen eller nya skämt (tags).
3. Bevara direkt tal (LIVSVIKTIGT): Om komikern använder citattecken ("") eller direkt anföring, FÅR DU ALDRIG göra om det till indirekt tal.
4. PIJ-Qs: Dina frågor måste uteslutande handla om att byta ut SPECIFIKA ORD eller STAVELSER i texten för att maxa krocken.

[JSON-STRUKTUR OCH FÄLT-INSTRUKTIONER]
Du MÅSTE svara med ett giltigt JSON-objekt enligt exakt denna struktur. Ersätt <beskrivning> med din riktiga, välformulerade analys.

{
  "akuten": {
    "scenkaraktar": "<Skriv 1-2 meningar om den mörka/absurda karaktären komikern spelar, t.ex. 'En patetisk ensamvarg som försöker verka lyckad.'>",
    "undertext": "<Vad är den mörka sanningen publiken måste förstå mellan raderna?>",
    "trigger_analys": "<Analysera triggern. Om den redan ligger sist: Beröm placeringen i en naturlig mening. Om inte: Föreslå hur orden ska flyttas.>",
    "kill_your_darlings": "<Skriv en radikalt tajtare version av skämtet. DU MÅSTE BEHÅLLA CITAT OCH DIREKT TAL EXAKT SOM KOMIKERN SKREV DEM.>"
  },
  "fordjupning": {
    "diagnos_och_metaskamt": "<Vilken skämttyp är det? Vad är Safety och vad är Violation?>",
    "stilistiska_extremvarden": "<Vilken jargong används? Föreslå mer extrema, sjuka ord inom exakt den jargongen.>",
    "misplaced_sincerity": "<Hur ska komikerns kroppsspråk och tonfall vara för att sälja in att de inte skämtar?>",
    "overdrift_underdrift_skala": "<Endast om skämtet bygger på orimliga proportioner, ge en 3-gradig skala. Annars skriv: 'Ej aktuellt.'>"
  },
  "skriv_katalysatorn": {
    "pij_q1": "<Ledande fråga som utmanar komikern att byta ut ETT SPECIFIKT ORD för att krocken ska bli hårdare.>",
    "pij_q2": "<Ledande fråga om att byta ut ETT ANNAT ORD eller PLATS.>"
  },
  "tags": ["<Tagg1>", "<Tagg2>", "<Tagg3>"]
}`;

    // OpenAI-anropet med rätt modell ("gpt-4o")
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" }, // Tvingar fram JSON!
      messages: [
        { role: "system", content: masterPrompt },
        { role: "user", content: premise },
      ],
      temperature: 0.7, 
    });

    // Parsa det JSON-objekt som AI:n spottar ur sig
    const aiData = JSON.parse(response.choices[0].message.content || "{}");

    // Formatera den strukturerade JSON-datan till en vacker Markdown-text för frontenden
    const formattedFeedback = `
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

    // Skicka tillbaka strängen precis som frontenden förväntar sig!
    return NextResponse.json({
      feedback: formattedFeedback,
      suggestedTags: aiData.tags || []
    });

  } catch (error: any) {
    console.error("Analys API error:", error);
    return NextResponse.json({ feedback: "Kunde inte nå AI:n för analys." }, { status: 500 });
  }
}