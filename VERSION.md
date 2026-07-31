v0.6
Auflösung und Windgeschwindigkeit sind einstellbare Größen — die Rechnung bleibt
in allen drei Stufen stabil. Abschnitt 1 ist damit abgeschlossen.

Etappe 1.5 (abgenommen):
- Der Kanal wird jetzt über eine von drei Auflösungsstufen angelegt statt über
  eine frei getippte Zellenzahl: grob (200 × 60), mittel (280 × 84) und fein
  (400 × 120 Zellen)
- Alle drei haben dasselbe Seitenverhältnis. Dieselbe Szene sieht deshalb in
  jeder Stufe gleich aus — nur schärfer. Die höchste Geschwindigkeit weicht
  zwischen den Stufen nur um 3 Prozent ab
- Die Windgeschwindigkeit hat einen geprüften Bereich von 0,01 bis 0,12 und
  lässt sich mitten im Lauf ändern, ohne dass die Rechnung neu beginnt. Der
  neue Wind wandert dann von vorn durch den Kanal, wie wenn man am Gebläse
  dreht. Beim Hindernis geht das weiterhin nicht — eine Wand mitten im Gitter
  einzublenden wäre ein Sprung, den die Strömung nicht verkraftet
- Einstellungen außerhalb des geprüften Bereichs werden gemeldet statt
  stillschweigend gerechnet
- Prüfbar über `node werkzeug/pruefe-kern.js`: acht Teile, 47 Prüfpunkte, etwa
  60 Sekunden. Der neue Teil 8 rechnet alle drei Stufen je 2000 Schritte durch
  und meldet die Rechenzeit je Schritt

Unterwegs festgelegt:
- Die Grenze der Windgeschwindigkeit ist gemessen, nicht geschätzt. Der leere
  Kanal hält Wind bis etwa 0,25 aus, mit einem Hindernis darin bricht die
  Rechnung schon zwischen 0,15 und 0,16 zusammen: an der Körperkante wird die
  Luft auf gut das Doppelte beschleunigt und kommt dort der
  Schallgeschwindigkeit des Rechengitters zu nahe. 0,12 lässt Abstand,
  nachgeprüft mit der schärfsten Form — einer angestellten Platte — in jeder
  Stufe
- Ebenso bei der Zähigkeit: bei 0,002 bricht die Rechnung zusammen, ab 0,004
  läuft sie. Erlaubt ist sie deshalb ab 0,005
- Die Untergrenze des Windes ist dagegen keine Frage der Rechnung, sondern der
  Anschauung: darunter steht das Bild praktisch still
- Die grobe Stufe entspricht genau der bisherigen Voreinstellung. Die Etappen
  1.1 bis 1.4 rechnen daher unverändert weiter — der Wirbeltakt hinter dem
  Kreis steht weiterhin bei 637 Schritten

Bekannte Grenzen dieses Standes:
- Dass die feine Stufe schärfere Wirbel zeigt, ist nicht geprüft — nur, dass
  alle drei dieselbe Strömung zeigen und stabil bleiben. Die Schärfe braucht
  ein Bild und kommt in Etappe 3.2
- Die Rechenzeiten gelten für den Prüfrechner: dort schafft die feine Stufe
  rund 130 Schritte je Sekunde. Auf dem Handy wird das deutlich weniger sein,
  genau dafür sieht Etappe 3.2 eine geräteabhängige Voreinstellung vor
- Die Windgrenze ist an Kreis, Rechteck und angestellter Platte geprüft, nicht
  an jeder denkbaren Kombination

Noch keine Bildschirmausgabe. Als Nächstes Etappe 2.1: die Seite zeigt die
laufende Strömung um einen fest eingebauten Kreis als Farbfeld.
