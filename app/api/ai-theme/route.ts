// app/api/ai-theme/route.ts
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Den letar automatiskt efter denna i din .env
});

export async function POST(req: Request) {
  const { theme, bits } = await req.json();

  const systemPrompt = `Du är en kreativ redaktör för en standup-komiker. 
  Din uppgift är att hitta skämt från komikerns bibliotek som kan knytas till temat.
  
  VAR KREATIV! Leta efter subtext, känslor eller subtila kopplingar. 
  Om temat är "pengar", leta efter skämt om CSN, swish, dyra dejter eller att panta burkar. 
  Om temat är "ensamhet", leta efter skämt om Tinder, fredagskvällar, husdjur eller att prata med sig själv.
  Ett skämt behöver absolut inte innehålla det specifika sökordet för att passa.
  
  DU MÅSTE svara med ett JSON-objekt som har nyckeln "suggestedIds". 
  Värdet för "suggestedIds" ska vara en array med id-nummer (strängar) på de utvalda skämten.`;

  const userPrompt = `Hitta de 3 till 10 skämt som passar bäst in på temat "${theme}".
  
  Lista med skämt:
  ${JSON.stringify(bits)}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.6-terra",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 1, // Perfekt för att låta den hitta oväntade kopplingar
    });

    // Tolka det JSON-svar som modellen skickar tillbaka
    const resultText = response.choices[0].message.content || '{"suggestedIds": []}';
    const data = JSON.parse(resultText);

    return Response.json(data);
  } catch (error) {
    console.error("AI Theme Search Error:", error);
    return Response.json({ error: "Kunde inte hitta teman" }, { status: 500 });
  }
}