v0.5
Geschwindigkeit, Druck und Wirbelstärke sind aus dem Gitter ablesbar — die
Wirbelablösung hinter dem Kreis erscheint als Zahl.

Etappe 1.4 (abgenommen):
- Aus der Rechnung lassen sich jetzt die drei Größen ablesen, die später die
  drei Farbfelder auf dem Bildschirm ergeben: wie schnell und wohin die Luft
  strömt, wie hoch der Druck ist und wie stark sie sich dreht
- Der Druck wird als Unterschied zum Ruhezustand angegeben: positiv heißt Stau
  (vor dem Körper), negativ heißt Sog (dahinter)
- Die Wirbelstärke macht sichtbar, was man sonst nur ahnt. Ein umströmter Kreis
  wirft abwechselnd links- und rechtsdrehende Wirbel ab, immer im selben Takt —
  hier alle 637 Schritte eine volle Runde. Dieselbe Erscheinung lässt eine
  Fahnenstange im Wind singen
- Prüfbar über `node werkzeug/pruefe-kern.js`: sieben Teile, 40 Prüfpunkte,
  etwa 22 Sekunden. Der neue Teil 7 zeigt das Druck- und das Wirbelstärkebild
  als Textbild und schreibt die Wirbelstärke hinter dem Kreis über 2600
  Schritte mit; sie kehrt sich alle 318 Schritte im Vorzeichen um, mit einer
  Schwankung von 8 Prozent

Unterwegs festgelegt:
- Druck als Unterschied zum Ruhedruck statt absolut. Absolut schwankt der Wert
  nur in der dritten Nachkommastelle und wäre als Farbskala nicht lesbar
- An der Haftwand zählt die Wand für die Wirbelstärke als stehende Luft — genau
  diese Scherung soll sie ja messen. An der reibungsfreien Decke wird sie
  dagegen mitgezogen, sonst sähe die Decke im Bild aus wie ein zweiter Boden
- Zwei Wege zum Ablesen: eine einzelne Zelle abfragen oder das ganze Gitter auf
  einmal in Felder schreiben, die sich wiederverwenden lassen. Der zweite Weg
  ist für die spätere Darstellung gedacht, die sechzigmal je Sekunde alles
  braucht
- Teil 7 rechnet 6600 statt der sonst üblichen 2000 Schritte, davon die ersten
  4000 zum Einschwingen. Die Wirbelablösung setzt nicht sofort ein: die
  Strömung hinter dem Kreis ist zunächst spiegelbildlich und kippt erst nach
  und nach ins Schwingen

Bekannte, gewollte Erscheinung: Im Druckbild erscheint fast der ganze Kanal als
leichter Überdruck. Das ist richtig so — der Auslass hält den Druck hinten fest,
die Reibung erzeugt ein Gefälle nach vorn. Stau und Sog am Körper heben sich
davon ab, liegen aber auf dieser schiefen Ebene.

Noch keine Bildschirmausgabe. Als Nächstes Etappe 1.5: Auflösung und
Windgeschwindigkeit als einstellbare Größen, in allen Stufen stabil.
