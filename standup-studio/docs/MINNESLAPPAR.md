# Minneslappar — första versionen

1. Ta backup i Supabase och kör `migrations/20261019_memory_cards.sql` i SQL Editor. Det lägger till en JSONB-kolumn på `setlists` och ändrar inte befintliga rader.
2. Starta appen som vanligt. Öppna en setlista som inte är markerad som genomförd.
3. I högra kolumnen, klicka **+ Ny minneslapp här** där en ny grupp ska börja. En första lapp läggs automatiskt till om du börjar längre ned i listan. Namnge lapparna efter tema och spara setlistan.
4. Välj **Repetera → Minneslappar**. Försök återge skämtnamnen i rätt ordning, visa facit och gå till nästa lapp. Testa även lappordningen.
5. Scenläget visar lapparnas teman som diskreta avgränsningar utan att kräva interaktion.

Minneslapparna är **frivilliga** och sparas per setlista. De påverkar inte Comedy Writer, skämtens originaltexter eller tidigare setlistor. Flyttar du ett skämt som är första skämtet på en lapp följer gränsen med skämtet. Om du tar bort det skämtet tas gränsen bort. Gränserna är inte ett lås som håller ihop skämt i en grupp vid sortering.

## Teststatus

TSX-syntax har kontrollerats med global TypeScript-kompilator. Full Next.js-build och webbläsartest är inte genomförda eftersom paketberoendena inte är installerade i granskningsmiljön. Testa gärna med en separat testsetlista före skarp användning.

## Slumpträning (2026-10-20)
I **Repetera → Minneslappar → Slumpträning** får du en slumpmässig fråga av två slag:
- Lappens namn visas; försök återge skämtnamnen i rätt ordning.
- "Vad kommer efter lappen X?"; försök säga nästa lapps namn.

Tryck **Visa svaret** för facit och **Nästa slumpfråga** för en ny fråga. Exakt samma fråga upprepas inte direkt om det finns andra frågor att välja på. Med bara en lapp tränas endast skämten på den lappen. Den ordinarie funktionen **Lapp för lapp** finns kvar. Ingen databasändring krävs.
