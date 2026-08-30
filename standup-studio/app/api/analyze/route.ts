import { NextResponse } from "next/server";
import OpenAI from "openai";

// OBS: Om du faktiskt har en fil som heter comedyTheory.ts kan du avkommentera raden nedan, annars kraschar Next.js.
// import { comedyTheory } from "../../../lib/comedyTheory";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    // 1. Vi måste ta emot "isMeta" exakt så som frontend skickar det
    const { premise, isMeta } = await req.json();

    if (!premise || premise.trim() === "") {
      return NextResponse.json({ feedback: "Ingen text att analysera.", suggestedTags: [] }, { status: 400 });
    }

    const masterPrompt = `Du är "Comedy Doctor 2.0", en standup-redaktör inbyggd i appen Standup Studio. Ditt mål är ordekonomi, tajming och kontrast.
Du MÅSTE svara uteslutande med ett giltigt JSON-objekt.

[META/ANTI-HUMOR FLAGGA: ${isMeta ? 'true' : 'false'}]

[ABSOLUTA RESTRIKTIONER]
1. Skriv ALDRIG följdskämt (Tags): Hitta inte på vad som händer sen. Stanna i den befintliga texten.
2. Bevara Pusslet: Överförklara aldrig. Stryk förklarande ord som "eftersom".
3. Meta/Anti-humor: Om flaggan är "true", leta INTE efter en traditionell punchline. Beröm den trasiga formen och föreslå hur den obekväma tystnaden kan maximeras.
4. Rädda Parodin: Om skämtet innehåller direkt anföring, citat eller en parodiform (t.ex. nyhetsspråk), får du ALDRIG skriva om det till indirekt tal i "kill_your_darlings".

[JSON SCHEMA SOM MÅSTE FÖLJAS]
Returnera ditt svar enligt exakt denna JSON-struktur:
{
  "akuten": {
    "scenkaraktar": "Kort beskrivning av hur komikern framstår.",
    "undertext": "Den mörka/absurda sanningen som inte uttalas rakt ut.",
    "trigger_analys": "OM trigger-ordet REDAN ligger absolut sist: Bekräfta det. OM INTE: Föreslå ordföljd.",
    "kill_your_darlings": "Skriv en radikalt nedstruken version. Bevara eventuella citat intakta."
  },
  "fordjupning": {
    "diagnos_och_metaskamt": "Identifiera skämttyp samt Safety/Violation.",
    "stilistiska_extremvarden": "Identifiera jargong (klinisk, byråkratisk etc) och föreslå extrema ord inom den.",
    "misplaced_sincerity": "Direktiv om kroppsspråk för att dölja att det är ett skämt.",
    "overdrift_underdrift_skala": "OM överdrift/underdrift: ge 3 nivåer. OM INTE: skriv 'Ej aktuellt.'"
  },
  "skriv_katalysatorn": {
    "pij_q1": "Ledande fråga 1 om ett specifikt ORD för att maxa krocken.",
    "pij_q2": "Ledande fråga 2 om ett specifikt ORD för att maxa krocken."
  },
  "tags": ["Tagg1", "Tagg2", "Tagg3", "Skämttyp"]
}`;

    // 3. OpenAI-anropet med rätt modell ("gpt-4o" med bokstaven O)
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" }, // Tvingar fram JSON!
      messages: [
        { role: "system", content: masterPrompt },
        { role: "user", content: premise },
      ],
      temperature: 0.7, 
    });

    // 4. Parsa det JSON-objekt som AI:n spottar ur sig
    const aiData = JSON.parse(response.choices[0].message.content || "{}");

    // 5. Formatera den strukturerade JSON-datan till en vacker Markdown-text
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

    // 6. Skicka tillbaka strängen precis som frontenden förväntar sig!
    return NextResponse.json({
      feedback: formattedFeedback,
      suggestedTags: aiData.tags || []
    });

  } catch (error: any) {
    console.error("Analys API error:", error);
    return NextResponse.json({ feedback: "Kunde inte nå AI:n för analys." }, { status: 500 });
  }
}