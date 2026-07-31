v0.9
Die Seite ist öffentlich erreichbar und läuft auf iPhone und iPad.
Damit ist Abschnitt 2 abgeschlossen.

Etappe 2.3 (abgenommen):
- Unter <https://silberfisch24-cpu.github.io/Windkanal/> ist die Seite ohne
  Installation zu öffnen — auf dem Rechner, auf dem iPhone und auf dem iPad
- Die Schaltflächen sind mit dem Finger bedienbar: Form wechseln, anhalten,
  weiterlaufen lassen und zurücksetzen gehen alle am Telefon
- `.nojekyll` in der Wurzel: GitHub liefert die Dateien unverändert aus, ohne
  einen Umbauschritt dazwischen. Am heutigen Bestand ändert das nichts — es
  nimmt den Schritt heraus, bevor er später an einer neuen Datei scheitern oder
  sie stillschweigend weglassen kann
- Die Hervorhebung beim Überfahren einer Schaltfläche gilt nur noch für Maus und
  Trackpad. Auf dem Touchscreen blieb sie nach dem Antippen hängen und sah aus,
  als wäre die Schaltfläche gewählt
- An `src/` keine Zeile geändert; `pruefe-kern.js` läuft unverändert durch

Unterwegs festgelegt:
- Handybreiten lassen sich im kopflosen Browser **nicht** über `--window-size`
  prüfen: Chrome erzwingt eine Mindestfensterbreite von 500 Punkten und
  beschneidet das Bild bloß auf den verlangten Wert. Die Seite sieht dann aus,
  als liefe sie über den Rand, obwohl sie es nicht tut. Gemessen wird stattdessen
  in einem Rahmen fester Breite
- Nachgemessen bei 393 (iPhone hochkant), 852 (iPhone quer) und 820 Punkten
  (iPad): nichts läuft seitlich über, alle sechs Schaltflächen sind mindestens
  44 Punkte groß
- Ein Branch lässt sich vor dem Merge auf dem Handy prüfen, indem die Dateien
  über einen fremden Ausliefer-Dienst von einem festen Commit geholt werden.
  Nötig, weil die Artifact-Vorschau alle Module zu einer Datei zusammenlegt und
  damit gerade das Laden der echten Dateiaufteilung nicht zeigt

Bekannte Grenzen dieses Standes:
- Im Querformat des iPhones muss man scrollen, um das Strömungsbild ganz und die
  Laufanzeige darunter zu sehen. Abgeschnitten ist nichts; das Sitzen im Hoch-
  und Querformat ist Abnahmekriterium von Etappe 4.2
- Die Maße der Formen sind weiterhin fest eingebaut. Größe, Anstellwinkel, Höhe
  über dem Boden und Windgeschwindigkeit werden erst in Etappe 3.1 einstellbar
- Nur eine der vier Darstellungsarten, weiterhin ohne Legende (Etappen 3.3
  und 4.1). Kein Dunkelmodus, keine Reaktion auf Fenstergrößen oder Tabwechsel
  (Etappen 3.4 und 4.2)
- Wie flüssig die Rechnung auf dem iPhone läuft, ist nicht gemessen. Der Regler
  für die Auflösung kommt in Etappe 3.2

Als Nächstes Etappe 3.1: Windgeschwindigkeit, Hindernisgröße, Anstellwinkel und
Höhe über dem Boden über Regler einstellbar machen.
