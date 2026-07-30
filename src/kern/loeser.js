/**
 * Strömungsrechnung im Kanal — Lattice-Boltzmann-Verfahren (D2Q9).
 *
 * Reine Zahlenrechnung. Diese Datei kennt weder Browser noch Bildschirm und ruft
 * nichts aus `src/ui/` auf (siehe „Trennung Fachlogik / Darstellung" in SPEC.md).
 *
 * Gedankenmodell: Das Gitter speichert nicht Geschwindigkeit, sondern neun
 * Teilchenanteile je Zelle — einen ruhenden und acht, die in die acht Nachbarn
 * zeigen. Ein Rechenschritt besteht aus zwei Hälften:
 *   1. Stoßen  — die neun Anteile einer Zelle gleichen sich ihrem Ruhezustand an
 *   2. Strömen — jeder Anteil rückt eine Zelle in seine Richtung weiter
 * Geschwindigkeit und Dichte werden daraus abgelesen, nicht gespeichert.
 *
 * Koordinaten: x läuft nach rechts (Strömungsrichtung), y nach oben.
 * y = 0 ist der Boden, y = hoehe - 1 die Decke. Zellindex: i = x + y * breite.
 * Alle Größen in Gittereinheiten (eine Zelle, ein Zeitschritt).
 */

import { liegtInForm, ausdehnung, pruefeForm } from './formen.js';

// Die neun Richtungen: 0 ruhend, 1–4 gerade, 5–8 diagonal.
const RICHTUNG_X = [0, 1, 0, -1, 0, 1, -1, -1, 1];
const RICHTUNG_Y = [0, 0, 1, 0, -1, 1, 1, -1, -1];

// Wie stark jede Richtung im Ruhezustand vertreten ist. Summe = 1.
const GEWICHT = [4 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 36, 1 / 36, 1 / 36, 1 / 36];

// Gegenrichtung — für den Rückprall an der Haftwand: was ankommt, geht zurück.
const GEGENRICHTUNG = [0, 3, 4, 1, 2, 7, 8, 5, 6];

// An einer waagerechten Wand gespiegelte Richtung — für die Gleitwand:
// die Aufwärtskomponente kehrt sich um, die Vorwärtskomponente bleibt.
const SPIEGELUNG_WAAGERECHT = [0, 1, 4, 3, 2, 8, 7, 6, 5];

/** Zellarten. */
export const FLUID = 0;
export const HAFTWAND = 1; // Luft haftet an ihr — erzeugt die Grenzschicht
export const GLEITWAND = 2; // Luft gleitet reibungsfrei entlang

/** Ruhezustand einer Richtung bei gegebener Dichte und Geschwindigkeit. */
function ruhezustand(richtung, dichte, ux, uy) {
  const projektion = 3 * (RICHTUNG_X[richtung] * ux + RICHTUNG_Y[richtung] * uy);
  const tempo = 1.5 * (ux * ux + uy * uy);
  return GEWICHT[richtung] * dichte * (1 + projektion + 0.5 * projektion * projektion - tempo);
}

/**
 * Legt einen leeren Kanal an: Boden haftend, Decke gleitend, überall die
 * vorgegebene Windgeschwindigkeit.
 *
 * @param {object} einstellungen
 * @param {number} einstellungen.breite   Zellen in Strömungsrichtung
 * @param {number} einstellungen.hoehe    Zellen vom Boden zur Decke
 * @param {number} einstellungen.windgeschwindigkeit  in Zellen je Zeitschritt
 * @param {number} einstellungen.zaehigkeit           Zähigkeit der Luft
 * @param {object|null} einstellungen.hindernis       siehe `setzeHindernis`
 */
export function erzeugeKanal({
  breite = 200,
  hoehe = 60,
  windgeschwindigkeit = 0.1,
  zaehigkeit = 0.01,
  hindernis = null,
} = {}) {
  if (breite < 3 || hoehe < 3) {
    throw new Error('Der Kanal braucht mindestens 3 × 3 Zellen.');
  }
  if (zaehigkeit <= 0) {
    throw new Error('Die Zähigkeit muss größer als null sein.');
  }

  const anzahlZellen = breite * hoehe;

  // Wie schnell sich eine Zelle ihrem Ruhezustand annähert. Aus der Zähigkeit
  // abgeleitet; muss über 0,5 liegen, sonst schaukelt sich die Rechnung auf.
  const angleichzeit = 3 * zaehigkeit + 0.5;

  const kanal = {
    breite,
    hoehe,
    windgeschwindigkeit,
    zaehigkeit,
    angleichzeit,
    hindernis: null,
    zellart: new Uint8Array(anzahlZellen),
    anteile: new Float64Array(9 * anzahlZellen),
    anteileNeu: new Float64Array(9 * anzahlZellen),
    schrittzahl: 0,
  };

  setzeHindernis(kanal, hindernis);
  return kanal;
}

/**
 * Setzt ein Hindernis in den Kanal — oder räumt ihn mit `null` wieder leer.
 * Die Rechnung beginnt danach von vorn; ein Hindernis mitten im Lauf
 * einzuwechseln wäre sonst ein Sprung, den die Strömung nicht verkraftet.
 *
 * Wie eine Form beschrieben wird, steht in `formen.js`.
 *
 * Hinderniszellen sind Haftwand — dieselbe Wandart wie der Boden. Die Luft
 * strömt also nicht hindurch, sondern prallt zurück und haftet an der Form.
 */
export function setzeHindernis(kanal, hindernis = null) {
  kanal.hindernis = hindernis;
  baueZellarten(kanal);
  setzeAufAnfangszustand(kanal);
}

/** Trägt Boden, Decke und das Hindernis in die Zellarten ein. */
function baueZellarten(kanal) {
  const { breite, hoehe, zellart, hindernis } = kanal;

  zellart.fill(FLUID);
  for (let x = 0; x < breite; x++) {
    zellart[x] = HAFTWAND; // y = 0
    zellart[x + (hoehe - 1) * breite] = GLEITWAND;
  }

  if (hindernis === null) return;
  pruefeForm(hindernis);

  // Ein- und Auslass werden in jedem Schritt neu gesetzt; ein Hindernis, das
  // bis dorthin reicht, würde stillschweigend überschrieben. Lieber melden.
  const kanten = ausdehnung(hindernis);
  if (kanten.links < 1 || kanten.rechts > breite - 2) {
    throw new Error('Das Hindernis reicht bis an den Einlass oder den Auslass.');
  }

  let zellenImHindernis = 0;
  for (let y = 1; y < hoehe - 1; y++) {
    for (let x = 1; x < breite - 1; x++) {
      if (!liegtInForm(hindernis, x, y)) continue;
      zellart[x + y * breite] = HAFTWAND;
      zellenImHindernis++;
    }
  }
  if (zellenImHindernis === 0) {
    throw new Error('Das Hindernis deckt keine einzige Zelle ab — zu klein oder außerhalb des Kanals.');
  }
}

/**
 * Setzt den Kanal zurück: überall Dichte 1, in der Luft die volle
 * Windgeschwindigkeit, in den Wänden Ruhe.
 *
 * Auch die Wandzellen werden gefüllt, obwohl in ihnen nichts gerechnet wird:
 * sonst stünde dort die Dichte null, und ein Blick ins Hindernis lieferte statt
 * „steht still" einen ungültigen Wert (null geteilt durch null).
 */
export function setzeAufAnfangszustand(kanal) {
  const { breite, hoehe, windgeschwindigkeit, zellart, anteile, anteileNeu } = kanal;
  const anzahlZellen = breite * hoehe;

  for (let zelle = 0; zelle < anzahlZellen; zelle++) {
    const ux = zellart[zelle] === FLUID ? windgeschwindigkeit : 0;
    for (let richtung = 0; richtung < 9; richtung++) {
      const menge = ruhezustand(richtung, 1, ux, 0);
      anteile[richtung * anzahlZellen + zelle] = menge;
      anteileNeu[richtung * anzahlZellen + zelle] = menge;
    }
  }
  kanal.schrittzahl = 0;
}

/**
 * Ein Rechenschritt: stoßen, strömen, Ränder nachziehen.
 * Der Zustand ist nach jedem Schritt vollständig gültig und ablesbar.
 */
export function schritt(kanal) {
  stossen(kanal);
  stroemen(kanal);
  setzeEinUndAuslass(kanal);
  kanal.schrittzahl++;
}

/** Führt mehrere Rechenschritte hintereinander aus. */
export function schritte(kanal, anzahl) {
  for (let n = 0; n < anzahl; n++) schritt(kanal);
}

/** Erste Hälfte: Jede Zelle gleicht ihre neun Anteile ihrem Ruhezustand an. */
function stossen(kanal) {
  const { breite, hoehe, zellart, anteile, angleichzeit } = kanal;
  const anzahlZellen = breite * hoehe;
  const anteilNeu = 1 / angleichzeit;

  for (let zelle = 0; zelle < anzahlZellen; zelle++) {
    if (zellart[zelle] !== FLUID) continue;

    let dichte = 0;
    let impulsX = 0;
    let impulsY = 0;
    for (let richtung = 0; richtung < 9; richtung++) {
      const menge = anteile[richtung * anzahlZellen + zelle];
      dichte += menge;
      impulsX += menge * RICHTUNG_X[richtung];
      impulsY += menge * RICHTUNG_Y[richtung];
    }

    const ux = impulsX / dichte;
    const uy = impulsY / dichte;

    for (let richtung = 0; richtung < 9; richtung++) {
      const stelle = richtung * anzahlZellen + zelle;
      anteile[stelle] += anteilNeu * (ruhezustand(richtung, dichte, ux, uy) - anteile[stelle]);
    }
  }
}

/**
 * Zweite Hälfte: Jeder Anteil rückt eine Zelle weiter.
 *
 * Gerechnet wird von der Zielzelle aus („woher kommt das, was hier ankommt?"),
 * weil sich die Wände so ohne Sonderfälle einbauen lassen:
 *   - Nachbar ist Fluid    → der Anteil kommt von dort
 *   - Nachbar ist Haftwand → der eigene Anteil prallt zurück (Luft haftet)
 *   - Nachbar ist Gleitwand → der eigene Anteil wird gespiegelt (Luft gleitet)
 */
function stroemen(kanal) {
  const { breite, hoehe, zellart, anteile, anteileNeu } = kanal;
  const anzahlZellen = breite * hoehe;

  for (let y = 1; y < hoehe - 1; y++) {
    for (let x = 1; x < breite - 1; x++) {
      const zelle = x + y * breite;

      // In einer Wandzelle strömt nichts. Ihr Inhalt wird unverändert
      // übernommen, damit dort weiterhin ruhende Luft abzulesen ist statt
      // dessen, was zufällig aus der Nachbarschaft hineingelaufen wäre.
      if (zellart[zelle] !== FLUID) {
        for (let richtung = 0; richtung < 9; richtung++) {
          anteileNeu[richtung * anzahlZellen + zelle] = anteile[richtung * anzahlZellen + zelle];
        }
        continue;
      }

      for (let richtung = 0; richtung < 9; richtung++) {
        const herkunft = x - RICHTUNG_X[richtung] + (y - RICHTUNG_Y[richtung]) * breite;
        const art = zellart[herkunft];
        if (art === FLUID) {
          anteileNeu[richtung * anzahlZellen + zelle] = anteile[richtung * anzahlZellen + herkunft];
        } else if (art === HAFTWAND) {
          anteileNeu[richtung * anzahlZellen + zelle] =
            anteile[GEGENRICHTUNG[richtung] * anzahlZellen + zelle];
        } else {
          anteileNeu[richtung * anzahlZellen + zelle] =
            anteile[SPIEGELUNG_WAAGERECHT[richtung] * anzahlZellen + zelle];
        }
      }
    }
  }

  kanal.anteile = anteileNeu;
  kanal.anteileNeu = anteile;
}

/**
 * Ränder links und rechts. Sie werden nicht durchströmt, sondern gesetzt:
 *   - links  Einlass: gleichmäßiger Wind vorgegeben
 *   - rechts Auslass: Druck vorgegeben (Dichte 1), Geschwindigkeit läuft durch
 *
 * Die Aufteilung ist wesentlich: vorne die Geschwindigkeit, hinten der Druck.
 * Gäbe man beides vorne vor und ließe hinten nur durchlaufen, hätte der Druck
 * nirgends einen Anker — die Reibung im Kanal würde dann immer weiter Luft
 * aufstauen, statt sich auf ein Gefälle einzupendeln.
 *
 * Die Grenzschicht am Boden baut sich dadurch erst über die Kanallänge auf —
 * so wie in einem echten Windkanal hinter der Düse.
 */
function setzeEinUndAuslass(kanal) {
  const { breite, hoehe, windgeschwindigkeit, anteile } = kanal;
  const anzahlZellen = breite * hoehe;

  for (let y = 1; y < hoehe - 1; y++) {
    const einlass = y * breite;
    const auslass = breite - 1 + y * breite;
    const vorletzte = breite - 2 + y * breite;

    // Geschwindigkeit unmittelbar vor dem Auslass ablesen und mitnehmen
    let dichteDavor = 0;
    let impulsX = 0;
    let impulsY = 0;
    for (let richtung = 0; richtung < 9; richtung++) {
      const menge = anteile[richtung * anzahlZellen + vorletzte];
      dichteDavor += menge;
      impulsX += menge * RICHTUNG_X[richtung];
      impulsY += menge * RICHTUNG_Y[richtung];
    }
    const uxAuslass = impulsX / dichteDavor;
    const uyAuslass = impulsY / dichteDavor;

    for (let richtung = 0; richtung < 9; richtung++) {
      const versatz = richtung * anzahlZellen;
      anteile[versatz + einlass] = ruhezustand(richtung, 1, windgeschwindigkeit, 0);
      anteile[versatz + auslass] = ruhezustand(richtung, 1, uxAuslass, uyAuslass);
    }
  }
}

/** Dichte einer Zelle. In Wandzellen ohne Aussage (dort strömt nichts). */
export function dichteBei(kanal, x, y) {
  const { breite, hoehe, anteile } = kanal;
  const anzahlZellen = breite * hoehe;
  const zelle = x + y * breite;
  let dichte = 0;
  for (let richtung = 0; richtung < 9; richtung++) {
    dichte += anteile[richtung * anzahlZellen + zelle];
  }
  return dichte;
}

/** Geschwindigkeit einer Zelle als { ux, uy } in Zellen je Zeitschritt. */
export function geschwindigkeitBei(kanal, x, y) {
  const { breite, hoehe, anteile } = kanal;
  const anzahlZellen = breite * hoehe;
  const zelle = x + y * breite;
  let dichte = 0;
  let impulsX = 0;
  let impulsY = 0;
  for (let richtung = 0; richtung < 9; richtung++) {
    const menge = anteile[richtung * anzahlZellen + zelle];
    dichte += menge;
    impulsX += menge * RICHTUNG_X[richtung];
    impulsY += menge * RICHTUNG_Y[richtung];
  }
  return { ux: impulsX / dichte, uy: impulsY / dichte };
}

/** Ist die Zelle Luft (im Gegensatz zu Wand)? */
export function istFluid(kanal, x, y) {
  return kanal.zellart[x + y * kanal.breite] === FLUID;
}
