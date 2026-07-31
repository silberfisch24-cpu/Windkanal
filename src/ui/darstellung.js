/**
 * Zeichnen: aus den Zahlenfeldern des Kerns wird ein Farbbild.
 *
 * Diese Datei gehört zur Oberfläche und darf deshalb `canvas` anfassen. Sie
 * ruft nichts aus dem Kern auf, was rechnet — sie liest nur, was `felder.js`
 * ausgerechnet hat (siehe „Trennung Fachlogik / Darstellung" in SPEC.md).
 *
 * Zwei Dinge müssen dabei umgerechnet werden:
 *   1. **Oben und unten.** Im Kern ist y = 0 der Boden, auf der Zeichenfläche
 *      ist die Zeile 0 der obere Bildrand. Die Umkehrung passiert genau hier
 *      und sonst nirgends.
 *   2. **Zahl in Farbe.** Über eine feste Skala, nicht über den größten Wert
 *      des jeweiligen Bildes — siehe `TEMPO_OBERGRENZE` unten.
 */

import { FLUID } from '../kern/loeser.js';

/**
 * Die Farbskala für die Geschwindigkeit: **ein Farbton, hell nach dunkel**.
 *
 * Hell heißt langsam und tritt zurück, dunkel heißt schnell und drängt sich
 * vor — die Ordnung liegt damit in der Helligkeit und bleibt auch für
 * Farbenblinde und im Schwarzweißdruck lesbar. Ein Regenbogen (blau-grün-gelb-rot)
 * hätte diese Ordnung nicht: er sieht bunter aus, aber welche Farbe „mehr"
 * bedeutet, muss man dabei auswendig wissen.
 *
 * Die dreizehn Stufen stammen aus einer geprüften Blau-Skala; zwischen ihnen
 * wird geradlinig gemischt.
 */
const FARBSKALA = [
  '#cde2fb', '#b7d3f6', '#9ec5f4', '#86b6ef', '#6da7ec', '#5598e7', '#3987e5',
  '#2a78d6', '#256abf', '#1c5cab', '#184f95', '#104281', '#0d366b',
];

/**
 * Wände — Boden, Decke und das Hindernis — bekommen ein neutrales Grau statt
 * einer Farbe aus der Skala. Sonst erschiene das Hindernis, in dem die
 * Geschwindigkeit null ist, als besonders langsam strömende Luft.
 */
const WANDFARBE = [107, 106, 100]; // #6b6a64

/**
 * Bis zu welcher Geschwindigkeit die Skala reicht, als Vielfaches der
 * Windgeschwindigkeit.
 *
 * Fest, nicht aus dem jeweiligen Bild abgeleitet: Würde die Skala sich in jedem
 * Einzelbild am größten vorkommenden Wert ausrichten, änderte sich die Bedeutung
 * der Farben sechzigmal je Sekunde — das ganze Bild flackerte, obwohl sich die
 * Strömung kaum ändert. Das Doppelte deckt ab, was an der Körperkante auftritt:
 * dort wird die Luft auf gut das Doppelte beschleunigt.
 */
const TEMPO_OBERGRENZE = 2;

/** Wie fein die Skala vorab in Farben zerlegt wird. */
const SKALENSTUFEN = 256;

/**
 * Richtet das Zeichnen auf einer Zeichenfläche für einen bestimmten Kanal ein.
 *
 * Die Zeichenfläche bekommt genau die Größe des Rechengitters — ein Bildpunkt
 * je Zelle. Auf Bildschirmgröße vergrößert wird sie vom Browser über die
 * Formatvorlage; das glättet die Übergänge nebenbei und spart eigenen Code.
 *
 * @param {HTMLCanvasElement} zeichenflaeche
 * @param {object} kanal  der Kanal aus `loeser.js`
 */
export function erzeugeDarstellung(zeichenflaeche, kanal) {
  const { breite, hoehe } = kanal;

  zeichenflaeche.width = breite;
  zeichenflaeche.height = hoehe;

  const stift = zeichenflaeche.getContext('2d');
  const bild = stift.createImageData(breite, hoehe);
  const bildpunkte = bild.data;

  const skala = baueSkala();
  const obergrenze = TEMPO_OBERGRENZE * kanal.windgeschwindigkeit;

  return {
    /**
     * Malt ein Einzelbild aus den zuletzt gelesenen Feldern.
     * @param {object} felder  Ergebnis von `leseFelder`
     */
    zeichne(felder) {
      const { tempo } = felder;
      const { zellart } = kanal;

      for (let y = 0; y < hoehe; y++) {
        // Kern zählt y vom Boden nach oben, die Zeichenfläche von oben nach unten.
        const bildzeile = (hoehe - 1 - y) * breite;

        for (let x = 0; x < breite; x++) {
          const zelle = x + y * breite;
          const ziel = (bildzeile + x) * 4;

          if (zellart[zelle] !== FLUID) {
            bildpunkte[ziel] = WANDFARBE[0];
            bildpunkte[ziel + 1] = WANDFARBE[1];
            bildpunkte[ziel + 2] = WANDFARBE[2];
            bildpunkte[ziel + 3] = 255;
            continue;
          }

          let stufe = Math.round((tempo[zelle] / obergrenze) * (SKALENSTUFEN - 1));
          if (stufe < 0) stufe = 0;
          if (stufe > SKALENSTUFEN - 1) stufe = SKALENSTUFEN - 1;

          const farbe = stufe * 3;
          bildpunkte[ziel] = skala[farbe];
          bildpunkte[ziel + 1] = skala[farbe + 1];
          bildpunkte[ziel + 2] = skala[farbe + 2];
          bildpunkte[ziel + 3] = 255;
        }
      }

      stift.putImageData(bild, 0, 0);
    },
  };
}

/**
 * Zerlegt die Farbskala einmalig in 256 fertige Farben. Die Mischung je
 * Bildpunkt auszurechnen wäre bei bis zu 48.000 Zellen und 60 Bildern je
 * Sekunde unnötige Arbeit — nachgeschlagen wird sie in einem Schritt.
 */
function baueSkala() {
  const stuetzstellen = FARBSKALA.map(alsRgb);
  const letzte = stuetzstellen.length - 1;
  const skala = new Uint8ClampedArray(SKALENSTUFEN * 3);

  for (let stufe = 0; stufe < SKALENSTUFEN; stufe++) {
    const stelle = (stufe / (SKALENSTUFEN - 1)) * letzte;
    const unten = Math.min(Math.floor(stelle), letzte - 1);
    const anteil = stelle - unten;

    for (let kanal = 0; kanal < 3; kanal++) {
      skala[stufe * 3 + kanal] =
        stuetzstellen[unten][kanal] +
        anteil * (stuetzstellen[unten + 1][kanal] - stuetzstellen[unten][kanal]);
    }
  }

  return skala;
}

/** '#3987e5' → [57, 135, 229] */
function alsRgb(hex) {
  const zahl = Number.parseInt(hex.slice(1), 16);
  return [(zahl >> 16) & 255, (zahl >> 8) & 255, zahl & 255];
}
