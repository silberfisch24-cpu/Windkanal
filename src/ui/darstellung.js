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
 *      und sonst nirgends — auch für die Teilchen, die darüber liegen.
 *   2. **Zahl in Farbe.** Über eine feste Skala, nicht über den größten Wert
 *      des jeweiligen Bildes — siehe `FARBFELDER` unten.
 *
 * Seit Etappe 3.3 gibt es drei Farbfelder statt einem. Sie unterscheiden sich
 * nicht nur in der Größe, die sie zeigen, sondern in der Art der Skala:
 *
 *   - **Geschwindigkeit** kennt kein Vorzeichen — null ist der eine Rand, schnell
 *     der andere. Dafür ist eine **einseitige** Skala richtig: ein Farbton, hell
 *     nach dunkel.
 *   - **Druck und Wirbelstärke** haben ein Vorzeichen, und die Null ist ihre
 *     natürliche Mitte (Ruhedruck, keine Drehung). Dafür ist eine **zweiseitige**
 *     Skala richtig: zwei Farbtöne, die von einer hellen Mitte aus in beide
 *     Richtungen dunkler werden. So liegt die Stärke wieder in der Helligkeit
 *     und die Richtung im Farbton — und man sieht auf einen Blick, wo die Größe
 *     ihr Vorzeichen wechselt. Eine einseitige Skala müsste das Vorzeichen
 *     unterschlagen oder in die Helligkeit stecken, wo es nicht hingehört.
 */

import { FLUID, AUFLOESUNGEN } from '../kern/loeser.js';
import { erzeugeTeilchen } from './teilchen.js';

/**
 * Die Farbskala für die **Geschwindigkeit**: ein Farbton, hell nach dunkel.
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
const FARBEN_TEMPO = [
  '#cde2fb', '#b7d3f6', '#9ec5f4', '#86b6ef', '#6da7ec', '#5598e7', '#3987e5',
  '#2a78d6', '#256abf', '#1c5cab', '#184f95', '#104281', '#0d366b',
];

/**
 * Die Farbskala für den **Druck**: blau — hell — rot, von Unterdruck über den
 * Ruhedruck zum Überdruck.
 *
 * Rot für den Stau vor dem Körper und Blau für den Sog dahinter folgt der
 * gewohnten Leserichtung „warm ist viel, kalt ist wenig". Beide Töne sind auch
 * bei den häufigen Farbsehschwächen (Rot- und Grünblindheit) auseinanderzuhalten,
 * anders als ein Rot-Grün-Paar; und wer gar keine Farben unterscheidet, liest die
 * Stärke weiterhin an der Helligkeit ab. Aus einer geprüften zweiseitigen Skala.
 */
const FARBEN_DRUCK = [
  '#053061', '#2166ac', '#4393c3', '#92c5de', '#d1e5f0', '#f7f7f7',
  '#fddbc7', '#f4a582', '#d6604d', '#b2182b', '#67001f',
];

/**
 * Die Farbskala für die **Wirbelstärke**: violett — hell — orange, von der
 * Drehung mit dem Uhrzeigersinn über die drehungsfreie Strömung zur Drehung
 * dagegen.
 *
 * Ein **anderes** Farbpaar als beim Druck, obwohl beide Skalen gleich gebaut
 * sind: Sonst sähen die zwei Ansichten auf den ersten Blick gleich aus, und man
 * müsste jedes Mal am Untertitel nachlesen, welche gerade läuft. Auch dieses
 * Paar ist bei Rot- und Grünblindheit unterscheidbar.
 */
const FARBEN_WIRBEL = [
  '#2d004b', '#542788', '#8073ac', '#b2abd2', '#d8daeb', '#f7f7f7',
  '#fee0b6', '#fdb863', '#e08214', '#b35806', '#7f3b08',
];

/**
 * Wände — Boden, Decke und das Hindernis — bekommen ein neutrales Grau statt
 * einer Farbe aus der Skala. Sonst erschiene das Hindernis, in dem alle drei
 * Größen null sind, als besonders langsam strömende Luft, als Stelle mit
 * Ruhedruck oder als drehungsfreies Gebiet.
 */
const WANDFARBE = [107, 106, 100]; // #6b6a64

/** Wie fein jede Skala vorab in Farben zerlegt wird. */
const SKALENSTUFEN = 256;

/**
 * Die drei Farbfelder mit ihren Skalengrenzen.
 *
 * **Alle drei Grenzen hängen am Wind und werden je Bild neu ausgerechnet**, nicht
 * am größten Wert des jeweiligen Einzelbildes. Eine mitwandernde Grenze änderte
 * die Bedeutung der Farben sechzigmal je Sekunde: das ganze Bild flackerte,
 * obwohl sich die Strömung kaum ändert. Am Wind müssen sie dagegen hängen, weil
 * er sich seit Etappe 3.1 im Lauf verstellen lässt — eine feste Zahl wäre nach
 * jeder Reglerbewegung falsch, und das Bild würde durchweg hell oder durchweg
 * dunkel.
 *
 * Womit die Grenze wächst, ist je Größe verschieden und nicht geraten, sondern
 * aus dem Verfahren abgeleitet und nachgemessen (4000 Schritte, vier Szenen,
 * alle drei Auflösungsstufen, Wind 30 % und 100 % — siehe Änderungsverlauf in
 * `SPEC.md` zum 2026-08-01):
 *
 *   - **Geschwindigkeit** wächst geradewegs mit dem Wind. Das Doppelte deckt ab,
 *     was an der Körperkante auftritt: dort wird die Luft auf gut das Doppelte
 *     beschleunigt.
 *   - **Druck** wächst mit dem **Quadrat** des Windes — Staudruck ist ½·ρ·u².
 *     Gemessen liegt das 99,5-%-Band bei 0,3 bis 2,1 · u²; 2 · u² deckt das ab.
 *   - **Wirbelstärke** ist eine Scherung, also Geschwindigkeit **je Zelle**: sie
 *     wächst mit dem Wind und fällt mit der Feinheit des Gitters, denn auf einem
 *     feineren Gitter verteilt sich dieselbe Scherung auf mehr Zellen. Deshalb
 *     steht der Faktor der Stufe im Nenner. Dass das stimmt, zeigt die Messung:
 *     das 99,5-%-Band liegt in allen drei Stufen bei 0,26 / 0,27 / 0,28 · u/f,
 *     ohne den Faktor liefe es um das Doppelte auseinander.
 *
 * Was über die Grenze hinausgeht, bleibt am Skalenende stehen. Das betrifft
 * überall dieselben wenigen Stellen — die Kante des Körpers und die
 * Grenzschicht am Boden —, und ihnen zuliebe die Skala so weit aufzuziehen,
 * dass sie hineinpassen, machte den ganzen Rest des Bildes farblos.
 */
const FARBFELDER = {
  tempo: {
    farben: FARBEN_TEMPO,
    zweiseitig: false,
    grenze: (kanal) => 2 * kanal.windgeschwindigkeit,
  },
  druck: {
    farben: FARBEN_DRUCK,
    zweiseitig: true,
    grenze: (kanal) => 2 * kanal.windgeschwindigkeit * kanal.windgeschwindigkeit,
  },
  wirbelstaerke: {
    farben: FARBEN_WIRBEL,
    zweiseitig: true,
    grenze: (kanal) => (0.5 * kanal.windgeschwindigkeit) / faktorVon(kanal),
  },
};

/** Die Ansicht, mit der die Seite aufgeht. */
export const ANFANGSANSICHT = 'tempo';

/**
 * Wie viele Bildpunkte der Zeichenfläche auf eine Gitterzelle kommen.
 *
 * Bis Etappe 3.2 war das genau einer, und für das Farbfeld ist es das
 * weiterhin: Es wird nach wie vor mit einem Bildpunkt je Zelle gemalt und
 * anschließend vergrößert — an dem, was der Nutzer vom Farbfeld sieht, ändert
 * sich dadurch nichts.
 *
 * Die **Teilchenstriche** aber sind Linien und keine Zellen. Auf einer Fläche
 * von 200 Punkten Breite, die der Browser auf gut 900 Punkte zieht, ist der
 * dünnste zeichenbare Strich fünf Bildschirmpunkte breit und verwischt dabei:
 * Aus Strichen wurden Flecken — im ersten Versuch am 2026-08-01 genau so
 * gesehen. Mit vier Punkten je Zelle sind die Striche fein genug, um Richtung
 * und Länge zu zeigen. Mehr bringt nichts mehr und kostet Zeichenfläche.
 */
const FEINHEIT = 4;

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

  zeichenflaeche.width = breite * FEINHEIT;
  zeichenflaeche.height = hoehe * FEINHEIT;
  const stift = zeichenflaeche.getContext('2d');

  // Das Farbfeld entsteht weiterhin mit einem Bildpunkt je Zelle — auf einer
  // eigenen, unsichtbaren Fläche, weil `putImageData` nicht vergrößern kann und
  // Vergrößerung und Glättung ignoriert. Von dort wird es in einem Zug auf die
  // sichtbare Fläche gezogen; den Rest der Vergrößerung besorgt wie bisher der
  // Browser über die Formatvorlage.
  const feldflaeche = document.createElement('canvas');
  feldflaeche.width = breite;
  feldflaeche.height = hoehe;
  const feldstift = feldflaeche.getContext('2d');
  const bild = feldstift.createImageData(breite, hoehe);
  const bildpunkte = bild.data;

  // Je Ansicht eine fertig zerlegte Skala. Alle drei einmalig beim Einrichten,
  // weil das Umschalten sonst jedes Mal 256 Farben neu mischen müsste.
  const skalen = Object.fromEntries(
    Object.entries(FARBFELDER).map(([name, ansicht]) => [name, baueSkala(ansicht.farben)])
  );

  const teilchen = erzeugeTeilchen(kanal, faktorVon(kanal));

  return {
    /** Setzt den Teilchenschwarm neu — nach Formwechsel oder Zurücksetzen. */
    saeeTeilchenNeu: teilchen.saeeNeu,

    /**
     * Malt ein Einzelbild aus den zuletzt gelesenen Feldern.
     *
     * @param {object} felder  Ergebnis von `leseFelder`
     * @param {object} stand
     * @param {string} stand.ansicht    'tempo', 'druck' oder 'wirbelstaerke'
     * @param {boolean} stand.teilchen  ob die Teilchen darüber liegen
     * @param {number} stand.schritte   gerechnete Schritte seit dem letzten Bild
     */
    zeichne(felder, { ansicht, teilchen: mitTeilchen, schritte = 0 }) {
      const gewaehlt = FARBFELDER[ansicht];
      if (gewaehlt === undefined) {
        throw new Error(`Unbekannte Ansicht: ${ansicht}`);
      }

      const werte = felder[ansicht];
      const skala = skalen[ansicht];
      const grenze = gewaehlt.grenze(kanal);
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

          // Einseitig: 0 … grenze auf die ganze Skala. Zweiseitig: −grenze …
          // +grenze, die Null landet damit genau in der Mitte.
          const anteil = gewaehlt.zweiseitig
            ? (werte[zelle] / grenze + 1) / 2
            : werte[zelle] / grenze;

          let stufe = Math.round(anteil * (SKALENSTUFEN - 1));
          if (stufe < 0) stufe = 0;
          if (stufe > SKALENSTUFEN - 1) stufe = SKALENSTUFEN - 1;

          const farbe = stufe * 3;
          bildpunkte[ziel] = skala[farbe];
          bildpunkte[ziel + 1] = skala[farbe + 1];
          bildpunkte[ziel + 2] = skala[farbe + 2];
          bildpunkte[ziel + 3] = 255;
        }
      }

      feldstift.putImageData(bild, 0, 0);
      stift.setTransform(1, 0, 0, 1, 0, 0);
      stift.imageSmoothingEnabled = true;
      stift.drawImage(feldflaeche, 0, 0, breite * FEINHEIT, hoehe * FEINHEIT);

      if (!mitTeilchen) return;

      teilchen.treibe(felder, schritte);

      // Die Teilchen rechnen in Zellen und in den Koordinaten des Kerns, y also
      // vom Boden nach oben. Statt jeden Punkt einzeln umzurechnen, wird die
      // Zeichenfläche für den Augenblick auf Zellenmaß gestellt und dabei
      // umgedreht — das hält die Umkehrung an dieser einen Stelle, wie oben
      // zugesagt, und die Strichstärken bleiben in Zellen angebbar.
      stift.save();
      stift.setTransform(FEINHEIT, 0, 0, -FEINHEIT, 0, hoehe * FEINHEIT);
      teilchen.zeichne(stift, felder, kanal.windgeschwindigkeit);
      stift.restore();
    },
  };
}

/**
 * Wie viele Zellen einer groben Zelle entsprechen. Für einen Kanal mit eigenen
 * Maßen — den es nur in den Prüfskripten gibt — gilt 1.
 */
function faktorVon(kanal) {
  const stufe = AUFLOESUNGEN[kanal.aufloesung];
  return stufe === undefined ? 1 : stufe.faktor;
}

/**
 * Zerlegt eine Farbskala einmalig in 256 fertige Farben. Die Mischung je
 * Bildpunkt auszurechnen wäre bei bis zu 48.000 Zellen und 60 Bildern je
 * Sekunde unnötige Arbeit — nachgeschlagen wird sie in einem Schritt.
 */
function baueSkala(farben) {
  const stuetzstellen = farben.map(alsRgb);
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
