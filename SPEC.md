# SPEC — Windkanal

## Kern

*Dieser Abschnitt wird bei jedem Sessionbeginn gelesen. Kurz halten — wächst er,
gehört der Zuwachs in einen der unteren Abschnitte.*

- **Zweck:** Ein interaktiver 2D-Windkanal im Browser, in dem man ein Hindernis in eine Strömung setzt und die Umströmung sofort sieht.
- **Gehört ausdrücklich nicht dazu:** keine belastbaren Messwerte (Widerstands-/Auftriebsbeiwerte) — die Simulation ist anschaulich, nicht ingenieurstauglich; kein freies Zeichnen eigener Formen; kein Server, keine Nutzerkonten, kein Speichern.
- **Aktueller Stand:** Etappe 1.1 — Strömungslöser auf leerem Gitter, noch ohne jede Oberfläche.

---

## Anforderungen

*Ergebnis der Klärung. Annahmen sind als solche gekennzeichnet und werden ersetzt,
sobald sie geklärt sind.*

- **Kernfunktionen (Muss):**
  - Luftstrom von links nach rechts über eine rechteckige Fläche
  - Hindernis aus einer Auswahl fertiger Formen: Kreis, Rechteck, stumpfe Platte, Tragflächenprofil
  - Größe und Anstellwinkel des Hindernisses einstellbar, Windgeschwindigkeit einstellbar
  - Vier Darstellungsarten: mitströmende Teilchen, Farbfeld Geschwindigkeit, Farbfeld Druck, Farbfeld Wirbelstärke
  - Regler für die Rechenauflösung, Voreinstellung passend zum Gerät
  - Läuft flüssig auf PC, Mac, iPad und iPhone, Bedienung mit Maus und mit Finger
- **Kernfunktionen (Kann):**
  - Kraftanzeige (Widerstand/Auftrieb) als grobe Größenordnung — bewusst zurückgestellt
  - Eigene Formen zeichnen — bewusst zurückgestellt
- **Zielgruppe:** interessierte Laien und Schüler; jemand, der den Link öffnet, soll ohne Anleitung in etwa einer Minute zu einem sinnvollen Strömungsbild kommen.
- **Daten:** keine. Nichts wird gespeichert, nichts hochgeladen, nichts nachgeladen — alle Formen sind im Programm hinterlegt. Damit besteht kein Schutzbedarf.
- **Umgebung:** statische Webseite, aufgerufen über einen GitHub-Pages-Link. Keine Installation, kein Server, keine Anmeldung. Zielbrowser: Safari (iOS/macOS), Chrome, Firefox, Edge in aktuellen Versionen.
- **Abgrenzung:** kein 3D; keine belastbaren Zahlenwerte; kein freies Zeichnen; keine Wärme-, Schall- oder Überschallströmung; keine Speicher- oder Teilenfunktion.
- **Erfolgskriterium erste Version:** Der Unterschied zwischen stumpfer Platte und Tragflächenprofil wird im Strömungsbild unmittelbar deutlich — die Platte erzeugt sichtbar ein breites, wirbeliges Totwasser, das Profil legt sich die Strömung weitgehend glatt an.

*Offene Annahmen:*
- ⚠️ ANNAHME: Die Fläche wird quer angeströmt und ist am oberen und unteren Rand offen (freie Anströmung), nicht von Kanalwänden begrenzt — das entspricht eher dem Bild „Körper im Freistrom" als einem echten Kanal. Noch nicht bestätigt.
- ⚠️ ANNAHME: Die Seite erscheint auf Deutsch. Noch nicht bestätigt.

---

## Architektur

*Jede Entscheidung mit Begründung in einem Satz. Die Begründungen sind später der
Maßstab dafür, ob eine geplante Änderung noch zur Struktur passt.*

- **Ausführungsform:** rein statische Webseite, ausgeliefert über GitHub Pages — weil „über einen GitHub-Link aufrufbar, ohne Installation" genau das ist und jeder Server-Anteil zusätzlichen Betrieb und Kosten bedeuten würde, ohne dass es hier etwas zu speichern gäbe.
- **Sprache/Framework:** reines JavaScript als ES-Module, kein Framework, kein Build-Schritt — weil die Seite aus einer Zeichenfläche und einer Handvoll Regler besteht; ein Framework verwaltet Oberflächenzustand, den es hier kaum gibt, und ein Build-Schritt würde bedeuten, dass niemand die Datei mehr einfach im Browser öffnen kann.
- **Rechenverfahren:** Lattice-Boltzmann-Verfahren (D2Q9) — weil es Strömung als lokales Weiterschieben von Teilchenanteilen zwischen Nachbarzellen rechnet: Hindernisse sind dann einfach markierte Zellen, an denen zurückgeprallt wird, und Druck fällt als Nebenprodukt mit ab. Das übliche Alternativverfahren (Navier-Stokes direkt) braucht in jedem Zeitschritt eine globale Druckrechnung über das ganze Gitter — mehr Code, mehr Stolperstellen, und auf dem Handy langsamer.
- **Darstellung:** Canvas 2D, Farbfelder über ein Pixel-Feld, Teilchen als kurze Striche darüber — weil bei den vorgesehenen Gittergrößen (etwa 12.000 bis 50.000 Zellen) die Rechnung teurer ist als das Zeichnen; WebGL wäre schneller, aber deutlich mehr Code für einen Gewinn, den es hier noch nicht braucht.
- **Dateistruktur:**
  - `index.html` — Einstiegspunkt, lädt die Module direkt
  - `src/kern/` — Fachlogik, kennt weder Browser noch Bildschirm: `loeser.js` (Strömungsrechnung), `formen.js` (Hindernisse als Gitterbelegung), `felder.js` (abgeleitete Größen: Geschwindigkeit, Druck, Wirbelstärke)
  - `src/ui/` — Oberfläche: `darstellung.js` (Zeichnen), `bedienung.js` (Regler, Maus, Finger), `start.js` (verbindet beides)
  - `werkzeug/` — Prüfskripte für die Kommandozeile, mit denen Abschnitt 1 ohne Oberfläche abgenommen wird
  - `tests/` — automatische Tests (Abschnitt 5)
- **Abhängigkeiten:** zur Laufzeit keine. Für Entwicklung: Node.js mit eingebautem Testläufer (`node --test`) — keine installierten Pakete, damit das Projekt in fünf Jahren noch startet.
- **Trennung Fachlogik / Darstellung:** `src/kern/` gibt ausschließlich Zahlenfelder heraus und ruft nichts aus `src/ui/` auf. Alles, was `document`, `canvas` oder `window` anfasst, steht in `src/ui/`. Diese Trennung macht Abschnitt 1 überhaupt erst ohne Oberfläche abnehmbar.

---

## Etappenliste

*Nummerierung: Abschnitt.Etappe. Neue Etappen werden angehängt, nie eingeschoben —
Commit-Nachrichten verweisen auf diese Nummern.*

### Abschnitt 1 — Kernlogik ohne Oberfläche

- [ ] **1.1** Die Strömungsrechnung läuft auf einer leeren Fläche stabil: Luft strömt gleichmäßig von links nach rechts und bleibt es auch nach tausenden Rechenschritten.
  - Abnahme: `node werkzeug/pruefe-kern.js` ausführen; die Ausgabe zeigt nach 2000 Schritten überall annähernd die vorgegebene Geschwindigkeit und eine gleichbleibende Dichte, keine Ausreißer.
  - Noch nicht: kein Hindernis, keine Bildschirmausgabe.
- [ ] **1.2** Ein Hindernis lässt sich in die Fläche setzen; die Strömung prallt an ihm ab statt hindurchzuströmen.
  - Abnahme: Das Prüfskript zeichnet die Form als grobes Textbild und meldet, dass die Geschwindigkeit innerhalb des Hindernisses null ist und außen herum zunimmt.
  - Noch nicht: nur Kreis und Rechteck, Profil und Platte kommen in 1.3.
- [ ] **1.3** Alle vier Formen stehen bereit — Kreis, Rechteck, stumpfe Platte, Tragflächenprofil — jeweils mit einstellbarer Größe und Anstellwinkel.
  - Abnahme: Das Prüfskript zeigt jede Form als Textbild, auch gedreht; die Umrisse sind erkennbar.
- [ ] **1.4** Aus dem Rechengitter lassen sich Geschwindigkeit, Druck und Wirbelstärke ablesen.
  - Abnahme: Das Prüfskript gibt für einen angeströmten Kreis aus, dass sich hinter ihm die Wirbelstärke periodisch im Vorzeichen umkehrt — das ist die Wirbelablösung in Zahlen.
- [ ] **1.5** Auflösung und Windgeschwindigkeit sind einstellbare Größen; die Rechnung bleibt in allen vorgesehenen Stufen stabil.
  - Abnahme: Das Prüfskript rechnet grob, mittel und fein je 2000 Schritte durch, ohne dass Werte ins Unendliche laufen; es meldet zusätzlich, wie lange ein Rechenschritt je Stufe dauert.

### Abschnitt 2 — Minimale Bedienbarkeit

- [ ] **2.1** Die Seite zeigt die laufende Strömung um einen fest eingebauten Kreis als Farbfeld auf dem Bildschirm.
  - Abnahme: `index.html` im Browser öffnen; das Bild bewegt sich sichtbar und ruckelfrei.
- [ ] **2.2** Form auswählen sowie Starten, Anhalten und Zurücksetzen sind über Schaltflächen bedienbar.
  - Abnahme: Ohne Neuladen der Seite zwischen allen vier Formen wechseln und die Simulation zurücksetzen.
- [ ] **2.3** Die Seite ist über den GitHub-Pages-Link öffentlich erreichbar und läuft auf iPhone und iPad.
  - Abnahme: Den Link auf dem eigenen Handy öffnen; die Strömung läuft, die Schaltflächen sind mit dem Finger bedienbar.

### Abschnitt 3 — Erweiterungen und Sonderfälle

- [ ] **3.1** Windgeschwindigkeit, Hindernisgröße und Anstellwinkel sind über Regler einstellbar und wirken sofort.
  - Abnahme: Anstellwinkel des Profils langsam vergrößern; ab einem gewissen Winkel reißt die Strömung sichtbar ab.
- [ ] **3.2** Ein Regler stellt die Rechenauflösung ein; die Voreinstellung richtet sich nach dem Gerät.
  - Abnahme: Auf dem Handy ist die Voreinstellung gröber als auf dem Rechner; die feinste Stufe zeigt schärfere Wirbel.
- [ ] **3.3** Zwischen den vier Darstellungsarten lässt sich umschalten, die Teilchen lassen sich zuschalten.
  - Abnahme: Alle vier Ansichten am selben Strömungsbild durchschalten; die Teilchen treiben sichtbar mit.
- [ ] **3.4** Ungewöhnliche Situationen führen zu vernünftigem Verhalten statt zu kaputten Bildern.
  - Abnahme: Fenster verkleinern, Gerät drehen, Tab wegschalten und zurückkommen, extreme Reglerstellungen wählen — die Darstellung bleibt heil oder setzt sich sauber zurück.

### Abschnitt 4 — Darstellung und Politur

- [ ] **4.1** Farbskalen sind stimmig gewählt und mit einer Legende erklärt.
  - Abnahme: Man erkennt ohne Nachfrage, welche Farbe schnell und welche langsam bedeutet.
- [ ] **4.2** Die Oberfläche sitzt auf kleinen und großen Bildschirmen, im Hoch- wie im Querformat.
  - Abnahme: Auf dem iPhone hoch und quer prüfen; nichts überlappt, nichts ist abgeschnitten.
- [ ] **4.3** Der Startzustand und kurze Erklärtexte machen die Seite ohne Anleitung verständlich.
  - Abnahme: Jemandem den Link geben und zusehen, ob er ohne Erklärung zurechtkommt.

### Abschnitt 5 — Absicherung durch Tests

- [ ] **5.1** Automatische Tests sichern die Kernlogik ab: Stabilität, Hindernisse, abgeleitete Größen.
  - Abnahme: `npm test` läuft durch und meldet, was geprüft wurde.
- [ ] **5.2** Das Erfolgskriterium ist als fester Prüffall hinterlegt: Platte gegen Profil.
  - Abnahme: Der Test misst, dass das Totwasser hinter der Platte deutlich breiter ist als hinter dem Profil, und schlägt an, wenn sich das ändert.

---

## Änderungsverlauf

*Änderungen am Umfang werden angefügt, nicht durch Umschreiben ersetzt. Ohne
Verlauf lässt sich später nicht feststellen, ob eine Abweichung Absicht war oder
Fehler.*

- **2026-07-30:** Projekt angelegt. Zweck, Anforderungen, Architektur und Etappenplan festgelegt. Kraftanzeige und freies Zeichnen bewusst aus der ersten Version herausgenommen.
