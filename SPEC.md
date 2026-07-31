# SPEC — Windkanal

## Kern

*Dieser Abschnitt wird bei jedem Sessionbeginn gelesen. Kurz halten — wächst er,
gehört der Zuwachs in einen der unteren Abschnitte.*

- **Zweck:** Ein interaktiver 2D-Windkanal im Browser, in dem man ein Hindernis in eine Strömung setzt und die Umströmung sofort sieht.
- **Gehört ausdrücklich nicht dazu:** keine belastbaren Messwerte (Widerstands-/Auftriebsbeiwerte) — die Simulation ist anschaulich, nicht ingenieurstauglich; kein freies Zeichnen eigener Formen; kein Server, keine Nutzerkonten, kein Speichern.
- **Aktueller Stand:** **Etappe 2.1 abgenommen (`v0.7`) — das erste Bild steht auf dem
  Bildschirm.** `index.html` zeigt die laufende Strömung um einen fest eingebauten Kreis
  als Farbfeld der Geschwindigkeit; nach etwa fünf Sekunden lösen sich sichtbar Wirbel ab.
  Darunter liegt die in Abschnitt 1 fertiggestellte Kernlogik: Strömung im Kanal, alle vier
  Formen mit Größe, Anstellwinkel und Höhe über dem Boden, Geschwindigkeit, Druck und
  Wirbelstärke ablesbar, drei Auflösungsstufen bei einstellbarer Windgeschwindigkeit.
  Prüfbar über `node werkzeug/pruefe-kern.js` (acht Teile, 47 Prüfpunkte, etwa 60 Sekunden).
  Frühere Stände: `v0.1` Projektgrundlage, `v0.2` Strömung im leeren Kanal, `v0.3` Hindernis
  im Kanal, `v0.4` alle vier Formen, `v0.5` abgeleitete Größen, `v0.6` Auflösung und
  Windgeschwindigkeit. Noch nichts bedienbar: keine Schaltflächen, keine Regler, nur eine
  der vier Darstellungsarten. Als Nächstes **Etappe 2.2** — Form auswählen sowie Starten,
  Anhalten und Zurücksetzen über Schaltflächen.

---

## Anforderungen

*Ergebnis der Klärung. Annahmen sind als solche gekennzeichnet und werden ersetzt,
sobald sie geklärt sind.*

- **Kernfunktionen (Muss):**
  - Luftstrom von links nach rechts durch einen **oben und unten von Wänden begrenzten Kanal**
  - Hindernis aus einer Auswahl fertiger Formen: Kreis, Rechteck, stumpfe Platte, Tragflächenprofil
  - Größe, Anstellwinkel **und Höhe über dem Boden** des Hindernisses einstellbar, Windgeschwindigkeit einstellbar
  - Vier Darstellungsarten: mitströmende Teilchen, Farbfeld Geschwindigkeit, Farbfeld Druck, Farbfeld Wirbelstärke
  - Regler für die Rechenauflösung, Voreinstellung passend zum Gerät
  - Läuft flüssig auf PC, Mac, iPad und iPhone, Bedienung mit Maus und mit Finger
- **Kernfunktionen (Kann):**
  - Kraftanzeige (Widerstand/Auftrieb) als grobe Größenordnung — bewusst zurückgestellt
  - Eigene Formen zeichnen — bewusst zurückgestellt
  - Mitbewegter Boden (wie das Laufband in echten Fahrzeug-Windkanälen) — bewusst zurückgestellt, siehe „Kanalform" unten
  - Zwischen mehreren Farbschemata wählen können — bewusst zurückgestellt (angemerkt 2026-07-31). Etappe 4.1 legt **eine** stimmige Skala je Darstellungsart fest; eine Auswahl wäre der Schritt danach und würde eine eigene Etappe brauchen
- **Zielgruppe:** interessierte Laien und Schüler; jemand, der den Link öffnet, soll ohne Anleitung in etwa einer Minute zu einem sinnvollen Strömungsbild kommen.
- **Daten:** keine. Nichts wird gespeichert, nichts hochgeladen, nichts nachgeladen — alle Formen sind im Programm hinterlegt. Damit besteht kein Schutzbedarf.
- **Umgebung:** statische Webseite, aufgerufen über einen GitHub-Pages-Link — wie beim Schwesterprojekt *Steuerrechner*, dort unter <https://silberfisch24-cpu.github.io/Steuerrechner/>. Keine Installation, kein Server, keine Anmeldung. Zielbrowser: Safari (iOS/macOS), Chrome, Firefox, Edge in aktuellen Versionen.
- **Sprache der Oberfläche:** Deutsch.
- **Abgrenzung:** kein 3D; keine belastbaren Zahlenwerte; kein freies Zeichnen; keine Wärme-, Schall- oder Überschallströmung; keine Speicher- oder Teilenfunktion.
- **Erfolgskriterium erste Version:** Der Unterschied zwischen stumpfer Platte und Tragflächenprofil wird im Strömungsbild unmittelbar deutlich — die Platte erzeugt sichtbar ein breites, wirbeliges Totwasser, das Profil legt sich die Strömung weitgehend glatt an.

*Offene Annahmen:*
- keine offenen Annahmen. Die beiden ursprünglichen wurden am 2026-07-30 geklärt, siehe Änderungsverlauf.

### Kanalform

Geklärt am 2026-07-30, weil davon fast jede Etappe abhängt:

- **Unten:** fester Boden mit Haftbedingung — Luft haftet an ihm, wie an einer echten Fahrbahn.
  Ein Quadrat, das auf dem Boden steht, schließt dicht ab; es wird nicht unterströmt.
- **Oben:** Wand, aber **reibungsfrei** (die Luft gleitet daran entlang, statt an ihr zu haften).
  Grund: Eine zweite Haftwand würde eine eigene Grenzschicht aufbauen und das Bild am Objekt
  verfälschen. Die Deckenhöhe liegt deutlich über den üblichen Objektgrößen — Richtwert:
  mindestens die vierfache Objekthöhe.
- **Bodenfreiheit als Eigenschaft der Form:** Ob ein Körper unterströmt wird, ergibt sich aus
  seiner Geometrie und seiner eingestellten Höhe. Ein Fahrzeugumriss mit Radstand und Spalt
  darunter wird unterströmt, ein aufsitzender Klotz nicht. Es braucht dafür keinen Schalter.
- **Bekannte Vereinfachung:** Der Boden steht still. In echten Fahrzeug-Windkanälen läuft er
  als Band mit, weil sonst über die Kanallänge eine dicke Grenzschicht anwächst, die es unter
  einem fahrenden Auto nicht gibt. Für die Anschauung ist das tragbar; der mitbewegte Boden
  steht als „Kann" auf der Liste.

---

## Architektur

*Jede Entscheidung mit Begründung in einem Satz. Die Begründungen sind später der
Maßstab dafür, ob eine geplante Änderung noch zur Struktur passt.*

- **Ausführungsform:** rein statische Webseite, ausgeliefert über GitHub Pages — weil „über einen GitHub-Link aufrufbar, ohne Installation" genau das ist und jeder Server-Anteil zusätzlichen Betrieb und Kosten bedeuten würde, ohne dass es hier etwas zu speichern gäbe.
- **Veröffentlichungsweg:** GitHub Pages direkt aus dem Branch `main`, Wurzelverzeichnis — **ohne Bau-Workflow**. Der *Steuerrechner* braucht seinen Workflow, weil dort erst gebaut werden muss; hier gibt es nichts zu bauen, die Dateien liegen fertig im Repo. Der Link sieht am Ende gleich aus: <https://silberfisch24-cpu.github.io/Windkanal/>. Einmalig muss dafür in den Repository-Einstellungen unter *Pages* die Quelle auf „Deploy from a branch → main → / (root)" gestellt werden.
- **Versionsvergabe:** ein einziger Actions-Workflow, `.github/workflows/tag.yml`, setzt den Versions-Tag. Er liest `VERSION.md` — erste Zeile die Nummer, darunter die Stichpunkte — und legt daraus einen annotierten Tag an, sobald eine geänderte `VERSION.md` auf `main` ankommt. Grund für die Ausnahme vom „kein Workflow"-Grundsatz: Cloud-Sessions können technisch keine Tags anlegen (siehe `CLAUDE.md`), und der Schritt ist deshalb zweimal liegengeblieben. Der Workflow baut nichts, verändert keine ausgelieferte Datei und läuft nur bei einer Änderung an dieser einen Datei — die Seite bleibt eine bloße Dateisammlung. Einmalig muss dafür unter *Settings → Actions → General → Workflow permissions* „Read and write permissions" gewählt sein.
- **Sprache/Framework:** reines JavaScript als ES-Module, kein Framework, kein Build-Schritt — weil die Seite aus einer Zeichenfläche und einer Handvoll Regler besteht; ein Framework verwaltet Oberflächenzustand, den es hier kaum gibt, und ein Build-Schritt würde bedeuten, dass niemand die Datei mehr einfach im Browser öffnen kann. Bewusster Unterschied zum *Steuerrechner* (React + Vite): dort gibt es viele Eingabefelder und Diagramme, die React trägt; hier läuft die Arbeit pro Einzelbild in eigenem Rechencode ab, zu dem React nichts beiträgt.
- **Aussehen:** eigenes, schlichtes Erscheinungsbild — der CDU-Styleguide des *Steuerrechners* wird ausdrücklich **nicht** übernommen. Grund: Er verbietet Farbverläufe, die Strömungsdarstellung lebt aber genau davon (langsam bis schnell, Unterdruck bis Überdruck); und ein Parteidesign an einem Windkanal wäre eine Aussage, die das Projekt nicht treffen will.
- **Rechenverfahren:** Lattice-Boltzmann-Verfahren (D2Q9) — weil es Strömung als lokales Weiterschieben von Teilchenanteilen zwischen Nachbarzellen rechnet: Hindernisse sind dann einfach markierte Zellen, an denen zurückgeprallt wird, und Druck fällt als Nebenprodukt mit ab. Das übliche Alternativverfahren (Navier-Stokes direkt) braucht in jedem Zeitschritt eine globale Druckrechnung über das ganze Gitter — mehr Code, mehr Stolperstellen, und auf dem Handy langsamer.
- **Darstellung:** Canvas 2D, Farbfelder über ein Pixel-Feld, Teilchen als kurze Striche darüber — weil bei den vorgesehenen Gittergrößen (etwa 12.000 bis 50.000 Zellen) die Rechnung teurer ist als das Zeichnen; WebGL wäre schneller, aber deutlich mehr Code für einen Gewinn, den es hier noch nicht braucht.
- **Dateistruktur:**
  - `index.html` — Einstiegspunkt, lädt die Module direkt
  - `src/kern/` — Fachlogik, kennt weder Browser noch Bildschirm: `loeser.js` (Strömungsrechnung), `formen.js` (Hindernisse als Gitterbelegung), `felder.js` (abgeleitete Größen: Geschwindigkeit, Druck, Wirbelstärke)
  - `src/ui/` — Oberfläche: `darstellung.js` (Zeichnen), `bedienung.js` (Regler, Maus, Finger), `start.js` (verbindet beides)
  - `werkzeug/` — Prüfskripte für die Kommandozeile, mit denen Abschnitt 1 ohne Oberfläche abgenommen wird
  - `tests/` — automatische Tests (Abschnitt 5)
  - `VERSION.md` — aktuelle Versionsnummer und die Stichpunkte dazu; Grundlage des Tags
  - `.github/workflows/tag.yml` — setzt daraus den Tag, siehe „Versionsvergabe"
- **Abhängigkeiten:** zur Laufzeit keine. Für Entwicklung: Node.js mit eingebautem Testläufer (`node --test`) — keine installierten Pakete, damit das Projekt in fünf Jahren noch startet. Die `package.json` enthält nur `"type": "module"` und keinerlei Pakete; ohne sie hält Node die `.js`-Dateien für das alte Modulformat und weigert sich, sie zu laden. Der Browser braucht sie nicht.
- **Randbedingungen des Kanals** (festgelegt in Etappe 1.1): links wird die **Geschwindigkeit** vorgegeben, rechts der **Druck** (Dichte 1), oben Gleitwand, unten Haftwand. Die Aufteilung vorne Geschwindigkeit / hinten Druck ist notwendig: gibt man beides vorne vor und lässt hinten nur durchlaufen, hat der Druck keinen Anker und die Reibung staut immer weiter Luft auf, statt sich auf ein Gefälle einzupendeln — genau das trat beim ersten Versuch auf.
- **Hindernisse im Kanal** (festgelegt in Etappe 1.2): Ein Hindernis ist nichts anderes als eine Gruppe von **Haftwand**-Zellen mitten im Gitter — dieselbe Wandart wie der Boden. Die Luft prallt daran zurück und haftet an der Oberfläche; ein eigener Mechanismus für Körper ist nicht nötig, genau darum wurde das Lattice-Boltzmann-Verfahren gewählt. Die Form selbst kennt der Löser nicht: `formen.js` beantwortet nur „liegt Zelle (x, y) in dieser Form?", `loeser.js` macht daraus Wandzellen. Ein Hindernis zu setzen oder zu wechseln **setzt die Rechnung zurück** — eine Wand mitten im Lauf einzublenden wäre ein Sprung, den die Strömung nicht verkraftet. Ein Hindernis darf Einlass und Auslass nicht berühren, weil diese beiden Spalten in jedem Schritt neu gesetzt werden; der Versuch wird gemeldet statt stillschweigend übergangen. Dasselbe gilt seit Etappe 1.3 nach oben: ein Hindernis, das bis an die Decke reicht, wird abgewiesen statt abgeschnitten — sonst sähe es aus, als hinge der Körper an der Decke. Am Boden ist das Aufsitzen dagegen gewollt.
- **Formen, Anstellung und Höhe über dem Boden** (festgelegt in Etappe 1.3): Vier Arten stehen bereit — `kreis` (Durchmesser), `rechteck` (Breite, Höhe), `platte` (Länge, Dicke) und `profil` (Länge, Dicke). Platte und Profil bekommen dieselbe voreingestellte Dicke, 12 % der Länge und mindestens 3 Zellen, damit sich bei gleicher Länge allein die Form unterscheidet — genau darauf zielt das Erfolgskriterium. Das Profil folgt der üblichen NACA-Formel für symmetrische Vierziffern-Profile: vorn rund, dickste Stelle bei knapp einem Drittel der Länge, hinten spitz auslaufend; die Platte ist vorn und hinten abgeschnitten. Der **Anstellwinkel** in Grad gilt für jede Form, positiv hebt die Anströmkante; gedreht wird dabei nicht die Form, sondern der abgefragte Punkt entgegengesetzt — dadurch bleibt jede Form in ihrem eigenen Koordinatensystem einfach beschreibbar und der Winkel steht an einer einzigen Stelle. Beim Kreis bleibt er wirkungslos. Die **Höhe über dem Boden** wird entweder als Mittelpunkt `y` oder als `bodenabstand` angegeben — freie Zellen zwischen Boden und Unterkante, 0 heißt „sitzt auf". Genau eines von beidem, beides zugleich wäre widersprüchlich. Jede Form geht vor der Benutzung durch `normalisiereForm`: prüfen, Fehlendes ergänzen, einen Bodenabstand in ein `y` umrechnen. In `kanal.hindernis` steht danach die vervollständigte Form, damit niemand nachrechnen muss, wo der Körper tatsächlich steht.
- **Abgeleitete Größen** (festgelegt in Etappe 1.4): Der Löser speichert neun Teilchenanteile je Zelle — Zahlen, die für sich nichts zeigen. `felder.js` rechnet daraus die drei Größen aus, die man sehen will. **Geschwindigkeit** als `ux`, `uy` und Betrag. **Druck** aus der Dichte, und zwar als *Unterschied zum Ruhedruck* (`(dichte − 1) / 3`) statt absolut: die Dichte liegt in der Rechnung immer dicht bei 1, die Abweichung ist die ganze Aussage, und eine Farbskala von 0,333 bis 0,334 wäre nicht lesbar. **Wirbelstärke** als Drehung der Luft (`∂uy/∂x − ∂ux/∂y`), positiv gegen den Uhrzeigersinn, gerechnet aus dem Unterschied der Nachbargeschwindigkeiten. Dabei gilt für Wände eine eigene Regel, ohne die die Wirbelstärke falsch herauskäme: eine **Haftwand** zählt mit Geschwindigkeit null — genau diese Scherung soll sie ja messen —, eine **Gleitwand** wird längs mitgezogen, damit an der reibungsfreien Decke keine Drehung ausgewiesen wird, die es dort nicht gibt; am Gitterrand wird einseitig abgeleitet. In Wandzellen selbst steht überall null. Zwei Wege stehen bereit: Einzelabfrage (`druckBei`, `wirbelstaerkeBei` — für Messungen und Prüfungen) und `leseFelder` für das ganze Gitter auf einmal. Letzteres schreibt in Felder, die man behalten und wiedergeben kann, weil die Darstellung sie sechzigmal je Sekunde braucht und ebenso oft neuen Speicher anzufordern Ruckeln bedeutete.
- **Auflösung und Windgeschwindigkeit** (festgelegt in Etappe 1.5): Die Kanalgröße wird nicht mehr frei in Zellen angegeben, sondern über eine von drei **Auflösungsstufen** — `grob` 200 × 60, `mittel` 280 × 84, `fein` 400 × 120 Zellen. Alle drei haben dasselbe Seitenverhältnis (10 : 3), damit dieselbe Szene in jeder Stufe gleich aussieht und sich allein die Schärfe unterscheidet; jede Stufe führt einen `faktor` mit (1 / 1,4 / 2), mit dem sich in groben Zellen beschriebene Maße hochrechnen lassen. Die Zellenzahlen 12.000 / 23.520 / 48.000 liegen im Bereich, den „Darstellung" oben vorsieht. Eigene Maße bleiben möglich, aber nur **statt** einer Stufe, nicht zusätzlich — die Prüfskripte brauchen sie für kürzere Kanäle, in denen ein Textbild lesbar bleibt. **Windgeschwindigkeit 0,01 bis 0,12** Zellen je Schritt, **Zähigkeit mindestens 0,005**; beide Grenzen sind gemessen, nicht geschätzt (siehe Änderungsverlauf 2026-07-31). Werte außerhalb werden abgewiesen statt stillschweigend gerechnet, weil ein aufgeschaukeltes Gitter sich später wie ein Programmfehler liest. Der Wind lässt sich **mitten im Lauf ändern, ohne die Rechnung zurückzusetzen** — anders als beim Hindernis: der Einlass wird ohnehin in jedem Schritt neu gesetzt, der neue Wind wandert also von vorn durch den Kanal, wie wenn man am Gebläse dreht. Das Umrechnen einer Form auf eine feinere Stufe steht bewusst noch **nicht** im Kern, sondern im Prüfskript; ob es dorthin gehört, entscheidet sich in Etappe 3.2, wenn die Oberfläche es zum zweiten Mal braucht.
- **Bild auf dem Bildschirm** (festgelegt in Etappe 2.1): Gezeigt wird zunächst **eine** der vier vorgesehenen Darstellungsarten, das Farbfeld der Geschwindigkeit; die übrigen drei kommen in Etappe 3.3 dazu. Die **Farbskala** ist einfarbig und läuft von hell nach dunkel — hell ist langsam, dunkel ist schnell. Eine Regenbogenskala (blau-grün-gelb-rot) wäre bunter, aber ihre Reihenfolge steckt nicht in der Farbe selbst: welcher Ton „mehr" bedeutet, müsste man auswendig wissen. Bei einer Helligkeitsskala liegt die Ordnung im Bild und bleibt auch für Farbenblinde und im Schwarzweißdruck lesbar. Die **Obergrenze der Skala liegt fest** bei dem Doppelten der Windgeschwindigkeit — nicht beim größten Wert des jeweiligen Einzelbildes: eine mitwandernde Skala änderte die Bedeutung der Farben sechzigmal je Sekunde, das ganze Bild flackerte, obwohl sich die Strömung kaum ändert. Das Doppelte deckt ab, was tatsächlich vorkommt (an der Körperkante gemessen 1,73-fach). **Wandzellen** — Boden, Decke, Hindernis — bekommen ein neutrales Grau außerhalb der Skala, sonst erschiene das Hindernis als besonders langsam strömende Luft. Die **Zeichenfläche hat die Größe des Rechengitters**, ein Bildpunkt je Zelle; auf Bildschirmbreite vergrößert wird sie vom Browser über die Formatvorlage, was die Übergänge nebenbei glättet und eigenen Vergrößerungscode spart. Dass der Kern y vom Boden nach oben zählt, die Zeichenfläche aber von oben nach unten, wird an genau einer Stelle umgekehrt (in `darstellung.js`) und sonst nirgends.
- **Der Körper im Bild ist eckig** (festgestellt in Etappe 2.1): Der Kreis erscheint auf dem Bildschirm nicht rund, sondern treppig, mit je einer einzelnen vorstehenden Zelle links, rechts, oben und unten. Das ist die Rasterung, und zwar aus zwei getrennten Gründen. **Erstens** ist ein Kreis von 16 Zellen Durchmesser nicht runder darstellbar als das Gitter — 16 Zellen sind 16 Stufen. **Zweitens** zählt `liegtInForm` eine Zelle zum Kreis, wenn ihr Mittelpunkt höchstens einen Radius entfernt liegt (`<=`); genau auf den vier Hauptrichtungen liegt der Mittelpunkt exakt auf dem Rand und wird mitgezählt. Daraus entsteht die einzelne Nase, die auffälliger wirkt als die Treppe selbst — und sie bleibt in jeder Auflösung bestehen, weil sie nicht von der Feinheit abhängt, sondern von der Vergleichsrichtung. Wesentlich dabei: **die Rechnung sieht dieselbe Treppe.** Das ist kein Zeichenfehler, sondern die Form, an der die Luft tatsächlich zurückprallt — beim gewählten Verfahren ist ein Körper nichts anderes als eine Gruppe von Wandzellen. Dass das die Strömung nicht verfälscht, ist gemessen: der Wirbeltakt aus Etappe 1.4 entspricht einer Strouhal-Zahl von etwa 0,25, dem für diese Anströmung erwarteten Wert. Drei Wege, das Bild zu glätten, in aufsteigender Eingriffstiefe: eine feinere Auflösung (Etappe 3.2) macht die Stufen im Verhältnis kleiner; ein über das Farbfeld gezeichneter **glatter Umriss** der wahren Form macht den Körper rund, ohne die Rechnung anzufassen (in `formen.js` von Anfang an vorgesehen — „der Löser macht daraus Wandzellen, die Oberfläche später einen Umriss") und wäre der Kandidat für Etappe 4.1, allerdings um den Preis, dass das Bild einen glatten Körper zeigt, an dem die Luft in Wahrheit treppig abprallt; die Vergleichsrichtung im Kern von `<=` auf `<` zu ändern nähme die vier Nasen weg, verschöbe aber die wirksame Größe jedes Kreises um eine Zelle und damit sämtliche 47 Prüfpunkte aus Abschnitt 1 — deshalb **nicht** ohne eigenen Anlass.
- **Takt der Bildschleife** (festgelegt in Etappe 2.1): Je Einzelbild wird nicht eine feste Zahl von Rechenschritten gerechnet, sondern so viele, wie in ein **Zeitbudget von 12 ms** passen (höchstens 20). Eine feste Zahl wäre einfacher, aber falsch: auf einem schnellen Rechner bliebe Leistung liegen, auf dem Handy käme das Bild nicht mehr nach und es ruckelte. Über das Budget bleibt die Bildfolge auf jedem Gerät gleichmäßig; auf schwächeren Geräten läuft dafür die Strömung langsamer ab. Das ist die bewusste Wahl: lieber langsamer als ruckelig.
- **Trennung Fachlogik / Darstellung:** `src/kern/` gibt ausschließlich Zahlenfelder heraus und ruft nichts aus `src/ui/` auf. Alles, was `document`, `canvas` oder `window` anfasst, steht in `src/ui/`. Diese Trennung macht Abschnitt 1 überhaupt erst ohne Oberfläche abnehmbar.

---

## Etappenliste

*Nummerierung: Abschnitt.Etappe. Neue Etappen werden angehängt, nie eingeschoben —
Commit-Nachrichten verweisen auf diese Nummern.*

### Abschnitt 1 — Kernlogik ohne Oberfläche

- [x] **1.1** *(abgenommen 2026-07-30, v0.2)* Die Strömungsrechnung läuft im leeren Kanal stabil: Luft strömt von links nach rechts, haftet am Boden, gleitet an der Decke entlang, und das bleibt auch nach tausenden Rechenschritten so.
  - Abnahme: `node werkzeug/pruefe-kern.js` ausführen; die Ausgabe zeigt nach 2000 Schritten eine gleichbleibende Dichte, in Bodennähe eine langsamer werdende Strömung (die Grenzschicht) und darüber annähernd die vorgegebene Geschwindigkeit, keine Ausreißer.
  - Noch nicht: kein Hindernis, keine Bildschirmausgabe.
- [x] **1.2** *(abgenommen 2026-07-30, v0.3)* Ein Hindernis lässt sich in den Kanal setzen; die Strömung prallt an ihm ab statt hindurchzuströmen.
  - Abnahme: Das Prüfskript zeichnet die Form als grobes Textbild und meldet, dass die Geschwindigkeit innerhalb des Hindernisses null ist und außen herum zunimmt.
  - Noch nicht: nur Kreis und Rechteck, Profil und Platte kommen in 1.3.
- [x] **1.3** *(abgenommen 2026-07-31, v0.4)* Alle vier Formen stehen bereit — Kreis, Rechteck, stumpfe Platte, Tragflächenprofil — jeweils mit einstellbarer Größe, Anstellwinkel und Höhe über dem Boden.
  - Abnahme: Das Prüfskript zeigt jede Form als Textbild, auch gedreht. Zusätzlich zwei Gegenproben: ein auf dem Boden aufsitzendes Rechteck lässt darunter nichts durch (Geschwindigkeit dort null), dasselbe Rechteck angehoben wird sichtbar unterströmt.
  - Noch nicht: Der Unterschied zwischen Platte und Profil ist nur als Beobachtung ausgewiesen, noch nicht als Prüffall — der kommt in 5.2.
- [x] **1.4** *(abgenommen 2026-07-31, v0.5)* Aus dem Rechengitter lassen sich Geschwindigkeit, Druck und Wirbelstärke ablesen.
  - Abnahme: Das Prüfskript gibt für einen angeströmten Kreis aus, dass sich hinter ihm die Wirbelstärke periodisch im Vorzeichen umkehrt — das ist die Wirbelablösung in Zahlen.
  - Noch nicht: Die Werte stehen in Gittereinheiten, nicht in Metern je Sekunde oder Pascal — belastbare Zahlen sind ausdrücklich nicht Ziel des Projekts.
- [x] **1.5** *(abgenommen 2026-07-31, v0.6)* Auflösung und Windgeschwindigkeit sind einstellbare Größen; die Rechnung bleibt in allen vorgesehenen Stufen stabil.
  - Abnahme: Das Prüfskript rechnet grob, mittel und fein je 2000 Schritte durch, ohne dass Werte ins Unendliche laufen; es meldet zusätzlich, wie lange ein Rechenschritt je Stufe dauert.
  - Noch nicht: Dass die feine Stufe *schärfere* Wirbel zeigt, ist nicht geprüft — nur, dass alle drei Stufen dieselbe Strömung zeigen und stabil bleiben. Die Schärfe braucht ein Bild und ist Abnahmekriterium von 3.2.

**Abschnitt 1 ist damit abgeschlossen.** Die Kernlogik rechnet ohne Oberfläche vollständig.

### Abschnitt 2 — Minimale Bedienbarkeit

- [x] **2.1** *(abgenommen 2026-07-31, v0.7)* Die Seite zeigt die laufende Strömung um einen fest eingebauten Kreis als Farbfeld auf dem Bildschirm.
  - Abnahme: `index.html` im Browser öffnen; das Bild bewegt sich sichtbar und ruckelfrei.
  - Noch nicht: nur eine der vier Darstellungsarten (Geschwindigkeit), keine Legende zur
    Farbskala, keine Bedienung. Die Ecken und Kanten des Kreises sind die Rasterung des
    Rechengitters — siehe „Der Körper im Bild ist eckig" unter *Architektur*.
- [ ] **2.2** Form auswählen sowie Starten, Anhalten und Zurücksetzen sind über Schaltflächen bedienbar.
  - Abnahme: Ohne Neuladen der Seite zwischen allen vier Formen wechseln und die Simulation zurücksetzen.
- [ ] **2.3** Die Seite ist unter <https://silberfisch24-cpu.github.io/Windkanal/> öffentlich erreichbar und läuft auf iPhone und iPad.
  - Abnahme: Den Link auf dem eigenen Handy öffnen; die Strömung läuft, die Schaltflächen sind mit dem Finger bedienbar.
  - Voraussetzung, die nur der Nutzer selbst erledigen kann: in den Repository-Einstellungen unter *Pages* die Quelle auf „Deploy from a branch → main → / (root)" stellen.

### Abschnitt 3 — Erweiterungen und Sonderfälle

- [ ] **3.1** Windgeschwindigkeit, Hindernisgröße, Anstellwinkel und Höhe über dem Boden sind über Regler einstellbar und wirken sofort.
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
- **2026-07-30:** Beide offenen Annahmen geklärt.
  1. *Kanalform:* Es ist ein echter Kanal mit Wänden oben und unten, kein Freistrom. Boden mit Haftbedingung, Decke reibungsfrei und deutlich über den Objekten. Ob ein Körper unterströmt wird, ergibt sich aus seiner Form und seiner Höhe. Folge: Etappen 1.1, 1.3 und 3.1 umformuliert (noch keine davon war begonnen, daher keine neuen Nummern). Mitbewegter Boden als „Kann" aufgenommen.
  2. *Sprache:* Deutsch, bestätigt.
- **2026-07-30:** Etappe 1.1 umgesetzt (Strömung im leeren Kanal). Dabei festgelegt, weil es
  ohne Festlegung nicht rechenbar war:
  1. *Randbedingungen:* Einlass gibt die Geschwindigkeit vor, Auslass den Druck — siehe
     „Randbedingungen des Kanals" unter Architektur. Kein Umfangszuwachs, nur eine
     Ausgestaltung der bereits geklärten Kanalform.
  2. *Voreinstellungen des Kanals:* 200 × 60 Zellen, Windgeschwindigkeit 0,1 und Zähigkeit
     0,01 in Gittereinheiten. Damit ist die Grenzschicht am Boden deutlich sichtbar und die
     Decke bleibt weit genug entfernt. Einstellbar werden diese Größen erst in Etappe 1.5.
  3. *`package.json` angelegt*, ausschließlich mit `"type": "module"` — ohne sie lädt Node
     die Dateien nicht. Keine Pakete, kein Build-Schritt; die Zusage „bloße Dateisammlung"
     bleibt unberührt.
  4. *Bekannte, gewollte Randerscheinung:* An der Vorderkante des Bodens staut sich die Luft
     (Dichte bis 1,022) und weicht nach oben aus. Das ist echte Strömung an einer Kante, kein
     Rechenfehler; im Kanalinneren liegt die Dichte zwischen 1,0002 und 1,0032. Die Prüfpunkte
     messen deshalb im Kanalinneren und weisen die Randwerte getrennt aus.
- **2026-07-30:** Etappe 1.2 umgesetzt (Hindernis im Kanal, Kreis und Rechteck). Dabei
  festgelegt:
  1. *Hindernis = Haftwand:* siehe „Hindernisse im Kanal" unter Architektur. Kein
     Umfangszuwachs, sondern die Ausgestaltung dessen, was das Rechenverfahren ohnehin
     vorsieht.
  2. *Beschreibung einer Form:* schlichtes Objekt mit `art` und dem **Mittelpunkt** `(x, y)`
     in Zellen — Kreis über `durchmesser`, Rechteck über `breite` und `hoehe`. Der
     Mittelpunkt statt einer Ecke, weil Anstellwinkel (Etappe 1.3) um ihn gedreht wird.
  3. *Drei Anpassungen am Löser*, die erst nötig wurden, als Wandzellen mitten im Gitter
     liegen: Wandzellen werden beim Zurücksetzen mit ruhender Luft der Dichte 1 gefüllt
     (sonst liefert ein Blick ins Hindernis „null geteilt durch null" statt „steht still");
     Wandzellen strömen nicht mit, ihr Inhalt bleibt stehen (sonst laufen Werte aus der
     Nachbarschaft hinein); ein Hindernis an Einlass oder Auslass wird abgewiesen. Am leeren
     Kanal ändert keine dieser Anpassungen etwas — die Prüfpunkte aus Etappe 1.1 liefern
     unverändert dieselben Zahlen.
  4. *Prüfmaß für Teil 2 und 3:* 120 × 60 Zellen statt 200 × 60, Hindernis 16 Zellen groß.
     Grund: allein die Bildgröße im Textbild — die Form soll erkennbar sein. Die
     Voreinstellungen des Kanals bleiben unberührt.
  5. *Bekannte, gewollte Randerscheinung:* Hinter dem Hindernis läuft die Strömung
     stellenweise rückwärts (bis etwa −7 % der Windgeschwindigkeit), und die Dichte
     schwankt weiter als im leeren Kanal (0,968 bis 1,038 statt 0,994 bis 1,022). Beides
     ist der Nachlauf eines umströmten Körpers, kein Rechenfehler; über 20.000 Schritte
     geprüft, ohne dass Werte davonlaufen.
- **2026-07-30:** Auslieferung am Schwesterprojekt *Steuerrechner* ausgerichtet: derselbe Weg (öffentlicher GitHub-Pages-Link), aber ohne dessen Actions-Workflow und ohne React/Vite, weil hier nichts zu bauen ist. Der CDU-Styleguide des Steuerrechners wird ausdrücklich nicht übernommen — er verbietet Farbverläufe, die die Strömungsdarstellung braucht.
- **2026-07-30:** *Ausnahme vom Grundsatz „kein Actions-Workflow":* Ein Workflow kommt hinzu, allein für die Versionsvergabe. Anlass: Der Tag für die abgeschlossene erste Phase konnte zweimal nicht gesetzt werden. Geprüft wurde an diesem Tag, dass eine Cloud-Session Tags grundsätzlich nicht anlegen kann — `git push` von `refs/tags/*` sowie die API-Pfade `/git/tags` und `/git/refs` antworten mit 403, während gewöhnliche Branch-Pushes und sogar das Pushen von `.github/workflows/` durchgehen. Der Grundsatz galt dem *Bauen* der Seite und bleibt dafür unangetastet: Der neue Workflow baut nichts, verändert keine ausgelieferte Datei und wird nur durch eine Änderung an `VERSION.md` ausgelöst. Die Seite bleibt eine Dateisammlung ohne Build-Schritt. Folge: neue Dateien `VERSION.md` und `.github/workflows/tag.yml`, Abschnitt „Architektur" um „Versionsvergabe" ergänzt, Tag-Regeln in `CLAUDE.md` umgeschrieben.
- **2026-07-31:** Etappe 1.3 umgesetzt (alle vier Formen, Anstellwinkel, Höhe über dem
  Boden). Dabei festgelegt:
  1. *Platte und Profil, Anstellwinkel, Bodenabstand:* siehe „Formen, Anstellung und Höhe
     über dem Boden" unter Architektur. Kein Umfangszuwachs — beide Formen und alle drei
     Einstellungen stehen von Anfang an in den Anforderungen.
  2. *Gleiche voreingestellte Dicke für Platte und Profil* (12 % der Länge). Sonst
     vergliche der spätere Prüffall aus Etappe 5.2 zwei verschieden große Körper und
     nicht zwei Formen.
  3. *Vorzeichen des Anstellwinkels:* positiv hebt die Anströmkante. Das musste festgelegt
     werden, weil beide Richtungen denkbar sind; gewählt ist die übliche Leserichtung
     „positiver Anstellwinkel hebt die Nase". Ein Prüfpunkt misst es nach, damit es nicht
     unbemerkt kippt.
  4. *Bodenabstand als zweiter Weg, die Höhe anzugeben.* Aus dem Mittelpunkt
     zurückzurechnen wäre bei gedrehten Formen jedes Mal Handarbeit gewesen — und die
     Gegenprobe „sitzt auf dem Boden" ließe sich nicht sauber treffen. Entweder `y` oder
     `bodenabstand`, nie beides.
  5. *Neue Absage: Hindernis an der Decke.* Bisher waren nur Einlass und Auslass
     geschützt; mit einstellbarer Höhe ist das Überschreiten nach oben der naheliegende
     Fehlgriff.
  6. *Prüfmaß für Teil 4:* Platte und Profil dort 10 statt der voreingestellten 4 Zellen
     dick. Grund wie schon beim Kanalmaß in Etappe 1.2 allein die Bildgröße im Textbild —
     mit der Voreinstellung wären beide nur ein Strich, und der Unterschied der Formen
     ginge verloren. In der Strömung (Teil 5) gilt die Voreinstellung.
  7. *Nebenbefund, noch kein Prüffall:* Hinter der stumpfen Platte strömt die Luft mit
     52 % der Windgeschwindigkeit rückwärts, hinter dem Profil bei gleicher Länge, Dicke
     und Anstellung (20°) nur mit 29 %. Genau dieser Unterschied ist das Erfolgskriterium
     des Projekts; als harter Prüffall gehört er nach Etappe 5.2, hier wird er nur
     ausgewiesen.
- **2026-07-31:** Etappe 1.4 umgesetzt (Geschwindigkeit, Druck und Wirbelstärke ablesen).
  Dabei festgelegt:
  1. *Neue Datei `src/kern/felder.js`* mit den drei abgeleiteten Größen — siehe
     „Abgeleitete Größen" unter Architektur. Kein Umfangszuwachs: die Datei war in der
     Dateistruktur von Anfang an vorgesehen, und alle drei Größen stehen als
     Darstellungsarten in den Anforderungen.
  2. *Druck als Unterschied zum Ruhedruck, nicht absolut.* Das musste entschieden
     werden, weil beides vertretbar ist; ausschlaggebend war die spätere Farbskala:
     absolut schwankt der Wert nur in der dritten Nachkommastelle.
  3. *Wandregel für die Wirbelstärke.* An der Haftwand zählt die Wand als stehende
     Luft, an der Gleitwand wird sie längs mitgezogen. Ohne diese Unterscheidung
     erschiene an der reibungsfreien Decke eine Drehung, die es dort nicht gibt — die
     Decke sähe im Bild aus wie ein zweiter Boden.
  4. *Prüfmaß für Teil 7:* 6600 Schritte statt der sonst üblichen 2000, davon die
     ersten 4000 zum Einschwingen. Grund: Die Wirbelablösung setzt nicht sofort ein —
     die Strömung hinter dem Kreis ist zunächst spiegelbildlich und kippt erst nach und
     nach ins Schwingen. Mit 2000 Schritten wäre der Ausschlag noch zu klein, um von
     Zittern unterscheidbar zu sein. Die Laufzeit des Prüfskripts steigt dadurch von
     etwa 16 auf etwa 22 Sekunden.
  5. *Bekannte, gewollte Erscheinung im Druckbild:* Über die Kanallänge fällt der Druck
     gleichmäßig ab, weil der Auslass ihn festhält und die Reibung davor ein Gefälle
     erzeugt. Im Textbild erscheint deshalb fast der ganze Kanal als leichter Überdruck;
     Stau vor dem Körper und Sog dahinter heben sich davon ab, liegen aber auf dieser
     schiefen Ebene. Kein Rechenfehler, sondern die Randbedingung aus Etappe 1.1.
  6. *Nebenbefund:* Der Kreis wirft die Wirbel im Takt von 637 Schritten ab (bei
     Durchmesser 16 und Windgeschwindigkeit 0,1). Das entspricht einer Strouhal-Zahl
     von etwa 0,25 — der Wert, den man bei dieser Anströmung erwartet. Ein Prüfpunkt
     auf die Zahl selbst ist bewusst nicht gesetzt: geprüft wird, dass der Takt
     *gleichmäßig* ist, nicht wie schnell er ist, weil die Kanalwände ihn beeinflussen.
- **2026-07-31:** Etappe 1.5 umgesetzt — Auflösung und Windgeschwindigkeit als einstellbare
  Größen. Dabei festgelegt und nachgetragen (siehe „Auflösung und Windgeschwindigkeit" unter
  *Architektur*):
  1. *Drei Auflösungsstufen statt freier Zellenzahl.* `grob` 200 × 60, `mittel` 280 × 84,
     `fein` 400 × 120 — gleiches Seitenverhältnis, damit die Stufe die Schärfe ändert und
     nicht die Szene. `grob` entspricht genau der bisherigen Voreinstellung; die Etappen 1.1
     bis 1.4 rechnen daher unverändert weiter.
  2. *Die Grenzen sind gemessen, nicht geschätzt.* Der **leere** Kanal hält Wind bis etwa 0,25
     aus, **mit Hindernis** bricht die Rechnung schon zwischen 0,15 und 0,16 zusammen: an der
     Körperkante wird die Luft auf gut das Doppelte beschleunigt und nähert sich dort der
     Schallgeschwindigkeit des Gitters (0,577) zu weit an. Erlaubt sind deshalb **0,01 bis
     0,12**, nachgeprüft mit der schärfsten Form (angestellte Platte) in jeder Stufe. Ebenso
     bei der Zähigkeit: bei 0,002 (Angleichzeit 0,506) bricht sie zusammen, ab 0,004 läuft
     sie — erlaubt ab **0,005**. Die Untergrenze des Windes ist dagegen keine Frage der
     Rechnung, sondern der Anschauung: darunter steht das Bild praktisch still.
  3. *Der Wind ist mitten im Lauf änderbar, das Hindernis nicht.* Der Unterschied ist kein
     Versehen: der Einlass wird in jedem Schritt neu gesetzt, eine Wand mitten im Gitter
     nicht. Der neue Wind wandert über einige hundert Schritte durch den Kanal — Etappe 3.1
     („Regler wirken sofort") ist damit ohne Rücksetzen erreichbar.
  4. *Abweichung von den Voreinstellungen im Prüfskript:* Teil 8 rechnet 2000 Schritte in
     jeder der drei Stufen, weil das Abnahmekriterium es verlangt. Die Laufzeit des
     Prüfskripts steigt dadurch von etwa 22 auf etwa 60 Sekunden. Das ist der Preis dafür,
     dass die feine Stufe viermal so viele Zellen rechnet wie die grobe; abgekürzt würde
     genau das nicht geprüft, worum es in der Etappe geht.
  5. *Nebenbefund:* Die Rechenleistung liegt in allen drei Stufen bei etwa 6,5 Millionen
     Zellen je Sekunde — die Rechenzeit wächst also mit der Zellenzahl und nicht schneller.
     Die feine Stufe schafft auf dem Prüfrechner rund 130 Schritte je Sekunde, also gut
     zwei Rechenschritte je Bild bei 60 Bildern. Auf dem Handy wird das deutlich weniger
     sein — genau dafür sieht Etappe 3.2 die geräteabhängige Voreinstellung vor.
- **2026-07-31:** Etappe 2.1 umgesetzt — erstes Bild auf dem Bildschirm. Drei neue Dateien
  (`index.html`, `src/ui/darstellung.js`, `src/ui/start.js`), am Kern keine Zeile geändert.
  Dabei festgelegt und nachgetragen (siehe „Bild auf dem Bildschirm" und „Takt der
  Bildschleife" unter *Architektur*):
  1. *Nur eine Darstellungsart, und zwar die Geschwindigkeit.* Die Etappe verlangt „ein
     Farbfeld", nicht alle vier; Druck, Wirbelstärke und Teilchen kommen in 3.3. Die
     Geschwindigkeit ist die Größe, die ohne Erklärung verständlich ist.
  2. *Einfarbige Skala hell → dunkel statt Regenbogen.* Begründung oben. Die dreizehn
     Blaustufen stammen aus einer geprüften sequenziellen Skala; zwischen ihnen wird
     geradlinig gemischt und das Ergebnis einmalig in 256 fertige Farben zerlegt, damit je
     Bildpunkt nur nachgeschlagen und nicht gerechnet wird.
  3. *Feste Skalenobergrenze statt selbsttätiger Anpassung.* Ohne diese Festlegung
     flackert das Bild; sie musste getroffen werden, weil beides üblich ist.
  4. *Zeitbudget je Bild statt fester Schrittzahl.* Begründung oben. Damit ist
     „ruckelfrei" aus dem Abnahmekriterium auch auf schwachen Geräten erreichbar — der
     Preis ist, dass die Strömung dort langsamer abläuft.
  5. *Feste Szene:* Kreis, Durchmesser 16, bei x = 40 auf halber Höhe in grober Auflösung
     — dieselbe Anordnung, an der Etappe 1.4 die Wirbelablösung in Zahlen nachgemessen
     hat. So zeigt der Bildschirm dasselbe, was das Prüfskript gemessen hat.
  6. *Ungefragt hinzugekommen: eine Laufanzeige* unter dem Bild (Bilder je Sekunde,
     Rechenschritte je Bild, gerechnete Schritte). Grund: Das Abnahmekriterium lautet
     „bewegt sich ruckelfrei", und ohne diese Zeile hat der Nutzer kein Mittel, das zu
     beurteilen. Sie kann später wieder verschwinden.
  7. *Gemessen, nicht geschätzt:* Zeichnen 0,21 ms, Felder auslesen 1,62 ms, ein
     Rechenschritt 1,02 ms je Bild in grober Auflösung. Bei 12 ms Budget sind das rund elf
     Rechenschritte und insgesamt knapp 14 ms je Bild — die 16,7 ms für 60 Bilder je
     Sekunde bleiben eingehalten.
  8. *Nebenbefund:* Die Wirbelstraße hinter dem Kreis baut sich erst über etwa 3000
     Rechenschritte auf — auf dem Bildschirm also etwa fünf Sekunden nach dem Laden. Davor
     ist das Nachlaufbild noch spiegelbildlich. Das ist echte Strömung, kein Anlaufen des
     Programms.
  9. *Bewusst noch nicht dabei:* keine Legende zur Farbskala (Etappe 4.1), kein
     Dunkelmodus und keine Anpassung an Hoch- und Querformat (4.2), keine Reaktion auf
     Fenstergrößen und Tabwechsel (3.4), keine Bedienelemente (2.2).
- **2026-07-31:** Etappe 2.1 abgenommen (`v0.7`). Zwei Beobachtungen des Nutzers dabei
  aufgenommen, beide **ohne Änderung am Programm**:
  1. *Farbschemata zur Auswahl* — als „Kann" zurückgestellt. Bisher sah der Plan mit
     Etappe 4.1 genau **eine** stimmige Skala je Darstellungsart vor; eine Auswahl geht
     darüber hinaus und braucht eine eigene Etappe. Einordnung: Erweiterung im
     bestehenden Rahmen, kein anderer Zweck — sie kann jederzeit als Etappe 4.4 in den
     Plan rücken, sobald der Nutzer das entscheidet.
  2. *Der Kreis wirkt eckig.* Nachgeprüft, nicht geschätzt: siehe „Der Körper im Bild ist
     eckig" unter *Architektur*. Es sind zwei Ursachen, nicht eine — die Treppe des
     Gitters und zusätzlich vier einzelne vorstehende Zellen aus der Vergleichsrichtung
     `<=` in `liegtInForm`. Die zweite verschwindet auch in feinerer Auflösung nicht. Das
     war keine bekannte Erscheinung, sondern fiel erst am Bild auf; die Kernlogik ist
     davon unberührt und bleibt es vorerst.
  3. *Für die Abnahme veröffentlicht:* Weil die Session in der Cloud lief, war
     `localhost` für den Nutzer nicht erreichbar. Die Abnahme erfolgte über eine
     zusammengelegte Einzeldatei-Vorschau derselben fünf Quelldateien (`import`-Zeilen
     entfernt, sonst Zeile für Zeile unverändert, mit Gegenprobe auf doppelte Namen).
     Sie liegt außerhalb des Repos und ist kein Build-Schritt — die Zusage „bloße
     Dateisammlung" bleibt unberührt. Was sie **nicht** belegt: dass die echte
     Modulaufteilung im Browser lädt und dass der GitHub-Pages-Link trägt. Beides ist
     Abnahmekriterium von Etappe 2.3.
