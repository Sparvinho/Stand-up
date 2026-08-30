import { NextResponse } from "next/server";
import OpenAI from "openai"; 
import { comedyTheory } from "../../../lib/comedyTheory";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    // 1. Ta nu även emot 'isMetaChecked' (eller vad du kallar din flagga) från frontend
    const { premise, isMetaChecked } = await req.json();

    if (!premise || premise.trim() === "") {
      return NextResponse.json({ error: "Ingen text att analysera." }, { status: 400 });
    }

    // 2. Ersätt din gamla systemPrompt med vår nya JSON Master-Prompt.
    // Vi lägger också in din comedyTheory-variabel och meta-flaggan dynamiskt!
    const masterPrompt = `Du är "Comedy Doctor 2.0", en standup-redaktör inbyggd i appen Standup Studio. Ditt mål är ordekonomi, tajming och kontrast.
Du MÅSTE svara uteslutande med ett giltigt JSON-objekt.

HÄR ÄR DITT TEORETISKA RAMVERK:
${comedyTheory}

[META/ANTI-HUMOR FLAGGA: ${isMetaChecked}]

[ABSOLUTA RESTRIKTIONER]
1. Skriv ALDRIG följdskämt (Tags): Hitta inte på vad som händer sen. Stanna i den befintliga texten.
2. Bevara Pusslet: Överförklara aldrig. Stryk förklarande ord som "eftersom".
3. Meta/Anti-humor: Om [META/ANTI-HUMOR FLAGGA] är "true", leta INTE efter en traditionell punchline. Beröm den trasiga formen och föreslå hur den obekväma tystnaden kan maximeras.
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
    "overdrift_underdrift_skala": "OM överdrift/underdrift: ge 3 nivåer. OM INTE: skriv 'Ej aktuellt'."
  },
  "skriv_katalysatorn": {
    "pij_q1": "Ledande fråga 1 om ett specifikt ORD för att maxa krocken.",
    "pij_q2": "Ledande fråga 2 om ett specifikt ORD för att maxa krocken."
  },
  "tags": ["Tagg1", "Tagg2", "Tagg3", "Skämttyp"]
}`;

    // 3. OpenAI-anropet (Nu med JSON Mode och gpt-4o)
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Rättat från "gpt-40" till "gpt-4o"
      response_format: { type: "json_object" }, // DEN HÄR RADEN ÄR MAGIN!
      messages: [
        { role: "system", content: masterPrompt },
        { role: "user", content: premise },
      ],
      temperature: 0.7, // Jag rekommenderar 0.7 för att den ska vara lite mer kreativ i sina ordval än 0.3
    });

    // 4. Nu är output garanterat en perfekt JSON-sträng, så vi slipper all regex-parsing!
    const aiData = JSON.parse(response.choices[0].message.content || "{}");

    // Returnera det städade JSON-objektet direkt till frontend
    return NextResponse.json(aiData);

  } catch (error: any) {
    console.error("Analys API error:", error);
    return NextResponse.json({ error: "Kunde inte nå AI:n för analys." }, { status: 500 });
  }
}