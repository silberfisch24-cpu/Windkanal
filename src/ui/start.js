/**
 * Einstiegspunkt der Oberfläche: legt den Kanal an und treibt die Bildschleife.
 *
 * Diese Datei verbindet beide Seiten — sie holt die Rechnung aus `src/kern/`,
 * gibt sie an `darstellung.js` weiter und nimmt von `bedienung.js` entgegen,
 * was angeklickt oder gezogen wurde. Der Kern erfährt davon nichts.
 *
 * Stand Etappe 3.1: Form wählen, anhalten, zurücksetzen, und über vier Regler
 * Wind, Größe, Anstellwinkel und Höhe über dem Boden einstellen. Die übrigen
 * Darstellungsarten kommen in 3.3.
 */

import {
  erzeugeKanal,
  schritt,
  setzeHindernis,
  setzeWindgeschwindigkeit,
  setzeAufAnfangszustand,
} from '../kern/loeser.js';
import { normalisiereForm, ausdehnung } from '../kern/formen.js';
import { erzeugeFelder, leseFelder } from '../kern/felder.js';
import { erzeugeDarstellung } from './darstellung.js';
import { erzeugeBedienung } from './bedienung.js';

/**
 * Die vier wählbaren Szenen.
 *
 * `grundmass` ist das Leitmaß der Form in Zellen der groben Auflösung, auf das
 * sich der Größenregler bezieht: 100 % ist genau das Maß, mit dem die Seite
 * bisher lief. Zwei Festlegungen stecken darin:
 *
 * 1. **Der Kreis bleibt, wie er war** — Durchmesser 16 bei x = 40 und y = 30;
 *    letzteres ergibt sich aus dem voreingestellten Bodenabstand von 21 Zellen.
 *    Das ist dieselbe Anordnung, an der Etappe 1.4 die Wirbelablösung in Zahlen
 *    nachgemessen hat. Was auf dem Bildschirm zu sehen ist, lässt sich damit
 *    weiter gegen die Zahlen halten.
 * 2. **Platte und Profil haben dasselbe Grundmaß.** Die voreingestellte Dicke
 *    ist bei beiden gleich (12 % der Länge, siehe `formen.js`). Weil die Regler
 *    beim Formwechsel stehen bleiben, unterscheidet sich zwischen den beiden in
 *    jeder Reglerstellung allein die Form — genau darauf zielt das
 *    Erfolgskriterium des Projekts.
 */
const SZENEN = [
  {
    schluessel: 'kreis',
    name: 'Kreis',
    beschreibung: 'einen Kreis',
    massname: 'Durchmesser',
    grundmass: 16,
  },
  {
    schluessel: 'rechteck',
    name: 'Rechteck',
    beschreibung: 'ein Rechteck',
    massname: 'Kantenlänge',
    grundmass: 16,
  },
  {
    schluessel: 'platte',
    name: 'Platte',
    beschreibung: 'eine stumpfe Platte',
    massname: 'Länge',
    grundmass: 30,
  },
  {
    schluessel: 'profil',
    name: 'Profil',
    beschreibung: 'ein Tragflächenprofil',
    massname: 'Länge',
    grundmass: 30,
  },
];

/** Womit die Seite aufgeht. */
const ANFANGSFORM = 'kreis';

/** Wo das Hindernis im Kanal steht, in Zellen vom Einlass aus gezählt. */
const LAGE_X = 40;

/**
 * Die Windgeschwindigkeit, auf die sich der Windregler als 100 % bezieht — der
 * Wert, mit dem die Seite seit Etappe 2.1 läuft.
 */
const WIND_VOREINSTELLUNG = 0.1;

/**
 * Die vier Regler mit ihren Bereichen.
 *
 * Die Grenzen sind **gemessen, nicht geschätzt** (siehe Änderungsverlauf in
 * `SPEC.md` zum 2026-08-01). Entscheidend ist dabei nicht jeder Regler für
 * sich, sondern ihr Zusammenspiel: Ein großer, quer angestellter Körper dicht
 * über dem Boden beschleunigt die Luft an seiner Kante auf über das Dreifache
 * des Windes. Kommt sie damit der Schallgeschwindigkeit des Gitters (0,577) zu
 * nahe, schaukelt sich die Rechnung auf und das Bild zerfällt.
 *
 * Der Wind reicht deshalb nur bis 100 % (= 0,10) statt bis zu den 0,12, die
 * `loeser.js` zuließe: Diese 0,12 wurden in Etappe 1.5 an einer freistehenden
 * Platte gemessen — ein aufsitzendes Rechteck bei 30° hält sie nicht aus.
 * Größe bis 115 % und Anstellung bis ±30° sind an denselben ungünstigsten
 * Fällen abgesichert. Ein weiterer Bereich bräuchte entweder eine
 * unempfindlichere Rechnung oder das Auffangnetz aus Etappe 3.4.
 */
const REGLER = [
  { schluessel: 'wind', name: 'Wind', mindestens: 10, hoechstens: 100, schritt: 5, wert: 100 },
  { schluessel: 'groesse', name: 'Größe', mindestens: 50, hoechstens: 115, schritt: 5, wert: 100 },
  { schluessel: 'winkel', name: 'Anstellwinkel', mindestens: -30, hoechstens: 30, schritt: 1, wert: 10 },
  {
    schluessel: 'bodenabstand',
    name: 'Höhe über dem Boden',
    mindestens: 0,
    // Vorläufig: Wie hoch der Körper steigen darf, hängt davon ab, wie hoch er
    // ist. Die tatsächliche Obergrenze wird beim Start und nach jeder Änderung
    // an Form, Größe oder Anstellung neu ausgerechnet.
    hoechstens: 40,
    schritt: 1,
    wert: 21,
  },
];

/**
 * Wie viel Zeit je Einzelbild gerechnet werden darf, in Millisekunden.
 *
 * Eine feste Zahl von Rechenschritten je Bild wäre der einfachere Weg, aber der
 * falsche: Auf einem schnellen Rechner bliebe Leistung liegen, auf dem Handy
 * käme das Bild nicht mehr nach und es ruckelte. Über ein Zeitbudget rechnet
 * jedes Gerät so viel, wie es in der Zeit schafft — die Bildfolge bleibt
 * gleichmäßig, nur die Strömung läuft auf schwächeren Geräten langsamer ab.
 * 12 ms lassen von den 16,7 ms eines Bildes bei 60 Bildern je Sekunde noch
 * Luft zum Zeichnen.
 */
const RECHENZEIT_JE_BILD = 12;

/** Obergrenze, damit die Strömung auf sehr schnellen Geräten nicht verwischt. */
const SCHRITTE_HOECHSTENS = 20;

/** Über wie viele Millisekunden die angezeigte Bildfolge gemittelt wird. */
const MITTELUNGSZEIT = 500;

starte();

function starte() {
  const zeichenflaeche = document.querySelector('#stroemungsbild');
  const anzeige = document.querySelector('#laufanzeige');
  const untertitel = document.querySelector('#untertitel');

  // Die Reglerstellungen gelten für alle Formen gemeinsam und bleiben beim
  // Wechsel stehen. Nur so lassen sich Platte und Profil bei gleicher Größe und
  // gleichem Anstellwinkel gegeneinanderhalten.
  const einstellungen = Object.fromEntries(REGLER.map((regler) => [regler.schluessel, regler.wert]));

  let gewaehlteForm = ANFANGSFORM;

  const kanal = erzeugeKanal({
    aufloesung: 'grob',
    windgeschwindigkeit: windAus(einstellungen.wind),
    hindernis: baueForm(szene(gewaehlteForm), einstellungen),
  });
  const felder = erzeugeFelder(kanal);
  const darstellung = erzeugeDarstellung(zeichenflaeche, kanal);

  let laeuft = true;
  // Die laufende Bildanforderung, oder null im angehaltenen Zustand. Angehalten
  // wird die Schleife wirklich abgestellt, nicht nur um die Rechnung gebracht —
  // ein leer weiterlaufendes requestAnimationFrame kostet auf dem Handy Strom.
  let bildanforderung = null;

  let bilderSeitAnzeige = 0;
  let schritteSeitAnzeige = 0;
  let letzteAnzeige = 0;
  let letzteBildfolge = null;
  let letzteSchritteJeBild = null;

  const bedienung = erzeugeBedienung({
    auswahlfeld: document.querySelector('#formauswahl'),
    laufschalter: document.querySelector('#laufschalter'),
    ruecksetzer: document.querySelector('#ruecksetzer'),
    reglerfeld: document.querySelector('#reglerleiste'),
    formen: SZENEN,
    regler: REGLER,
    beiFormwahl: waehleForm,
    beiLaufwechsel: wechsleLauf,
    beiRuecksetzen: setzeZurueck,
    beiReglerwechsel: stelleEin,
  });

  bedienung.zeigeForm(gewaehlteForm);
  bedienung.zeigeLauf(laeuft);
  beschrifteRegler();
  beschrifte();
  starteSchleife();

  /**
   * Wechselt die Form. Die Reglerstellungen bleiben dabei stehen; nur die Höhe
   * wird nachgezogen, falls die neue Form höher baut und sonst an die Decke
   * stieße.
   */
  function waehleForm(schluessel) {
    if (schluessel === gewaehlteForm) return;
    gewaehlteForm = schluessel;
    bedienung.zeigeForm(schluessel);
    baueHindernisNeu();
  }

  /**
   * Nimmt eine Reglerstellung entgegen.
   *
   * Der Wind ist der einzige, der die Strömung **nicht** neu ansetzt: der
   * Einlass wird ohnehin in jedem Schritt neu gesetzt, der neue Wind wandert
   * also von vorn durch den Kanal — wie wenn man am Gebläse dreht. Größe,
   * Anstellwinkel und Höhe verändern dagegen die Wandzellen; sie mitten im Lauf
   * zu verschieben wäre ein Sprung, den die Strömung nicht verkraftet (siehe
   * „Hindernisse im Kanal" in SPEC.md).
   */
  function stelleEin(schluessel, wert) {
    einstellungen[schluessel] = wert;

    if (schluessel === 'wind') {
      setzeWindgeschwindigkeit(kanal, windAus(wert));
      beschrifteRegler();
      // Die Farbskala hängt am Wind (siehe `darstellung.js`). Das Bild ändert
      // sich also auch im angehaltenen Zustand und muss neu gemalt werden.
      zeichneStand();
      return;
    }

    baueHindernisNeu();
  }

  /** Setzt die Strömung auf den Anfangszustand zurück, ohne etwas zu verstellen. */
  function setzeZurueck() {
    setzeAufAnfangszustand(kanal);
    vergissMessung();
    zeichneStand();
  }

  /**
   * Baut das Hindernis aus den gegenwärtigen Reglerstellungen neu auf. Der Kern
   * setzt die Rechnung dabei von selbst zurück.
   */
  function baueHindernisNeu() {
    begrenzeHoehe();
    setzeHindernis(kanal, baueForm(szene(gewaehlteForm), einstellungen));
    vergissMessung();
    beschrifteRegler();
    beschrifte();
    zeichneStand();
  }

  /**
   * Stutzt die eingestellte Höhe so weit zurück, dass die Form die Decke nicht
   * berührt — sonst wiese der Kern sie zurück (siehe `setzeHindernis`), und die
   * Seite bliebe mit einem Fehler stehen, statt einfach nicht weiter zu steigen.
   */
  function begrenzeHoehe() {
    const hoechstens = hoechsteHoehe();
    if (einstellungen.bodenabstand > hoechstens) einstellungen.bodenabstand = hoechstens;
    return hoechstens;
  }

  /**
   * Wie viele Zellen Luft höchstens unter der Form bleiben dürfen.
   *
   * Der Mittelpunkt steigt mit dem Bodenabstand um genau denselben Betrag. Es
   * genügt deshalb, die Form einmal aufsitzend zu vermessen und zu sehen, wie
   * viel bis zur Decke übrig bleibt. Die oberste Zeile ist die Decke selbst,
   * die vorletzte muss frei bleiben — dieselbe Bedingung, die `loeser.js` prüft.
   */
  function hoechsteHoehe() {
    const aufsitzend = normalisiereForm(
      baueForm(szene(gewaehlteForm), { ...einstellungen, bodenabstand: 0 })
    );
    return Math.max(0, kanal.hoehe - 2 - ausdehnung(aufsitzend).oben);
  }

  /** Schreibt neben jeden Regler, was seine Stellung bedeutet. */
  function beschrifteRegler() {
    const aktuell = szene(gewaehlteForm);
    const istKreis = gewaehlteForm === 'kreis';

    bedienung.zeigeRegler('wind', {
      wert: einstellungen.wind,
      text: `${einstellungen.wind} % der Voreinstellung`,
    });

    bedienung.zeigeRegler('groesse', {
      wert: einstellungen.groesse,
      text: `${einstellungen.groesse} % · ${aktuell.massname} ${leitmass(aktuell, einstellungen)} Zellen`,
    });

    bedienung.zeigeRegler('winkel', {
      wert: einstellungen.winkel,
      // Der Kreis ist die einzige Form, an der eine Drehung nichts ändert. Ein
      // Regler, der sich ziehen lässt und nichts bewirkt, sähe kaputt aus.
      gesperrt: istKreis,
      text: istKreis ? 'beim Kreis ohne Wirkung' : `${einstellungen.winkel}°`,
    });

    bedienung.zeigeRegler('bodenabstand', {
      hoechstens: hoechsteHoehe(),
      wert: einstellungen.bodenabstand,
      text:
        einstellungen.bodenabstand === 0
          ? 'sitzt auf dem Boden'
          : `${einstellungen.bodenabstand} Zellen frei`,
    });
  }

  function wechsleLauf() {
    laeuft = !laeuft;
    bedienung.zeigeLauf(laeuft);
    if (laeuft) {
      starteSchleife();
    } else {
      haltAn();
      zeigeAnzeige();
    }
  }

  function starteSchleife() {
    if (bildanforderung !== null) return;
    vergissMessung();
    bildanforderung = requestAnimationFrame(naechstesBild);
  }

  function haltAn() {
    if (bildanforderung === null) return;
    cancelAnimationFrame(bildanforderung);
    bildanforderung = null;
  }

  function naechstesBild() {
    // Rechnen, solange das Zeitbudget reicht — mindestens einen Schritt.
    const bis = performance.now() + RECHENZEIT_JE_BILD;
    let schritte = 0;
    do {
      schritt(kanal);
      schritte++;
    } while (schritte < SCHRITTE_HOECHSTENS && performance.now() < bis);

    leseFelder(kanal, felder);
    darstellung.zeichne(felder);

    bilderSeitAnzeige++;
    schritteSeitAnzeige += schritte;

    const jetzt = performance.now();
    const vergangen = jetzt - letzteAnzeige;
    if (vergangen >= MITTELUNGSZEIT) {
      letzteBildfolge = Math.round((bilderSeitAnzeige * 1000) / vergangen);
      letzteSchritteJeBild = (schritteSeitAnzeige / bilderSeitAnzeige).toFixed(1);
      bilderSeitAnzeige = 0;
      schritteSeitAnzeige = 0;
      letzteAnzeige = jetzt;
      zeigeAnzeige();
    }

    bildanforderung = requestAnimationFrame(naechstesBild);
  }

  /**
   * Malt einmalig ein Bild aus dem gegenwärtigen Zustand.
   *
   * Nötig, weil Form wechseln, Zurücksetzen und die Regler auch im angehaltenen
   * Zustand bedienbar sind: ohne dieses eine Bild stünde noch der alte Stand auf
   * dem Schirm, und es sähe aus, als hätte die Bedienung nichts getan.
   */
  function zeichneStand() {
    leseFelder(kanal, felder);
    darstellung.zeichne(felder);
    zeigeAnzeige();
  }

  /**
   * Wirft die angefangene Messung der Bildfolge weg. Nach einem Anhalten, einem
   * Formwechsel oder einer Reglerstellung wäre sie über die Unterbrechung hinweg
   * gemittelt und meldete eine Bildfolge, die es nie gab.
   */
  function vergissMessung() {
    bilderSeitAnzeige = 0;
    schritteSeitAnzeige = 0;
    letzteAnzeige = performance.now();
    letzteBildfolge = null;
    letzteSchritteJeBild = null;
  }

  function zeigeAnzeige() {
    const stand = `${kanal.schrittzahl.toLocaleString('de-DE')} Schritte gerechnet`;
    if (!laeuft) {
      anzeige.textContent = `Angehalten · ${stand}`;
      return;
    }
    if (letzteBildfolge === null) {
      anzeige.textContent = `Die Rechnung läuft an … · ${stand}`;
      return;
    }
    anzeige.textContent =
      `${letzteBildfolge} Bilder je Sekunde · ${letzteSchritteJeBild} Rechenschritte je Bild · ${stand}`;
  }

  function beschrifte() {
    const text = `Geschwindigkeit der Luft um ${szene(gewaehlteForm).beschreibung} — hell ist langsam, dunkel ist schnell.`;
    untertitel.textContent = text;
    zeichenflaeche.setAttribute('aria-label', `Farbfeld der Strömungsgeschwindigkeit um ${szene(gewaehlteForm).beschreibung}`);
  }
}

/** Die Szene zu einem Schlüssel. Ein unbekannter Schlüssel ist ein Programmfehler. */
function szene(schluessel) {
  const gefunden = SZENEN.find((eintrag) => eintrag.schluessel === schluessel);
  if (gefunden === undefined) {
    throw new Error(`Unbekannte Szene: ${schluessel}`);
  }
  return gefunden;
}

/**
 * Rechnet die Reglerstellung „Wind in Prozent" in die Größe um, die der Kern
 * versteht.
 *
 * Gerundet wird, weil 0,1 · 100 / 100 in Gleitkommarechnung nicht immer genau
 * 0,1 ergibt. Ein solcher Krümel über der zulässigen Grenze ließe den Kern die
 * Einstellung zurückweisen — und die Seite bliebe stehen.
 */
function windAus(prozent) {
  return Number(((WIND_VOREINSTELLUNG * prozent) / 100).toFixed(4));
}

/** Das Leitmaß der Form in Zellen bei der eingestellten Größe. */
function leitmass(aktuell, einstellungen) {
  return Math.max(3, Math.round((aktuell.grundmass * einstellungen.groesse) / 100));
}

/**
 * Baut aus Szene und Reglerstellungen die Formbeschreibung, die `formen.js`
 * erwartet.
 *
 * Die Höhe wird als **Bodenabstand** übergeben, nicht als Mittelpunkt: „wie
 * viel Luft bleibt unter dem Körper" ist das, was man einstellen will, und es
 * bleibt beim Drehen und Vergrößern gleich, statt sich stillschweigend mit zu
 * verschieben.
 */
function baueForm(aktuell, einstellungen) {
  const mass = leitmass(aktuell, einstellungen);
  const lage = {
    x: LAGE_X,
    bodenabstand: einstellungen.bodenabstand,
    winkel: einstellungen.winkel,
  };

  switch (aktuell.schluessel) {
    case 'kreis':
      return { art: 'kreis', ...lage, durchmesser: mass };
    case 'rechteck':
      return { art: 'rechteck', ...lage, breite: mass, hoehe: mass };
    default:
      return { art: aktuell.schluessel, ...lage, laenge: mass };
  }
}
