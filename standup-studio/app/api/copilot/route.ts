import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { currentBit, availableBits } = await req.json();

    if (!currentBit || !availableBits || availableBits.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    // Begränsa antalet kandidater som skickas till AI för att hålla anropet snabbt och kostnadseffektivt
    const candidatePool = availableBits.slice(0, 40).map((b: any) => ({
      id: String(b.id),
      title: b.title,
      premise: b.premise?.slice(0, 100),
      mood: b.mood,
      priority: b.priority,
      tags: b.tags,
    }));

    const systemPrompt = `
Du är en mästerlig standup-regissör och setlist-arkitekt.
En komiker har precis lagt till ett skämt i sin setlist.
Ditt uppdrag är att skanna kandidatpoolen av tillgängliga skämt och välja ut exakt 3 OLIKA skämt som är bäst lämpade att följa direkt efter det nuvarande skämtet.

Du ska ge exakt 3 förslag utifrån dessa 3 specifika spår:
1. Sömlös övergång: Ett skämt på exakt samma (eller ett mycket närliggande) tema, som matchar föregående skämts energi/mood perfekt.
2. Tematisk brygga: Ett skämt som har en tydlig logisk eller tematisk koppling till det förra, men som flyttar handlingen/ämnet ett litet steg framåt (bibehåller dock liknande energi).
3. Wild Card: Ett helt oväntat "kasta sig ut för stupet"-skämt. Något som bryter mönstret helt för att väcka publiken, byta ämne radikalt, eller agera "palate cleanser".

Svara ENDAST med giltig JSON i detta format:
{
  "suggestions": [
    {
      "bitId": "id-här",
      "track": "Sömlös övergång",
      "reason": "Kort motivering till varför det passar perfekt (max 1 mening)"
    },
    {
      "bitId": "id-här",
      "track": "Tematisk brygga",
      "reason": "Kort motivering om hur det bygger vidare på ämnet (max 1 mening)"
    },
    {
      "bitId": "id-här",
      "track": "Wild Card",
      "reason": "Kort motivering till varför detta bryter av snyggt här (max 1 mening)"
    }
  ]
}
`;

    const userPrompt = `
Nuvarande skämt på scen:
Titel: ${currentBit.title}
Premiss: ${currentBit.premise || ""}
Mood/Energi: ${currentBit.mood || "Odefinierad"}
Prioritet: ${currentBit.priority || 1}

Tillgängliga skämt att välja bland för nästa övergång:
${JSON.stringify(candidatePool)}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7, // Lite kreativitet tillåten, speciellt för Wild Card
    });

    const parsed = JSON.parse(response.choices[0].message.content || "{}");
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("Copilot API error:", error);
    return NextResponse.json({ suggestions: [] }, { status: 500 });
  }
}