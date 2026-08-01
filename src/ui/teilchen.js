/**
 * Mitströmende Teilchen — die vierte Darstellungsart.
 *
 * Diese Datei gehört zur Oberfläche. Sie rechnet zwar nur mit Zahlen, gehört
 * aber trotzdem nicht in den Kern: Teilchen sind nichts, was die Strömung
 * beeinflusst, sondern eine Art, sie anzusehen. Der Kern weiß von ihnen nichts,
 * und die Rechnung läuft ohne sie genauso.
 *
 * **Was ein Teilchen ist:** ein Punkt ohne Masse, der sich mit der Luft
 * treiben lässt. Er wird nicht mitgerechnet, sondern nachträglich über das
 * Geschwindigkeitsfeld geschoben — wie ein Papierschnipsel, den man in einen
 * echten Windkanal hält. Gezeichnet wird er als kurzer Strich in
 * Strömungsrichtung: ein einzelner Punkt zeigt nur, *wo* die Luft ist, ein
 * Strich zeigt zusätzlich, *wohin* und *wie schnell* sie geht.
 *
 * **Warum ein Teilchen wieder verschwindet:** Es läuft hinten aus dem Kanal,
 * es gerät in eine Wand — oder seine Zeit ist um. Das Letzte ist nötig, weil
 * die Luft hinter einem stumpfen Körper fast steht: ohne Ablauf sammelten sich
 * dort mit der Zeit alle Teilchen, und der Rest des Kanals liefe leer. Wer
 * abläuft, wird an einer zufälligen freien Stelle neu gesetzt, damit die
 * Verteilung gleichmäßig bleibt.
 *
 * **Die Koordinaten sind die des Kerns**, y zählt also vom Boden nach oben. Das
 * Umdrehen für die Zeichenfläche besorgt `darstellung.js` an seiner einen
 * Stelle (siehe „Bild auf dem Bildschirm" in SPEC.md) — hier wird nicht
 * gespiegelt.
 */

import { FLUID } from '../kern/loeser.js';

/**
 * Wie viele Teilchen unterwegs sind — unabhängig von der Auflösungsstufe.
 *
 * Das Bild wird in jeder Stufe auf dieselbe Bildschirmbreite gezogen. Eine feste
 * Zahl hält die Dichte auf dem Bildschirm damit gleich; an die Zellenzahl
 * gekoppelt wäre das Bild in der feinen Stufe viermal so voll, ohne dass mehr zu
 * erkennen wäre.
 */
const ANZAHL = 450;

/**
 * Wie lange ein Teilchen höchstens lebt, in Einzelbildern.
 *
 * Gezählt wird in Bildern und nicht in Rechenschritten, weil es um das Auge
 * geht: Vier Sekunden bei 60 Bildern je Sekunde sind lang genug, dass man einem
 * Teilchen um den Körper herum folgen kann, und kurz genug, dass sich im
 * Totwasser nichts festsetzt. Im angehaltenen Zustand altert nichts.
 */
const LEBENSDAUER = 240;

/**
 * Wie lang ein Strich bei voller Skalengeschwindigkeit wird, in **groben**
 * Zellen. Auf feineren Gittern wird er mit dem Faktor der Stufe hochgerechnet,
 * damit er auf dem Bildschirm gleich lang aussieht.
 */
const STRICHLAENGE = 4.5;

/** Kürzer als das wird kein Strich gezeichnet — darunter ist es ein Punkt. */
const STRICHLAENGE_MINDESTENS = 0.5;

/**
 * Strichstärken in groben Zellen: erst der dunkle Saum, dann der helle Kern.
 *
 * Beide **unter einer Zelle**, obwohl die Zeichenfläche nur eine Zelle je Punkt
 * auflösen würde: Sie kommt für die Striche mit vier Punkten je Zelle daher
 * (siehe `FEINHEIT` in `darstellung.js`). Mit einer ganzen Zelle Strichstärke
 * wären es auf dem Bildschirm gut fünf Punkte — dann sieht man Flecken statt
 * Striche und die Richtung der Strömung geht verloren.
 */
const SAUMSTAERKE = 0.9;
const KERNSTAERKE = 0.35;

/**
 * Zwei Striche übereinander statt einem.
 *
 * Ein Teilchen muss über hellen wie über dunklen Feldstellen zu sehen sein, und
 * über den zweiseitigen Skalen kommt beides im selben Bild vor. Eine einzelne
 * Farbe kann das nicht: Weiß verschwindet in der hellen Mitte der Druckskala,
 * Schwarz im dunklen Rand der Geschwindigkeitsskala. Der dunkle Saum unter dem
 * hellen Kern trägt in beiden Fällen.
 */
const SAUMFARBE = 'rgba(24, 24, 24, 0.55)';
const KERNFARBE = 'rgba(255, 255, 255, 0.92)';

/**
 * Bis zu welcher Geschwindigkeit die Strichlänge wächst, als Vielfaches der
 * Windgeschwindigkeit. Derselbe Wert wie die Obergrenze der Farbskala für die
 * Geschwindigkeit — so bedeutet ein Strich in voller Länge dasselbe wie die
 * dunkelste Farbe.
 */
const TEMPO_OBERGRENZE = 2;

/**
 * Legt einen Teilchenschwarm für einen Kanal an.
 *
 * @param {object} kanal   der Kanal aus `loeser.js`
 * @param {number} faktor  Zellen je grober Zelle in dieser Auflösungsstufe
 */
export function erzeugeTeilchen(kanal, faktor = 1) {
  const { breite, hoehe } = kanal;

  const x = new Float64Array(ANZAHL);
  const y = new Float64Array(ANZAHL);
  const restzeit = new Int32Array(ANZAHL);

  saeeAlle();

  /**
   * Setzt alle Teilchen neu — beim Anlegen und immer dann, wenn sich die Szene
   * geändert hat. Die Lebenszeiten werden dabei zufällig gestreut, sonst liefen
   * sie später alle im selben Bild ab und der Schwarm blinkte im Takt.
   */
  function saeeAlle() {
    for (let n = 0; n < ANZAHL; n++) {
      setzeNeu(n);
      restzeit[n] = 1 + Math.floor(Math.random() * LEBENSDAUER);
    }
  }

  /**
   * Setzt ein einzelnes Teilchen an eine zufällige freie Stelle.
   *
   * Gleichverteilt über den ganzen Kanal statt am Einlass: Wer vorne einsetzt,
   * bekommt eine gleichmäßige Anströmung, lässt den Nachlauf hinter dem Körper
   * aber leer, solange sich die Teilchen dort erst hineinarbeiten müssen.
   * Versucht wird eine begrenzte Zahl von Malen — findet sich keine freie
   * Stelle, bleibt das Teilchen, wo es ist, und wird im nächsten Bild wieder
   * eingesammelt. (Ein Kanal, der ganz aus Wand besteht, kann nicht vorkommen:
   * der Kern weist eine Form zurück, die Einlass, Auslass oder Decke berührt.)
   */
  function setzeNeu(n) {
    for (let versuch = 0; versuch < 20; versuch++) {
      const px = Math.random() * breite;
      const py = Math.random() * hoehe;
      if (istFrei(px, py)) {
        x[n] = px;
        y[n] = py;
        restzeit[n] = LEBENSDAUER;
        return;
      }
    }
    restzeit[n] = LEBENSDAUER;
  }

  function istFrei(px, py) {
    const zx = Math.floor(px);
    const zy = Math.floor(py);
    if (zx < 0 || zx >= breite || zy < 0 || zy >= hoehe) return false;
    return kanal.zellart[zx + zy * breite] === FLUID;
  }

  /**
   * Liest die Geschwindigkeit an einer beliebigen Stelle zwischen den Zellen ab.
   *
   * Zwischen den vier umliegenden Zellen wird gemischt, statt einfach die
   * nächstgelegene zu nehmen. Ohne das Mischen springt ein Teilchen beim
   * Übertritt von Zelle zu Zelle in der Richtung, und die Bahnen sähen eckig
   * aus, obwohl die Strömung glatt ist. Der Mittelpunkt der Zelle `i` liegt bei
   * `i + 0,5` — daher der halbe Zellenversatz.
   */
  function geschwindigkeitAn(felder, px, py) {
    const gx = px - 0.5;
    const gy = py - 0.5;

    let x0 = Math.floor(gx);
    let y0 = Math.floor(gy);
    const anteilX = gx - x0;
    const anteilY = gy - y0;

    if (x0 < 0) x0 = 0;
    if (y0 < 0) y0 = 0;
    const x1 = Math.min(x0 + 1, breite - 1);
    const y1 = Math.min(y0 + 1, hoehe - 1);
    x0 = Math.min(x0, breite - 1);
    y0 = Math.min(y0, hoehe - 1);

    const untenLinks = x0 + y0 * breite;
    const untenRechts = x1 + y0 * breite;
    const obenLinks = x0 + y1 * breite;
    const obenRechts = x1 + y1 * breite;

    const gegenX = 1 - anteilX;
    const gegenY = 1 - anteilY;
    const gewichtUL = gegenX * gegenY;
    const gewichtUR = anteilX * gegenY;
    const gewichtOL = gegenX * anteilY;
    const gewichtOR = anteilX * anteilY;

    return {
      ux:
        felder.ux[untenLinks] * gewichtUL +
        felder.ux[untenRechts] * gewichtUR +
        felder.ux[obenLinks] * gewichtOL +
        felder.ux[obenRechts] * gewichtOR,
      uy:
        felder.uy[untenLinks] * gewichtUL +
        felder.uy[untenRechts] * gewichtUR +
        felder.uy[obenLinks] * gewichtOL +
        felder.uy[obenRechts] * gewichtOR,
    };
  }

  return {
    /** Setzt den ganzen Schwarm neu — nach Formwechsel oder Zurücksetzen. */
    saeeNeu: saeeAlle,

    /**
     * Schiebt alle Teilchen um die Strecke weiter, die die Luft in diesem Bild
     * zurückgelegt hat.
     *
     * Weitergeschoben wird um `ux · schritte`, nicht um `ux` allein: In einem
     * Einzelbild rechnet die Seite so viele Schritte, wie in ihr Zeitbudget
     * passen (siehe „Takt der Bildschleife" in SPEC.md). Zöge man das nicht
     * heran, trieben die Teilchen auf einem schnellen Rechner viel langsamer als
     * die Strömung, die sie zeigen sollen. Innerhalb eines Bildes steht das
     * Geschwindigkeitsfeld ohnehin still, ein Zwischenschritt brächte also
     * nichts.
     *
     * @param {object} felder    Ergebnis von `leseFelder`
     * @param {number} schritte  gerechnete Schritte seit dem letzten Bild
     */
    treibe(felder, schritte) {
      if (schritte <= 0) return;

      for (let n = 0; n < ANZAHL; n++) {
        restzeit[n] -= 1;
        if (restzeit[n] <= 0) {
          setzeNeu(n);
          continue;
        }

        const { ux, uy } = geschwindigkeitAn(felder, x[n], y[n]);
        const naechstesX = x[n] + ux * schritte;
        const naechstesY = y[n] + uy * schritte;

        if (!istFrei(naechstesX, naechstesY)) {
          setzeNeu(n);
          continue;
        }

        x[n] = naechstesX;
        y[n] = naechstesY;
      }
    },

    /**
     * Zeichnet alle Teilchen als kurze Striche.
     *
     * Alle Striche kommen in **einen** Pfad und werden zweimal gezogen — einmal
     * breit und dunkel, einmal schmal und hell. Strich für Strich einzeln wären
     * das 1200 Zeichenbefehle je Bild statt zweien; bei 60 Bildern je Sekunde
     * ist das der Unterschied zwischen unauffällig und spürbar.
     *
     * Der Stift steht dabei bereits im Koordinatensystem des Kerns — das
     * Umdrehen von oben und unten hat `darstellung.js` besorgt.
     *
     * @param {CanvasRenderingContext2D} stift
     * @param {object} felder
     * @param {number} windgeschwindigkeit
     */
    zeichne(stift, felder, windgeschwindigkeit) {
      const vollesTempo = TEMPO_OBERGRENZE * windgeschwindigkeit;
      const hoechstlaenge = STRICHLAENGE * faktor;

      stift.beginPath();
      for (let n = 0; n < ANZAHL; n++) {
        const { ux, uy } = geschwindigkeitAn(felder, x[n], y[n]);
        const tempo = Math.hypot(ux, uy);
        if (tempo === 0) continue;

        // Die Länge zeigt die Geschwindigkeit — bei voller Skalengeschwindigkeit
        // ist der Strich am längsten, in ruhiger Luft nur noch ein Stummel.
        const laenge = Math.min(1, tempo / vollesTempo) * hoechstlaenge;
        if (laenge < STRICHLAENGE_MINDESTENS) continue;

        // Der Strich liegt **hinter** dem Teilchen: er zeigt, wo es herkam,
        // und läuft an seiner gegenwärtigen Stelle aus. Vorweg gezeichnet
        // liefe er dem Teilchen voraus und behauptete einen Weg, den es noch
        // nicht genommen hat.
        stift.moveTo(x[n] - (ux / tempo) * laenge, y[n] - (uy / tempo) * laenge);
        stift.lineTo(x[n], y[n]);
      }

      stift.lineCap = 'round';
      stift.lineWidth = SAUMSTAERKE * faktor;
      stift.strokeStyle = SAUMFARBE;
      stift.stroke();
      stift.lineWidth = KERNSTAERKE * faktor;
      stift.strokeStyle = KERNFARBE;
      stift.stroke();
    },
  };
}
