---
name: browser-abnahme
description: Prüft eine sichtbare Änderung selbst im Browser nach und legt dem Nutzer
  eine lauffähige Vorschau vor. Anwenden, sobald eine Etappe am Bild, an der Bedienung
  oder am Seitenaufbau etwas ändert — also vor jeder Abnahme aus Abschnitt 2 aufwärts,
  und immer dann, wenn der Nutzer die Seite selbst ansehen soll.
---

# Sichtbare Änderungen prüfen und vorlegen

Zwei Teile: erst selbst gegenprüfen, dann dem Nutzer vorlegen. Nie umgekehrt — sonst
sieht er Zeichensatz- und Ladefehler vor dir (am 2026-07-31 genau so passiert).

**Der Nutzer kann die Seite nicht über `localhost` ansehen.** Die Session läuft in einem
Container in der Cloud; ein Server dort ist für ihn nicht erreichbar. Deshalb Teil 2.

---

# Teil 1 — Selbst gegenprüfen

## Werkzeug

Playwright liegt in der Umgebung bereit, mitsamt Chromium — **nichts zu installieren,
nichts ins Repo aufzunehmen.** Es ist Werkzeug der Umgebung, keine Projektabhängigkeit;
`package.json` bleibt unberührt, der Grundsatz „keine Laufzeit-Abhängigkeiten" gilt
weiter.

Aus dem Arbeitsverzeichnis lädt `import 'playwright'` **nicht** — die Installation liegt
global. Über den absoluten Pfad gehen (`npm root -g` nennt das Verzeichnis, falls es sich
einmal ändert):

```js
const { chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs');
const browser = await chromium.launch({ args: ['--no-sandbox'] });
```

Das Prüfskript gehört ins **Arbeitsverzeichnis, nie ins Repo** — aus demselben Grund, aus
dem sich `baue-vorschau.js` weigert, dorthin zu schreiben. Die Seite selbst wird dabei
nicht angefasst: Playwright bedient die **unveränderte** `index.html` über einen lokalen
Server (`python3 -m http.server <port>`).

## Was damit geht

| Zu prüfen | So |
|---|---|
| Schaltfläche betätigen | `page.getByRole('button', { name: 'Profil' }).click()` |
| Regler stellen | `locator.fill('70')` — löst `input` selbst aus |
| Zustand ablesen | `locator.textContent()`, `inputValue()`, `evaluate(…)` |
| Handybreite | `newContext({ viewport: { width: 393, height: 852 } })` |
| Überlauf | `evaluate(() => [scrollWidth, clientWidth] …)` im Kontext dieser Breite |
| Laufzeit über Minuten | `waitForTimeout` und ablesen — echte Wanduhr |
| Fehler | `page.on('pageerror', …)` und `page.on('console', …)` einsammeln |
| Bild ansehen | `page.screenshot({ path: … })`, dann selbst anschauen |

Am 2026-08-02 an der Windkanal-Seite belegt: Formwechsel auf Profil, Windregler von 100
auf 70, Anhalten, Laufanzeige „Angehalten · 92 Schritte gerechnet", danach 51 Bilder je
Sekunde über echte Sekunden, Handybreite 393 ohne Überlauf, keine Konsolenfehler.

## Dabei beachten

- **Bedienelemente wirklich betätigen, nicht nur abbilden.** Ein Standbild zeigt den
  Anfangszustand; ob eine Schaltfläche etwas bewirkt, zeigt es nicht. Auch den
  angehaltenen oder umgeschalteten Zustand prüfen, nicht nur den eingeschwungenen.
- **`fill` prüft die Reglergrenzen.** Ein Wert außerhalb `min`/`max` bricht mit
  „Malformed value" ab — erst `min`/`max` lesen, dann setzen.
- **Zustand als Text auslesen, nicht aus Bildpunkten.** Reglerwerte, Beschriftungen und
  Anzeigen über `textContent` holen; das ist zuverlässiger, und Fehler gehen nicht in
  einem hübschen Bild unter.
- **Rechenzeit der Kernlogik ohne Browser messen.** Für Fragen nach Geschwindigkeit oder
  Einschwingen ein kleines Node-Skript gegen `src/kern/` laufen lassen; im Browser misst
  man die Oberfläche mit.
- **Aufräumen in einem eigenen Befehl.** `pkill -f "http.server"` bringt die eigene Shell
  um — das Muster steht auch in deren Befehlszeile, und alles nach dem `pkill` bleibt
  liegen (am 2026-08-02 zweimal passiert; es sah aus, als sei der Server nicht
  hochgekommen). Stattdessen, und **nicht** an den Startbefehl angehängt:
  `for P in $(pgrep -f '[h]ttp\.server'); do kill "$P"; done`

## Falls doch einmal der nackte Chromium

Er liegt unter `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`. Drei Fallen, die
Playwright allesamt erspart — sie sind der Grund, hier nicht zurückzufallen:

- `--window-size=393,852` ergibt **keine** Handybreite: Chrome erzwingt mindestens 500
  Punkte Sichtfeld und beschneidet nur das Bild. Die Seite sieht dann aus, als liefe sie
  über den Rand.
- `--virtual-time-budget` misst **keine** Laufzeit: `performance.now()` und die Wanduhr
  laufen auseinander. Dieselbe Messung kam einmal auf 3,4 und einmal auf 288 Millionen
  Zellen je Sekunde.
- `--dump-dom` wartet nur auf `load` und trägt nicht über Minuten.

---

# Teil 2 — Dem Nutzer vorlegen

**Ungefragt vorlegen**, sobald eine Etappe etwas Sichtbares ändert. Der Weg seit dem
2026-08-02: committen, pushen, den **GitHack-Link mit vollem Commit-Schlüssel** nennen.

```
https://raw.githack.com/silberfisch24-cpu/Windkanal/<voller-commit-schluessel>/index.html
```

- Der Dienst reicht die **unveränderten Dateien** vom Branch mit den richtigen Dateitypen
  durch — anders als GitHub selbst, das rohe Dateien als reinen Text schickt, den der
  Browser nicht als Programm ausführt. Es wird nichts installiert und nichts am Repo
  geändert; das Repo ist öffentlich, es wird also nichts sichtbar, was es nicht ohnehin
  wäre. Am 2026-07-31 vom Nutzer erprobt.
- **Vollen Commit-Schlüssel einsetzen, nicht den Branchnamen** — die Branchnamen der
  Cloud-Sessions enthalten einen Schrägstrich, an dem sich der Dienst verschluckt. Ein
  fester Stand ist bei einer Abnahme ohnehin das Richtige.
- **Nicht als Artifact veröffentlichen.** Das hat einmal so viele Tokens verbraucht, dass
  das Nutzungslimit des Nutzers erreicht war. Der GitHack-Link kostet einen `git push`.
- Der Pages-Link zeigt immer `main` und ist vor dem Merge nicht prüfbar.

## Rückfallweg: die zusammengelegte Vorschau

Nur, wenn der GitHack-Weg einmal nicht trägt:

```
node werkzeug/baue-vorschau.js <arbeitsverzeichnis>/vorschau.html
```

Das Skript legt `index.html` und alle Module zu **einer** Datei zusammen. Es holt sich die
Dateien aus den `import`-Zeilen, es gibt also **keine Liste zu pflegen**; es bricht ab,
wenn zwei Dateien denselben Namen auf oberster Ebene vergeben, und es weigert sich, ins
Repo zu schreiben. Am Quelltext ändert es nichts außer den `import`-Zeilen und dem Wort
`export` — auch nicht die Gestaltung: Der Nutzer soll abnehmen, was ausgeliefert wird,
nicht eine aufgehübschte Fassung.

**Dazusagen, was die Vorschau nicht belegt:** dass die echte Modulaufteilung im Browser
lädt. Genau das wäre bei einer Etappe zu prüfen, die Dateien hinzufügt, verschiebt oder
die `<script>`-Zeilen in `index.html` anfasst — dafür ist der GitHack-Link da.
