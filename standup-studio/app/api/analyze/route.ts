import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { premise } = await req.json();

    if (!premise || premise.trim() === "") {
      return NextResponse.json({ suggestedTags: [] }, { status: 400 });
    }

    const systemPrompt = `Du är en kategoriserings-motor för en standup-komiker. 
Din ENDA uppgift är att analysera ett skämt och returnera relevanta ÄMNES-taggar så att komikern snabbt kan hitta skämtet när hen bygger en rutin.

ABSOLUTA REGLER FÖR TAGGARNA:
1. INGA META-ORD: Förbjudet att använda ord som "humor", "skämt", "punchline", "följdskämt", "setup", "ironi" eller liknande.
2. FÅNGA ÖVERRASKNINGEN: Tagga både det skämtet verkar handla om, och det absurda ämnet i punchlinen. (Exempel: Om setupen handlar om mänskliga rättigheter men punchlinen bygger på dvärgarna i Snövit -> tagga "rättigheter", "snövit", "dvärgar", "sagor").
3. FORMAT: Bara små bokstäver. Korta ord. Inga hashtags (#). Ge mig 3-5 taggar totalt.
4. DATASTRUKTUR: Du MÅSTE svara med ett giltigt JSON-objekt med exakt en nyckel: "suggestedTags" som innehåller en array med strängar.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Fixat från 40 till 4o
      response_format: { type: "json_object" }, // Detta tvingar OpenAI att BARA svara i JSON
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Läs och tagga detta skämt:\n\n${premise}` },
      ],
      temperature: 0.3, // Låg temperatur så att den inte flummar iväg
    });

    const aiData = JSON.parse(response.choices[0].message.content || "{}");

    return NextResponse.json({
      suggestedTags: aiData.suggestedTags || []
    });

  } catch (error: any) {
    console.error("Analys API error:", error);
    return NextResponse.json({ suggestedTags: ["analysfel"] }, { status: 500 });
  }
}