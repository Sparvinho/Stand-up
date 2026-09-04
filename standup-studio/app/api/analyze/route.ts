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
      return NextResponse.json(
        { feedback: "Ingen text att analysera.", suggestedTags: [] },
        { status: 400 }
      );
    }

    const masterPrompt = `Du är en tagg-motor. Returnera BARA en JSON-array med relevanta hashtags. Analysera ingenting annat.

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

    // Dölj fält som AI:n lämnat tomma (t.ex. om triggern redan är perfekt eller informationsbalansen sitter)
    const triggerText = aiData.akuten?.trigger_analys ? `**Trigger-analys:** ${aiData.akuten.trigger_analys}\n\n` : "";
    const infoText = aiData.akuten?.informationsbalans ? `**Informationsbalans:** ${aiData.akuten.informationsbalans}\n\n` : "";

    // Formatera datan för ReactMarkdown
    const formattedFeedback = `
### DEL 1: AKUTEN
**Scenkaraktär:** ${aiData.akuten?.scenkaraktar || ""}

**Undertext:** ${aiData.akuten?.undertext || ""}

${infoText}${triggerText}**Kill Your Darlings:** ${aiData.akuten?.kill_your_darlings || ""}

### DEL 2: TEORETISK FÖRDJUPNING
**Diagnos & Metaskämtet:** ${aiData.fordjupning?.diagnos_och_metaskamt || ""}

**Stilistiska extremvärden:** ${aiData.fordjupning?.stilistiska_extremvarden || ""}

**Misplaced Sincerity:** ${aiData.fordjupning?.misplaced_sincerity || ""}

**Överdrift/Underdrift-Skala:** ${aiData.fordjupning?.overdrift_underdrift_skala || ""}

### DEL 3: SKRIV-KATALYSATORN
**PIJ-Q 1 (Ordval):** ${aiData.skriv_katalysatorn?.pij_q1 || ""}

**PIJ-Q 2 (Struktur):** ${aiData.skriv_katalysatorn?.pij_q2 || ""}

**PIJ-Q 3 (Struktur):** ${aiData.skriv_katalysatorn?.pij_q3 || ""}

---
> **Doktorns inre monolog:** _${aiData.intern_tankeprocess || "Analyserar mörkret..."}_
`;

    return NextResponse.json({
      feedback: formattedFeedback,
      suggestedTags: aiData.tags || []
    });

  } catch (error: any) {
    console.error("Analys API error:", error);
    return NextResponse.json(
      { feedback: "Kunde inte nå AI:n för analys." },
      { status: 500 }
    );
  }
}