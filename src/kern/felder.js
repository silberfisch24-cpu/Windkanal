/**
 * Abgeleitete Größen aus dem Rechengitter: Geschwindigkeit, Druck, Wirbelstärke.
 *
 * Reine Zahlenrechnung. Diese Datei kennt weder Browser noch Bildschirm und ruft
 * nichts aus `src/ui/` auf (siehe „Trennung Fachlogik / Darstellung" in SPEC.md).
 *
 * Der Löser speichert je Zelle neun Teilchenanteile — Zahlen, die für sich
 * genommen nichts zeigen. Sehen will man drei andere Größen, und die rechnet
 * diese Datei daraus aus:
 *
 *   - **Geschwindigkeit** `ux`, `uy` in Zellen je Zeitschritt, dazu `tempo` als
 *     Betrag (wie schnell, ohne Richtung).
 *   - **Druck** aus der Dichte. Angegeben wird nicht der volle Druck, sondern
 *     der Unterschied zum Ruhedruck: null heißt „wie im ruhenden Kanal",
 *     positiv Überdruck (Stau vor dem Körper), negativ Unterdruck (Sog).
 *   - **Wirbelstärke** — wie stark und in welche Richtung sich die Luft an
 *     dieser Stelle dreht. Positiv gegen den Uhrzeigersinn, negativ mit ihm,
 *     null bei geradliniger Strömung ohne Scherung.
 *
 * In Wandzellen — Boden, Decke und Hindernis — steht überall null: dort strömt
 * nichts, dort dreht sich nichts, und der Druck hat keine Bedeutung.
 */

import { FLUID, HAFTWAND, dichteBei, geschwindigkeitBei, istFluid } from './loeser.js';

/**
 * Aus der Dichte wird der Druck, indem man mit dem Quadrat der
 * Schallgeschwindigkeit des Gitters multipliziert — beim D2Q9-Gitter ist das 1/3.
 * Wer den vollen Druck will, rechnet `dichte / 3`; ablesbar ist hier bewusst nur
 * der Unterschied zum Ruhedruck, weil die Dichte in der Rechnung immer dicht bei
 * 1 liegt und die Abweichung die eigentliche Aussage ist.
 */
const SCHALLGESCHWINDIGKEIT_QUADRAT = 1 / 3;

/** Ruhende Luft — was an einer Haftwand für die Ableitung gilt. */
const STEHT_STILL = { ux: 0, uy: 0 };

/** Druck einer Zelle, gemessen als Unterschied zum Ruhedruck. */
export function druckBei(kanal, x, y) {
  if (!istFluid(kanal, x, y)) return 0;
  return (dichteBei(kanal, x, y) - 1) * SCHALLGESCHWINDIGKEIT_QUADRAT;
}

/**
 * Wirbelstärke einer Zelle: die Drehung der Luft an dieser Stelle.
 *
 * Gerechnet aus dem Unterschied der Geschwindigkeiten ringsum — wie stark sich
 * die Aufwärtsbewegung nach rechts hin ändert, abzüglich dessen, wie stark sich
 * die Vorwärtsbewegung nach oben hin ändert. Anschaulich: läuft die Luft oben
 * schneller als unten, schert sie sich und dreht sich dabei.
 */
export function wirbelstaerkeBei(kanal, x, y) {
  if (!istFluid(kanal, x, y)) return 0;

  const { breite, hoehe } = kanal;
  const hier = geschwindigkeitBei(kanal, x, y);

  const xLinks = x > 0 ? x - 1 : x;
  const xRechts = x < breite - 1 ? x + 1 : x;
  const yUnten = y > 0 ? y - 1 : y;
  const yOben = y < hoehe - 1 ? y + 1 : y;

  const links = nachbarwert(kanal, xLinks, y, hier);
  const rechts = nachbarwert(kanal, xRechts, y, hier);
  const unten = nachbarwert(kanal, x, yUnten, hier);
  const oben = nachbarwert(kanal, x, yOben, hier);

  return (
    (rechts.uy - links.uy) / (xRechts - xLinks) - (oben.ux - unten.ux) / (yOben - yUnten)
  );
}

/**
 * Geschwindigkeit einer Nachbarzelle, so wie sie für die Ableitung gilt:
 *
 *   - Luft      → der tatsächliche Wert
 *   - Haftwand  → null in beide Richtungen. Genau das ist die Scherung, die die
 *                 Wirbelstärke sichtbar machen soll: am Boden und an der
 *                 Körperoberfläche steht die Luft, kurz daneben strömt sie.
 *   - Gleitwand → längs derselbe Wert wie in der Bezugszelle, quer null. An der
 *                 reibungsfreien Decke bremst nichts, dort darf auch keine
 *                 Drehung ausgewiesen werden, die es nicht gibt.
 */
function nachbarwert(kanal, x, y, bezug) {
  const art = kanal.zellart[x + y * kanal.breite];
  if (art === FLUID) return geschwindigkeitBei(kanal, x, y);
  if (art === HAFTWAND) return STEHT_STILL;
  return { ux: bezug.ux, uy: 0 };
}

/**
 * Legt die Felder an, die `leseFelder` füllt. Getrennt vom Ablesen, damit man
 * dieselben Felder in jedem Einzelbild wiederverwenden kann, statt bei 60 Bildern
 * je Sekunde ebenso oft neuen Speicher anzufordern.
 */
export function erzeugeFelder(kanal) {
  const anzahlZellen = kanal.breite * kanal.hoehe;
  return {
    breite: kanal.breite,
    hoehe: kanal.hoehe,
    ux: new Float64Array(anzahlZellen),
    uy: new Float64Array(anzahlZellen),
    tempo: new Float64Array(anzahlZellen),
    druck: new Float64Array(anzahlZellen),
    wirbelstaerke: new Float64Array(anzahlZellen),
  };
}

/**
 * Liest den ganzen Kanal auf einmal aus — für die Darstellung, die ohnehin jede
 * Zelle braucht. Zellindex wie im Löser: `i = x + y * breite`.
 *
 * Ohne zweites Argument werden die Felder neu angelegt; wer sie behält und
 * wieder hereingibt, bekommt sie überschrieben zurück.
 */
export function leseFelder(kanal, felder = erzeugeFelder(kanal)) {
  const { breite, hoehe, zellart } = kanal;
  if (felder.breite !== breite || felder.hoehe !== hoehe) {
    throw new Error('Die Felder passen nicht zum Kanal — Breite oder Höhe stimmen nicht überein.');
  }

  const { ux, uy, tempo, druck, wirbelstaerke } = felder;

  // Erst Geschwindigkeit und Druck: beides ist an einer Zelle allein ablesbar.
  for (let y = 0; y < hoehe; y++) {
    for (let x = 0; x < breite; x++) {
      const zelle = x + y * breite;
      if (zellart[zelle] !== FLUID) {
        ux[zelle] = 0;
        uy[zelle] = 0;
        tempo[zelle] = 0;
        druck[zelle] = 0;
        continue;
      }
      const geschwindigkeit = geschwindigkeitBei(kanal, x, y);
      ux[zelle] = geschwindigkeit.ux;
      uy[zelle] = geschwindigkeit.uy;
      tempo[zelle] = Math.hypot(geschwindigkeit.ux, geschwindigkeit.uy);
      druck[zelle] = (dichteBei(kanal, x, y) - 1) * SCHALLGESCHWINDIGKEIT_QUADRAT;
    }
  }

  // Dann die Wirbelstärke: sie braucht die Nachbarn und damit den ersten Durchgang.
  for (let y = 0; y < hoehe; y++) {
    for (let x = 0; x < breite; x++) {
      const zelle = x + y * breite;
      if (zellart[zelle] !== FLUID) {
        wirbelstaerke[zelle] = 0;
        continue;
      }

      const xLinks = x > 0 ? x - 1 : x;
      const xRechts = x < breite - 1 ? x + 1 : x;
      const yUnten = y > 0 ? y - 1 : y;
      const yOben = y < hoehe - 1 ? y + 1 : y;

      const links = randgerecht(zellart, ux, uy, xLinks + y * breite, ux[zelle]);
      const rechts = randgerecht(zellart, ux, uy, xRechts + y * breite, ux[zelle]);
      const unten = randgerecht(zellart, ux, uy, x + yUnten * breite, ux[zelle]);
      const oben = randgerecht(zellart, ux, uy, x + yOben * breite, ux[zelle]);

      wirbelstaerke[zelle] =
        (rechts.uy - links.uy) / (xRechts - xLinks) - (oben.ux - unten.ux) / (yOben - yUnten);
    }
  }

  return felder;
}

/**
 * Die schnellste Stelle im Kanal, aus bereits gelesenen Feldern.
 *
 * Diese eine Zahl entscheidet, ob das Verfahren noch trägt: Nicht der Wind am
 * Einlass bringt es zum Zerfallen, sondern die Spitze irgendwo im Kanal, wenn
 * sie der Gitter-Schallgeschwindigkeit zu nahe kommt (siehe
 * `setzeNachdaempfung` in `loeser.js`).
 *
 * Der Durchgang ist ein bloßer Vergleich über ein fertiges Feld — kein Rechnen,
 * keine neun Anteile je Zelle wie bei `istHeil`. Er kostet damit rund ein
 * Zwanzigstel und darf in **jedem** Bild laufen.
 *
 * In Wandzellen steht null, sie fallen also von selbst heraus. `NaN` ebenso:
 * Der Vergleich ist so geschrieben, dass ein solcher Wert nie größer ist —
 * eine zerfallene Rechnung ist Sache von `istHeil`, nicht dieser Zeile.
 */
export function hoechstesTempo(felder) {
  const { tempo } = felder;
  let groesstes = 0;
  for (let zelle = 0; zelle < tempo.length; zelle++) {
    if (tempo[zelle] > groesstes) groesstes = tempo[zelle];
  }
  return groesstes;
}

/** Wie `nachbarwert`, nur aus den bereits gefüllten Feldern statt aus dem Gitter. */
function randgerecht(zellart, ux, uy, zelle, bezugUx) {
  const art = zellart[zelle];
  if (art === FLUID) return { ux: ux[zelle], uy: uy[zelle] };
  if (art === HAFTWAND) return STEHT_STILL;
  return { ux: bezugUx, uy: 0 };
}
