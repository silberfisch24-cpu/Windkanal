v1.1
Die Rechenauflösung liegt auf einem Regler, und die Seite sucht sich beim Laden
selbst die Stufe, die zum Gerät passt.

Etappe 3.2:
- Ein fünfter Regler stellt die Rechenauflösung ein: grob 200 × 60, mittel
  280 × 84, fein 400 × 120 Zellen. Neben dem Regler steht, welche Stufe gilt und
  wie viele Zellen sie rechnet
- Die feinere Stufe zeigt schärfere Wirbel und braucht dafür mehr Rechenzeit je
  Bild. Die Bildfolge bleibt gleichmäßig — was langsamer wird, ist der
  Fortschritt der Strömung
- Womit die Seite aufgeht, richtet sich nach dem Gerät. Zwei Fragen begrenzen es,
  und die gröbere Antwort gilt: Wie breit wird das Bild überhaupt angezeigt
  (mehr Rechenzellen als Bildpunkte bringen nichts Sichtbares), und wie schnell
  rechnet das Gerät (gemessen beim Laden, nicht aus dem Gerätetyp erraten)
- Auf dem Handy wird dadurch gröber voreingestellt als auf dem Rechner. Von Hand
  bleibt überall jede Stufe wählbar
- Die Reglerstellungen behalten beim Stufenwechsel ihre Bedeutung: „Größe 100 %,
  20°, 21 Zellen frei" ist in jeder Stufe dieselbe Szene, nur feiner gerechnet.
  Die Oberfläche rechnet in groben Zellen und rechnet erst beim Bau der Form hoch
- Ein Stufenwechsel setzt die Strömung neu an, wie Größe, Anstellwinkel und Höhe
  auch — ein Rechengitter lässt sich nicht mitten im Lauf austauschen

Unterwegs gemessen:
- Die Reglergrenzen aus Etappe 3.1 tragen unverändert in allen drei Stufen: alle
  vier Formen bei Größe 115 %, 30° Anstellung, aufsitzend, Wind 100 %, je 3000
  Schritte in jeder Stufe — kein einziger ungültiger Wert. Sie mussten also nicht
  je Stufe verengt werden
- Ein Schritt kostet auf dem Prüfrechner 1,8 ms in grob, 3,5 ms in mittel und
  7,3 ms in fein; bei 12 ms Zeitbudget je Bild sind das rund 6, 3 und 1,6
  Rechenschritte. Voreingestellt wird nur, was mindestens vier schafft
- Eine einzelne Zeitmessung schwankte um das 2,4-fache und ließ die Voreinstellung
  zufällig zwischen zwei Stufen kippen. Gemessen wird deshalb in vier Blöcken, von
  denen der schnellste zählt — ein Ausreißer nach unten ist unmöglich, einer nach
  oben häufig

Aufgeräumt:
- Das Umrechnen einer Form auf eine feinere Stufe steht jetzt als `skaliereForm`
  im Kern statt doppelt im Prüfskript. Etappe 1.5 hatte das bis zum zweiten Bedarf
  offengelassen

Bekannte Grenzen dieses Standes:
- Nur eine der vier Darstellungsarten, weiterhin ohne Legende (Etappen 3.3
  und 4.1)
- Sehr weit aufgedrehte Einstellungen sind ausgeschlossen statt aufgefangen. Ein
  Auffangnetz für zerfallende Rechnungen ist Etappe 3.4
- Im Querformat muss man weiterhin scrollen (Etappe 4.2)
- Die Obergrenze des Höhenreglers unterscheidet sich zwischen den Stufen um eine
  Zelle — die Rundung der skalierten Maße

Als Nächstes Etappe 3.3: zwischen den vier Darstellungsarten umschalten und die
mitströmenden Teilchen zuschalten.
