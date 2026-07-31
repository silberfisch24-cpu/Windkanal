v0.4
Alle vier Formen stehen bereit — anstellbar und in der Höhe verstellbar, noch ohne Bild.

Etappe 1.3 (abgenommen):
- Neben Kreis und Rechteck gibt es jetzt die stumpfe Platte und das
  Tragflächenprofil. Das Profil ist vorn rund und läuft hinten spitz aus, die
  Platte ist vorn und hinten abgeschnitten
- Jede Form lässt sich anstellen: ein positiver Winkel hebt die Anströmkante,
  so wie ein Flugzeug im Steigflug die Nase hebt. Beim Kreis bleibt der Winkel
  wirkungslos — das wird eigens nachgemessen
- Die Höhe über dem Boden ist wahlweise als Mittelpunkt oder als Bodenabstand
  anzugeben. Bodenabstand 0 heißt: die Form sitzt auf dem Boden auf und wird
  nicht unterströmt; angehoben strömt die Luft durch den Spalt, dort sogar
  schneller als der Wind (165 %)
- Prüfbar über `node werkzeug/pruefe-kern.js`: sechs Teile — die drei bisherigen,
  dazu alle vier Formen als Textbild (waagerecht und angestellt), Platte und
  Profil in der Strömung sowie die Gegenprobe zur Bodenfreiheit; 35 Prüfpunkte
  insgesamt

Unterwegs festgelegt:
- Platte und Profil bekommen dieselbe voreingestellte Dicke, 12 % der Länge.
  Grund: Beim späteren Vergleich der beiden soll sich allein die Form
  unterscheiden, nicht die Größe
- Das Profil folgt der üblichen NACA-Formel für symmetrische Vierziffern-Profile:
  vorn rund, dickste Stelle bei knapp einem Drittel der Länge, hinten spitz
- Gedreht wird nicht die Form, sondern der abgefragte Punkt entgegengesetzt.
  Dadurch bleibt jede Form in ihrem eigenen Koordinatensystem einfach
  beschreibbar, und der Anstellwinkel steht an einer einzigen Stelle im Code
- Ein Hindernis, das bis an die Decke reicht, wird jetzt abgewiesen statt
  abgeschnitten. Bisher waren nur Einlass und Auslass geschützt; mit
  einstellbarer Höhe ist das Überschreiten nach oben der naheliegende Fehlgriff.
  Am Boden bleibt das Aufsitzen ausdrücklich gewollt

Erster Hinweis auf das Erfolgskriterium des Projekts: Hinter der stumpfen Platte
strömt die Luft mit 52 % der Windgeschwindigkeit rückwärts, hinter dem Profil bei
gleicher Länge, Dicke und Anstellung nur mit 29 %. Das ist bisher eine
Beobachtung, kein Prüffall — als solcher kommt es in Etappe 5.2.

Bekannte Grenze: Bei weniger als etwa drei Zellen Dicke kann eine gedrehte Form
zu einer Treppe aus einzeln stehenden Zellen zerfallen, durch die die Luft
diagonal hindurchschlüpft. Die voreingestellte Mindestdicke liegt deshalb bei
drei Zellen; wer von Hand weniger angibt, bekommt keine Warnung.

Noch keine Bildschirmausgabe. Als Nächstes Etappe 1.4: Geschwindigkeit, Druck und
Wirbelstärke aus dem Rechengitter ablesen.
