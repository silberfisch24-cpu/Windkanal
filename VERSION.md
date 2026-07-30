v0.3
Ein Hindernis im Kanal — die Strömung prallt daran ab, noch ohne Bild.

Etappe 1.2 (abgenommen):
- Ein Kreis oder ein Rechteck lässt sich in den Kanal setzen. Die Luft strömt
  nicht hindurch, sondern prallt ab und haftet an der Oberfläche — dieselbe
  Wandart wie am Boden
- Vor dem Hindernis staut sich die Luft (Rechteck: auf 10 % der
  Windgeschwindigkeit abgebremst, Kreis: 26 %), daneben muss sie durch den
  engeren Rest und wird schneller (165 bis 176 %), dahinter bleibt ein
  langsamer Bereich stehen, in dem sie sogar rückwärts läuft
- Ein Hindernis zu setzen beginnt die Rechnung von vorn; eine Wand mitten im
  Lauf einzublenden wäre ein Sprung, den die Strömung nicht verkraftet
- Prüfbar über `node werkzeug/pruefe-kern.js`: drei Teile — leerer Kanal wie
  bisher, dann Kreis und Rechteck, je mit Textbild der Strömung und sechs
  Prüfpunkten; 21 Prüfpunkte insgesamt

Unterwegs festgelegt:
- Eine Form wird als schlichtes Objekt beschrieben, mit dem Mittelpunkt in
  Zellen: Kreis über den Durchmesser, Rechteck über Breite und Höhe. Der
  Mittelpunkt statt einer Ecke, weil der Anstellwinkel in Etappe 1.3 um ihn
  gedreht wird
- Die Formen bekamen eine eigene Datei src/kern/formen.js, wie in SPEC.md
  ohnehin vorgesehen — sie beantwortet nur, welche Zellen zur Form gehören,
  und weiß nichts über Strömung
- Drei Anpassungen am Löser wurden erst nötig, als Wandzellen mitten im Gitter
  liegen: Wandzellen werden mit ruhender Luft gefüllt, sie strömen nicht mit,
  und ein Hindernis am Einlass oder Auslass wird abgewiesen. Am leeren Kanal
  ändert das nichts — die Prüfpunkte aus Etappe 1.1 liefern unverändert
  dieselben Zahlen

Bekannt und gewollt: Hinter dem Hindernis läuft die Strömung stellenweise
rückwärts, und die Dichte schwankt weiter als im leeren Kanal (0,968 bis 1,038
statt 0,994 bis 1,022). Das ist der Nachlauf eines umströmten Körpers, kein
Rechenfehler; über 20.000 Schritte geprüft, ohne dass Werte davonlaufen.

Noch keine Bildschirmausgabe. Als Nächstes Etappe 1.3: alle vier Formen —
Kreis, Rechteck, stumpfe Platte, Tragflächenprofil — mit einstellbarer Größe,
Anstellwinkel und Höhe über dem Boden.
