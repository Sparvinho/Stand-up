import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { jokesText } = await req.json();

    if (!jokesText) {
      return NextResponse.json({ result: "Ingen text att sy ihop." }, { status: 200 });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      response_format: { type: "json_object" }, 
      messages: [
        {
          role: "system",
          content: `Du är en genialisk standup-komiker. 
          Du kommer att få en lista med korta skämt/oneliners. Din uppgift är att "sy ihop" dessa till en enda flytande komisk rutin.
          
          Regler:
          1. Behåll skämtens original-punchlines och premisser, men skriv korta, naturliga övergångar (segues) mellan dem så att det blir en röd tråd.
          2. Det ska låta som att en person står på scen och pratar (talspråk, mörk humor, vuxet språk är okej).
          3. HÅLL DET KORTFATTAT. Övergångarna ska vara snabba och punchiga. Sväva inte iväg och lägg absolut inte till onödigt fluff eller onödiga utfyllnadsord.
          4. SKRIV ALDRIG några rubriker, siffror eller markeringar som "(Skämt 1)" i texten! Det ska vara EN ENDA sammanhängande, flytande text från början till slut.
          5. Du ska inte skriva egna skämt
          6. Svara MÅSTE vara ett giltigt JSON-objekt med exakt ett fält: "stitched_text" som innehåller den färdiga, ihopsydda rutinen.`
        },
        {
          role: "user",
          content: `Här är skämten som ska sys ihop:\n\n${jokesText}`
        }
      ]
    });

    const aiContent = response.choices[0].message.content || "{}";
    const parsedData = JSON.parse(aiContent);

    return NextResponse.json({ 
      result: parsedData.stitched_text 
    });

  } catch (error: any) {
    console.error("AI Stitch Error:", error.message);
    return NextResponse.json({ 
      result: `AI:n stötte på ett problem: ${error.message}` 
    }, { status: 200 });
  }
}