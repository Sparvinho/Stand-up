# Klona setlistor – reviderad version

- Tryck **Klona** direkt på valfri sparad setlista, eller på **Klona** i redigeraren för den aktuella sparade setlistan.
- Ange namn på kopian. Appen gör `INSERT` från den **sparade källposten**, inte `UPDATE`.
- Kopian har ett eget databas-ID. Originalet behåller sitt namn och innehåll.
- Kopierar ordning, dolda skämt, stödord, rutinögonblicksbilder och minneslappar.
- Kopierar inte genomförandedatum och gigutvärdering.
- Vid lyckad kloning öppnas kopian. Om databasen nekar `INSERT` visas ett felmeddelande, och ingen framgång påstås.

## Test

1. Spara ett testset som `A`.
2. Tryck **Klona** på posten `A` i **Sparade** och döp kopian till `B`.
3. Verifiera att både `A` och `B` finns i listan.
4. Ändra `B`, tryck **Spara**, och kontrollera att `A` fortfarande är oförändrad.
5. Prova även att klona en genomförd setlista.

**Observera:** Har du osparade ändringar i redigeraren måste du först spara dem om de ska ingå i kopian. Kloning använder det senast sparade setet.
