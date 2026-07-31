v0.8
Die Seite ist bedienbar: Form wählen, anhalten, zurücksetzen — ohne Neuladen.

Etappe 2.2 (abgenommen):
- Über dem Bild steht eine Leiste. Unter **Form** stehen Kreis, Rechteck,
  Platte und Profil zur Wahl; ein Klick wechselt den Körper im Kanal, die
  Seite muss dafür nicht neu geladen werden
- Unter **Ablauf** hält eine Schaltfläche die Strömung an und lässt sie
  weiterlaufen, eine zweite setzt sie auf den Anfangszustand zurück
- Form wechseln und Zurücksetzen gehen auch im angehaltenen Zustand; das Bild
  zeigt dann sofort den neuen Zustand, bleibt aber stehen
- Der Text über dem Bild und die Bildbeschreibung nennen die gewählte Form
- Eine neue Datei in der Oberfläche (`src/ui/bedienung.js`); an der Kernlogik
  ist keine Zeile geändert, `pruefe-kern.js` läuft unverändert durch

Unterwegs festgelegt:
- Starten und Anhalten teilen sich **eine** Schaltfläche, beschriftet mit dem,
  was sie als Nächstes tut („Anhalten" / „Weiter"). Zwei getrennte wären immer
  zur Hälfte wirkungslos, und eine Beschriftung mit dem Zustand („Angehalten")
  ließe offen, ob sie ihn meldet oder ihn herstellt
- Angehalten wird die Bildschleife wirklich abgestellt, statt sie leer
  weiterlaufen zu lassen — das ist auf dem Handy der Unterschied beim
  Stromverbrauch
- Die vier Formschaltflächen entstehen aus einer Liste im Programm, nicht aus
  `index.html`. Sonst stünden die Formen an zwei Stellen und eine fünfte
  später nur an einer davon
- Platte und Profil haben dieselbe Länge (30 Zellen) und denselben
  Anstellwinkel (10°), damit sich allein die Form unterscheidet — genau darauf
  zielt das Erfolgskriterium des Projekts
- Die angefangene Messung „Bilder je Sekunde" wird nach jedem Anhalten und
  jedem Formwechsel verworfen, sonst mittelt sie über die Pause hinweg und
  meldet eine Bildfolge, die es nie gab

Bekannte Grenzen dieses Standes:
- Der Unterschied zwischen Platte und Profil ist bei der Voreinstellung noch
  schwach: gemessen ist das Totwasser hinter der Platte etwa ein Drittel
  breiter als hinter dem Profil (13 gegen 10 Zellen). Deutlich wird er erst,
  wenn sich der Anstellwinkel in Etappe 3.1 aufdrehen lässt
- Jeder Formwechsel setzt die Rechnung zurück — das verlangt das
  Rechenverfahren. Wer schnell hin- und herklickt, sieht beide Formen nur im
  Anfangszustand und muss jedes Mal einige Sekunden auf die Wirbel warten
- Die Maße der Formen sind fest eingebaut. Größe, Anstellwinkel, Höhe über dem
  Boden und Windgeschwindigkeit werden erst in Etappe 3.1 einstellbar
- Nur eine der vier Darstellungsarten, weiterhin ohne Legende (Etappen 3.3
  und 4.1). Kein Dunkelmodus, keine Anpassung an Hoch- und Querformat, keine
  Reaktion auf Fenstergrößen oder Tabwechsel (Etappen 3.4 und 4.2)
- Auf iPhone und iPad ungeprüft — ob die Schaltflächen dort mit dem Finger gut
  zu treffen sind und ob 60 Bilder je Sekunde gehalten werden, zeigt erst
  Etappe 2.3

Als Nächstes Etappe 2.3: die Seite unter dem GitHub-Pages-Link öffentlich
erreichbar machen und auf iPhone und iPad prüfen.
