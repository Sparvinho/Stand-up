# Klona setlist (2026-10-29)

## Nytt
- **Spara** uppdaterar fortfarande aktuell setlist (inklusive namn).
- **Spara som ny** skapar en ny databaspost med ett nytt ID, och byter till den nya kopian i redigeraren.
- Kopian innehåller aktuell ordning, plats, dolda skämt, stödord och minneslappar.
- Utförandedatum, betyg och utvärdering kopieras **inte**, så kopian går att redigera och använda vid nytt gig.
- Ursprunglig setlist lämnas orörd. Även genomförda set kan klonas.
- Funktionen kräver ingen ny SQL-migrering.

## Test
1. Öppna en sparad setlist. Klicka **Spara som ny** och ge kopian ett annat namn.
2. Öppna **Sparade** och kontrollera att både originalet och kopian syns.
3. Ändra ordningen i kopian och klicka **Spara**. Kontrollera att originalet är oförändrat.
4. Prova en setlist med stödord och minneslappar.

## Begränsning
Denna version innehåller bara kloningsfixen. Stöd för Writer-rutiner som hela block ingår inte ännu; det kräver separat datamodell och test av manus-/övergångsinnehåll.
