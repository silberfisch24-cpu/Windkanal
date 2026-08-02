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

import { liegtInForm, ausdehnung, normalisiereForm } from './formen.js';

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

/**
 * Die vorgesehenen Auflösungsstufen: wie fein der Kanal in Zellen zerlegt wird.
 *
 * Alle drei haben dasselbe Seitenverhältnis (10 : 3). Dieselbe Szene sieht
 * deshalb in jeder Stufe gleich aus — nur feiner aufgelöst, mit schärferen
 * Wirbeln. `faktor` sagt, wie viele Zellen einer groben Zelle entsprechen; wer
 * eine in groben Zellen beschriebene Form auf eine feinere Stufe umrechnen
 * will, multipliziert ihre Maße damit.
 *
 * Die Zellenzahlen liegen im Bereich, den die Architektur vorsieht (etwa 12.000
 * bis 50.000): darunter verschwimmt das Bild, darüber wird es auf dem Handy zu
 * langsam für eine flüssige Darstellung.
 */
export const AUFLOESUNGEN = {
  grob: { breite: 200, hoehe: 60, faktor: 1 },
  mittel: { breite: 280, hoehe: 84, faktor: 1.4 },
  fein: { breite: 400, hoehe: 120, faktor: 2 },
};

/** Ohne Angabe wird grob gerechnet — die Stufe, die auf jedem Gerät läuft. */
export const VOREINGESTELLTE_AUFLOESUNG = 'grob';

/**
 * Zulässige Windgeschwindigkeit in Zellen je Schritt.
 *
 * Die Obergrenze ist gemessen, nicht geschätzt: der leere Kanal hält bis etwa
 * 0,25 durch, mit einem Hindernis darin bricht die Rechnung schon zwischen 0,15
 * und 0,16 zusammen. An der Körperkante wird die Luft nämlich auf gut das
 * Doppelte beschleunigt, und dort nähert sie sich der Schallgeschwindigkeit des
 * Gitters (0,577) so weit, dass das Verfahren aufschaukelt. 0,12 lässt dazu
 * Abstand — geprüft mit der schärfsten Form, einer angestellten Platte, in
 * jeder Auflösungsstufe.
 *
 * Die Untergrenze ist keine Frage der Rechnung, sondern der Anschauung:
 * darunter steht das Bild praktisch still.
 */
export const WIND_MINDESTENS = 0.01;
export const WIND_HOECHSTENS = 0.12;

/**
 * Kleinste zulässige Zähigkeit. Aus ihr folgt die Angleichzeit (3 · Zähigkeit +
 * 0,5); je näher die an 0,5 rückt, desto weniger dämpft die Rechnung und desto
 * eher schaukelt sie sich auf. Gemessen: bei 0,002 (Angleichzeit 0,506) bricht
 * sie zusammen, ab 0,004 läuft sie. 0,005 lässt dazu Abstand.
 */
export const ZAEHIGKEIT_MINDESTENS = 0.005;

/**
 * In welchem Bereich die Dichte einer Luftzelle liegen darf, damit die Rechnung
 * noch als heil gilt — siehe `istHeil`.
 *
 * Im Ruhezustand ist die Dichte überall genau 1; die Strömung drückt sie um
 * wenige Prozent darüber oder darunter. Aus dem Druck abgeleitet, den Etappe 3.3
 * über vier Szenen und alle drei Stufen nachgemessen hat: Er bleibt unter
 * 2 · u² = 0,02, und weil Druck = (Dichte − 1) · 1/3 gilt, weicht die Dichte
 * dabei um höchstens 0,06 von 1 ab.
 *
 * Der Bereich hier ist mit Absicht **viel** weiter gespannt. Er soll nicht
 * anzeigen, dass die Strömung ungewöhnlich ist, sondern dass die Rechnung
 * zerfallen ist — und das ist kein allmähliches Abdriften: Schaukelt sich das
 * Verfahren auf, verdoppelt sich der Fehler in jedem Schritt, und die Dichte
 * verlässt jeden endlichen Bereich innerhalb weniger Dutzend Schritte. Wo genau
 * die Grenze liegt, ändert daran nichts; weit gespannt kann sie dafür nicht aus
 * Versehen bei einer noch gesunden Strömung anschlagen.
 */
export const DICHTE_MINDESTENS = 0.5;
export const DICHTE_HOECHSTENS = 2;

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
 * Die Kanalgröße wird entweder als **Auflösungsstufe** angegeben oder als eigene
 * Maße — genau eines von beidem. Die Stufe ist der übliche Weg; eigene Maße gibt
 * es für Prüfskripte, die einen kürzeren Kanal brauchen, damit ein Textbild
 * lesbar bleibt.
 *
 * @param {object} einstellungen
 * @param {string} einstellungen.aufloesung  'grob', 'mittel' oder 'fein'
 * @param {number} einstellungen.breite   Zellen in Strömungsrichtung (statt der Stufe)
 * @param {number} einstellungen.hoehe    Zellen vom Boden zur Decke (statt der Stufe)
 * @param {number} einstellungen.windgeschwindigkeit  in Zellen je Zeitschritt
 * @param {number} einstellungen.zaehigkeit           Zähigkeit der Luft
 * @param {object|null} einstellungen.hindernis       siehe `setzeHindernis`
 */
export function erzeugeKanal({
  aufloesung,
  breite,
  hoehe,
  windgeschwindigkeit = 0.1,
  zaehigkeit = 0.01,
  hindernis = null,
} = {}) {
  const masse = kanalmasse(aufloesung, breite, hoehe);
  pruefeWindgeschwindigkeit(windgeschwindigkeit);
  pruefeZaehigkeit(zaehigkeit);

  const anzahlZellen = masse.breite * masse.hoehe;

  // Wie schnell sich eine Zelle ihrem Ruhezustand annähert. Aus der Zähigkeit
  // abgeleitet; muss über 0,5 liegen, sonst schaukelt sich die Rechnung auf.
  const angleichzeit = 3 * zaehigkeit + 0.5;

  const kanal = {
    breite: masse.breite,
    hoehe: masse.hoehe,
    aufloesung: masse.aufloesung, // null bei eigenen Maßen
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
 * Ermittelt Breite und Höhe: entweder aus der Auflösungsstufe oder aus eigenen
 * Maßen. Beides zugleich wäre widersprüchlich — dann stünde nicht fest, welche
 * Angabe gilt, und die andere verschwände stillschweigend.
 */
function kanalmasse(aufloesung, breite, hoehe) {
  const eigeneMasse = breite !== undefined || hoehe !== undefined;

  if (aufloesung !== undefined && eigeneMasse) {
    throw new Error(
      'Der Kanal bekommt entweder eine aufloesung oder eigene Maße (breite und hoehe) — nicht beides.'
    );
  }

  if (eigeneMasse) {
    if (!Number.isFinite(breite) || !Number.isFinite(hoehe)) {
      throw new Error('Eigene Maße brauchen sowohl breite als auch hoehe in Zellen.');
    }
    if (breite < 3 || hoehe < 3) {
      throw new Error('Der Kanal braucht mindestens 3 × 3 Zellen.');
    }
    return { breite, hoehe, aufloesung: null };
  }

  const name = aufloesung ?? VOREINGESTELLTE_AUFLOESUNG;
  const stufe = AUFLOESUNGEN[name];
  if (stufe === undefined) {
    throw new Error(
      `Unbekannte Auflösung: ${name}. Möglich sind ${Object.keys(AUFLOESUNGEN).join(', ')}.`
    );
  }
  return { breite: stufe.breite, hoehe: stufe.hoehe, aufloesung: name };
}

/**
 * Ändert die Windgeschwindigkeit mitten im Lauf, **ohne** die Rechnung
 * zurückzusetzen.
 *
 * Anders als beim Hindernis ist das unbedenklich: der Einlass wird in jedem
 * Schritt ohnehin neu gesetzt, der neue Wind wandert also von vorn durch den
 * Kanal, statt schlagartig überall zu gelten. Bis er hinten ankommt, vergehen
 * einige hundert Schritte — genau so, wie man in einem echten Windkanal am
 * Gebläse dreht.
 */
export function setzeWindgeschwindigkeit(kanal, windgeschwindigkeit) {
  pruefeWindgeschwindigkeit(windgeschwindigkeit);
  kanal.windgeschwindigkeit = windgeschwindigkeit;
}

/** Wirft, wenn der Wind außerhalb des Bereichs liegt, in dem die Rechnung trägt. */
function pruefeWindgeschwindigkeit(wert) {
  if (!Number.isFinite(wert) || wert < WIND_MINDESTENS || wert > WIND_HOECHSTENS) {
    throw new Error(
      `Die Windgeschwindigkeit muss zwischen ${WIND_MINDESTENS} und ${WIND_HOECHSTENS} Zellen je Schritt liegen` +
        ' — darüber bricht die Rechnung an der Körperkante zusammen, darunter steht das Bild still.'
    );
  }
}

/** Wirft, wenn die Zähigkeit so klein ist, dass die Rechnung aufschaukelt. */
function pruefeZaehigkeit(wert) {
  if (!Number.isFinite(wert) || wert < ZAEHIGKEIT_MINDESTENS) {
    throw new Error(
      `Die Zähigkeit muss mindestens ${ZAEHIGKEIT_MINDESTENS} betragen` +
        ' — darunter dämpft die Rechnung zu wenig und schaukelt sich auf.'
    );
  }
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
  // Vervollständigt abgelegt: mit Anstellwinkel, voreingestellter Dicke und
  // ausgerechnetem Mittelpunkt. Wer später wissen will, wo das Hindernis
  // tatsächlich steht, liest `kanal.hindernis` und muss nichts nachrechnen.
  kanal.hindernis = hindernis === null ? null : normalisiereForm(hindernis);
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

  // Ein- und Auslass werden in jedem Schritt neu gesetzt; ein Hindernis, das
  // bis dorthin reicht, würde stillschweigend überschrieben. Lieber melden.
  const kanten = ausdehnung(hindernis);
  if (kanten.links < 1 || kanten.rechts > breite - 2) {
    throw new Error('Das Hindernis reicht bis an den Einlass oder den Auslass.');
  }
  // Nach oben genauso: die Decke ist Kanalwand, kein Teil des Körpers. Wäre
  // eine zu hoch gesetzte Form nur abgeschnitten worden, sähe es aus, als
  // hinge sie an der Decke. Am Boden ist das Aufsitzen dagegen gewollt.
  if (kanten.oben > hoehe - 2) {
    throw new Error('Das Hindernis reicht bis an die Decke — Höhe über dem Boden oder Größe verringern.');
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

/**
 * Ist die Rechnung noch heil — oder hat sie sich aufgeschaukelt?
 *
 * Das Verfahren ist nur innerhalb bestimmter Grenzen stabil (siehe
 * `WIND_HOECHSTENS` und `ZAEHIGKEIT_MINDESTENS`). Wird eine davon überschritten,
 * wächst der Fehler in jedem Schritt, bis die Zahlen ins Unendliche laufen. Das
 * Bild zeigt dann kein Strömungsfeld mehr, sondern ein zerfallenes Muster, und
 * es kommt von allein nie wieder in Ordnung.
 *
 * Die Oberfläche fragt hier nach, statt darauf zu vertrauen, dass die Regler eng
 * genug gespannt sind. Die Grenzen sind gemessen, aber sie sind an ausgewählten
 * ungünstigsten Fällen gemessen — an einer Reglerkombination, an einem Gerät
 * oder in einem Browser, wo die Gleitkommarechnung anders rundet, kann etwas
 * durchrutschen. Ein Auffangnetz kostet nichts und macht aus einem kaputten Bild
 * ein neu angesetztes.
 *
 * Geprüft wird die **Dichte** und nur sie. Sie ist die Summe der neun Anteile
 * einer Zelle und wird als Erstes ungültig: die Geschwindigkeit wird durch sie
 * geteilt, der Druck aus ihr gebildet. Wandzellen werden übersprungen — in ihnen
 * wird nicht gerechnet.
 *
 * **Nicht in jedem Bild aufrufen.** Der Durchgang geht über alle Zellen und
 * summiert je Zelle neun Werte; gemessen am 2026-08-02 kostet er 0,22 ms in der
 * groben und 1,08 ms in der feinsten Stufe — dort also fast ein Zehntel des
 * Zeitbudgets, das ein Einzelbild zum Rechnen hat. Das ist auch nicht nötig: Vom
 * ersten Anzeichen bis zum unbrauchbaren Bild vergehen rund hundert
 * Rechenschritte (nachgemessen), und in dieser Zeit vergehen mehrere Bilder.
 * `start.js` fragt deshalb in jedem zehnten nach.
 *
 * @returns {boolean} true, solange jede Luftzelle eine gültige Dichte hat
 */
export function istHeil(kanal) {
  const { breite, hoehe, zellart, anteile } = kanal;
  const anzahlZellen = breite * hoehe;

  for (let zelle = 0; zelle < anzahlZellen; zelle++) {
    if (zellart[zelle] !== FLUID) continue;
    let dichte = 0;
    for (let richtung = 0; richtung < 9; richtung++) {
      dichte += anteile[richtung * anzahlZellen + zelle];
    }
    // Die Abfrage ist bewusst so herum geschrieben: `NaN` ist mit keiner Zahl
    // vergleichbar, `NaN < DICHTE_MINDESTENS` wäre also falsch und der Zerfall
    // bliebe unbemerkt. So schlägt jeder Wert an, der nicht im Bereich liegt.
    if (!(dichte >= DICHTE_MINDESTENS && dichte <= DICHTE_HOECHSTENS)) return false;
  }

  return true;
}
