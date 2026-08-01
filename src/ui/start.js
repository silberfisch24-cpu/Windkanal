/**
 * Einstiegspunkt der Oberfläche: legt den Kanal an und treibt die Bildschleife.
 *
 * Diese Datei verbindet beide Seiten — sie holt die Rechnung aus `src/kern/`,
 * gibt sie an `darstellung.js` weiter und nimmt von `bedienung.js` entgegen,
 * was angeklickt oder gezogen wurde. Der Kern erfährt davon nichts.
 *
 * Stand Etappe 3.3: Form wählen, anhalten, zurücksetzen, über fünf Regler Wind,
 * Größe, Anstellwinkel, Höhe über dem Boden und die Rechenauflösung einstellen,
 * zwischen drei Farbfeldern umschalten und die Teilchen darüberlegen.
 *
 * **Alle Maße dieser Datei sind grobe Zellen** — die der Stufe `grob`. Erst
 * `baueForm` rechnet sie mit dem `faktor` der eingestellten Stufe auf deren
 * Gitter hoch. Dadurch bedeutet eine Reglerstellung in jeder Auflösung dieselbe
 * Szene, und ein Stufenwechsel zeigt sie schärfer statt anders.
 */

import {
  erzeugeKanal,
  schritt,
  setzeHindernis,
  setzeWindgeschwindigkeit,
  setzeAufAnfangszustand,
  AUFLOESUNGEN,
} from '../kern/loeser.js';
import { normalisiereForm, ausdehnung, skaliereForm } from '../kern/formen.js';
import { erzeugeFelder, leseFelder } from '../kern/felder.js';
import { erzeugeDarstellung, ANFANGSANSICHT } from './darstellung.js';
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

/**
 * Die drei Farbfelder, zwischen denen sich umschalten lässt.
 *
 * Der Schlüssel ist zugleich der Name des Feldes in `leseFelder` und der der
 * Ansicht in `darstellung.js` — dieselbe Größe heißt überall gleich.
 *
 * Die **Teilchen sind keine vierte Schaltfläche in dieser Reihe**, sondern ein
 * eigener Schalter daneben. Sie liegen als kurze Striche über dem Farbfeld
 * (siehe „Darstellung" in SPEC.md) und schließen keines der drei aus: „welche
 * Größe wird eingefärbt" und „liegen Teilchen darüber" sind zwei Fragen. Als
 * vierte Schaltfläche in derselben Reihe müsste man sich zwischen den Teilchen
 * und jedem Farbfeld entscheiden — und zusammen sind sie am aufschlussreichsten.
 *
 * `deutung` erklärt die Farben. Ohne diesen Satz sieht man beim Druck und bei
 * der Wirbelstärke zwar, *dass* sich etwas ändert, aber nicht, in welche
 * Richtung — die Legende dazu kommt erst in Etappe 4.1.
 */
const ANSICHTEN = [
  {
    schluessel: 'tempo',
    name: 'Geschwindigkeit',
    groesse: 'Geschwindigkeit der Luft',
    deutung: 'hell ist langsam, dunkel ist schnell',
  },
  {
    schluessel: 'druck',
    name: 'Druck',
    groesse: 'Druck der Luft',
    // Der leichte Abfall über die ganze Kanallänge ist keine Erscheinung am
    // Körper, sondern die Randbedingung: hinten hält der Auslass den Druck
    // fest, davor staut die Reibung. Ohne diesen Hinweis liest man das
    // durchgehende Gefälle als Fehler (siehe Änderungsverlauf zu Etappe 1.4).
    deutung:
      'rot ist Überdruck, blau ist Unterdruck, hell ist der Ruhedruck; über die ganze Kanallänge fällt er zusätzlich leicht ab, das ist die Reibung',
  },
  {
    schluessel: 'wirbelstaerke',
    name: 'Wirbelstärke',
    groesse: 'Drehung der Luft',
    deutung:
      'orange dreht gegen den Uhrzeigersinn, violett mit ihm, hell heißt drehungsfrei',
  },
];

/** Womit die Seite aufgeht. */
const ANFANGSFORM = 'kreis';

/**
 * Ob die Teilchen von Anfang an liegen.
 *
 * Aus: Der erste Blick soll das Farbfeld sein, das Etappe 2.1 abgenommen hat.
 * Die Teilchen sind eine Zutat, die man dazuschaltet — und wer sie gleich
 * mitgeliefert bekäme, könnte den Unterschied nicht sehen, den sie machen.
 */
const TEILCHEN_ANFANGS = false;

/** Wo das Hindernis im Kanal steht, in groben Zellen vom Einlass aus gezählt. */
const LAGE_X = 40;

/**
 * Die Auflösungsstufen in der Reihenfolge, in der der Regler sie durchfährt —
 * von grob nach fein. Der Reglerwert ist die Nummer in dieser Liste, nicht der
 * Name der Stufe: ein Schieber führt Zahlen.
 */
const STUFEN = Object.keys(AUFLOESUNGEN);

/**
 * Die Windgeschwindigkeit, auf die sich der Windregler als 100 % bezieht — der
 * Wert, mit dem die Seite seit Etappe 2.1 läuft.
 */
const WIND_VOREINSTELLUNG = 0.1;

/**
 * Die fünf Regler mit ihren Bereichen.
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
 *
 * Die Grenzen gelten in **allen drei Auflösungsstufen** — nachgemessen in
 * Etappe 3.2 (siehe Änderungsverlauf zum 2026-08-01): über 3000 Schritte
 * entsteht in keiner Stufe ein ungültiger Wert. Sie müssen deshalb nicht je
 * Stufe verengt werden.
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
  {
    schluessel: 'aufloesung',
    name: 'Rechenauflösung',
    mindestens: 0,
    hoechstens: STUFEN.length - 1,
    schritt: 1,
    // Vorläufig: Womit die Seite aufgeht, hängt vom Gerät ab und wird beim
    // Start durch `waehleVoreinstellung` ersetzt.
    wert: 0,
  },
];

/**
 * Wie viele Rechenschritte je Bild eine Stufe mindestens schaffen muss, damit
 * sie als Voreinstellung in Frage kommt.
 *
 * Nicht die Bildfolge ist hier das Maß — die bleibt über das Zeitbudget in
 * jeder Stufe gleichmäßig —, sondern wie schnell die Strömung vorankommt. Bis
 * sich hinter dem Körper eine Wirbelstraße eingeschwungen hat, vergehen einige
 * tausend Rechenschritte (in Etappe 1.4 nachgemessen). Bei vier Schritten je
 * Bild ist das eine gute halbe Minute; bei einem wäre es das Vierfache, und der
 * Erstbesucher sähe nur ein zähes Bild. Wer die feinste Stufe trotzdem will,
 * stellt sie von Hand ein — voreingestellt wird sie nur, wo sie vorankommt.
 */
const SCHRITTE_JE_BILD_MINDESTENS = 4;

/**
 * Der Probelauf, mit dem die Rechenleistung des Geräts gemessen wird: erst
 * aufwärmen, dann in mehreren Blöcken messen.
 *
 * Die ersten Schritte sind nicht aussagekräftig — der Browser übersetzt den
 * Code erst während der Ausführung in Maschinensprache und wird dabei
 * schneller. Ohne Aufwärmen fiele jedes Gerät zu langsam aus.
 *
 * Gemessen wird in Blöcken, weil eine einzelne Messung nach oben ausreißen
 * kann: Kommt dem Browser mitten im Block etwas dazwischen, sieht das Gerät
 * langsamer aus, als es ist. Beim Nachmessen am 2026-08-01 lag zwischen dem
 * schnellsten und dem langsamsten Lauf desselben Codes das 2,4-fache. Ein
 * Ausreißer nach *unten* ist dagegen nicht möglich — schneller als sie kann
 * die Maschine nicht rechnen. Deshalb zählt der schnellste Block.
 *
 * Zusammen sind es 58 Schritte auf dem groben Gitter: auf einem langsamen Gerät
 * gut eine Zehntelsekunde beim Laden, auf einem schnellen kaum messbar.
 */
const AUFWAERMSCHRITTE = 10;
const MESSBLOECKE = 4;
const SCHRITTE_JE_BLOCK = 12;

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
  let gewaehlteAnsicht = ANFANGSANSICHT;
  let teilchenAn = TEILCHEN_ANFANGS;

  // Womit die Seite aufgeht, hängt vom Gerät ab — siehe `waehleVoreinstellung`.
  einstellungen.aufloesung = waehleVoreinstellung(zeichenflaeche);

  // Kanal, Felder und Zeichenfläche hängen an der Auflösung und werden bei
  // jedem Stufenwechsel neu angelegt — das Gitter ändert dabei seine Größe.
  // Angelegt wird erst, wenn die Bedienleiste steht: `legeKanalAn` beschriftet
  // sie mit.
  let kanal;
  let felder;
  let darstellung;

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
    ansichtfeld: document.querySelector('#ansichtauswahl'),
    laufschalter: document.querySelector('#laufschalter'),
    ruecksetzer: document.querySelector('#ruecksetzer'),
    teilchenschalter: document.querySelector('#teilchenschalter'),
    reglerfeld: document.querySelector('#reglerleiste'),
    formen: SZENEN,
    ansichten: ANSICHTEN,
    regler: REGLER,
    beiFormwahl: waehleForm,
    beiAnsichtwahl: waehleAnsicht,
    beiLaufwechsel: wechsleLauf,
    beiRuecksetzen: setzeZurueck,
    beiTeilchenwechsel: wechsleTeilchen,
    beiReglerwechsel: stelleEin,
  });

  bedienung.zeigeForm(gewaehlteForm);
  bedienung.zeigeAnsicht(gewaehlteAnsicht);
  bedienung.zeigeLauf(laeuft);
  bedienung.zeigeTeilchen(teilchenAn);
  legeKanalAn();
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
   * Wechselt das Farbfeld.
   *
   * Die Strömung läuft dabei weiter: Es wird nur eine andere der Größen
   * eingefärbt, die `leseFelder` ohnehin in jedem Bild alle drei ausrechnet.
   * Genau darauf zielt das Abnahmekriterium — „alle vier Ansichten am **selben**
   * Strömungsbild durchschalten".
   */
  function waehleAnsicht(schluessel) {
    if (schluessel === gewaehlteAnsicht) return;
    gewaehlteAnsicht = schluessel;
    bedienung.zeigeAnsicht(schluessel);
    beschrifte();
    // Auch im angehaltenen Zustand muss das Bild wechseln — sonst sähe die
    // Schaltfläche wirkungslos aus.
    zeichneStand();
  }

  /** Legt die Teilchen über das Farbfeld oder nimmt sie wieder weg. */
  function wechsleTeilchen() {
    teilchenAn = !teilchenAn;
    bedienung.zeigeTeilchen(teilchenAn);
    // Beim Einschalten frisch aussäen: Der Schwarm ist über die Zeit, in der er
    // unsichtbar war, ohnehin nicht mitgetrieben, und stünde sonst noch dort,
    // wo die Strömung vor dem Ausschalten war.
    if (teilchenAn) darstellung.saeeTeilchenNeu();
    beschrifte();
    zeichneStand();
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

    // Eine andere Auflösung ist ein anderes Gitter: Kanal, Felder und
    // Zeichenfläche müssen neu angelegt werden, ein bloßes Umsetzen des
    // Hindernisses genügt nicht.
    if (schluessel === 'aufloesung') {
      legeKanalAn();
      return;
    }

    baueHindernisNeu();
  }

  /** Setzt die Strömung auf den Anfangszustand zurück, ohne etwas zu verstellen. */
  function setzeZurueck() {
    setzeAufAnfangszustand(kanal);
    darstellung.saeeTeilchenNeu();
    vergissMessung();
    zeichneStand();
  }

  /**
   * Legt den Kanal in der eingestellten Auflösung an — beim Start und nach
   * jedem Stufenwechsel.
   *
   * Die Reglerstellungen bleiben dabei stehen; sie sind in groben Zellen
   * angegeben und werden von `baueForm` auf das neue Gitter hochgerechnet. Was
   * man eingestellt hat, bedeutet nach dem Wechsel also dasselbe — nur feiner
   * aufgelöst. Die Strömung setzt neu an: ein Gitter lässt sich nicht mitten im
   * Lauf austauschen.
   */
  function legeKanalAn() {
    begrenzeHoehe();
    kanal = erzeugeKanal({
      aufloesung: stufe(einstellungen).name,
      windgeschwindigkeit: windAus(einstellungen.wind),
      hindernis: baueForm(szene(gewaehlteForm), einstellungen),
    });
    felder = erzeugeFelder(kanal);
    darstellung = erzeugeDarstellung(zeichenflaeche, kanal);
    vergissMessung();
    beschrifteRegler();
    beschrifte();
    zeichneStand();
  }

  /**
   * Baut das Hindernis aus den gegenwärtigen Reglerstellungen neu auf. Der Kern
   * setzt die Rechnung dabei von selbst zurück.
   */
  function baueHindernisNeu() {
    begrenzeHoehe();
    setzeHindernis(kanal, baueForm(szene(gewaehlteForm), einstellungen));
    // Die Wandzellen liegen jetzt anders; Teilchen, die eben noch frei standen,
    // stecken sonst in der neuen Form.
    darstellung.saeeTeilchenNeu();
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
   * Wie viele grobe Zellen Luft höchstens unter der Form bleiben dürfen.
   *
   * Der Mittelpunkt steigt mit dem Bodenabstand um genau denselben Betrag. Es
   * genügt deshalb, die Form einmal aufsitzend zu vermessen und zu sehen, wie
   * viel bis zur Decke übrig bleibt. Die oberste Zeile ist die Decke selbst,
   * die vorletzte muss frei bleiben — dieselbe Bedingung, die `loeser.js` prüft.
   *
   * Gemessen wird auf dem Gitter der eingestellten Stufe, geantwortet in groben
   * Zellen — das ist die Einheit, in der der Regler steht. Die Maße der Stufe
   * kommen dabei aus `AUFLOESUNGEN` und nicht aus `kanal`, damit die Grenze
   * auch dann schon feststeht, wenn der Kanal für die neue Stufe erst noch
   * angelegt wird.
   */
  function hoechsteHoehe() {
    const { hoehe, faktor } = stufe(einstellungen);
    const aufsitzend = normalisiereForm(
      baueForm(szene(gewaehlteForm), { ...einstellungen, bodenabstand: 0 })
    );
    const frei = hoehe - 2 - ausdehnung(aufsitzend).oben;
    return Math.max(0, Math.floor(frei / faktor));
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

    const gewaehlteStufe = stufe(einstellungen);
    bedienung.zeigeRegler('aufloesung', {
      wert: einstellungen.aufloesung,
      // Der Name allein („mittel") sagt nicht, wovon er die Mitte ist. Mit den
      // Gittermaßen daneben ist zu sehen, was die Stufe kostet und einbringt.
      text: `${gewaehlteStufe.name} · ${gewaehlteStufe.breite} × ${gewaehlteStufe.hoehe} Zellen`,
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
    darstellung.zeichne(felder, { ansicht: gewaehlteAnsicht, teilchen: teilchenAn, schritte });

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
   * Nötig, weil Form wechseln, Ansicht wechseln, Zurücksetzen und die Regler
   * auch im angehaltenen Zustand bedienbar sind: ohne dieses eine Bild stünde
   * noch der alte Stand auf dem Schirm, und es sähe aus, als hätte die Bedienung
   * nichts getan.
   *
   * Ohne Schritte: Die Teilchen werden mitgezeichnet, treiben aber nicht weiter —
   * hier ist ja keine Zeit vergangen.
   */
  function zeichneStand() {
    leseFelder(kanal, felder);
    darstellung.zeichne(felder, {
      ansicht: gewaehlteAnsicht,
      teilchen: teilchenAn,
      schritte: 0,
    });
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

  /** Schreibt unter die Überschrift, was gerade zu sehen ist. */
  function beschrifte() {
    const gezeigt = ansicht(gewaehlteAnsicht);
    const koerper = szene(gewaehlteForm).beschreibung;
    const zusatz = teilchenAn ? ' Die Teilchen treiben mit der Luft.' : '';

    untertitel.textContent = `${gezeigt.groesse} um ${koerper} — ${gezeigt.deutung}.${zusatz}`;
    zeichenflaeche.setAttribute(
      'aria-label',
      `Farbfeld: ${gezeigt.groesse} um ${koerper}${teilchenAn ? ', mit mittreibenden Teilchen' : ''}`
    );
  }
}

/** Die Ansicht zu einem Schlüssel. Ein unbekannter Schlüssel ist ein Programmfehler. */
function ansicht(schluessel) {
  const gefunden = ANSICHTEN.find((eintrag) => eintrag.schluessel === schluessel);
  if (gefunden === undefined) {
    throw new Error(`Unbekannte Ansicht: ${schluessel}`);
  }
  return gefunden;
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

/** Die eingestellte Auflösungsstufe samt ihrem Namen. */
function stufe(einstellungen) {
  const name = STUFEN[einstellungen.aufloesung];
  return { name, ...AUFLOESUNGEN[name] };
}

/** Das Leitmaß der Form in **groben** Zellen bei der eingestellten Größe. */
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
 *
 * Zusammengesetzt wird in groben Zellen, herausgegeben auf dem Gitter der
 * eingestellten Stufe: `skaliereForm` rechnet zum Schluss um. Deshalb bleibt
 * eine Reglerstellung beim Auflösungswechsel dieselbe Szene und wird nicht zu
 * einem kleineren Körper in einem größeren Kanal.
 */
function baueForm(aktuell, einstellungen) {
  const mass = leitmass(aktuell, einstellungen);
  const lage = {
    x: LAGE_X,
    bodenabstand: einstellungen.bodenabstand,
    winkel: einstellungen.winkel,
  };

  const inGrobenZellen = (() => {
    switch (aktuell.schluessel) {
      case 'kreis':
        return { art: 'kreis', ...lage, durchmesser: mass };
      case 'rechteck':
        return { art: 'rechteck', ...lage, breite: mass, hoehe: mass };
      default:
        return { art: aktuell.schluessel, ...lage, laenge: mass };
    }
  })();

  return skaliereForm(inGrobenZellen, stufe(einstellungen).faktor);
}

/**
 * Wählt die Auflösungsstufe, mit der die Seite auf diesem Gerät aufgeht.
 *
 * Zwei Fragen begrenzen sie, und es gilt die gröbere der beiden Antworten:
 *
 * 1. **Bringt die Stufe überhaupt sichtbares Detail?** Das Bild wird auf die
 *    verfügbare Breite gezogen, ein Bildpunkt je Zelle. Rechnet der Kanal mehr
 *    Zellen, als das Bild Punkte breit ist, kostet das Rechenzeit, ohne dass
 *    mehr zu erkennen wäre. Auf dem Handy sind das rund 360 Punkte — die feine
 *    Stufe mit 400 Zellen fällt dort schon aus diesem Grund heraus.
 * 2. **Läuft die Stufe flüssig?** Ein kurzer Probelauf misst, wie schnell
 *    dieses Gerät rechnet, statt es aus Bildschirmgröße oder Kernzahl zu
 *    erraten. Eine Messung altert nicht: ein schnelleres Gerät bekommt von
 *    selbst eine feinere Voreinstellung, ohne dass hier etwas nachgezogen
 *    werden müsste.
 *
 * Beides zusammen ergibt das, was Etappe 3.2 verlangt: auf dem Handy gröber als
 * auf dem Rechner. Von Hand bleibt jede Stufe überall wählbar — die Messung
 * bestimmt nur, womit die Seite aufgeht.
 */
function waehleVoreinstellung(zeichenflaeche) {
  const breiteInPunkten = zeichenflaeche.clientWidth || document.documentElement.clientWidth;
  const zellenJeSekunde = messeRechenleistung();
  const zellenJeBild = (RECHENZEIT_JE_BILD / 1000) * zellenJeSekunde;

  // Die feinste Stufe, die beide Bedingungen erfüllt. Erfüllt schon die gröbste
  // sie nicht, bleibt es bei ihr — gröber geht nicht.
  let gewaehlt = 0;
  STUFEN.forEach((name, nummer) => {
    const { breite, hoehe } = AUFLOESUNGEN[name];
    const passtInsBild = breite <= breiteInPunkten;
    const bleibtFluessig = zellenJeBild >= SCHRITTE_JE_BILD_MINDESTENS * breite * hoehe;
    if (passtInsBild && bleibtFluessig) gewaehlt = nummer;
  });
  return gewaehlt;
}

/**
 * Misst, wie viele Gitterzellen dieses Gerät in einer Sekunde rechnet.
 *
 * Der Probekanal ist leer und wird gleich wieder weggeworfen; gemessen wird nur
 * die Rechnung selbst, ohne Zeichnen. Die Zellenzahl je Sekunde ist dabei das
 * brauchbare Maß, weil die Rechenzeit mit der Zellenzahl wächst und nicht
 * schneller — in Etappe 1.5 über alle drei Stufen nachgemessen.
 */
function messeRechenleistung() {
  const probe = erzeugeKanal({ aufloesung: STUFEN[0] });
  const zellen = probe.breite * probe.hoehe;

  for (let n = 0; n < AUFWAERMSCHRITTE; n++) schritt(probe);

  let kuerzeste = Infinity;
  for (let block = 0; block < MESSBLOECKE; block++) {
    const beginn = performance.now();
    for (let n = 0; n < SCHRITTE_JE_BLOCK; n++) schritt(probe);
    const gebraucht = performance.now() - beginn;
    if (gebraucht < kuerzeste) kuerzeste = gebraucht;
  }

  // Safari rundet `performance.now()` auf ganze Millisekunden. Auf einem sehr
  // schnellen Gerät kann ein Block deshalb bei null landen; ohne die
  // Untergrenze käme dort eine unendliche Rechenleistung heraus.
  return (zellen * SCHRITTE_JE_BLOCK * 1000) / Math.max(kuerzeste, 0.5);
}
