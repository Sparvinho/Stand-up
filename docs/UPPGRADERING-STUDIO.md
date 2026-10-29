# Stand Up Studio – set, repetition och scen (första version)

## Vad som har ändrats

- **Bibliotekets stödord:** Öppna ett skämt i `/workshop`, skriv fältet `Stödord på scen` och spara. Dessa är originalstödord för skämtet.
- **Stödord per set:** Lägg till skämt i `/setlists`, redigera sedan `Stödord i detta set` under varje skämt och spara setet. `Återställ från biblioteket` hämtar aktuell text från originalskämtet.
- **Frysta stödord:** När ett skämt läggs till i ett set kopieras stödorden. Ändringar i biblioteket påverkar då inte detta set. Äldre setlistor får stödord från biblioteket tills de sparas på nytt; första sparningen fryser dessa.
- **Repetera:** Knappen `Repetera` öppnar en separat vy med Manus, Stödord eller Båda för samma set. Repetition ändrar inte setets ordning.
- **Scenläge:** Hela setlistan med stödord, valbar kompakt/större text, befintlig timer och befintligt stöd för skärmlås (där webbläsaren stöder det).
- **Fusklapp:** Utskriften visar även stödord.
- Länken från Workshop till den gamla rutinbyggaren går nu till setlistan. Den gamla routen är bevarad men inte länkad från Workshop; inga gamla rutiner har tagits bort.
- En tidigare mikrofonknapp i scenläget visades som inspelning men spelade inte in ljud. Den är borttagen. Timern finns kvar.

## Installation (viktig ordning)

1. Ta **backup** på databasen, särskilt tabellerna `bits` och `setlists`.
2. Kör `migrations/20261019_stage_cues.sql` i din **Supabase SQL Editor** med lämplig behörighet. Skriptet lägger till två kolumner utan att radera befintlig data.
3. Byt därefter ut källkoden i ditt lokala Studio-projekt eller jämför och slå ihop ändringarna. **Behåll din egen lokala `.env.local`**, som inte medföljer ZIP-filen.
4. Kör `npm ci` och `npm run dev` lokalt, och kontrollera att det går att spara och öppna set.
5. Testa med ett **nytt testskämt och ett nytt testset**, innan du ändrar ditt riktiga material.

## Föreslagna manuella testfall

1. Lägg standardstödord på ett skämt i Workshop och spara.
2. Skapa ett set. Skämtets stödord ska automatiskt följa med.
3. Ändra stödorden enbart i detta set och spara. Kontrollera att bibliotekets stödord är oförändrade.
4. Ändra därefter bibliotekets stödord. Ladda om setet. Setets tidigare stödord ska fortfarande ligga kvar.
5. Öppna `Repetera` och växla mellan Manus, Stödord och Båda.
6. Öppna `Starta Gig` och kontrollera hela listan på **din egen telefon** i både Kompakt och Stor text.
7. Avsluta ett **testgig** och kontrollera att utvärderingen fortfarande går att spara.
8. Öppna en äldre setlist, spara den och verifiera att befintliga skämt, gigbetyg och stödord finns kvar.

## Viktiga avgränsningar

- **Ingen ändring har gjorts i den riktiga Supabase-databasen.** Migreringen måste köras av dig.
- **Ingen riktig offlinefunktion/PWA har införts** ännu. Att låsa skärmen vaken förhindrar inte nätverksavbrott, och alla längre set ryms inte fysiskt på en mobilskärm samtidigt.
- Comedy Writer och Pocket Forge har **inte ändrats**. De bör fortsätta fungera med den additiva migrationen, eftersom de inte behöver skriva till de nya fälten.
- Rutinobjekt från Writers `routines`-tabell är **ännu inte integrerade** som färdiga byggblock i Studios setbyggare. Det bör göras separat efter att grundflödet är testat.
- Ändringarna är syntaktiskt kontrollerade men **inte fullständigt bygg- och webbläsartestade** i denna miljö.
- **Lägg aldrig `.env.local` eller privata API-nycklar i en ZIP du delar.** Utvärdera att rotera tidigare delade hemliga nycklar.


## Biblioteksfilter – uppdatering
- Skämt med status `I rutin` visas inte längre i listan med tillgängliga skämt i setbyggaren. Skämt som redan ingår i sparade setlistor tas inte bort.
- Knappen **Bara Fokus** filtrerar på `bits.is_focused = true`, samma markering som Comedy Writer använder. Befintligt filter för stjärnbetyg/prioritet finns kvar.
- Ingen ytterligare databasändring krävs för dessa filter.
- Det finns ingen avsiktlig maxlängd för setlistor i koden. Om en lång setlist inte sparas, kontrollera felmeddelandet i gränssnittet och eventuell Supabase-logg innan ändringar görs.
