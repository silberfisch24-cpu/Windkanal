/**
 * Einstiegspunkt der Oberfläche: legt den Kanal an und treibt die Bildschleife.
 *
 * Diese Datei verbindet beide Seiten — sie holt die Rechnung aus `src/kern/`
 * und gibt sie an `darstellung.js` weiter. Der Kern erfährt davon nichts.
 *
 * Stand Etappe 2.1: eine feste Szene, keine Bedienung. Schaltflächen kommen in
 * Etappe 2.2, Regler in 3.1, die übrigen Darstellungsarten in 3.3.
 */

import { erzeugeKanal, schritt } from '../kern/loeser.js';
import { erzeugeFelder, leseFelder } from '../kern/felder.js';
import { erzeugeDarstellung } from './darstellung.js';

/**
 * Die fest eingebaute Szene: ein Kreis mitten im Kanal, in grober Auflösung.
 *
 * Dieselbe Anordnung, mit der das Prüfskript die Wirbelablösung nachgemessen
 * hat (Durchmesser 16, Windgeschwindigkeit 0,1). Auf dem Bildschirm ist damit
 * dasselbe zu sehen, was dort in Zahlen stand: hinter dem Kreis lösen sich
 * abwechselnd links und rechts Wirbel ab.
 */
const SZENE = { art: 'kreis', x: 40, y: 30, durchmesser: 16 };

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

  const kanal = erzeugeKanal({ aufloesung: 'grob', hindernis: SZENE });
  const felder = erzeugeFelder(kanal);
  const darstellung = erzeugeDarstellung(zeichenflaeche, kanal);

  let bilderSeitAnzeige = 0;
  let schritteSeitAnzeige = 0;
  let letzteAnzeige = performance.now();

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
      const bildfolge = Math.round((bilderSeitAnzeige * 1000) / vergangen);
      const jeBild = (schritteSeitAnzeige / bilderSeitAnzeige).toFixed(1);
      anzeige.textContent =
        `${bildfolge} Bilder je Sekunde · ${jeBild} Rechenschritte je Bild · ` +
        `${kanal.schrittzahl.toLocaleString('de-DE')} Schritte gerechnet`;
      bilderSeitAnzeige = 0;
      schritteSeitAnzeige = 0;
      letzteAnzeige = jetzt;
    }

    requestAnimationFrame(naechstesBild);
  }

  requestAnimationFrame(naechstesBild);
}
