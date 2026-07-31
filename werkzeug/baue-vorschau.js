/**
 * Baut aus den echten Projektdateien **eine einzelne HTML-Datei zum Vorführen**.
 *
 * Wozu: In einer Cloud-Session (claude.ai/code) läuft die Seite in einem Container,
 * `localhost` ist für den Nutzer nicht erreichbar. Ab Abschnitt 2 hängt aber jede
 * Abnahme daran, dass er das Bild sieht. Eine veröffentlichte Vorschau muss aus einer
 * einzigen Datei bestehen — die Quellen sind aber ES-Module, die einander laden.
 * Dieses Skript legt sie zusammen.
 *
 * **Das ist ausdrücklich kein Build-Schritt.** Ausgeliefert wird weiterhin die bloße
 * Dateisammlung aus dem Repo, unverändert; diese Datei entsteht außerhalb des Repos,
 * dient allein der Abnahme und wird nie eingecheckt. Damit das nicht am Gedächtnis
 * hängt, weigert sich das Skript, in das Repo zu schreiben.
 *
 * Aufruf:
 *   node werkzeug/baue-vorschau.js                  → in das Temp-Verzeichnis
 *   node werkzeug/baue-vorschau.js /pfad/datei.html → an eine bestimmte Stelle
 *
 * In einer Cloud-Session gehört sie in das Arbeitsverzeichnis der Session (siehe
 * „Cloud-Sessions" in CLAUDE.md) und von dort in ein Artifact.
 *
 * Was die Vorschau **nicht** belegt: dass die echte Modulaufteilung im Browser lädt
 * und dass der GitHub-Pages-Link trägt. Beides ist Abnahmekriterium von Etappe 2.3
 * und muss dem Nutzer jedes Mal dazugesagt werden.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve, relative, join, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const WURZEL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EINSTIEG = join(WURZEL, 'index.html');

hauptlauf();

function hauptlauf() {
  const ziel = zielpfad(process.argv[2]);
  const seite = readFileSync(EINSTIEG, 'utf8');

  const startmodul = sucheStartmodul(seite);
  const module = inAbhaengigkeitsreihenfolge(startmodul);

  const code = module.map(zusammenlegbar).join('\n');
  pruefeAufDoppelteNamen(code);

  mkdirSync(dirname(ziel), { recursive: true });
  writeFileSync(ziel, baueSeite(seite, code));

  console.log('Zusammengelegt in dieser Reihenfolge:');
  for (const datei of module) console.log('  ', relative(WURZEL, datei));
  console.log('Geschrieben:', ziel);
}

/**
 * Wohin geschrieben wird — und wohin ausdrücklich nicht.
 *
 * Ein Pfad innerhalb des Repos wird abgewiesen. Sonst landete die zusammengelegte
 * Datei früher oder später versehentlich in einem Commit, und die Zusage „die Seite
 * ist eine bloße Dateisammlung ohne Build-Schritt" wäre stillschweigend gebrochen.
 */
function zielpfad(angabe) {
  const ziel = angabe
    ? resolve(isAbsolute(angabe) ? angabe : join(process.cwd(), angabe))
    : join(tmpdir(), 'windkanal-vorschau.html');

  const innerhalb = relative(WURZEL, ziel);
  if (!innerhalb.startsWith('..') && !isAbsolute(innerhalb)) {
    throw new Error(
      `Die Vorschau darf nicht im Repo liegen (${innerhalb}) — sie wird nie eingecheckt.\n` +
        'Einen Pfad außerhalb angeben oder das Argument weglassen.'
    );
  }
  return ziel;
}

/** Welches Modul lädt `index.html`? */
function sucheStartmodul(seite) {
  const treffer = seite.match(/<script\s[^>]*type=["']module["'][^>]*src=["']([^"']+)["']/);
  if (treffer === null) {
    throw new Error('In index.html steht kein <script type="module" src="…">.');
  }
  return resolve(WURZEL, treffer[1]);
}

/**
 * Läuft von der Einstiegsdatei aus alle `import`-Zeilen entlang und gibt die Module
 * so zurück, dass jedes nach seinen Abhängigkeiten steht.
 *
 * Die Liste wird bewusst **nicht** fest hinterlegt: Sonst müsste jede Etappe, die eine
 * Datei hinzufügt, daran denken — und die Vorschau wäre sonst stillschweigend
 * unvollständig, statt mit einem Fehler abzubrechen.
 */
function inAbhaengigkeitsreihenfolge(einstieg) {
  const fertig = [];
  const gesehen = new Set();
  const imGang = new Set();

  function gehe(datei) {
    if (gesehen.has(datei)) return;
    if (imGang.has(datei)) {
      throw new Error(`Ringschluss bei den Modulen: ${relative(WURZEL, datei)} lädt sich selbst.`);
    }
    imGang.add(datei);
    for (const bezug of importe(readFileSync(datei, 'utf8'))) {
      gehe(resolve(dirname(datei), bezug));
    }
    imGang.delete(datei);
    gesehen.add(datei);
    fertig.push(datei);
  }

  gehe(einstieg);
  return fertig;
}

/** Die Pfade aus allen `import`-Zeilen einer Datei. */
function importe(quelltext) {
  return [...quelltext.matchAll(/^\s*import\b[^;]*?['"]([^'"]+)['"]\s*;/gm)].map((t) => t[1]);
}

/**
 * Macht eine Moduldatei zusammenlegbar: `import`-Zeilen fallen weg (die Namen stehen
 * nach dem Zusammenlegen ohnehin nebeneinander), das Wort `export` fällt weg. Sonst
 * bleibt jede Zeile, wie sie im Repo steht — auch die Gestaltung. Der Nutzer soll das
 * abnehmen, was ausgeliefert wird, nicht eine aufgehübschte Fassung.
 */
function zusammenlegbar(datei) {
  const roh = readFileSync(datei, 'utf8');
  if (/^export\s+default\b/m.test(roh)) {
    throw new Error(
      `${relative(WURZEL, datei)} benutzt "export default" — das lässt sich nicht ohne ` +
        'Namensvergabe zusammenlegen. Entweder dort einen benannten Export verwenden ' +
        'oder dieses Skript erweitern.'
    );
  }
  return (
    `// ===== ${relative(WURZEL, datei)} =====\n` +
    roh.replace(/^\s*import\b[^;]*?['"][^'"]+['"]\s*;\s*$/gm, '').replace(/^export /gm, '')
  );
}

/**
 * Gegenprobe: Zwei Dateien, die auf oberster Ebene denselben Namen vergeben, sind
 * getrennt in Ordnung und zusammengelegt ein Fehler. Der fiele sonst erst im Browser
 * auf — und zwar dem Nutzer, nicht uns.
 */
function pruefeAufDoppelteNamen(code) {
  const namen = [...code.matchAll(/^(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/gm)]
    .map((t) => t[1]);
  const doppelt = [...new Set(namen.filter((n, i) => namen.indexOf(n) !== i))];
  if (doppelt.length > 0) {
    throw new Error(
      `Diese Namen kommen nach dem Zusammenlegen doppelt vor: ${doppelt.join(', ')}.\n` +
        'Einen davon in der Quelldatei umbenennen — zusammengelegt überschreiben sie sich.'
    );
  }
  console.log(namen.length, 'Namen auf oberster Ebene, keiner doppelt');
}

/**
 * Setzt die Seite zusammen: alles aus `<body>` außer dem Modul-Verweis, dazu die
 * Formatvorlage und der zusammengelegte Code.
 *
 * `<meta charset="utf-8">` muss vorneweg — ohne die Angabe rät der Browser den
 * Zeichensatz und zerlegt sämtliche Umlaute und Gedankenstriche.
 */
function baueSeite(seite, code) {
  const stil = ausschnitt(seite, /<style>([\s\S]*?)<\/style>/, 'ein <style>-Block');
  const koerper = ausschnitt(seite, /<body>([\s\S]*?)<\/body>/, 'ein <body>')
    .replace(/<script\s[^>]*type=["']module["'][^>]*>\s*<\/script>/g, '')
    .trim();
  const titel = ausschnitt(seite, /<title>([\s\S]*?)<\/title>/, 'ein <title>').trim();

  return (
    '<meta charset="utf-8">\n' +
    `<title>${titel} — Vorschau</title>\n` +
    `<style>${stil}</style>\n${koerper}\n` +
    `<script type="module">\n${code}\n</script>\n`
  );
}

function ausschnitt(text, muster, was) {
  const treffer = text.match(muster);
  if (treffer === null) throw new Error(`In index.html fehlt ${was}.`);
  return treffer[1];
}
