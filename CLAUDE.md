# Windkanal

Verbindliche Spezifikation: `SPEC.md`. Bei inhaltlichen Fragen zu Umfang, Zielen oder
getroffenen Entscheidungen dort nachlesen, statt anzunehmen.

## Befehle

- Starten: `python3 -m http.server 8000`, dann <http://localhost:8000> im Browser öffnen
  (nötig, weil ES-Module aus einer lokalen Datei heraus vom Browser blockiert werden)
- Kernlogik prüfen (Abschnitt 1, ohne Oberfläche): `node werkzeug/pruefe-kern.js` —
  **allein laufen lassen.** Ein Teil misst die Rechenzeit je Auflösungsstufe und schlägt
  fehl, wenn nebenher etwas anderes rechnet. Ein Fehlschlag genau dieses Punktes ist
  deshalb erst ein Befund, wenn der Lauf ohne Nebenlast wiederholt wurde.
- Tests: `node --test tests/` — **greift noch nicht.** `tests/` ist bis Abschnitt 5 leer,
  der Aufruf bricht deshalb ab. Abgesichert wird bis dahin über `werkzeug/pruefe-kern.js`.
- Linting: keins — bewusst, siehe Abhängigkeiten in `SPEC.md`
- Build: keiner — die Dateien werden unverändert ausgeliefert
- Sichtbares prüfen und dem Nutzer vorlegen: Skill `browser-abnahme`. Dort steht der
  ganze Weg — auch `werkzeug/baue-vorschau.js`, das die Seite als Rückfallweg zu einer
  Datei zusammenlegt. **Kein Build-Schritt:** Das Ergebnis liegt außerhalb des Repos (das
  Skript weigert sich sonst) und wird nie eingecheckt.

## Struktur

- Kernlogik: `src/kern/` — reine Zahlenrechnung, kein Zugriff auf `document`, `window`, `canvas`
- Oberfläche: `src/ui/` — alles Bildschirmbezogene; ruft den Kern auf, nie umgekehrt
- Einstiegspunkt: `index.html`
- Prüfskripte für die Kommandozeile: `werkzeug/` — dort dürfen **Maße und Rechenzeiten**
  von den Voreinstellungen abweichen, wenn es allein der Erkennbarkeit dient (gröberes
  Textbild, längerer Lauf bis eine Erscheinung eingeschwungen ist). Die Abweichung gehört
  mit Begründung in den Änderungsverlauf von `SPEC.md`, sonst liest sie sich später wie
  eine stille Änderung der Voreinstellungen.
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

Ändert die Etappe etwas Sichtbares, gehört eine lauffähige Vorschau dazu — ungefragt,
Weg im Skill `browser-abnahme`.

Ohne ausdrückliche Bestätigung: keinen Tag setzen, nicht zur nächsten Etappe übergehen.

## Sessionabschluss — ungefragt, bevor die Session endet

1. Entscheidungen und geänderte Annahmen in `SPEC.md` nachtragen
2. Stand in Etappenliste und Kern-Abschnitt aktualisieren
3. Zwei-Mal-Regel prüfen: Wurde etwas zum zweiten Mal erklärt? Dann hier aufnehmen (Fakt,
   immer gebraucht) oder in einen Skill (Vorgehen für einen bestimmten Anlass) — und dem
   Nutzer sagen, was du aufgenommen hast.
4. Commit setzen; bei bestätigter Etappe zusätzlich `VERSION.md`

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

Commit-Nachricht **im Klartext**, fachlich statt technisch — der Nutzer muss die Historie
überfliegen können, ohne den Änderungssatz zu öffnen. Erste Zeile: was sich geändert hat,
plus Etappennummer. Darunter Stichpunkte: was das Programm jetzt anders macht. Begründung
nur, wo sie nicht auf der Hand liegt. Vorbild sind die bestehenden Nachrichten in
`git log`.

## In Cloud-Sessions (claude.ai/code)

Die Arbeit läuft über einen Branch statt über direkte Commits auf den Hauptzweig.
**Ein Branch je Etappe, nicht je Session.** Die Abnahme durch den Nutzer bleibt
Voraussetzung — erst danach zum Pull Request.

- **Tags kann eine Cloud-Session nicht selbst setzen**, auch nicht mit Zugriff auf den
  Hauptzweig: `git push` von `refs/tags/*` und die API-Pfade `/git/tags` und `/git/refs`
  antworten mit 403. Eine neue Session mit anderen Rechten hilft nicht (2026-07-30
  geprüft).
- **Deshalb entsteht der Tag über `VERSION.md`.** Bei bestätigter Etappe diese Datei neu
  schreiben: erste Zeile die Nummer in der Form `v0.1`, darunter Stichpunkte im Klartext.
  Beim Merge nach `main` legt `.github/workflows/tag.yml` daraus den annotierten Tag an;
  eine schon vergebene Nummer wird nie überschrieben. `VERSION.md` gehört in **denselben**
  Pull Request wie die Etappe — fehlt sie, läuft der Workflow nicht an und der Tag fehlt
  stillschweigend.
- Schlägt der Workflow fehl, steht wahrscheinlich *Settings → Actions → General →
  **Workflow permissions*** nicht auf „Read and write permissions". Das kann nur der
  Nutzer ändern. Nicht zu verwechseln mit *Actions permissions* weiter oben auf derselben
  Seite.
- **Branches kann eine Cloud-Session ebenso wenig löschen** (2026-07-30 geprüft,
  Wiederholversuche helfen nicht). Den gemergten Branch löscht der Nutzer selbst auf der
  Pull-Request-Seite über **„Delete branch"**. Nach jedem Merge ungefragt daran erinnern
  und dazusagen, dass nichts verloren geht.
- Der Nutzer erreicht `localhost` in der Cloud nicht — für alles Sichtbare deshalb Skill
  `browser-abnahme`.

## Umfangsänderungen

Bemerkst du, dass eine Anforderung über `SPEC.md` hinausgeht: **sage es, bevor du
sie umsetzt.** Der Nutzer entscheidet, ob der Umfang wächst.

`SPEC.md` wird ergänzt, nie still überschrieben — datierter Eintrag im
Änderungsverlauf.

Ordne eine neue Anforderung zuerst ein, dann handle:

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

## Welcher Skill wann

| Situation | Skill |
|---|---|
| Etappe umsetzen (Regelfall) | `projekt-etappe` |
| Sichtbares prüfen und vorlegen | `browser-abnahme` |
| Prüfen, Qualität sichern, Doku fertigstellen | `projekt-review` |
| Neues Projekt | `projekt-start` |
