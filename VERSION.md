v0.1
Projektgrundlage steht, und die Versionsvergabe ist geklärt.

Projektdefinition:
- Zweck festgelegt: ein interaktiver 2D-Windkanal im Browser, in den man ein
  Hindernis setzt und die Umströmung sofort sieht — anschaulich, ausdrücklich
  nicht ingenieurstauglich
- Kanalform geklärt: fester Boden mit Haftbedingung, reibungsfreie Decke
  darüber; ob ein Körper unterströmt wird, ergibt sich aus Form und Höhe
- Architektur festgelegt: statische Seite über GitHub Pages, reines JavaScript
  ohne Framework und ohne Build-Schritt, Lattice-Boltzmann-Verfahren,
  strikte Trennung von Kernlogik und Oberfläche
- Etappenplan mit fünf Abschnitten und je eigenen Abnahmekriterien steht
- Erfolgskriterium der ersten Version: Der Unterschied zwischen stumpfer Platte
  und Tragflächenprofil wird im Strömungsbild unmittelbar deutlich

Versionsvergabe:
- Versions-Tags entstehen ab jetzt aus dieser Datei: erste Zeile die Nummer,
  darunter die Stichpunkte im Klartext
- Der Workflow .github/workflows/tag.yml legt daraus beim Merge nach main den
  annotierten Tag an; eine bereits vergebene Nummer wird nie überschrieben
- Grund: Cloud-Sessions können technisch keine Tags setzen — git push von
  refs/tags/* und die GitHub-API-Pfade /git/tags und /git/refs antworten mit
  403, während Branch-Pushes durchgehen. Deshalb blieb dieser Tag zweimal
  liegen. Der Workflow baut nichts und rührt keine ausgelieferte Datei an.

Noch kein Programmcode: als Nächstes Etappe 1.1 (Strömung im leeren Kanal).
