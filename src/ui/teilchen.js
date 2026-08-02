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
 * **Links hinein, rechts hinaus.** Ein Teilchen entsteht am Einlass und
 * verschwindet nur am Auslass — sonst nirgends. Es taucht nicht mitten im Bild
 * auf und löst sich nicht mitten im Bild auf; was man sieht, ist durchgehend
 * der Weg, den die Luft von vorn nach hinten nimmt. Gerät ein Teilchen an eine
 * Wand, bleibt es stehen, statt zu verschwinden: die Wand ist ein Hindernis auf
 * dem Weg, kein Ausgang.
 *
 * **Eine Ausnahme, und sie ist unsichtbar.** Hinter einem stumpfen Körper steht
 * die Luft nahezu still. Was dort hineingerät, käme nie wieder heraus: gemessen
 * waren nach einer Minute Lauf je nach Form 14 bis 26 % des Schwarms dort
 * versackt, und der Kanal dahinter lief allmählich leer. Deshalb wird ein
 * Teilchen, das **so langsam ist, dass ohnehin kein Strich mehr gezeichnet
 * wird**, nach einer Weile am Einlass neu angesetzt. Die Grenze ist genau
 * dieselbe, die über das Zeichnen entscheidet — es verschwindet also nie etwas,
 * das zu sehen war. Ein Teilchen, das langsam, aber sichtbar weiterzieht,
 * bleibt beliebig lange unterwegs.
 *
 * Beim Start und nach jeder Änderung an der Szene werden sie **über die
 * Kanallänge verteilt** gesetzt. Das ist keine Ausnahme von der Regel, sondern
 * genau der Zustand, den das Einströmen nach kurzer Zeit von selbst herstellt —
 * setzte man alle vorn an, sähe man erst ein leeres Bild und dann einen
 * geschlossenen Vorhang durchziehen.
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
 * Über wie viele Spalten hinter dem Einlass ein neu entstehendes Teilchen
 * gestreut wird.
 *
 * Genau auf die Einlassspalte gesetzt kämen die Teilchen im Gleichschritt und
 * bildeten sichtbare Reihen. Ein paar Zellen Streuung genügen, damit sie
 * unregelmäßig eintreffen, ohne dass es aussähe, als entstünden sie mitten im
 * Bild.
 */
const EINLASSTIEFE = 4;

/**
 * Wie viele Einzelbilder ein Teilchen unsichtbar langsam sein darf, bevor es
 * am Einlass neu angesetzt wird.
 *
 * Vier Sekunden bei 60 Bildern je Sekunde. Kürzer, und ein Teilchen, das nur
 * kurz in eine ruhige Ecke gerät, würde schon eingesammelt; länger, und der
 * Nachlauf setzt sich wieder zu. Gezählt wird nur, solange es ununterbrochen
 * zu langsam ist — jede sichtbare Bewegung setzt den Zähler zurück.
 */
const GEDULD = 240;

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
  /** Wie viele Bilder in Folge dieses Teilchen schon unsichtbar langsam ist. */
  const stillstand = new Int32Array(ANZAHL);

  saeeAlle();

  /**
   * Wie lang der Strich zu diesem Tempo wird — 0, wenn er zu kurz zum Zeichnen
   * wäre.
   *
   * Steht an einer Stelle, weil zwei Dinge daran hängen: was gezeichnet wird
   * und was als festgesetzt gilt. Zwei getrennte Grenzen liefen früher oder
   * später auseinander, und dann verschwänden entweder sichtbare Teilchen oder
   * unsichtbare blieben liegen.
   */
  function strichlaenge(tempo, windgeschwindigkeit) {
    const anteil = Math.min(1, tempo / (TEMPO_OBERGRENZE * windgeschwindigkeit));
    const laenge = anteil * STRICHLAENGE * faktor;
    return laenge < STRICHLAENGE_MINDESTENS ? 0 : laenge;
  }

  /**
   * Verteilt alle Teilchen über den Kanal — beim Anlegen und nach jeder
   * Änderung an der Szene. Die x-Stelle ist dabei zufällig über die ganze
   * Länge gestreut, weil das der Zustand ist, den das Einströmen ohnehin
   * herstellt (siehe oben).
   */
  function saeeAlle() {
    for (let n = 0; n < ANZAHL; n++) {
      if (!setzeIrgendwo(n)) setzeAmEinlass(n);
    }
  }

  /**
   * Setzt ein Teilchen an den Einlass — der einzige Ort, an dem im Lauf welche
   * entstehen. In der Höhe zufällig, in der Länge über die ersten Spalten
   * gestreut.
   *
   * Die Einlassspalte selbst ist immer frei: der Kern weist eine Form zurück,
   * die den Einlass berührt. Trotzdem wird geprüft, damit ein Teilchen nicht
   * unbemerkt in einer Wand landet, wenn diese Zusage einmal fiele.
   */
  function setzeAmEinlass(n) {
    for (let versuch = 0; versuch < 20; versuch++) {
      const px = 0.5 + Math.random() * EINLASSTIEFE;
      const py = Math.random() * hoehe;
      if (istFrei(px, py)) {
        x[n] = px;
        y[n] = py;
        return true;
      }
    }
    return false;
  }

  /** Wie `setzeAmEinlass`, nur über die ganze Kanallänge — nur für den Start. */
  function setzeIrgendwo(n) {
    for (let versuch = 0; versuch < 20; versuch++) {
      const px = Math.random() * breite;
      const py = Math.random() * hoehe;
      if (istFrei(px, py)) {
        x[n] = px;
        y[n] = py;
        return true;
      }
    }
    return false;
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
     * @param {number} windgeschwindigkeit
     */
    treibe(felder, schritte, windgeschwindigkeit) {
      if (schritte <= 0) return;

      for (let n = 0; n < ANZAHL; n++) {
        const { ux, uy } = geschwindigkeitAn(felder, x[n], y[n]);

        // Zu langsam, um noch einen Strich zu ergeben? Dann mitzählen — wer zu
        // lange am Stück unsichtbar ist, steckt fest und wird unten vorn neu
        // angesetzt. Weiterbewegt wird er trotzdem: langsam ist nicht dasselbe
        // wie stehend, und ein Kriechen soll ein Kriechen bleiben.
        if (strichlaenge(Math.hypot(ux, uy), windgeschwindigkeit) === 0) {
          stillstand[n] += 1;
        } else {
          stillstand[n] = 0;
        }

        if (stillstand[n] > GEDULD) {
          setzeAmEinlass(n);
          stillstand[n] = 0;
          continue;
        }

        const naechstesX = x[n] + ux * schritte;
        const naechstesY = y[n] + uy * schritte;

        // Hinten hinaus: das Teilchen hat den Kanal durchquert und tritt vorn
        // wieder ein. Der einzige Weg, auf dem ein *sichtbares* verschwindet.
        if (naechstesX >= breite - 1) {
          setzeAmEinlass(n);
          stillstand[n] = 0;
          continue;
        }

        // Gegen eine Wand: stehen bleiben, nicht verschwinden. Die Luft
        // ringsherum trägt es im nächsten Bild in aller Regel weiter; ein
        // Auflösen an der Körperkante sähe dagegen aus, als schluckte der
        // Körper die Luft.
        if (!istFrei(naechstesX, naechstesY)) continue;

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
      stift.beginPath();
      for (let n = 0; n < ANZAHL; n++) {
        const { ux, uy } = geschwindigkeitAn(felder, x[n], y[n]);
        const tempo = Math.hypot(ux, uy);
        if (tempo === 0) continue;

        // Die Länge zeigt die Geschwindigkeit — bei voller Skalengeschwindigkeit
        // ist der Strich am längsten, in ruhiger Luft nur noch ein Stummel. Zu
        // kurz zum Zeichnen heißt zugleich „gilt als festgesetzt": eine Grenze
        // für beides, siehe `strichlaenge`.
        const laenge = strichlaenge(tempo, windgeschwindigkeit);
        if (laenge === 0) continue;

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
