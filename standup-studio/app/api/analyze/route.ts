import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
});

export async function POST(req: Request) {
  const { premise } = await req.json();

  const systemPrompt = `Du är en kategoriserings-motor för en standup-komiker. 
Din ENDA uppgift är att analysera ett skämt och returnera relevanta ÄMNES-taggar så att komikern snabbt kan hitta skämtet när hen bygger en rutin.

ABSOLUTA REGLER FÖR TAGGARNA:
1. INGA META-ORD: Förbjudet att använda ord som "humor", "skämt", "punchline", "följdskämt", "setup", "ironi" eller liknande.
2. FÅNGA ÖVERRASKNINGEN: Tagga både det skämtet verkar handla om, och det absurda ämnet i punchlinen. (Exempel: Om setupen handlar om mänskliga rättigheter men punchlinen bygger på dvärgarna i Snövit -> tagga "rättigheter", "snövit", "dvärgar", "sagor").
3. FORMAT: Bara små bokstäver. Korta ord. Inga hashtags (#). Ge mig 3-5 taggar totalt.
4. DATASTRUKTUR: Du MÅSTE svara med ett giltigt JSON-objekt. Inget "Här är dina taggar", ingen inledande text.`;

  try {
    const result = await generateText({
      model: google('gemini-1.5-pro'), // Ändrad till en stabil standardmodell för att vara på säkra sidan
      system: systemPrompt,
      prompt: `Läs och tagga detta skämt:\n\n${premise}`,
    });

    // Skottsäker regex: Letar upp första { och sista } och ignorerar eventuellt skitsnack från AI:n före eller efter.
    const text = result.text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error("Hittade ingen JSON i svaret");
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(parsedData), {
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error("Fel vid AI-taggning:", error);
    return new Response(JSON.stringify({ suggestedTags: ["analysfel"] }), { status: 500 });
  }
}