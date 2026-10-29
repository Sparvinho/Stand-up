# Rutiner från Comedy Writer i Stand Up Studio

## Installation
1. Säkerhetskopiera Supabase-databasen.
2. Kör `migrations/20261029_routine_snapshots.sql` i SQL Editor.
3. Byt ut projektkoden mot denna version och behåll din egen `.env.local` lokalt. Lägg aldrig in nycklar i ZIP-filer.
4. Starta om utvecklingsservern.

## Användning
I setlistbyggaren: växla mellan **Skämt** och **Rutiner** i biblioteket. Välj **+** för att lägga till en hel rutin som ett block. Rutinen innehåller en ögonblicksbild av skämttexter och övergångar när den läggs till. Vid senare ändringar i Writer måste rutinen tas bort och läggas till på nytt för att uppdateras i setlistan.

En rutin visas som en enda post i setlistan och i scenläget. I repetitionsläget går den fullständiga texten att läsa. Du kan sätta stödord specifikt för setet på samma sätt som för vanliga skämt. **Spara som ny** behåller rutinernas text, stödord och minneslappar men inte gamla gigresultat. Ursprungliga rutiner i Writer ändras aldrig.

## Begränsningar
- Rutintid beräknas ungefärligt utifrån antalet ord, inte verklig speltid.
- Rutinen räknas som ett block i gigutvärderingen. Delarnas separata statistik uppdateras inte automatiskt.
- Rutiner som har tagits bort från Writer behåller sin sparade text i befintliga setlistor, men kan inte väljas på nytt.
- Kräver att båda apparna använder samma Supabase-projekt och att läsbehörighet finns för `routines`.
- Detta är en kodgranskad testversion; verifiera med ett separat testset innan du använder den på scen.
