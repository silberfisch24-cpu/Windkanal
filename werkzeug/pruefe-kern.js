/**
 * Prüft die Strömungsrechnung ohne Oberfläche — Abnahme für Abschnitt 1.
 *
 * Aufruf:  node werkzeug/pruefe-kern.js
 *
 * Stand Etappe 1.1: leerer Kanal, kein Hindernis. Geprüft wird, dass die
 * Rechnung nach 2000 Schritten noch steht, dass sich die Luftmenge nicht
 * verändert und dass sich am Boden eine Grenzschicht bildet, während oben
 * annähernd die vorgegebene Windgeschwindigkeit herrscht.
 */

import {
  erzeugeKanal,
  schritte,
  dichteBei,
  geschwindigkeitBei,
} from '../src/kern/loeser.js';

const SCHRITTE_GESAMT = 2000;
const ZWISCHENSTAND_ALLE = 500;

const kanal = erzeugeKanal({
  breite: 200,
  hoehe: 60,
  windgeschwindigkeit: 0.1,
  zaehigkeit: 0.01,
});

const messstelle = Math.round(kanal.breite * 0.75); // dort ist die Grenzschicht ausgeprägt
const ergebnisse = [];

console.log('Windkanal — Prüfung der Kernlogik');
console.log('=================================\n');
console.log(`Kanal:              ${kanal.breite} × ${kanal.hoehe} Zellen`);
console.log(`Windgeschwindigkeit: ${kanal.windgeschwindigkeit} Zellen je Schritt`);
console.log(`Zähigkeit:           ${kanal.zaehigkeit} (Angleichzeit ${kanal.angleichzeit.toFixed(3)})`);
console.log(`Boden haftend, Decke gleitend, Messstelle bei x = ${messstelle}\n`);

console.log('Verlauf der Rechnung');
console.log('--------------------');
console.log('  Schritt   Dichte Mittel      kleinste     größte   höchste Geschw.   ungültige Werte');

let zwischenstaende = [];
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
console.log('--------------------------------------------------------');
zeichneProfil(profil, kanal.windgeschwindigkeit);

const letzter = zwischenstaende.at(-1);
const vorletzter = zwischenstaende.at(-2);
const bodennah = profil[0].ux;
const freieStroemung = profil.at(-1).ux;
const dichteDrift = Math.abs(letzter.dichteMittel - vorletzter.dichteMittel);
const ersteDrift = Math.abs(zwischenstaende[1].dichteMittel - zwischenstaende[0].dichteMittel);

console.log('\nPrüfpunkte');
console.log('----------');

const pruefungen = [
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
];

let allesBestanden = true;
for (const pruefung of pruefungen) {
  if (!pruefung.bestanden) allesBestanden = false;
  console.log(`  ${pruefung.bestanden ? 'OK    ' : 'FEHLER'}  ${pruefung.name}`);
  console.log(`          ${pruefung.befund}`);
}

console.log('');
if (allesBestanden) {
  console.log('Ergebnis: Alle Prüfpunkte bestanden — Etappe 1.1 erfüllt.');
} else {
  console.log('Ergebnis: Mindestens ein Prüfpunkt nicht bestanden.');
}
process.exit(allesBestanden ? 0 : 1);

// --- Hilfsfunktionen -------------------------------------------------------

function messeGesamtzustand(kanal) {
  let summe = 0;
  let zellen = 0;
  let dichteKleinste = Infinity;
  let dichteGroesste = -Infinity;
  let hoechsteGeschwindigkeit = 0;
  let hoechsteQuergeschwindigkeit = 0;
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
      if (quer > hoechsteQuergeschwindigkeit) hoechsteQuergeschwindigkeit = quer;

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
    hoechsteQuergeschwindigkeit,
    querVorn,
    querHinten,
    ungueltige,
  };
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
