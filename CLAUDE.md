# Windkanal

Verbindliche Spezifikation: `SPEC.md`. Bei inhaltlichen Fragen zu Umfang, Zielen oder
getroffenen Entscheidungen dort nachlesen, statt anzunehmen.

## Befehle

- Starten: `python3 -m http.server 8000`, dann <http://localhost:8000> im Browser öffnen
  (nötig, weil ES-Module aus einer lokalen Datei heraus vom Browser blockiert werden)
- Kernlogik prüfen (Abschnitt 1, ohne Oberfläche): `node werkzeug/pruefe-kern.js` —
  **allein laufen lassen.** Ein Teil misst die Rechenzeit je Auflösungsstufe und schlägt
  fehl, wenn nebenher etwas anderes rechnet (am 2026-08-01 passiert, weil parallel ein
  kopfloser Browser lief). Ein Fehlschlag genau dieses Punktes ist deshalb erst ein
  Befund, wenn der Lauf ohne Nebenlast wiederholt wurde.
- Vorschau für die Abnahme bauen: `node werkzeug/baue-vorschau.js <ziel.html>` — legt die
  Seite zu einer einzigen Datei zusammen, damit sie sich als Artifact veröffentlichen
  lässt. Nur für Cloud-Sessions nötig, siehe dort. **Kein Build-Schritt:** Das Ergebnis
  muss außerhalb des Repos liegen (das Skript weigert sich sonst) und wird nie eingecheckt.
- Tests: `node --test tests/`
- Linting: keins — bewusst, siehe Abhängigkeiten in `SPEC.md`
- Build: keiner — die Dateien werden unverändert ausgeliefert

## Struktur

- Kernlogik: `src/kern/` — reine Zahlenrechnung, kein Zugriff auf `document`, `window`, `canvas`
- Oberfläche: `src/ui/` — alles Bildschirmbezogene; ruft den Kern auf, nie umgekehrt
- Einstiegspunkt: `index.html`
- Prüfskripte für die Kommandozeile: `werkzeug/` — dort dürfen **Maße und Rechenzeiten**
  von den Voreinstellungen abweichen, wenn es allein der Erkennbarkeit dient: im groben
  Textbild (Etappe 1.2: kürzerer Kanal, Etappe 1.3: dickere Platte und dickeres Profil)
  oder weil eine Erscheinung Zeit braucht, bis sie sich zeigt (Etappe 1.4: 6600 statt
  2000 Schritte, damit die Wirbelablösung eingeschwungen ist). Die Abweichung gehört mit
  Begründung in den Änderungsverlauf von `SPEC.md`, sonst liest sie sich später wie eine
  stille Änderung der Voreinstellungen. Dort liegt auch `baue-vorschau.js`, das nichts
  prüft, sondern die Seite für die Abnahme zusammenlegt.
- Tests: `tests/`
- Versionsstand: `VERSION.md` — daraus setzt `.github/workflows/tag.yml` den Tag

## Grenzen

- Die Trennung Kern / Oberfläche wird nicht aufgeweicht: kein Browser-Zugriff in `src/kern/`.
- Keine Laufzeit-Abhängigkeiten und kein Build-Schritt ohne Rückfrage — die Seite muss
  weiterhin als bloße Dateisammlung über GitHub Pages laufen. Der einzige
  Actions-Workflow ist `tag.yml`; er vergibt nur die Versionsnummer und baut nichts.
  Ein zweiter Workflow kommt nicht ohne Rückfrage dazu.
- Kein Wechsel des Rechenverfahrens (Lattice-Boltzmann) ohne neue Begründung in `SPEC.md`.
- Nichts wird gespeichert oder nach außen gesendet.
- Der CDU-Styleguide des Schwesterprojekts *Steuerrechner* gilt hier bewusst nicht — siehe
  „Aussehen" in `SPEC.md`.

---

# Arbeitsweise — gilt in jeder Session

Der Nutzer hat wenig Programmiererfahrung und hält Verfahren nicht selbst nach.
**Du führst das Verfahren, er trifft nur Entscheidungen.** Frage nie, ob ein
Verfahrensschritt gemacht werden soll — mache ihn und zeige das Ergebnis.

## Sessionbeginn — ungefragt, unabhängig davon wie der Nutzer einsteigt

1. Lies den Abschnitt "Kern" in `SPEC.md` (nur diesen, nicht die ganze Datei).
2. Nenne in zwei Sätzen: wo das Projekt steht und welche Etappe als Nächstes ansteht.
3. Warte auf Bestätigung oder Korrektur, bevor du etwas änderst.

## Vor jeder Änderung

Kurzer Plan zuerst, dann umsetzen. Eine Änderung zur Zeit — nicht mehrere Dinge
gleichzeitig, sonst ist die Ursache eines Problems später nicht zuzuordnen.

Läuft es erkennbar in die falsche Richtung: sofort stoppen und neu ansetzen, nicht
zu Ende führen.

## Abnahme — harte Sperre

**Nichts gilt als fertig, bevor der Nutzer es ausdrücklich bestätigt hat.**
Seine eigene Prüfung ist nicht ersetzbar; deine Einschätzung zählt hier nicht.

Lege ihm nach jeder Etappe ungefragt vor:

1. Das Abnahmekriterium und wie er es selbst durchspielen kann
2. Was sich geändert hat, in einfachen Worten
3. Was du geändert hast, worum er nicht gebeten hat
4. Was daran kaputtgehen oder übersehen worden sein könnte

Frage nie "ist das gut so?" — solche Fragen bekommen Zustimmung statt Prüfung.

Ohne ausdrückliche Bestätigung: keinen Tag setzen, nicht zur nächsten Etappe übergehen.

## Sessionabschluss — ungefragt, bevor die Session endet

1. Entscheidungen und geänderte Annahmen in `SPEC.md` nachtragen
2. Stand in Etappenliste und Kern-Abschnitt aktualisieren
3. Zwei-Mal-Regel prüfen: Wurde etwas zum zweiten Mal erklärt? Dann hier oder in
   einen Skill aufnehmen und dem Nutzer sagen, was du aufgenommen hast.
4. Commit setzen; bei bestätigter Etappe zusätzlich den Tag

Was nur im Gesprächsverlauf steht, ist nach der Session verloren. Nachtragen ist
kein Abschlussritual, sondern Voraussetzung.

## Commits und Tags

Commit nach jeder bestätigten Änderung, auch bei reinen Fehlerkorrekturen.
Tag nur bei bestätigter Etappe.

Versionsnummern nach Nutzbarkeitsgrad, nicht nach Projektstruktur:
- `0.x` — noch nicht durchgängig nutzbar
- `x.0` — neue durchgängig nutzbare Stufe erreicht
- `x.y` — bestätigte Etappe innerhalb dieser Stufe
- Fehlerkorrektur ohne Änderung an Funktion oder Darstellung: nur Commit, kein Tag —
  `VERSION.md` bleibt dann unberührt, sonst entsteht ungewollt ein Tag

Vergebene Tags werden nie umnummeriert oder umbenannt.

Commit-Nachricht **im Klartext**, fachlich statt technisch — der Nutzer muss die
Historie überfliegen können, ohne den Änderungssatz zu öffnen:

```
Günstigerprüfung ergänzt (Etappe 3.2)

- Beide Berechnungswege werden verglichen, das günstigere Ergebnis wird übernommen
- Betrifft nur Fälle mit Kapitaleinkünften
- Grund: Die Einzelberechnung lieferte bei niedrigen Einkommen zu hohe Werte
```

Erste Zeile: was sich geändert hat, plus Etappennummer. Stichpunkte: was das
Programm jetzt anders macht. Begründung nur, wo sie nicht auf der Hand liegt.

**In Cloud-Sessions** (claude.ai/code) läuft die Arbeit über einen Branch statt über
direkte Commits auf den Hauptzweig. Dann gilt:

- Ein Branch je Etappe, nicht je Session
- Die Abnahme durch den Nutzer bleibt Voraussetzung — erst danach zum Pull Request
- **Tags kann eine Cloud-Session grundsätzlich nicht selbst setzen — auch nicht mit
  Zugriff auf den Hauptzweig.** Die Umgebung sperrt jedes Anlegen von Tags: `git push`
  von `refs/tags/*` und die GitHub-API-Pfade `/git/tags` und `/git/refs` antworten mit
  403. Eine neue Session mit anderen Rechten hilft deshalb nicht. Am 2026-07-30
  geprüft. Gewöhnliche Branch-Pushes und auch das Pushen von `.github/workflows/`
  gehen durch — darauf beruht der Weg unten.
- **Deshalb entsteht der Tag über `VERSION.md`.** Bei einer bestätigten Etappe
  schreibst du diese Datei neu: erste Zeile die Versionsnummer in der Form `v0.1`,
  darunter die Stichpunkte im Klartext. Beim Merge nach `main` legt
  `.github/workflows/tag.yml` daraus den annotierten Tag an. Existiert die Nummer
  schon, passiert nichts — überschrieben wird nie.
- `VERSION.md` gehört in denselben Pull Request wie die Etappe, nicht in einen
  eigenen. Vergisst du sie, läuft der Workflow nicht an und der Tag fehlt
  stillschweigend — deshalb bei jeder bestätigten Etappe mit vorlegen.
- Schlägt der Workflow fehl, ist die wahrscheinlichste Ursache die Einstellung
  *Settings → Actions → General → **Workflow permissions***; sie muss auf
  „Read and write permissions" stehen. Das ist etwas, das nur der Nutzer erledigen
  kann. Nicht zu verwechseln mit *Actions permissions* weiter oben auf derselben
  Seite („Allow all actions …") — die regelt etwas anderes.
- **Branches kann eine Cloud-Session ebenso wenig löschen wie Tags setzen.**
  `git push origin --delete` meldet „Everything up-to-date" und bricht die Verbindung
  ab; der API-Weg antwortet mit 403 („Write access to this GitHub API path is not
  permitted through this proxy"). Am 2026-07-30 geprüft, Wiederholversuche helfen
  nicht. Den gemergten Branch löscht deshalb der Nutzer selbst — auf der
  Pull-Request-Seite über **„Delete branch"**. Nach jedem Merge ungefragt daran
  erinnern und dazusagen, dass nichts verloren geht.
- **Der Nutzer kann die Seite nicht über `localhost` ansehen.** Die Session läuft in
  einem Container in der Cloud; `python3 -m http.server 8000` startet dort und ist für
  ihn nicht erreichbar. Ab Abschnitt 2 hängt aber jede Abnahme daran, dass er das Bild
  sieht. **Ungefragt eine lauffähige Vorschau als Artifact veröffentlichen**, sobald
  eine Etappe etwas Sichtbares ändert:

  ```
  node werkzeug/baue-vorschau.js <arbeitsverzeichnis>/vorschau.html
  ```

  Das Skript legt die Seite zu einer einzigen Datei zusammen — ein Artifact kann nicht
  aus mehreren bestehen, die Quellen sind aber ES-Module. Es sucht sich die Dateien
  selbst aus den `import`-Zeilen zusammen, es gibt also **keine Liste zu pflegen**, wenn
  eine Etappe eine Datei hinzufügt. Es bricht ab, wenn zwei Dateien denselben Namen auf
  oberster Ebene vergeben, und es weigert sich, ins Repo zu schreiben.

  Am Quelltext wird dabei nichts geändert außer den `import`-Zeilen und dem Wort
  `export` — auch nicht die Gestaltung. Der Nutzer soll das abnehmen, was ausgeliefert
  wird, nicht eine aufgehübschte Fassung. Ihm jedes Mal dazusagen, was die Vorschau
  **nicht** belegt: dass die echte Modulaufteilung im Browser lädt und dass der
  Pages-Link trägt (beides Abnahmekriterium von Etappe 2.3).
- **Die Vorschau zeigt nicht, ob die echte Dateiaufteilung lädt.** Sie legt alle Module zu
  einer Datei zusammen — genau das, was bei einer Etappe zu prüfen wäre, die Dateien
  hinzufügt, verschiebt oder die `<script>`-Zeilen in `index.html` anfasst. Dafür gibt es
  einen zweiten Weg, der die **unveränderten Dateien vom Branch** ausliefert:

  ```
  https://raw.githack.com/silberfisch24-cpu/Windkanal/<voller-commit-schluessel>/index.html
  ```

  Der Dienst reicht Repo-Dateien mit den richtigen Dateitypen durch; GitHub selbst schickt
  rohe Dateien als reinen Text, und der Browser führt sie dann nicht als Programm aus. Es
  wird nichts installiert und nichts am Repo geändert, und weil das Repo öffentlich ist,
  wird nichts sichtbar, was es nicht ohnehin wäre. Am 2026-07-31 vom Nutzer erprobt.
  **Den vollen Commit-Schlüssel einsetzen, nicht den Branchnamen** — die Branchnamen der
  Cloud-Sessions enthalten einen Schrägstrich, an dem sich der Dienst verschluckt, und ein
  fester Stand ist bei einer Abnahme ohnehin das Richtige. Diesen Link **zusätzlich** zur
  Vorschau vorlegen, wenn die Etappe an der Dateiaufteilung rührt; sonst genügt die
  Vorschau. Der Pages-Link selbst zeigt immer `main` und ist vor dem Merge nicht prüfbar.
- **Vor dem Veröffentlichen im eigenen Browser gegenprüfen.** Chromium liegt unter
  `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`; mit `--headless --no-sandbox
  --disable-gpu --screenshot=… --virtual-time-budget=…` gegen einen lokalen Server im
  Arbeitsverzeichnis lässt sich ein Bild aufnehmen und selbst ansehen. So fallen
  Zeichensatz- und Ladefehler auf, bevor der Nutzer sie sieht — genau das ist am
  2026-07-31 passiert.
- **Bedienelemente dabei wirklich betätigen, nicht nur abbilden.** Ein Standbild zeigt
  den Anfangszustand; ob eine Schaltfläche oder ein Regler etwas bewirkt, zeigt es
  nicht. Playwright ist in der Umgebung **nicht** installiert, und der kopflose Browser
  kann von sich aus nicht klicken. Der Weg, der sich am 2026-07-31 (Etappe 2.2) bewährt
  hat: `index.html` samt `src/` ins Arbeitsverzeichnis kopieren, in die **Kopie** vor
  `</body>` ein kleines Skript einsetzen, das eine über `?klick=Profil,Anhalten`
  übergebene Liste von Beschriftungen nacheinander per `setTimeout` anklickt, und dann
  je Zustand ein Bild aufnehmen. Das Skript gehört ausschließlich in die Kopie —
  **nie ins Repo**, aus demselben Grund, aus dem sich `baue-vorschau.js` weigert, dorthin
  zu schreiben. Zu prüfen ist dabei auch der angehaltene oder umgeschaltete Zustand,
  nicht nur der eingeschwungene.
- **Ein Regler lässt sich nicht anklicken.** Für Schieber (`input type="range"`) im
  Prüfskript stattdessen `wert` setzen und `dispatchEvent(new Event('input', { bubbles:
  true }))` auslösen — sonst passiert nichts, und es sähe aus, als wirkte der Regler
  nicht. Am 2026-08-01 (Etappe 3.1) so gemacht. Lohnend ist außerdem, das Skript am Ende
  den **Zustand als Text** in einen Kasten schreiben zu lassen (Reglerwerte, Grenzen,
  Beschriftungen) und die Seite mit `--dump-dom` abzurufen: Das liest sich zuverlässiger
  als aus Bildpunkten, und Fehler fallen auf, statt in einem hübschen Bild unterzugehen.
- **`--window-size` stellt keine Handybreite ein.** Chrome erzwingt eine
  Mindestfensterbreite von 500 Punkten: `--window-size=393,852` ergibt ein Sichtfeld von
  500, das Bild wird aber auf 393 beschnitten — die Seite sieht dann aus, als liefe sie
  über den Rand, obwohl sie es nicht tut. Genau darauf bin ich am 2026-07-31 (Etappe 2.3)
  hereingefallen. `--force-device-scale-factor` hilft nicht, es skaliert die Rasterung,
  nicht das Sichtfeld. Der Weg, der trägt: eine Hilfsseite im Arbeitsverzeichnis, die
  `index.html` in einem `<iframe>` fester Breite lädt. Der Rahmen bekommt ein echtes
  Sichtfeld dieser Breite; darin lassen sich `scrollWidth` gegen `clientWidth` und die
  Größe der Schaltflächen messen. Wie jedes Prüfgerüst gehört auch diese Seite
  ausschließlich ins Arbeitsverzeichnis, **nie ins Repo**.
- **`--virtual-time-budget` misst keine Laufzeit.** Unter virtueller Zeit stimmen die
  Angaben aus `performance.now()` nicht mit der Wanduhr überein; die angezeigte Bildfolge
  („0 Bilder je Sekunde") und der Fortschritt der Strömung sind dort nicht aussagekräftig.
  Für Fragen nach Geschwindigkeit oder Einschwingen die Rechnung stattdessen ohne Browser
  über ein kleines Node-Skript gegen `src/kern/` laufen lassen.

## Umfangsänderungen

Bemerkst du, dass eine Anforderung über `SPEC.md` hinausgeht: **sage es, bevor du
sie umsetzt.** Der Nutzer entscheidet, ob der Umfang wächst.

`SPEC.md` wird ergänzt, nie still überschrieben — datierter Eintrag im
Änderungsverlauf.

## Welcher Skill wann

| Situation | Skill |
|---|---|
| Etappe umsetzen (Regelfall) | `projekt-etappe` |
| Prüfen, Qualität sichern, Doku fertigstellen | `projekt-review` |
| Neues Projekt | `projekt-start` |

## Einordnung neuer Anforderungen

Ordne zuerst ein, dann handle:

| Art | Vorgehen |
|---|---|
| **Fehlerbehebung** — funktioniert nicht wie beschrieben | eine Etappe, `SPEC.md` bleibt |
| **Erweiterung im Rahmen** — passt zum bestehenden Zweck | Etappen planen, `SPEC.md` ergänzen |
| **Rahmenänderung** — anderer Zweck, Zielgruppe, Umfang | zurück in die Klärung, datierter Eintrag |
| **Strukturänderung** — Architektur trägt nicht mehr | Struktur neu begründen |

Eine Rahmenänderung wie eine Fehlerbehebung zu behandeln ist der Weg, auf dem
Projekte unbemerkt etwas anderes werden, als sie sein sollten.

Wird dieselbe Stelle wiederholt angefasst, ist das ein Strukturproblem, kein
Zufall — sprich es an.
