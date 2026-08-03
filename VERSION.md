v1.4
Nähert sich die Strömung der Grenze des Rechenbaren, dämpft die Seite nach und
sagt es — statt es auf den Zusammenbruch ankommen zu lassen. Damit ist
Abschnitt 3 abgearbeitet.

Etappe 3.6 — Nachdämpfung an der Grenze des Rechenbaren:
- Wird die Luft irgendwo im Kanal zu schnell, macht die Seite sie vorübergehend
  zäher. Gleitend, je näher an der Grenze desto mehr; wird es wieder ruhig, hört
  es von selbst auf
- Angesagt wird es als das Wort „Gedämpft" vorn in der Laufanzeige. Es steht
  dort, wenn in der letzten halben Sekunde irgendein Bild gedämpft war. Was es
  bedeutet, erklärt ein fester Satz bei den Einstellungen — das Bild ist in
  dieser Zeit etwas glatter als die Wirklichkeit, und das zu verschweigen wäre
  eine Täuschung
- Die Ecke, die seit Etappe 3.4 als „zerfällt weiterhin" vermerkt war, hält
  jetzt durch: im Browser 8144 Schritte statt 2584, ohne die Meldung aus 3.4
- Im Alltag springt nichts an. Gewöhnliche Szenen bleiben bei 31 bis 42 % der
  Gitter-Schallgeschwindigkeit, die Schwelle liegt bei 55 %

Gemessen, bevor gebaut wurde — alle vier Fragen, die SPEC.md verlangt hat:
- Zu wenig Dämpfung verschiebt den Zusammenbruch nur, statt ihn zu verhindern:
  Zähigkeit 0,015 brachte ihn von Schritt 2584 auf 11056, 0,02 auf 8840. Erst
  das Dreifache hielt über die ganze gemessene Strecke
- Die Schwelle trennt sauber: gewöhnliche Szenen 31 bis 42 %, die härteste noch
  tragfähige 54 %, der Zerfall setzt bei 58 % ein und ist 30 Schritte später da
- Der Preis am Bild ist klein, selbst bei dauerhaft voller Dämpfung: mittleres
  Tempo im Kanal −1 bis −4,5 %, schnellste Stelle −6 bis −15 %, Wirbelstraße in
  unveränderter Stärke
- Die Suche nach der schnellsten Stelle kostet 0,05 ms und läuft deshalb in
  jedem Bild — zwanzigmal billiger als die Zerfallsprüfung aus 3.4
- Die Prüfung der Kernlogik hat einen zehnten Teil bekommen: 57 Prüfpunkte statt
  51, Laufzeit 62 statt 45 Sekunden

Bekannte Grenzen dieses Standes:
- Den Wind mitten im Lauf stark zurückzunehmen kann die Rechnung in derselben
  kritischen Ecke zerstören — auch ohne Nachdämpfung, sie verzögert es nur. Am
  leeren Kanal und an gewöhnlichen Szenen ist derselbe Windwechsel harmlos.
  Als Etappe 3.7 beschrieben und bewusst zurückgestellt; aufgefangen wird der
  Fall weiterhin vom Netz aus 3.4
- „Hält" heißt weiterhin nur „hat diese Strecke gehalten". Für keine
  Reglerstellung ist bewiesen, dass sie beliebig lange trägt
- Keine Legende zu den drei Farbskalen (Etappe 4.1)
- Bei 320 Punkten Breite reicht es nicht ohne Scrollen; bei 375 bricht die
  Ansichtsreihe auf zwei Zeilen um
- Im Querformat muss man weiterhin scrollen (Etappe 4.2)
- Das Druckbild pulsiert im Takt der Wirbelablösung (untersucht, echte
  Erscheinung, siehe v1.2)

Als Nächstes Abschnitt 4: Farbskalen mit Legende und ein glatter Umriss des
Körpers (Etappe 4.1).
