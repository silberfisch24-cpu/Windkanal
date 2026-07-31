v0.7
Das erste Bild steht auf dem Bildschirm: die Seite zeigt die laufende Strömung
um einen fest eingebauten Kreis als Farbfeld.

Etappe 2.1 (abgenommen):
- `index.html` öffnen genügt — es läuft eine Strömung von links nach rechts um
  einen Kreis, gezeichnet als Farbfeld der Geschwindigkeit. Hell heißt langsam,
  dunkel heißt schnell
- Nach etwa fünf Sekunden lösen sich hinter dem Kreis abwechselnd links und
  rechts Wirbel ab und wandern nach rechts aus dem Bild. Das ist dieselbe
  Anordnung, an der Etappe 1.4 die Wirbelablösung in Zahlen nachgemessen hat
- Unter dem Bild steht, wie viele Bilder je Sekunde laufen, wie viele
  Rechenschritte in einem Bild stecken und wie weit die Rechnung ist
- Drei neue Dateien in der Oberfläche; an der Kernlogik ist keine Zeile geändert

Unterwegs festgelegt:
- Die Farbskala ist einfarbig und läuft hell nach dunkel, statt ein Regenbogen
  zu sein. Bei einem Regenbogen müsste man auswendig wissen, ob Gelb mehr
  bedeutet als Grün; bei einer Helligkeitsskala liegt die Reihenfolge im Bild
  und bleibt auch für Farbenblinde lesbar
- Das obere Ende der Skala liegt fest beim Doppelten der Windgeschwindigkeit
  und richtet sich nicht nach dem größten Wert des jeweiligen Bildes. Sonst
  änderte sich die Bedeutung der Farben sechzigmal je Sekunde und das ganze
  Bild flackerte
- Je Bild wird nach einem Zeitbudget von 12 Millisekunden gerechnet statt nach
  einer festen Schrittzahl. Damit bleibt die Bildfolge auf jedem Gerät
  gleichmäßig; auf schwächeren Geräten läuft dafür die Strömung langsamer ab.
  Lieber langsamer als ruckelig
- Gemessen: Zeichnen 0,21 ms, Felder auslesen 1,62 ms, ein Rechenschritt
  1,02 ms. Das sind rund elf Rechenschritte und knapp 14 ms je Bild — die
  16,7 ms für 60 Bilder je Sekunde bleiben eingehalten

Bekannte Grenzen dieses Standes:
- Der Kreis sieht eckig aus. Das ist die Rasterung des Rechengitters und kein
  Zeichenfehler: die Rechnung sieht dieselbe Treppe, denn ein Körper ist bei
  diesem Verfahren nichts anderes als eine Gruppe von Wandzellen. Zusätzlich
  steht auf jeder der vier Hauptrichtungen eine einzelne Zelle vor, weil eine
  Zelle genau auf dem Rand noch mitzählt — das bleibt auch in feinerer
  Auflösung so. Die Strömung ist davon nicht verfälscht, der Wirbeltakt trifft
  den erwarteten Wert
- Bedienen lässt sich nichts: keine Schaltflächen, keine Regler, eine feste
  Szene. Das kommt in den Etappen 2.2 und 3.1
- Nur eine der vier Darstellungsarten ist da, und ohne Legende. Druck,
  Wirbelstärke und Teilchen kommen in 3.3, die Legende in 4.1
- Kein Dunkelmodus, keine Anpassung an Hoch- und Querformat, keine Reaktion auf
  Fenstergrößen oder Tabwechsel — das sind die Etappen 3.4 und 4.2
- Auf iPhone und iPad ungeprüft. Ob dort 60 Bilder je Sekunde gehalten werden,
  zeigt erst Etappe 2.3

Als Nächstes Etappe 2.2: Form auswählen sowie Starten, Anhalten und
Zurücksetzen über Schaltflächen.
