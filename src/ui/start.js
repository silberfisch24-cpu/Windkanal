/**
 * Einstiegspunkt der Oberfläche: legt den Kanal an und treibt die Bildschleife.
 *
 * Diese Datei verbindet beide Seiten — sie holt die Rechnung aus `src/kern/`,
 * gibt sie an `darstellung.js` weiter und nimmt von `bedienung.js` entgegen,
 * was angeklickt wurde. Der Kern erfährt davon nichts.
 *
 * Stand Etappe 2.2: Form wählen, anhalten, zurücksetzen. Die Maße der Formen
 * sind noch fest eingebaut; Regler dafür kommen in Etappe 3.1, die übrigen
 * Darstellungsarten in 3.3.
 */

import { erzeugeKanal, schritt, setzeHindernis, setzeAufAnfangszustand } from '../kern/loeser.js';
import { erzeugeFelder, leseFelder } from '../kern/felder.js';
import { erzeugeDarstellung } from './darstellung.js';
import { erzeugeBedienung } from './bedienung.js';

/**
 * Die vier wählbaren Szenen — je eine Form, mittig im Kanal.
 *
 * Alle Maße in Zellen der groben Auflösung (200 × 60). Zwei Festlegungen
 * stecken darin:
 *
 * 1. **Der Kreis bleibt, wie er war** (Durchmesser 16 bei x = 40, y = 30):
 *    dieselbe Anordnung, an der Etappe 1.4 die Wirbelablösung in Zahlen
 *    nachgemessen hat. Was auf dem Bildschirm zu sehen ist, lässt sich damit
 *    weiter gegen die Zahlen halten.
 * 2. **Platte und Profil haben dieselbe Länge und denselben Anstellwinkel.**
 *    Die voreingestellte Dicke ist bei beiden gleich (12 % der Länge, siehe
 *    `formen.js`). Zwischen den beiden unterscheidet sich damit allein die
 *    Form — genau darauf zielt das Erfolgskriterium des Projekts. Ein
 *    Anstellwinkel von 10° ist gewählt, weil eine exakt längs angeströmte
 *    Platte den Unterschied kaum zeigt.
 */
const SZENEN = [
  {
    schluessel: 'kreis',
    name: 'Kreis',
    beschreibung: 'einen Kreis',
    form: { art: 'kreis', x: 40, y: 30, durchmesser: 16 },
  },
  {
    schluessel: 'rechteck',
    name: 'Rechteck',
    beschreibung: 'ein Rechteck',
    form: { art: 'rechteck', x: 40, y: 30, breite: 16, hoehe: 16 },
  },
  {
    schluessel: 'platte',
    name: 'Platte',
    beschreibung: 'eine stumpfe Platte',
    form: { art: 'platte', x: 40, y: 30, laenge: 30, winkel: 10 },
  },
  {
    schluessel: 'profil',
    name: 'Profil',
    beschreibung: 'ein Tragflächenprofil',
    form: { art: 'profil', x: 40, y: 30, laenge: 30, winkel: 10 },
  },
];

/** Womit die Seite aufgeht. */
const ANFANGSFORM = 'kreis';

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

  const kanal = erzeugeKanal({ aufloesung: 'grob', hindernis: szene(ANFANGSFORM).form });
  const felder = erzeugeFelder(kanal);
  const darstellung = erzeugeDarstellung(zeichenflaeche, kanal);

  let gewaehlteForm = ANFANGSFORM;
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
    formen: SZENEN,
    beiFormwahl: waehleForm,
    beiLaufwechsel: wechsleLauf,
    beiRuecksetzen: setzeZurueck,
  });

  bedienung.zeigeForm(gewaehlteForm);
  bedienung.zeigeLauf(laeuft);
  beschrifte();
  starteSchleife();

  /**
   * Wechselt die Form. Der Kern setzt die Rechnung dabei von selbst zurück —
   * eine Wand mitten im Lauf einzublenden wäre ein Sprung, den die Strömung
   * nicht verkraftet (siehe „Hindernisse im Kanal" in SPEC.md).
   */
  function waehleForm(schluessel) {
    if (schluessel === gewaehlteForm) return;
    gewaehlteForm = schluessel;
    setzeHindernis(kanal, szene(schluessel).form);
    vergissMessung();
    bedienung.zeigeForm(schluessel);
    beschrifte();
    zeichneStand();
  }

  /** Setzt die Strömung auf den Anfangszustand zurück, ohne die Form zu ändern. */
  function setzeZurueck() {
    setzeAufAnfangszustand(kanal);
    vergissMessung();
    zeichneStand();
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
   * Nötig, weil Form wechseln und Zurücksetzen auch im angehaltenen Zustand
   * bedienbar sind: ohne dieses eine Bild stünde noch die alte Form auf dem
   * Schirm, und es sähe aus, als hätte die Schaltfläche nichts getan.
   */
  function zeichneStand() {
    leseFelder(kanal, felder);
    darstellung.zeichne(felder);
    zeigeAnzeige();
  }

  /**
   * Wirft die angefangene Messung der Bildfolge weg. Nach einem Anhalten oder
   * einem Formwechsel wäre sie über die Pause hinweg gemittelt und meldete eine
   * Bildfolge, die es nie gab.
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
