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
 *
 * Teil 4 bis 6 (Etappe 1.3): alle vier Formen als Textbild, waagerecht und
 * angestellt; Platte und Profil zusätzlich in der Strömung; und die Gegenprobe
 * zur Höhe über dem Boden — ein aufsitzendes Rechteck gegen dasselbe Rechteck
 * angehoben.
 *
 * Teil 7 (Etappe 1.4): die drei abgeleiteten Größen — Geschwindigkeit, Druck,
 * Wirbelstärke — am angeströmten Kreis. Kernstück ist die Wirbelablösung: hinter
 * dem Kreis kehrt sich die Drehrichtung der Luft in gleichmäßigem Takt um.
 */

import {
  erzeugeKanal,
  schritt,
  schritte,
  dichteBei,
  geschwindigkeitBei,
  istFluid,
} from '../src/kern/loeser.js';
import { leseFelder, druckBei, wirbelstaerkeBei } from '../src/kern/felder.js';
import { ausdehnung } from '../src/kern/formen.js';

const SCHRITTE_GESAMT = 2000;
const ZWISCHENSTAND_ALLE = 500;

// Teil 7: Bis die Wirbelablösung eingeschwungen ist, dauert es — die Strömung
// hinter dem Kreis ist zunächst noch spiegelbildlich und kippt erst nach und
// nach ins Schwingen. Erst danach wird aufgezeichnet.
const EINSCHWINGEN = 4000;
const AUFZEICHNUNG = 2600;

console.log('Windkanal — Prüfung der Kernlogik');
console.log('=================================');

const bestandenTeile = [
  pruefeLeerenKanal(),
  pruefeHindernis('Teil 2 — Kreis im Kanal (Etappe 1.2)', {
    art: 'kreis',
    x: 40,
    y: 30,
    durchmesser: 16,
  }),
  pruefeHindernis('Teil 3 — Rechteck im Kanal (Etappe 1.2)', {
    art: 'rechteck',
    x: 40,
    y: 30,
    breite: 16,
    hoehe: 16,
  }),
  zeigeFormenschau(),
  pruefeNeueFormenInStroemung(),
  pruefeBodenfreiheit(),
  pruefeAbgeleiteteGroessen(),
];

const allesBestanden = bestandenTeile.every(Boolean);
console.log('\n=================================');
if (allesBestanden) {
  console.log('Ergebnis: Alle Prüfpunkte bestanden — Etappen 1.1 bis 1.4 erfüllt.');
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

  console.log(`\n${titel}`);
  console.log('-'.repeat(titel.length));
  beschreibeKanal(kanal);
  console.log(`Hindernis: ${beschreibeHindernis(kanal.hindernis)}\n`);

  schritte(kanal, SCHRITTE_GESAMT);

  console.log(`Strömungsbild nach ${kanal.schrittzahl} Schritten`);
  zeichneStroemungsbild(kanal);

  const form = kanal.hindernis;
  const stand = messeGesamtzustand(kanal);
  const kanten = ausdehnung(form);

  // Messstellen entlang der Mittellinie des Hindernisses
  const vorne = kanten.links - 2;
  const hinten = kanten.rechts + 3;
  const davor = geschwindigkeitBei(kanal, vorne, form.y);
  const dahinter = geschwindigkeitBei(kanal, hinten, form.y);
  const dichteDavor = dichteBei(kanal, vorne, form.y);

  // Schnellste Stelle in der Spalte durch die Hindernismitte — dort muss die
  // Luft am Hindernis vorbei, also durch einen engeren Querschnitt.
  const daneben = hoechsteGeschwindigkeitInSpalte(kanal, form.x);

  return melde([
    ...grundpruefungen(kanal, stand),
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
        `neben dem Hindernis (x = ${form.x}, y = ${daneben.y})` +
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

/**
 * Die drei Prüfpunkte, die für jedes Hindernis gelten, gleich welcher Form:
 * die Rechnung steht, die Luftmenge bleibt erhalten, und im Körper selbst
 * bewegt sich nichts.
 */
function grundpruefungen(kanal, stand) {
  const innen = messeImHindernis(kanal);
  return [
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
  ];
}

// --- Teil 4: alle vier Formen als Textbild (Etappe 1.3) --------------------

/**
 * Zeigt jede der vier Formen einmal waagerecht und einmal angestellt. Hier
 * wird nicht gerechnet — es geht allein darum, welche Zellen die Form belegt.
 *
 * Platte und Profil sind hier dicker angegeben als voreingestellt (10 statt 4
 * Zellen bei 30 Zellen Länge). Grund ist allein das grobe Textbild: mit der
 * schlanken Voreinstellung wären beide nur ein Strich, und der Unterschied —
 * vorn rund und hinten spitz gegen vorn und hinten abgeschnitten — ginge
 * verloren. In der Strömung (Teil 5) gilt wieder die Voreinstellung.
 */
function zeigeFormenschau() {
  const titel = 'Teil 4 — Alle vier Formen, waagerecht und angestellt (Etappe 1.3)';
  console.log(`\n${titel}`);
  console.log('-'.repeat(titel.length));
  console.log('Gitter 60 × 32 Zellen, ein Zeichen je Zelle in der Breite, je zwei in der Höhe');
  console.log('(ein Schriftzeichen ist etwa doppelt so hoch wie breit — sonst wäre der Kreis flach).');
  console.log('Es wird nicht gerechnet, gezeigt wird nur die Belegung des Gitters.');

  const mitte = { x: 30, y: 16 };
  const schau = [
    ['Kreis', { art: 'kreis', durchmesser: 16 }],
    ['Kreis, 30 Grad gedreht', { art: 'kreis', durchmesser: 16, winkel: 30 }],
    // Länglich statt quadratisch: an einem Quadrat wäre eine Drehung um 30 Grad
    // zwar zu sehen, aber nicht zu messen — es liegt vorn so hoch wie hinten.
    ['Rechteck', { art: 'rechteck', breite: 20, hoehe: 10 }],
    ['Rechteck, 30 Grad angestellt', { art: 'rechteck', breite: 20, hoehe: 10, winkel: 30 }],
    ['Stumpfe Platte', { art: 'platte', laenge: 30, dicke: 10 }],
    ['Stumpfe Platte, 20 Grad angestellt', { art: 'platte', laenge: 30, dicke: 10, winkel: 20 }],
    ['Tragflächenprofil', { art: 'profil', laenge: 30, dicke: 10 }],
    ['Tragflächenprofil, 20 Grad angestellt', { art: 'profil', laenge: 30, dicke: 10, winkel: 20 }],
  ];

  const kanaele = new Map();
  for (const [name, form] of schau) {
    const kanal = erzeugeKanal({ breite: 60, hoehe: 32, hindernis: { ...form, ...mitte } });
    kanaele.set(name, kanal);
    console.log(`\n  ${name} — ${zaehleFormzellen(kanal)} Zellen`);
    zeichneFormbild(kanal);
  }

  const leer = [...kanaele].filter(([, kanal]) => zaehleFormzellen(kanal) === 0).map(([name]) => name);

  // Der Kreis ist die einzige Form, an der ein Anstellwinkel nichts ändern darf.
  const kreisGleich = belegungGleich(kanaele.get('Kreis'), kanaele.get('Kreis, 30 Grad gedreht'));

  // Bei positivem Anstellwinkel muss die Anströmkante (vorn, links) höher
  // liegen als die Hinterkante. Das prüft nicht nur, dass gedreht wird,
  // sondern auch, in welche Richtung.
  const angestellt = [
    'Rechteck, 30 Grad angestellt',
    'Stumpfe Platte, 20 Grad angestellt',
    'Tragflächenprofil, 20 Grad angestellt',
  ].map((name) => ({ name, ...vergleicheVorderUndHinterkante(kanaele.get(name)) }));

  // Der Unterschied zwischen den beiden neuen Formen in Zahlen: das Profil
  // läuft nach hinten spitz aus, die Platte ist hinten so dick wie vorn.
  const platte = messeDickenverlauf(kanaele.get('Stumpfe Platte'));
  const profil = messeDickenverlauf(kanaele.get('Tragflächenprofil'));

  return melde([
    {
      name: 'Jede der vier Formen belegt Zellen im Gitter',
      bestanden: leer.length === 0,
      befund:
        leer.length === 0
          ? [...kanaele].map(([name, kanal]) => `${name}: ${zaehleFormzellen(kanal)}`).join(', ')
          : `ohne eine einzige Zelle: ${leer.join(', ')}`,
    },
    {
      name: 'Der Kreis bleibt beim Drehen unverändert',
      bestanden: kreisGleich,
      befund: kreisGleich
        ? 'gedreht und ungedreht belegen genau dieselben Zellen — beim Kreis ist der Anstellwinkel ohne Wirkung'
        : 'die Belegung hat sich geändert, obwohl ein Kreis in jeder Lage gleich aussieht',
    },
    {
      name: 'Der Anstellwinkel hebt die Anströmkante',
      bestanden: angestellt.every((eintrag) => eintrag.unterschied > 1),
      befund: angestellt
        .map(
          (eintrag) =>
            `${eintrag.name}: vorn im Mittel y = ${eintrag.vorn.toFixed(1)},` +
            ` hinten y = ${eintrag.hinten.toFixed(1)}`
        )
        .join('; '),
    },
    {
      name: 'Das Profil läuft nach hinten spitz aus, die Platte nicht',
      bestanden: profil.hinten < 0.5 * profil.vorn && platte.hinten === platte.vorn,
      befund:
        `Profil: ${profil.vorn} Zellen dick auf einem Viertel der Länge, hinten nur noch ${profil.hinten};` +
        ` Platte: ${platte.vorn} gegen ${platte.hinten}`,
    },
  ]);
}

// --- Teil 5: Platte und Profil in der Strömung (Etappe 1.3) ----------------

/**
 * Beide neuen Formen einmal wirklich anströmen — eine Form „steht bereit",
 * wenn die Rechnung mit ihr auch nach 2000 Schritten noch steht.
 *
 * Länge, Dicke und Anstellwinkel sind für beide gleich; unterschiedlich ist
 * allein die Form. Was das im Strömungsbild ausmacht, ist der eigentliche
 * Zweck des Projekts — als harter Prüffall kommt es in Etappe 5.2, hier wird
 * es nur nebenbei ausgewiesen.
 */
function pruefeNeueFormenInStroemung() {
  const titel = 'Teil 5 — Stumpfe Platte und Tragflächenprofil in der Strömung (Etappe 1.3)';
  console.log(`\n${titel}`);
  console.log('-'.repeat(titel.length));

  const gemeinsam = { x: 40, y: 30, laenge: 30, winkel: 20 };
  const ergebnisse = [];

  for (const art of ['platte', 'profil']) {
    const kanal = erzeugeKanal({
      breite: 120,
      hoehe: 60,
      windgeschwindigkeit: 0.1,
      zaehigkeit: 0.01,
      hindernis: { art, ...gemeinsam },
    });
    console.log(`\n${beschreibeHindernis(kanal.hindernis)}`);
    schritte(kanal, SCHRITTE_GESAMT);
    console.log(`Strömungsbild nach ${kanal.schrittzahl} Schritten`);
    zeichneStroemungsbild(kanal);

    const stand = messeGesamtzustand(kanal);
    const kanten = ausdehnung(kanal.hindernis);
    ergebnisse.push({
      art,
      pruefungen: grundpruefungen(kanal, stand),
      rueckstroemung: staerksteRueckstroemung(kanal, kanten.rechts + 1, kanten.rechts + 20),
    });
  }

  console.log(
    '\nNebenbefund zum Erfolgskriterium (harter Prüffall erst in Etappe 5.2): stärkste' +
      ' Rückströmung im Nachlauf, gemessen über 20 Zellen hinter dem Körper —'
  );
  for (const { art, rueckstroemung } of ergebnisse) {
    console.log(
      `  ${art === 'platte' ? 'Stumpfe Platte    ' : 'Tragflächenprofil '}` +
        ` ${(100 * rueckstroemung / 0.1).toFixed(1)} % der Windgeschwindigkeit rückwärts`
    );
  }

  return melde(
    ergebnisse.flatMap(({ art, pruefungen }) =>
      pruefungen.map((pruefung) => ({
        ...pruefung,
        name: `${art === 'platte' ? 'Platte' : 'Profil'}: ${pruefung.name}`,
      }))
    )
  );
}

// --- Teil 6: Höhe über dem Boden (Etappe 1.3) ------------------------------

/**
 * Die Gegenprobe zur Bodenfreiheit: dasselbe Rechteck einmal aufsitzend und
 * einmal um acht Zellen angehoben. Gemessen wird in beiden Fällen derselbe
 * Streifen unmittelbar über dem Boden — beim aufsitzenden Rechteck gehört er
 * zum Körper und steht still, beim angehobenen ist er freie Strömung.
 */
function pruefeBodenfreiheit() {
  const titel = 'Teil 6 — Höhe über dem Boden: aufsitzend gegen angehoben (Etappe 1.3)';
  console.log(`\n${titel}`);
  console.log('-'.repeat(titel.length));

  const BODENABSTAND = 8;
  const rechteck = { art: 'rechteck', x: 40, breite: 16, hoehe: 16 };
  const faelle = [];

  for (const bodenabstand of [0, BODENABSTAND]) {
    const kanal = erzeugeKanal({
      breite: 120,
      hoehe: 60,
      windgeschwindigkeit: 0.1,
      zaehigkeit: 0.01,
      hindernis: { ...rechteck, bodenabstand },
    });
    console.log(
      `\n${bodenabstand === 0 ? 'Aufsitzend (bodenabstand 0)' : `Angehoben (bodenabstand ${bodenabstand})`}:` +
        ` ${beschreibeHindernis(kanal.hindernis)}`
    );
    schritte(kanal, SCHRITTE_GESAMT);
    console.log(`Strömungsbild nach ${kanal.schrittzahl} Schritten`);
    zeichneStroemungsbild(kanal);

    faelle.push({
      bodenabstand,
      unterkante: ausdehnung(kanal.hindernis).unten,
      spalt: messeStreifen(kanal, rechteck.x, 1, BODENABSTAND),
      stand: messeGesamtzustand(kanal),
    });
  }

  const [aufsitzend, angehoben] = faelle;

  return melde([
    {
      name: 'Beide Rechnungen stehen (keine ungültigen Werte)',
      bestanden: aufsitzend.stand.ungueltige === 0 && angehoben.stand.ungueltige === 0,
      befund: `aufsitzend ${aufsitzend.stand.ungueltige}, angehoben ${angehoben.stand.ungueltige} ungültige Werte`,
    },
    {
      name: 'Die eingestellte Höhe über dem Boden kommt im Gitter an',
      bestanden: aufsitzend.unterkante === 1 && angehoben.unterkante === 1 + BODENABSTAND,
      befund:
        `Unterkante aufsitzend bei y = ${aufsitzend.unterkante} (unterste Luftzelle des Kanals),` +
        ` angehoben bei y = ${angehoben.unterkante} — also ${BODENABSTAND} Zellen Luft darunter`,
    },
    {
      name: 'Das aufsitzende Rechteck lässt darunter nichts durch',
      bestanden: aufsitzend.spalt.luftzellen === 0 && aufsitzend.spalt.hoechsteGeschwindigkeit === 0,
      befund:
        `im Streifen y = 1 bis ${BODENABSTAND} über dem Boden ${aufsitzend.spalt.luftzellen} Luftzellen,` +
        ` Geschwindigkeit dort ${aufsitzend.spalt.hoechsteGeschwindigkeit.toFixed(5)}` +
        ` — der Streifen gehört ganz zum Körper`,
    },
    {
      name: 'Dasselbe Rechteck angehoben wird sichtbar unterströmt',
      bestanden:
        angehoben.spalt.luftzellen === BODENABSTAND &&
        angehoben.spalt.hoechsteGeschwindigkeit > 0.5 * 0.1,
      befund:
        `im selben Streifen ${angehoben.spalt.luftzellen} Luftzellen,` +
        ` bis zu ${(100 * angehoben.spalt.hoechsteGeschwindigkeit / 0.1).toFixed(1)} % der Windgeschwindigkeit` +
        ` — durch den Spalt wird die Luft sogar schneller als der Wind`,
    },
  ]);
}

// --- Teil 7: Geschwindigkeit, Druck, Wirbelstärke (Etappe 1.4) -------------

/**
 * Derselbe Kreis wie in Teil 2, nur länger gerechnet. Gezeigt wird, was sich aus
 * dem Gitter ablesen lässt: Druck und Wirbelstärke als Bild, und die
 * Wirbelstärke an einer festen Stelle hinter dem Kreis über die Zeit.
 *
 * Der Vorzeichenwechsel dort ist das Abnahmekriterium dieser Etappe. Er ist
 * nicht willkürlich: Ein umströmter Kreis wirft abwechselnd links- und
 * rechtsdrehende Wirbel ab (die „Kármánsche Wirbelstraße"). Wer an einer Stelle
 * im Nachlauf stehen bleibt, sieht deshalb abwechselnd die eine und die andere
 * Drehrichtung vorbeiziehen.
 */
function pruefeAbgeleiteteGroessen() {
  const titel = 'Teil 7 — Geschwindigkeit, Druck und Wirbelstärke am Kreis (Etappe 1.4)';
  console.log(`\n${titel}`);
  console.log('-'.repeat(titel.length));

  const kanal = erzeugeKanal({
    breite: 120,
    hoehe: 60,
    windgeschwindigkeit: 0.1,
    zaehigkeit: 0.01,
    hindernis: { art: 'kreis', x: 40, y: 30, durchmesser: 16 },
  });
  beschreibeKanal(kanal);
  console.log(`Hindernis: ${beschreibeHindernis(kanal.hindernis)}\n`);

  const form = kanal.hindernis;
  const kanten = ausdehnung(form);

  schritte(kanal, EINSCHWINGEN);

  // Die Messstelle liegt eine halbe Kreisbreite hinter dem Körper, auf seiner
  // Mittellinie — dort ziehen die abgelösten Wirbel abwechselnd vorbei.
  const messstelle = { x: kanten.rechts + 8, y: form.y };

  const verlauf = [];
  for (let n = 0; n < AUFZEICHNUNG; n++) {
    schritt(kanal);
    verlauf.push(wirbelstaerkeBei(kanal, messstelle.x, messstelle.y));
  }

  const felder = leseFelder(kanal);

  console.log(`Druckbild nach ${kanal.schrittzahl} Schritten`);
  zeichneFeldbild(kanal, felder.druck, 'Unterdruck (Sog)', 'Überdruck (Stau)');

  console.log(`\nWirbelstärkebild nach ${kanal.schrittzahl} Schritten`);
  console.log('  Die abwechselnden Flecken hinter dem Kreis sind die abgelösten Wirbel.');
  zeichneFeldbild(kanal, felder.wirbelstaerke, 'Drehung im Uhrzeigersinn', 'Drehung dagegen');

  console.log(
    `\nWirbelstärke an einer festen Stelle hinter dem Kreis (x = ${messstelle.x}, y = ${messstelle.y}),` +
      ` über ${AUFZEICHNUNG} Schritte`
  );
  zeichneZeitverlauf(verlauf, EINSCHWINGEN);

  // --- Messwerte für die Prüfpunkte
  const abweichung = vergleicheFeldMitEinzelabfrage(kanal, felder);

  const staupunkt = druckBei(kanal, kanten.links - 2, form.y); // vor dem Kreis
  const sog = druckBei(kanal, kanten.rechts + 2, form.y); // unmittelbar dahinter
  const druckImKoerper = druckBei(kanal, form.x, form.y);

  const freieStroemung = wirbelstaerkeBei(kanal, 15, kanal.hoehe - 8); // weit weg von allem
  const amBoden = wirbelstaerkeBei(kanal, 15, 1);
  const ueberDemKreis = mittlereWirbelstaerke(kanal, form.x, kanten.oben + 1, kanten.oben + 3);
  const unterDemKreis = mittlereWirbelstaerke(kanal, form.x, kanten.unten - 3, kanten.unten - 1);

  // Vorzeichenwechsel mit Schwelle, damit kleines Zittern um die Null nicht als
  // Wechsel durchgeht: gezählt wird erst, wenn der Wert deutlich auf die andere
  // Seite ausschlägt.
  const ausschlag = Math.max(...verlauf.map(Math.abs));
  const wechsel = findeVorzeichenwechsel(verlauf, 0.25 * ausschlag);
  const abstaende = wechsel.slice(1).map((stelle, n) => stelle.schritt - wechsel[n].schritt);
  const mittlererAbstand = abstaende.reduce((summe, wert) => summe + wert, 0) / (abstaende.length || 1);
  const groessteAbweichung = Math.max(...abstaende.map((wert) => Math.abs(wert - mittlererAbstand)));

  return melde([
    {
      name: 'Das ganze Feld auf einmal liefert dasselbe wie die Einzelabfrage',
      bestanden: abweichung.groesste === 0 && abweichung.zellen > 0,
      befund:
        `${abweichung.zellen} Zellen geprüft (Geschwindigkeit, Druck, Wirbelstärke),` +
        ` größter Unterschied ${abweichung.groesste} — kein Feld ist verschoben oder vertauscht`,
    },
    {
      name: 'Vor dem Kreis staut sich der Druck, dahinter zieht es',
      bestanden: staupunkt > 0 && sog < 0 && druckImKoerper === 0,
      befund:
        `zwei Zellen davor ${vorzeichenbehaftet(staupunkt)} (Überdruck),` +
        ` zwei Zellen dahinter ${vorzeichenbehaftet(sog)} (Unterdruck);` +
        ` im Körper selbst ${druckImKoerper} — dort hat Druck keine Bedeutung`,
    },
    {
      name: 'Wirbelstärke: in der freien Strömung nahe null, am Boden deutlich',
      bestanden: Math.abs(freieStroemung) < 0.1 * Math.abs(amBoden) && amBoden < 0,
      befund:
        `oben im freien Strom ${vorzeichenbehaftet(freieStroemung)},` +
        ` unmittelbar über dem Boden ${vorzeichenbehaftet(amBoden)}` +
        ` — die Grenzschicht ist die Scherung, die die Wirbelstärke misst`,
    },
    {
      name: 'Über und unter dem Kreis dreht die Luft gegensinnig',
      bestanden: ueberDemKreis < 0 && unterDemKreis > 0,
      befund:
        `oben ${vorzeichenbehaftet(ueberDemKreis)} (im Uhrzeigersinn),` +
        ` unten ${vorzeichenbehaftet(unterDemKreis)} (dagegen)` +
        ` — beide Seiten scheren die Luft, aber in entgegengesetzte Richtung`,
    },
    {
      // Das Abnahmekriterium der Etappe.
      name: 'Hinter dem Kreis kehrt sich die Wirbelstärke periodisch im Vorzeichen um',
      bestanden:
        wechsel.length >= 4 && abstaende.length > 0 && groessteAbweichung < 0.2 * mittlererAbstand,
      befund:
        `${wechsel.length} Vorzeichenwechsel in ${AUFZEICHNUNG} Schritten,` +
        ` im Mittel alle ${Math.round(mittlererAbstand)} Schritte` +
        ` (Schwankung höchstens ${Math.round(groessteAbweichung)} Schritte,` +
        ` also ${(100 * groessteAbweichung / mittlererAbstand).toFixed(1)} %);` +
        ` eine volle Umdrehung des Wechselspiels dauert ${Math.round(2 * mittlererAbstand)} Schritte,` +
        ` stärkster Ausschlag ${ausschlag.toFixed(4)}`,
    },
  ]);
}

/** Zahl mit Vorzeichen, damit „positiv" und „negativ" im Text ablesbar sind. */
function vorzeichenbehaftet(wert) {
  return (wert >= 0 ? '+' : '') + wert.toExponential(2);
}

/** Mittlere Wirbelstärke in einem senkrechten Stück einer Spalte. */
function mittlereWirbelstaerke(kanal, x, yVon, yBis) {
  let summe = 0;
  let zellen = 0;
  for (let y = yVon; y <= yBis; y++) {
    if (!istFluid(kanal, x, y)) continue;
    summe += wirbelstaerkeBei(kanal, x, y);
    zellen++;
  }
  return zellen === 0 ? NaN : summe / zellen;
}

/**
 * Gegenprobe: Was `leseFelder` für den ganzen Kanal liefert, muss Zelle für
 * Zelle dasselbe sein wie die Einzelabfrage. Das prüft weniger die Rechnung als
 * die Buchführung — ein vertauschter Zellindex fiele hier sofort auf.
 */
function vergleicheFeldMitEinzelabfrage(kanal, felder) {
  let groesste = 0;
  let zellen = 0;
  for (let y = 0; y < kanal.hoehe; y++) {
    for (let x = 0; x < kanal.breite; x++) {
      const zelle = x + y * kanal.breite;
      const luft = istFluid(kanal, x, y);
      const { ux, uy } = luft ? geschwindigkeitBei(kanal, x, y) : { ux: 0, uy: 0 };
      const unterschiede = [
        Math.abs(felder.ux[zelle] - ux),
        Math.abs(felder.uy[zelle] - uy),
        Math.abs(felder.tempo[zelle] - Math.hypot(ux, uy)),
        Math.abs(felder.druck[zelle] - druckBei(kanal, x, y)),
        Math.abs(felder.wirbelstaerke[zelle] - wirbelstaerkeBei(kanal, x, y)),
      ];
      groesste = Math.max(groesste, ...unterschiede);
      zellen++;
    }
  }
  return { groesste, zellen };
}

/**
 * Sucht die Stellen, an denen der Wert das Vorzeichen wechselt. Gezählt wird
 * erst, wenn er die Schwelle auf der anderen Seite überschreitet — sonst zählte
 * jedes Zittern um die Null als Wechsel.
 */
function findeVorzeichenwechsel(reihe, schwelle) {
  const wechsel = [];
  let seite = 0; // 0 noch unentschieden, +1 oben, -1 unten
  for (let n = 0; n < reihe.length; n++) {
    if (reihe[n] > schwelle && seite !== 1) {
      if (seite === -1) wechsel.push({ schritt: n, nach: '+' });
      seite = 1;
    } else if (reihe[n] < -schwelle && seite !== -1) {
      if (seite === 1) wechsel.push({ schritt: n, nach: '-' });
      seite = -1;
    }
  }
  return wechsel;
}

// --- Ausgabe ---------------------------------------------------------------

function beschreibeKanal(kanal) {
  console.log(`Kanal: ${kanal.breite} × ${kanal.hoehe} Zellen, Wind ${kanal.windgeschwindigkeit} Zellen je Schritt,`);
  console.log(`Zähigkeit ${kanal.zaehigkeit} (Angleichzeit ${kanal.angleichzeit.toFixed(3)}), Boden haftend, Decke gleitend`);
}

/** Beschreibt eine vervollständigte Form in einem Satz. */
function beschreibeHindernis(form) {
  const masse = {
    kreis: () => `Kreis, Durchmesser ${form.durchmesser} Zellen`,
    rechteck: () => `Rechteck, ${form.breite} × ${form.hoehe} Zellen`,
    platte: () => `Stumpfe Platte, ${form.laenge} Zellen lang und ${form.dicke} dick`,
    profil: () => `Tragflächenprofil, ${form.laenge} Zellen lang und ${form.dicke} dick`,
  };
  const anstellung =
    form.winkel === 0 ? 'nicht angestellt' : `Anstellwinkel ${form.winkel}° (Anströmkante angehoben)`;
  return `${masse[form.art]()}, Mitte bei x = ${form.x}, y = ${zahl(form.y)}, ${anstellung}`;
}

/** Ganze Zahlen ohne Nachkommastellen, halbe Zellen mit einer. */
function zahl(wert) {
  return Number.isInteger(wert) ? String(wert) : wert.toFixed(1);
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

/**
 * Reines Formbild ohne Strömung: eine Zelle je Zeichen in der Breite, zwei in
 * der Höhe. Boden und Decke bleiben weg — zu sehen sein soll allein der Körper.
 */
function zeichneFormbild(kanal) {
  for (let yOben = kanal.hoehe - 2; yOben >= 1; yOben -= 2) {
    let zeile = '';
    for (let x = 0; x < kanal.breite; x++) {
      let wand = false;
      for (let y = Math.max(1, yOben - 1); y <= yOben; y++) {
        if (!istFluid(kanal, x, y)) wand = true;
      }
      zeile += wand ? '#' : ' ';
    }
    console.log(`  |${zeile}|`);
  }
  console.log(`  ${'-'.repeat(kanal.breite + 2)}  Boden`);
}

/**
 * Textbild eines Feldes, das nach beiden Seiten ausschlagen kann — Druck
 * (Unterdruck / Überdruck) ebenso wie Wirbelstärke (die eine Drehrichtung / die
 * andere). Blockeinteilung wie im Strömungsbild.
 *
 * Je Block wird nicht gemittelt, sondern der stärkste Wert genommen: dünne
 * Scherschichten und die Wirbel dahinter würden sich sonst gegenseitig
 * wegmitteln, und übrig bliebe ein leeres Bild.
 */
function zeichneFeldbild(kanal, werte, negativ, positiv) {
  const ZIEL_SPALTEN = 60;
  const blockBreite = Math.max(1, Math.ceil(kanal.breite / ZIEL_SPALTEN));
  const blockHoehe = blockBreite * 2;

  // Maßstab aus dem Feld selbst, ohne die beiden Randstreifen: dort setzen
  // Einlass und Auslass die Werte, das sagt über den Kanal nichts aus.
  let staerkster = 0;
  for (let y = 1; y < kanal.hoehe - 1; y++) {
    for (let x = 5; x < kanal.breite - 5; x++) {
      if (!istFluid(kanal, x, y)) continue;
      staerkster = Math.max(staerkster, Math.abs(werte[x + y * kanal.breite]));
    }
  }

  const stufen = [
    { grenze: -0.5, zeichen: 'X' },
    { grenze: -0.15, zeichen: 'x' },
    { grenze: 0.15, zeichen: ' ' },
    { grenze: 0.5, zeichen: 'o' },
    { grenze: Infinity, zeichen: 'O' },
  ];

  console.log(`  Legende: '#' Hindernis, ' ' fast nichts`);
  console.log(`           'X' stark, 'x' schwach — ${negativ}`);
  console.log(`           'O' stark, 'o' schwach — ${positiv}`);
  console.log(`  Maßstab: stärkster Wert im Kanal ${staerkster.toExponential(2)}`);

  for (let yOben = kanal.hoehe - 1; yOben >= 0; yOben -= blockHoehe) {
    let zeile = '';
    for (let xLinks = 0; xLinks < kanal.breite; xLinks += blockBreite) {
      let wand = false;
      let staerkerWert = 0;
      let zellen = 0;
      for (let y = Math.max(0, yOben - blockHoehe + 1); y <= yOben; y++) {
        for (let x = xLinks; x < Math.min(kanal.breite, xLinks + blockBreite); x++) {
          if (!istFluid(kanal, x, y)) {
            if (y > 0 && y < kanal.hoehe - 1) wand = true;
            continue;
          }
          const wert = werte[x + y * kanal.breite];
          if (Math.abs(wert) > Math.abs(staerkerWert)) staerkerWert = wert;
          zellen++;
        }
      }
      if (wand || zellen === 0) {
        zeile += '#';
        continue;
      }
      const anteil = staerkster === 0 ? 0 : staerkerWert / staerkster;
      zeile += stufen.find((stufe) => anteil < stufe.grenze).zeichen;
    }
    console.log(`  |${zeile}|`);
  }
  console.log(`  ${'-'.repeat(Math.ceil(kanal.breite / blockBreite) + 2)}  Boden`);
}

/**
 * Zeitverlauf eines Wertes als liegende Kurve: die Null steht in der Mitte, der
 * Ausschlag geht nach links und rechts. Ausgegeben wird nicht jeder Schritt,
 * sonst wären es tausende Zeilen.
 */
function zeichneZeitverlauf(reihe, versatzSchritte) {
  const HALBE_BREITE = 30;
  const ZEILEN = 52;
  const abstand = Math.max(1, Math.round(reihe.length / ZEILEN));
  const ausschlag = Math.max(...reihe.map(Math.abs)) || 1;

  console.log(
    `  Null in der Mitte, links Drehung im Uhrzeigersinn, rechts dagegen;` +
      ` Rand entspricht ${ausschlag.toExponential(2)}`
  );
  console.log(`  Schritt   ${'-'.repeat(HALBE_BREITE)}0${'-'.repeat(HALBE_BREITE)}`);

  for (let n = 0; n < reihe.length; n += abstand) {
    const stelle = Math.round((reihe[n] / ausschlag) * HALBE_BREITE);
    const zeichen = Array(2 * HALBE_BREITE + 1).fill(' ');
    zeichen[HALBE_BREITE] = '|';
    zeichen[HALBE_BREITE + stelle] = '#';
    console.log(`  ${String(versatzSchritte + n + 1).padStart(7)}   ${zeichen.join('')}`);
  }
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

/** Zellen, die zum Hindernis gehören — Boden und Decke zählen nicht mit. */
function zaehleFormzellen(kanal) {
  let zellen = 0;
  for (let y = 1; y < kanal.hoehe - 1; y++) {
    for (let x = 0; x < kanal.breite; x++) {
      if (!istFluid(kanal, x, y)) zellen++;
    }
  }
  return zellen;
}

/** Belegen zwei Kanäle genau dieselben Zellen? */
function belegungGleich(einer, anderer) {
  if (einer.zellart.length !== anderer.zellart.length) return false;
  for (let zelle = 0; zelle < einer.zellart.length; zelle++) {
    if (einer.zellart[zelle] !== anderer.zellart[zelle]) return false;
  }
  return true;
}

/** Wie viele Zellen der Form liegen in der Spalte x? */
function formhoeheInSpalte(kanal, x) {
  let zellen = 0;
  for (let y = 1; y < kanal.hoehe - 1; y++) {
    if (!istFluid(kanal, x, y)) zellen++;
  }
  return zellen;
}

/**
 * Mittlere Höhe der Formzellen im vorderen und im hinteren Drittel. Bei einem
 * angestellten Körper muss vorn höher liegen als hinten.
 */
function vergleicheVorderUndHinterkante(kanal) {
  const kanten = ausdehnung(kanal.hindernis);
  const drittel = (kanten.rechts - kanten.links) / 3;
  const vorn = mittlereHoehe(kanal, kanten.links, kanten.links + drittel);
  const hinten = mittlereHoehe(kanal, kanten.rechts - drittel, kanten.rechts);
  return { vorn, hinten, unterschied: vorn - hinten };
}

/** Mittlere Höhe aller Formzellen zwischen zwei Spalten. */
function mittlereHoehe(kanal, xVon, xBis) {
  let summe = 0;
  let zellen = 0;
  for (let y = 1; y < kanal.hoehe - 1; y++) {
    for (let x = Math.ceil(xVon); x <= Math.floor(xBis); x++) {
      if (istFluid(kanal, x, y)) continue;
      summe += y;
      zellen++;
    }
  }
  return zellen === 0 ? NaN : summe / zellen;
}

/**
 * Dicke der Form auf einem Viertel und auf neun Zehnteln ihrer Länge — daran
 * zeigt sich, ob eine Form nach hinten ausläuft oder abgeschnitten ist.
 */
function messeDickenverlauf(kanal) {
  const kanten = ausdehnung(kanal.hindernis);
  const laenge = kanten.rechts - kanten.links;
  return {
    vorn: formhoeheInSpalte(kanal, Math.round(kanten.links + 0.25 * laenge)),
    hinten: formhoeheInSpalte(kanal, Math.round(kanten.links + 0.9 * laenge)),
  };
}

/** Stärkste Rückströmung (negatives ux) im Bereich zwischen zwei Spalten. */
function staerksteRueckstroemung(kanal, xVon, xBis) {
  let staerkste = 0;
  for (let y = 1; y < kanal.hoehe - 1; y++) {
    for (let x = Math.max(1, xVon); x <= Math.min(kanal.breite - 2, xBis); x++) {
      if (!istFluid(kanal, x, y)) continue;
      const { ux } = geschwindigkeitBei(kanal, x, y);
      if (-ux > staerkste) staerkste = -ux;
    }
  }
  return staerkste;
}

/**
 * Misst einen senkrechten Streifen in der Spalte x, von `yVon` bis `yBis`
 * einschließlich: wie viele Luftzellen darin liegen und wie schnell es dort
 * höchstens strömt. Wandzellen zählen mit Geschwindigkeit null.
 */
function messeStreifen(kanal, x, yVon, yBis) {
  let luftzellen = 0;
  let hoechsteGeschwindigkeit = 0;
  for (let y = yVon; y <= yBis; y++) {
    if (istFluid(kanal, x, y)) luftzellen++;
    const { ux, uy } = geschwindigkeitBei(kanal, x, y);
    const tempo = Math.hypot(ux, uy);
    if (!(tempo <= hoechsteGeschwindigkeit)) hoechsteGeschwindigkeit = tempo;
  }
  return { luftzellen, hoechsteGeschwindigkeit };
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
