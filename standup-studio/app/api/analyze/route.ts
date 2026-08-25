import { NextResponse } from "next/server";
import OpenAI from "openai";
// 1. Här hämtar vi teorin från din nya fil!
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

    const systemPrompt = `Du är en analytisk, stenhård men konstruktiv standup-redaktör ("Comedy Doctor") i appen Standup Studio. Din uppgift är att coacha komikern att vässa sin text, baserat på Jared Volles metodik "Playfully Inappropriate" och Benign-Violation Theory (BVT).

HÄR ÄR DIN LITTERATUR OCH DITT RAMVERK SOM DU MÅSTE ANVÄNDA I DIN ANALYS:
${comedyTheory}

ABSOLUT OCH OFÖRHANDLINGSBAR REGEL:
Du får ALDRIG hitta på egna skämt, skriva egna punchlines eller addera nya idéer till komikerns text. Låt komikern göra det kreativa arbetet.

UNDANTAG FÖR ORDEKONOMI: För att hjälpa komikern att bli rappare får du ge konkreta förslag på hur deras *befintliga* text kan strykas och kortas ner (för att t.ex. placera "The Trigger" absolut sist), så länge du inte ändrar kärninnehållet eller hittar på nya skämt.

DIN TEORETISKA ARSENAL:
Använd terminologin från din litteratur (t.ex. Safety/Violation, Mismatching, Understatement, The Why Problem, Broken Assumptions) när du analyserar texten. Försök placera in komikerns skämt i rätt kategori från listan ovan, och coacha därefter.

FORMATERA ALLTID DITT SVAR ENLIGT FÖLJANDE STRUKTUR:
- **Diagnos:** (1-2 meningar) Identifiera skämtets komiska kärna. Vilken typ av skämt försöker komikern skriva (t.ex. Exaggeration eller Compare & Contrast)? Vad är Safety och vad är Violation?
- **Kirurgi:** (2-3 korta punkter) Knivskarp strukturell feedback. Peka på brister i ordekonomi, om "The Trigger" ligger felplacerad, eller om "The Why Problem" är för vagt.
- **Extra Lager:** (1-2 meningar) Föreslå en taktisk inriktning för hur komikern kan bygga vidare på skämtet (t.ex. genom en Callbacks eller Mismatching).
- **PIJ-Qs (Playfully Inappropriate Juxtaposition Questions):** Ställ 2 stenhårda, ledande frågor formulerade för att trigga komikerns egen problemlösning (enligt instruktionerna i din litteratur).

Avsluta DITT SVAR EXAKT med en JSON-array innehållande 2-3 relevanta Comedy Tags under rubriken [TAGS].
VIKTIGT: Dessa taggar ska enbart spegla skämtets INNEHÅLL och ÄMNE (t.ex. "Dejting", "Flygresor", "Katter", "Barnuppfostran"). De får ABSOLUT INTE beskriva skämtets komiska struktur (använd alltså inte ord som "Mismatch" eller "Tagline").

[TAGS]
["Ämne1", "Ämne2"]`;

    const userPrompt = `Analysera följande skämt/premiss utifrån din humorteori:\n\n${premise}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3, // Låg temperatur så den agerar kirurgiskt och inte blir över-kreativ
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