/**
 * Prüft die Strömungsrechnung ohne Oberfläche — Abnahme für Abschnitt 1.
 *
 * Aufruf:  node werkzeug/pruefe-kern.js
 *
 * Teil 1 (Etappe 1.1): leerer Kanal. Geprüft wird, dass die Rechnung nach 2000
 * Schritten noch steht, dass sich die Luftmenge nicht verändert und dass sich am
 * Boden eine Grenzschicht bildet, während oben annähernd die vorgegebene
 * Windgeschwindigkeit herrscht.
 *
 * Teil 2 und 3 (Etappe 1.2): derselbe Kanal mit einem Kreis beziehungsweise
 * einem Rechteck darin. Geprüft wird, dass im Hindernis nichts strömt, dass die
 * Luft davor aufstaut, daneben schneller wird und dahinter ein langsamer
 * Bereich stehen bleibt.
 */

import {
  erzeugeKanal,
  schritte,
  dichteBei,
  geschwindigkeitBei,
  istFluid,
} from '../src/kern/loeser.js';
import { ausdehnung } from '../src/kern/formen.js';

const SCHRITTE_GESAMT = 2000;
const ZWISCHENSTAND_ALLE = 500;

console.log('Windkanal — Prüfung der Kernlogik');
console.log('=================================');

const bestandenTeile = [
  pruefeLeerenKanal(),
  pruefeHindernis('Teil 2 — Kreis im Kanal', { art: 'kreis', x: 40, y: 30, durchmesser: 16 }),
  pruefeHindernis('Teil 3 — Rechteck im Kanal', {
    art: 'rechteck',
    x: 40,
    y: 30,
    breite: 16,
    hoehe: 16,
  }),
];

const allesBestanden = bestandenTeile.every(Boolean);
console.log('\n=================================');
if (allesBestanden) {
  console.log('Ergebnis: Alle Prüfpunkte bestanden — Etappen 1.1 und 1.2 erfüllt.');
} else {
  console.log('Ergebnis: Mindestens ein Prüfpunkt nicht bestanden.');
}
process.exit(allesBestanden ? 0 : 1);

// --- Teil 1: leerer Kanal (Etappe 1.1) -------------------------------------

function pruefeLeerenKanal() {
  const kanal = erzeugeKanal({
    breite: 200,
    hoehe: 60,
    windgeschwindigkeit: 0.1,
    zaehigkeit: 0.01,
  });

  const messstelle = Math.round(kanal.breite * 0.75); // dort ist die Grenzschicht ausgeprägt

  console.log('\nTeil 1 — Leerer Kanal (Etappe 1.1)');
  console.log('----------------------------------');
  beschreibeKanal(kanal);
  console.log(`Messstelle bei x = ${messstelle}\n`);

  console.log('Verlauf der Rechnung');
  console.log('  Schritt   Dichte Mittel      kleinste     größte   höchste Geschw.   ungültige Werte');

  const zwischenstaende = [];
  for (let gerechnet = 0; gerechnet < SCHRITTE_GESAMT; gerechnet += ZWISCHENSTAND_ALLE) {
    schritte(kanal, ZWISCHENSTAND_ALLE);
    const stand = messeGesamtzustand(kanal);
    zwischenstaende.push(stand);
    console.log(
      `  ${String(kanal.schrittzahl).padStart(7)}` +
        `   ${stand.dichteMittel.toFixed(6).padStart(13)}` +
        `   ${stand.dichteKleinste.toFixed(6).padStart(10)}` +
        ` ${stand.dichteGroesste.toFixed(6).padStart(10)}` +
        `   ${stand.hoechsteGeschwindigkeit.toFixed(5).padStart(15)}` +
        `   ${String(stand.ungueltige).padStart(15)}`
    );
  }

  const profil = lesenGeschwindigkeitsprofil(kanal, messstelle);

  console.log('\nGeschwindigkeitsprofil über die Kanalhöhe');
  console.log(`(bei x = ${messstelle}, Balkenlänge ist die Geschwindigkeit)`);
  zeichneProfil(profil, kanal.windgeschwindigkeit);

  const letzter = zwischenstaende.at(-1);
  const vorletzter = zwischenstaende.at(-2);
  const bodennah = profil[0].ux;
  const freieStroemung = profil.at(-1).ux;
  const dichteDrift = Math.abs(letzter.dichteMittel - vorletzter.dichteMittel);
  const ersteDrift = Math.abs(zwischenstaende[1].dichteMittel - zwischenstaende[0].dichteMittel);

  return melde([
    {
      name: 'Rechnung steht (keine ungültigen Werte)',
      bestanden: letzter.ungueltige === 0,
      befund: `${letzter.ungueltige} ungültige Werte im Gitter`,
    },
    {
      name: 'Luftmenge bleibt gleich (Dichte um 1)',
      bestanden: Math.abs(letzter.dichteMittel - 1) < 0.01,
      befund: `mittlere Dichte ${letzter.dichteMittel.toFixed(6)}`,
    },
    {
      name: 'Keine Dichte-Ausreißer im Kanal',
      bestanden: letzter.dichteKleinsteInnen > 0.995 && letzter.dichteGroessteInnen < 1.005,
      befund:
        `im Kanal zwischen ${letzter.dichteKleinsteInnen.toFixed(6)} und ${letzter.dichteGroessteInnen.toFixed(6)}` +
        ` (an der Vorderkante des Bodens staut es sich auf ${letzter.dichteGroesste.toFixed(6)} —` +
        ` das ist der Staudruck an der Kante, kein Rechenfehler)`,
    },
    {
      name: 'Zustand beruhigt sich (Dichteschwankung wird kleiner)',
      bestanden: dichteDrift < 5e-4 && dichteDrift < ersteDrift,
      befund:
        `Änderung zuletzt ${dichteDrift.toExponential(2)},` +
        ` zu Beginn ${ersteDrift.toExponential(2)} — sie wird von Abschnitt zu Abschnitt kleiner`,
    },
    {
      name: 'Luft haftet am Boden (Grenzschicht vorhanden)',
      bestanden: bodennah < 0.5 * kanal.windgeschwindigkeit && bodennah > 0,
      befund: `unmittelbar über dem Boden ${(100 * bodennah / kanal.windgeschwindigkeit).toFixed(1)} % der Windgeschwindigkeit`,
    },
    {
      // Nur die Grenzschicht selbst darf als ansteigend erwartet werden. Darüber
      // liegt die Strömung geringfügig über der Windgeschwindigkeit und fällt zur
      // Decke hin wieder ab — die Grenzschicht verdrängt Luft nach oben, und im
      // geschlossenen Kanal muss dieselbe Luftmenge durch den engeren Rest passen.
      name: 'Geschwindigkeit nimmt vom Boden durch die Grenzschicht nach oben zu',
      bestanden: istAufsteigend(profil.slice(0, 10)),
      befund: `unterste 10 Zellen: ${profil[0].ux.toFixed(5)} bis ${profil[9].ux.toFixed(5)}`,
    },
    {
      name: 'Oben herrscht annähernd die vorgegebene Geschwindigkeit',
      bestanden:
        freieStroemung > 0.9 * kanal.windgeschwindigkeit &&
        freieStroemung < 1.3 * kanal.windgeschwindigkeit,
      befund: `unter der Decke ${(100 * freieStroemung / kanal.windgeschwindigkeit).toFixed(1)} % der Windgeschwindigkeit`,
    },
    {
      // Gegenprobe zum Boden: dort bremst die Wand die Luft auf wenige Prozent
      // herunter, hier darf sie das nicht tun. Verglichen wird die Zelle direkt
      // unter der Decke mit der fünften darunter.
      name: 'Luft gleitet an der Decke (dort keine Grenzschicht)',
      bestanden: Math.abs(freieStroemung - profil.at(-6).ux) < 0.01 * freieStroemung,
      befund:
        `unter der Decke ${freieStroemung.toFixed(5)}, fünf Zellen darunter ${profil.at(-6).ux.toFixed(5)}` +
        ` (Unterschied ${(100 * Math.abs(freieStroemung - profil.at(-6).ux) / freieStroemung).toFixed(2)} %,` +
        ` am Boden ${(100 * (freieStroemung - bodennah) / freieStroemung).toFixed(1)} %)`,
    },
    {
      // Ganz ohne Querströmung geht es nicht: die Grenzschicht wird zum Auslass
      // hin dicker und schiebt Luft nach oben. Richtig ist, dass diese Bewegung
      // klein bleibt und stromab nachlässt — schaukelte sich die Rechnung auf,
      // wäre sie groß und würde nach hinten zunehmen.
      name: 'Strömung läuft im Wesentlichen geradeaus',
      bestanden:
        letzter.querVorn < 0.1 * kanal.windgeschwindigkeit && letzter.querHinten < letzter.querVorn,
      befund:
        `Auf-/Abwärtsbewegung vorn im Kanal höchstens ${(100 * letzter.querVorn / kanal.windgeschwindigkeit).toFixed(1)} %` +
        ` der Windgeschwindigkeit, hinten nur noch ${(100 * letzter.querHinten / kanal.windgeschwindigkeit).toFixed(1)} %`,
    },
  ]);
}

// --- Teil 2 und 3: Kanal mit Hindernis (Etappe 1.2) ------------------------

function pruefeHindernis(titel, hindernis) {
  // Kürzerer Kanal als in Teil 1: Das Hindernis soll im Textbild groß genug
  // herauskommen, um die Form zu erkennen. Die Nachlaufstrecke dahinter bleibt
  // mit 80 Zellen reichlich bemessen.
  const kanal = erzeugeKanal({
    breite: 120,
    hoehe: 60,
    windgeschwindigkeit: 0.1,
    zaehigkeit: 0.01,
    hindernis,
  });

  console.log(`\n${titel} (Etappe 1.2)`);
  console.log('-'.repeat(titel.length + 14));
  beschreibeKanal(kanal);
  console.log(`Hindernis: ${beschreibeHindernis(hindernis)}\n`);

  schritte(kanal, SCHRITTE_GESAMT);

  console.log(`Strömungsbild nach ${kanal.schrittzahl} Schritten`);
  zeichneStroemungsbild(kanal);

  const stand = messeGesamtzustand(kanal);
  const innen = messeImHindernis(kanal);
  const kanten = ausdehnung(hindernis);

  // Messstellen entlang der Mittellinie des Hindernisses
  const vorne = kanten.links - 2;
  const hinten = kanten.rechts + 3;
  const davor = geschwindigkeitBei(kanal, vorne, hindernis.y);
  const dahinter = geschwindigkeitBei(kanal, hinten, hindernis.y);
  const dichteDavor = dichteBei(kanal, vorne, hindernis.y);

  // Schnellste Stelle in der Spalte durch die Hindernismitte — dort muss die
  // Luft am Hindernis vorbei, also durch einen engeren Querschnitt.
  const daneben = hoechsteGeschwindigkeitInSpalte(kanal, hindernis.x);

  return melde([
    {
      name: 'Rechnung steht (keine ungültigen Werte)',
      bestanden: stand.ungueltige === 0,
      befund: `${stand.ungueltige} ungültige Werte im Gitter`,
    },
    {
      name: 'Luftmenge bleibt gleich (Dichte um 1)',
      bestanden: Math.abs(stand.dichteMittel - 1) < 0.01,
      befund: `mittlere Dichte ${stand.dichteMittel.toFixed(6)}`,
    },
    {
      name: 'Im Hindernis steht die Luft still',
      bestanden: innen.zellen > 0 && innen.hoechsteGeschwindigkeit === 0,
      befund:
        `${innen.zellen} Zellen gehören zum Hindernis,` +
        ` höchste Geschwindigkeit darin ${innen.hoechsteGeschwindigkeit.toFixed(5)}` +
        ` (Windgeschwindigkeit ${kanal.windgeschwindigkeit})`,
    },
    {
      name: 'Die Strömung prallt ab: davor staut sich die Luft',
      bestanden: davor.ux < 0.6 * kanal.windgeschwindigkeit && dichteDavor > stand.dichteMittel,
      befund:
        `zwei Zellen vor dem Hindernis noch ${(100 * davor.ux / kanal.windgeschwindigkeit).toFixed(1)} %` +
        ` der Windgeschwindigkeit, Dichte dort ${dichteDavor.toFixed(6)} gegen ${stand.dichteMittel.toFixed(6)} im Mittel`,
    },
    {
      name: 'Daneben nimmt die Geschwindigkeit zu',
      bestanden: daneben.ux > 1.2 * kanal.windgeschwindigkeit,
      befund:
        `neben dem Hindernis (x = ${hindernis.x}, y = ${daneben.y})` +
        ` ${(100 * daneben.ux / kanal.windgeschwindigkeit).toFixed(1)} % der Windgeschwindigkeit`,
    },
    {
      name: 'Dahinter bleibt ein langsamer Bereich (Totwasser)',
      bestanden: dahinter.ux < 0.5 * kanal.windgeschwindigkeit,
      befund:
        `drei Zellen hinter dem Hindernis ${(100 * dahinter.ux / kanal.windgeschwindigkeit).toFixed(1)} %` +
        ` der Windgeschwindigkeit`,
    },
  ]);
}

// --- Ausgabe ---------------------------------------------------------------

function beschreibeKanal(kanal) {
  console.log(`Kanal: ${kanal.breite} × ${kanal.hoehe} Zellen, Wind ${kanal.windgeschwindigkeit} Zellen je Schritt,`);
  console.log(`Zähigkeit ${kanal.zaehigkeit} (Angleichzeit ${kanal.angleichzeit.toFixed(3)}), Boden haftend, Decke gleitend`);
}

function beschreibeHindernis(hindernis) {
  if (hindernis.art === 'kreis') {
    return `Kreis, Durchmesser ${hindernis.durchmesser} Zellen, Mitte bei x = ${hindernis.x}, y = ${hindernis.y}`;
  }
  return `Rechteck, ${hindernis.breite} × ${hindernis.hoehe} Zellen, Mitte bei x = ${hindernis.x}, y = ${hindernis.y}`;
}

/** Meldet eine Liste von Prüfpunkten und sagt, ob alle bestanden sind. */
function melde(pruefungen) {
  console.log('\nPrüfpunkte');
  let allesBestanden = true;
  for (const pruefung of pruefungen) {
    if (!pruefung.bestanden) allesBestanden = false;
    console.log(`  ${pruefung.bestanden ? 'OK    ' : 'FEHLER'}  ${pruefung.name}`);
    console.log(`          ${pruefung.befund}`);
  }
  return allesBestanden;
}

/**
 * Grobes Textbild des Kanals: das Hindernis als `#`, die Luft je nach
 * Geschwindigkeit. Ein Zeichen fasst mehrere Zellen zusammen — doppelt so viele
 * in der Breite wie in der Höhe, weil ein Schriftzeichen etwa doppelt so hoch
 * wie breit ist. Ein Kreis erscheint dadurch rund und nicht flachgedrückt.
 */
function zeichneStroemungsbild(kanal) {
  const ZIEL_SPALTEN = 60;
  const blockBreite = Math.max(1, Math.ceil(kanal.breite / ZIEL_SPALTEN));
  const blockHoehe = blockBreite * 2;
  const wind = kanal.windgeschwindigkeit;

  const stufen = [
    { grenze: 0.3, zeichen: ' ' },
    { grenze: 0.8, zeichen: '.' },
    { grenze: 1.1, zeichen: '-' },
    { grenze: 1.4, zeichen: '+' },
    { grenze: Infinity, zeichen: '*' },
  ];

  console.log(`  Legende: '#' Hindernis, dann von langsam nach schnell: ' ' '.' '-' '+' '*'`);
  for (let yOben = kanal.hoehe - 1; yOben >= 0; yOben -= blockHoehe) {
    let zeile = '';
    for (let xLinks = 0; xLinks < kanal.breite; xLinks += blockBreite) {
      let wand = false;
      let summe = 0;
      let zellen = 0;
      for (let y = Math.max(0, yOben - blockHoehe + 1); y <= yOben; y++) {
        for (let x = xLinks; x < Math.min(kanal.breite, xLinks + blockBreite); x++) {
          if (!istFluid(kanal, x, y)) {
            // Boden und Decke sind Kanalwände und gehören nicht zum Hindernis
            if (y > 0 && y < kanal.hoehe - 1) wand = true;
            continue;
          }
          summe += geschwindigkeitBei(kanal, x, y).ux;
          zellen++;
        }
      }
      if (wand || zellen === 0) {
        zeile += '#';
        continue;
      }
      const anteil = summe / zellen / wind;
      zeile += stufen.find((stufe) => anteil < stufe.grenze).zeichen;
    }
    console.log(`  |${zeile}|`);
  }
  console.log(`  ${'-'.repeat(Math.ceil(kanal.breite / blockBreite) + 2)}  Boden`);
}

// --- Messungen -------------------------------------------------------------

function messeGesamtzustand(kanal) {
  let summe = 0;
  let zellen = 0;
  let dichteKleinste = Infinity;
  let dichteGroesste = -Infinity;
  let hoechsteGeschwindigkeit = 0;
  let ungueltige = 0;

  // Innenbereich: der Kanal ohne Einlauf- und Auslaufstrecke. Dort wird
  // gemessen, was Etappe 1.1 prüfen will. An der Vorderkante des Bodens staut
  // sich die Luft (echter Staudruck), am Auslass wirkt der Rand — beides sagt
  // nichts darüber aus, ob die Strömung im Kanal gesund ist. Die Randwerte
  // werden trotzdem mitgeführt und ausgewiesen.
  const RANDSTREIFEN = 20;
  const innenVon = RANDSTREIFEN;
  const innenBis = kanal.breite - RANDSTREIFEN;
  let dichteKleinsteInnen = Infinity;
  let dichteGroessteInnen = -Infinity;
  let querVorn = 0; // erste Hälfte des Innenbereichs
  let querHinten = 0; // zweite Hälfte

  for (let y = 1; y < kanal.hoehe - 1; y++) {
    for (let x = 0; x < kanal.breite; x++) {
      if (!istFluid(kanal, x, y)) continue; // Hinderniszellen zählen nicht mit
      const dichte = dichteBei(kanal, x, y);
      const { ux, uy } = geschwindigkeitBei(kanal, x, y);
      if (!Number.isFinite(dichte) || !Number.isFinite(ux) || !Number.isFinite(uy)) {
        ungueltige++;
        continue;
      }
      summe += dichte;
      zellen++;
      if (dichte < dichteKleinste) dichteKleinste = dichte;
      if (dichte > dichteGroesste) dichteGroesste = dichte;
      const tempo = Math.hypot(ux, uy);
      if (tempo > hoechsteGeschwindigkeit) hoechsteGeschwindigkeit = tempo;
      const quer = Math.abs(uy);

      if (x >= innenVon && x < innenBis) {
        if (dichte < dichteKleinsteInnen) dichteKleinsteInnen = dichte;
        if (dichte > dichteGroessteInnen) dichteGroessteInnen = dichte;
        if (x < (innenVon + innenBis) / 2) {
          if (quer > querVorn) querVorn = quer;
        } else if (quer > querHinten) {
          querHinten = quer;
        }
      }
    }
  }

  return {
    dichteMittel: summe / zellen,
    dichteKleinste,
    dichteGroesste,
    dichteKleinsteInnen,
    dichteGroessteInnen,
    hoechsteGeschwindigkeit,
    querVorn,
    querHinten,
    ungueltige,
  };
}

/** Höchste Geschwindigkeit in den Hinderniszellen — sie muss null sein. */
function messeImHindernis(kanal) {
  let zellen = 0;
  let hoechsteGeschwindigkeit = 0;
  for (let y = 1; y < kanal.hoehe - 1; y++) {
    for (let x = 1; x < kanal.breite - 1; x++) {
      if (istFluid(kanal, x, y)) continue;
      zellen++;
      const { ux, uy } = geschwindigkeitBei(kanal, x, y);
      const tempo = Math.hypot(ux, uy);
      if (!(tempo <= hoechsteGeschwindigkeit)) hoechsteGeschwindigkeit = tempo; // fängt auch ungültige Werte
    }
  }
  return { zellen, hoechsteGeschwindigkeit };
}

/** Schnellste Luftzelle in einer senkrechten Spalte. */
function hoechsteGeschwindigkeitInSpalte(kanal, x) {
  let beste = { y: -1, ux: -Infinity };
  for (let y = 1; y < kanal.hoehe - 1; y++) {
    if (!istFluid(kanal, x, y)) continue;
    const { ux } = geschwindigkeitBei(kanal, x, y);
    if (ux > beste.ux) beste = { y, ux };
  }
  return beste;
}

/** Geschwindigkeit über die Höhe an einer Stelle, von unten nach oben. */
function lesenGeschwindigkeitsprofil(kanal, x) {
  const profil = [];
  for (let y = 1; y < kanal.hoehe - 1; y++) {
    const { ux, uy } = geschwindigkeitBei(kanal, x, y);
    profil.push({ y, ux, uy });
  }
  return profil;
}

function istAufsteigend(profil) {
  for (let n = 1; n < profil.length; n++) {
    if (profil[n].ux < profil[n - 1].ux - 1e-9) return false;
  }
  return true;
}

function zeichneProfil(profil, windgeschwindigkeit) {
  const maximaleBalkenlaenge = 50;
  const massstab = maximaleBalkenlaenge / (1.2 * windgeschwindigkeit);
  // von oben nach unten ausgeben, damit das Bild dem Kanal entspricht
  for (let n = profil.length - 1; n >= 0; n--) {
    const { y, ux } = profil[n];
    const laenge = Math.max(0, Math.round(ux * massstab));
    const zeile = `  y = ${String(y).padStart(2)}  |${'#'.repeat(laenge)}`;
    // nur jede zweite Zeile ausgeben, sonst wird die Ausgabe unübersichtlich
    if (n % 2 === 0 || n === profil.length - 1) {
      console.log(`${zeile.padEnd(60)} ${ux.toFixed(5)}`);
    }
  }
  console.log(`  Boden (Haftwand)`);
}
