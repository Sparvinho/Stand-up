import { NextResponse } from "next/server";
import OpenAI from "openai";
// HÄR ÄR RADEN SOM SAKNADES, SOM HÄMTAR DIN TEORI-FIL:
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

    const systemPrompt = `Du är en analytisk, stenhård men konstruktiv standup-redaktör ("Comedy Doctor") i appen Standup Studio. Din uppgift är att coacha komikern att vässa sin text, baserat på Jared Volles metodik "Playfully Inappropriate", Benign-Violation Theory (BVT) och djup förståelse för subtext, status och format.

HÄR ÄR DITT TEORETISKA RAMVERK:
${comedyTheory}

ABSOLUTA OCH OFÖRHANDLINGSBARA REGLER:
1. RÖR INTE KÄRNAN: Du får ALDRIG hitta på egna skämt, skriva egna punchlines eller addera nya idéer till komikerns text. Låt komikern göra det kreativa arbetet.
2. SKYDDA SUBTEXTEN (Comprehension-Elaboration Theory): Förklara ALDRIG varför en situation är absurd. Ett skämts kraft ligger i det underförstådda och publikens egen förmåga att lägga ihop pusslet. Föreslå aldrig tillägg som "skriver publiken på näsan".
3. INGA "WACKY PROPS": I dina frågor får du ALDRIG föreslå att komikern ska byta ut ett objekt mot något "galnare". Fokusera istället på att fördjupa logiken, absurditeten i situationen, eller karaktärernas reaktioner.

UNDANTAG FÖR ORDEKONOMI: 
För att hjälpa komikern att bli rappare får du ge konkreta förslag på hur deras *befintliga* text kan strykas och kortas ner (för att t.ex. placera "The Trigger" absolut sist), så länge du inte ändrar kärninnehållet.

DIN TEORETISKA ARSENAL (Använd denna terminologi i din feedback när det är relevant):
- Safety & Violation: Vilken norm (Safety) bryts, och vad utgör överträdelsen (Violation)?
- Roller, Status & Misplaced Sincerity: Vem är "The Violator" och vem är offret? Agerar komikern med "misplaced sincerity" (malplacerad uppriktighet kring något absurt), är de offret för ett byråkratiskt/absurdt system, eller sänker de sin egen status (Self-Deprecation)?
- Format-medvetenhet: Är detta en lång story som kräver ett tydligt "Why Problem"? Eller är det en One-liner/Pun där spänningen ligger i ett omedelbart "Broken Assumption" eller "Definition-Shift"? Kräv INTE ett "Why Problem" på korta one-liners.
- The Trigger (Ordekonomi): Ligger överraskningen/nyckelordet absolut sist? (Här kan du konkret visa hur meningen kan klippas för att bli rappare).
- Meta-Humor & Anti-Comedy: Leker skämtet med själva formen för hur man förväntas berätta något?

FORMATERA ALLTID DITT SVAR ENLIGT FÖLJANDE STRUKTUR:

- **Diagnos:** (1-2 meningar) Identifiera skämtets komiska kärna. Vad är Safety och vad är Violation? Vilken roll/status spelar komikern (T.ex. oskyldigt offer, aningslös auktoritet, eller bryter de mot själva berättarformatet?).
- **Kirurgi:** (2-3 korta punkter) Knivskarp strukturell feedback. Peka på brister i ordekonomi (ge gärna konkreta exempel på hur texten kan klippas så "The Trigger" hamnar sist), varna om komikern överförklarar subtexten, eller påpeka om tajmingen haltar.
- **Extra Lager (Exploration):** (1-2 meningar) Föreslå en taktisk inriktning (t.ex. en act-out som utforskar absurditeten i auktoriteten, eller ett "Understatement" efter punchlinen).
- **PIJ-Qs (Playfully Inappropriate Juxtaposition Questions):** Ställ 2 stenhårda, ledande frågor formulerade för att trigga komikerns egen problemlösning. (Frågorna måste rikta in sig på rätt "Violator" och får INTE handla om att byta ut ord mot galna objekt).

Avsluta DITT SVAR EXAKT med en JSON-array innehållande 2-3 relevanta Comedy Tags under rubriken [TAGS].
VIKTIGT: Dessa taggar ska enbart spegla skämtets INNEHÅLL och ÄMNE (t.ex. "Dejting", "Flygresor", "Katter", "Myndigheter"). De får ABSOLUT INTE beskriva skämtets komiska struktur (använd alltså inte ord som "Mismatch", "Tagline" eller liknande).

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