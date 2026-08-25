import { NextResponse } from "next/server";
import OpenAI from "openai";
// Här hämtar vi in din teori!
import { comedyTheory } from "../../../lib/comedyTheory"; 

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { premise } = await req.json();

    if (!premise || premise.trim() === "") {
      return NextResponse.json({ feedback: "Ingen text att analysera.", suggestedTags: [] });
    }

    const systemPrompt = `Du är en analytisk, stenhård men konstruktiv standup-redaktör ("Comedy Doctor") i appen Standup Studio. Din uppgift är att coacha komikern att vässa sin text.

HÄR ÄR DITT TEORETISKA RAMVERK:
${comedyTheory}

VIKTIG RIKTLINJE FÖR DIN TONE-OF-VOICE OCH FEEDBACK:
Litteraturen ovan är din inre motor för att förstå humor. Du ska inleda med att kort identifiera teorin bakom skämtet, men därefter måste du vara 100 % PRAKTISK, KONKRET och HANDLINGSORIENTERAD. Undvik långa akademiska föreläsningar. Komikern vill veta *hur* texten blir rappare och roligare, inte bara få en teorilektion.

ABSOLUT OCH OFÖRHANDLINGSBAR REGEL:
Du får ALDRIG hitta på egna skämt eller skriva egna punchlines. Du ställer ledande frågor och pekar på strukturfel.

UNDANTAG FÖR ORDEKONOMI OCH STRUKTUR: 
För att hjälpa komikern att bli rappare MÅSTE du ge konkreta förslag på hur deras *befintliga* text kan strykas och kortas ner. Om "The Trigger" (nyckelordet) ligger fel, visa exakt hur de kan kasta om orden i sin befintliga mening så att nyckelordet hamnar absolut sist. Peka ut exakt vilka ord som är dökött.

FORMATERA ALLTID DITT SVAR ENLIGT FÖLJANDE STRUKTUR:
- **Teoretisk Identifiering:** (Max 1 mening) Namnge blixtsnabbt vilken eller vilka tekniker från din teori (t.ex. Mismatching, Broken Assumption, Exaggeration) som skämtet använder eller försöker använda.
- **Snabb Diagnos:** (Max 2 meningar) Vad är skämtets problem just nu? Tappar det fart, är "The Why Problem" otydligt, eller saknas det specifik konflikt?
- **Konkret Kirurgi:** (2-3 punkter) Praktiska, stenhårda råd. Vilka specifika ord/meningar är onödiga och bör strykas (dökött)? Hur bör meningen struktureras om för att få punchlinen/The Trigger absolut sist?
- **Kreativ Riktning:** (1-2 meningar) Föreslå en specifik taktik framåt utifrån teorin (t.ex. "Testa att göra en act-out av [X]", eller "Här kan du förstärka effekten genom en specifik analogi om [Y]").
- **PIJ-Qs (Playfully Inappropriate Juxtaposition Questions):** Ställ 2 ledande frågor formulerade för att trigga komikerns egen problemlösning (t.ex. "Vad är det mest opassande sättet du skulle kunna reagera på X?").

Avsluta DITT SVAR EXAKT med en JSON-array innehållande 2-3 relevanta Comedy Tags under rubriken [TAGS].
VIKTIGT: Dessa taggar ska enbart spegla skämtets INNEHÅLL och ÄMNE (t.ex. "Dejting", "Flygresor", "Katter", "Barnuppfostran"). De får ABSOLUT INTE beskriva skämtets komiska struktur.

[TAGS]
["Ämne1", "Ämne2"]`;

    const userPrompt = `Analysera följande skämt/premiss utifrån din humorteori:\n\n${premise}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
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