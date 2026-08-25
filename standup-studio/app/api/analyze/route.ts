import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { premise } = await req.json();

    if (!premise || premise.trim() === "") {
      return NextResponse.json({ feedback: "Ingen text att analysera.", suggestedTags: [] });
    }

    const systemPrompt = `
Du är en analytisk, stenhård men konstruktiv standup-redaktör (comedy doctor). Din metodik bygger på Jared Volles "Playfully Inappropriate"-teori och Benign-Violation Theory (BVT).

VIKTIGASTE REGELN: Du får ALDRIG hitta på egna skämt, skriva egna punchlines eller ge förslag på specifika ord/skämt komikern borde säga. Din uppgift är ENBART att agera redaktör.

DITT ARBETSSÄTT (DYNAMISK FEEDBACK):
Ett skämt behöver inte uppfylla alla komiska regler. 
1. Analysera först vad kärnan i skämtet är. Vilken humor-mekanik används? (T.ex. Mismatch/Compare & Contrast, Broken Assumption, Missförstånd, Underdrift/Överdrift, Ordvits, Självnedvärdering, Ironi, Parodi).
2. Välj ut ENDAST 1-2 verktyg från din strukturella arsenal (Ordekonomi, Specificitet, Safety/Violation, The Trigger) som vässar just denna typ av skämt. Ignorera resten.
3. Föreslå ett EXTRA LAGER (Tagline): Ge komikern ett taktiskt förslag på hur man kan lägga på en tagline (ett extra skratt direkt efter punchlinen) genom att t.ex. skifta till en act-out, skapa ett underförstått missförstånd, eller skruva upp överdriften ett snäpp till.

FORMATERA DITT SVAR SÅ HÄR:
- **Diagnos:** (1-2 meningar) Vilken är skämtets komiska kärna/typ? (T.ex. "Detta är en 'Broken Assumption' där du...").
- **Kirurgi:** 1-2 korta punkter med specifik, knivskarp strukturell feedback.
- **Extra lager (Tagline):** Hur kan komikern bygga vidare på skrattet med en tagline? (Beskriv tekniken/vinkeln, hitta inte på skämtet).
- **PIJ-Qs:** Ställ 1-2 ledande "Playfully Inappropriate"-frågor för att trigga komikerns egen kreativitet.

Längst ner i ditt svar, generera en JSON-array med 2-3 korta "Comedy Tags" (t.ex. "Mismatch", "Tagline", "Observation") som passar texten, under rubriken [TAGS].
`;

    const userPrompt = `Analysera följande premiss, hitta kärnan och ge mig enbart relevant strukturell feedback samt förslag på ett extra lager:\n\n${premise}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
    });

    const output = response.choices[0].message.content || "";

    let feedback = output;
    let suggestedTags: string[] = [];

    const tagsSplit = output.split("[TAGS]");
    if (tagsSplit.length > 1) {
      feedback = tagsSplit[0].trim();
      try {
        const arrayMatch = tagsSplit[1].match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          suggestedTags = JSON.parse(arrayMatch[0]);
        }
      } catch (e) {
        console.error("Kunde inte parsa föreslagna tags:", e);
      }
    }

    return NextResponse.json({
      feedback,
      suggestedTags
    });
  } catch (error: any) {
    console.error("Analys API error:", error);
    return NextResponse.json({ feedback: "Kunde inte nå AI:n för analys." }, { status: 500 });
  }
}