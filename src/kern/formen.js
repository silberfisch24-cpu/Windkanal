/**
 * Hindernisformen — welche Gitterzellen zu einer Form gehören.
 *
 * Reine Zahlenrechnung ohne Browser-Bezug (siehe „Trennung Fachlogik /
 * Darstellung" in SPEC.md). Diese Datei weiß nichts über Strömung; sie
 * beantwortet nur die Frage „liegt Zelle (x, y) in dieser Form?". Der Löser
 * macht daraus Wandzellen, die Oberfläche später einen Umriss.
 *
 * Eine Form wird als schlichtes Objekt beschrieben, alle Maße in Zellen:
 *   { art: 'kreis',    durchmesser }
 *   { art: 'rechteck', breite, hoehe }
 *   { art: 'platte',   laenge, dicke? }   stumpf: vorn und hinten abgeschnitten
 *   { art: 'profil',   laenge, dicke? }   Tragfläche: vorn rund, hinten spitz
 *
 * Dazu bei jeder Form die Lage und die Anstellung:
 *   x              Mitte in Strömungsrichtung
 *   y              Mitte über dem Boden  — entweder y oder bodenabstand
 *   bodenabstand   freie Zellen zwischen Boden und Unterkante (0 = sitzt auf)
 *   winkel         Anstellwinkel in Grad, positiv hebt die Anströmkante
 *
 * `dicke` ist bei Platte und Profil voreingestellt und muss nur angegeben
 * werden, wenn eine andere gewünscht ist. Beide bekommen dieselbe
 * Voreinstellung, damit sich bei gleicher Länge allein die Form unterscheidet.
 *
 * Vor der Benutzung geht eine Form durch `normalisiereForm`: dort werden die
 * Angaben geprüft, Fehlendes ergänzt und ein Bodenabstand in ein y umgerechnet.
 * `liegtInForm` und `ausdehnung` erwarten eine so vervollständigte Form.
 *
 * Maße sind immer Zellen — also von der Auflösungsstufe abhängig. Wer eine in
 * groben Zellen beschriebene Szene in einer feineren Stufe zeigen will, rechnet
 * sie vorher mit `skaliereForm` um.
 */

const GRAD_IN_BOGENMASS = Math.PI / 180;

/** Voreingestellte Dicke von Platte und Profil: 12 % der Länge, mindestens 3 Zellen. */
function voreingestellteDicke(laenge) {
  return Math.max(3, Math.round(0.12 * laenge));
}

/**
 * Prüft die Beschreibung einer Form und gibt sie vervollständigt zurück:
 * mit Anstellwinkel, mit voreingestellter Dicke und mit einem Mittelpunkt y,
 * auch wenn die Höhe als Bodenabstand angegeben war.
 *
 * Wirft bei allem, was fehlt oder unsinnig ist — stillschweigend etwas
 * anzunehmen würde später als Rechenfehler erscheinen.
 */
export function normalisiereForm(form) {
  if (form === null || typeof form !== 'object') {
    throw new Error('Das Hindernis muss als Objekt beschrieben werden.');
  }

  const winkel = form.winkel ?? 0;
  if (!Number.isFinite(winkel)) {
    throw new Error('Der Anstellwinkel muss eine Zahl in Grad sein.');
  }
  const vollstaendig = { ...form, winkel };

  switch (form.art) {
    case 'kreis':
      pruefeMass(form.durchmesser, 'Der Durchmesser');
      break;
    case 'rechteck':
      pruefeMass(form.breite, 'Die Breite');
      pruefeMass(form.hoehe, 'Die Höhe');
      break;
    case 'platte':
    case 'profil':
      pruefeMass(form.laenge, 'Die Länge');
      vollstaendig.dicke = form.dicke ?? voreingestellteDicke(form.laenge);
      pruefeMass(vollstaendig.dicke, 'Die Dicke');
      break;
    default:
      throw new Error(`Unbekannte Hindernisform: ${form.art}`);
  }

  if (!Number.isFinite(vollstaendig.x)) {
    throw new Error('Das Hindernis braucht eine Lage x in Zellen.');
  }

  // Die Höhe über dem Boden lässt sich auf zwei Arten angeben: unmittelbar als
  // Mittelpunkt y oder als Bodenabstand. Beides zugleich wäre widersprüchlich,
  // keines von beidem ließe die Form in der Luft hängen.
  const hatMitte = Number.isFinite(vollstaendig.y);
  const hatBodenabstand = form.bodenabstand !== undefined;
  if (hatMitte === hatBodenabstand) {
    throw new Error(
      'Das Hindernis braucht seine Höhe entweder als y (Mittelpunkt) oder als bodenabstand — genau eines von beiden.'
    );
  }
  if (hatBodenabstand) {
    if (!Number.isFinite(form.bodenabstand) || form.bodenabstand < 0) {
      throw new Error('Der Bodenabstand muss eine Zahl ab null sein (0 = die Form sitzt auf dem Boden).');
    }
    // y = 0 ist der Boden selbst, die unterste Luftzelle ist y = 1. Ein
    // Bodenabstand von 0 setzt die Unterkante der Form also auf y = 1.
    vollstaendig.y = 1 + form.bodenabstand + halbeAbmessungen(vollstaendig)[1];
  }

  return vollstaendig;
}

/**
 * Rechnet eine in groben Zellen beschriebene Form auf eine feinere Stufe um:
 * jedes Maß wird mit dem `faktor` der Stufe multipliziert (siehe `AUFLOESUNGEN`
 * in `loeser.js`).
 *
 * Ohne das zeigte die feine Stufe nicht dieselbe Szene schärfer, sondern einen
 * kleineren Körper in einem größeren Kanal — und der Vergleich zwischen den
 * Stufen sagte nichts aus.
 *
 * Der **Anstellwinkel wird nicht mitskaliert**: er ist ein Winkel, kein Maß.
 * Ebenso bleibt `art` unberührt.
 */
export function skaliereForm(form, faktor) {
  if (form === null || typeof form !== 'object') {
    throw new Error('Die zu skalierende Form muss als Objekt beschrieben werden.');
  }
  if (!Number.isFinite(faktor) || faktor <= 0) {
    throw new Error('Der Faktor muss eine Zahl größer als null sein.');
  }

  const umgerechnet = { ...form };
  for (const mass of SKALIERBARE_MASSE) {
    if (umgerechnet[mass] !== undefined) {
      umgerechnet[mass] = Math.round(umgerechnet[mass] * faktor);
    }
  }
  return umgerechnet;
}

/**
 * Welche Angaben einer Form Maße in Zellen sind. Alles andere — `art` und
 * `winkel` — bleibt beim Umrechnen stehen.
 */
const SKALIERBARE_MASSE = [
  'x',
  'y',
  'durchmesser',
  'breite',
  'hoehe',
  'laenge',
  'dicke',
  'bodenabstand',
];

/** Liegt die Gitterzelle (x, y) innerhalb der Form? */
export function liegtInForm(form, x, y) {
  if (form.art === 'kreis') {
    // Der Kreis ist der einzige Fall, in dem der Anstellwinkel nichts ändert.
    const radius = form.durchmesser / 2;
    const abstandX = x - form.x;
    const abstandY = y - form.y;
    return abstandX * abstandX + abstandY * abstandY <= radius * radius;
  }

  const [laengs, quer] = insEigeneSystem(form, x, y);
  switch (form.art) {
    case 'rechteck':
      return Math.abs(laengs) <= form.breite / 2 && Math.abs(quer) <= form.hoehe / 2;
    case 'platte':
      return Math.abs(laengs) <= form.laenge / 2 && Math.abs(quer) <= form.dicke / 2;
    case 'profil': {
      const halbeLaenge = form.laenge / 2;
      if (Math.abs(laengs) > halbeLaenge) return false;
      // Anteil der Länge, von der Anströmkante aus gezählt
      const stelle = (laengs + halbeLaenge) / form.laenge;
      return Math.abs(quer) <= halbeProfildicke(form, stelle);
    }
    default:
      throw new Error(`Unbekannte Hindernisform: ${form.art}`);
  }
}

/**
 * Äußere Abmessungen der Form in Zellen: die Zellen `links` bis `rechts` und
 * `unten` bis `oben` können von ihr berührt sein, alle anderen nicht.
 * Ein Anstellwinkel ist eingerechnet.
 */
export function ausdehnung(form) {
  if (!Number.isFinite(form.winkel) || !Number.isFinite(form.y)) {
    throw new Error('Die Form muss erst durch normalisiereForm vervollständigt werden.');
  }
  const [halbeBreite, halbeHoehe] = halbeAbmessungen(form);
  return {
    links: Math.ceil(form.x - halbeBreite),
    rechts: Math.floor(form.x + halbeBreite),
    unten: Math.ceil(form.y - halbeHoehe),
    oben: Math.floor(form.y + halbeHoehe),
  };
}

/**
 * Rechnet einen Gitterpunkt in das Koordinatensystem der Form um: Ursprung im
 * Mittelpunkt, die erste Achse längs der Körperachse von der Anströmkante zur
 * Hinterkante, die zweite quer dazu.
 *
 * Gedreht wird nicht die Form, sondern der abgefragte Punkt — und zwar
 * entgegengesetzt. Dadurch bleibt jede Form in ihrem eigenen System einfach
 * beschreibbar, und der Anstellwinkel steht an einer einzigen Stelle.
 */
function insEigeneSystem(form, x, y) {
  const abstandX = x - form.x;
  const abstandY = y - form.y;
  if (form.winkel === 0) return [abstandX, abstandY];

  const bogen = form.winkel * GRAD_IN_BOGENMASS;
  const cos = Math.cos(bogen);
  const sin = Math.sin(bogen);
  return [abstandX * cos - abstandY * sin, abstandX * sin + abstandY * cos];
}

/**
 * Halbe Dicke des Tragflächenprofils an der Stelle `stelle` — 0 an der
 * Anströmkante, 1 an der Hinterkante.
 *
 * Das ist die übliche NACA-Formel für symmetrische Vierziffern-Profile: vorn
 * rund, dickste Stelle bei knapp einem Drittel der Länge, dann spitz
 * auslaufend. Genau dieser Verlauf ist der Unterschied zur stumpfen Platte,
 * die vorn und hinten abgeschnitten ist.
 */
function halbeProfildicke(form, stelle) {
  return (
    (form.dicke / 0.2) *
    (0.2969 * Math.sqrt(stelle) -
      0.126 * stelle -
      0.3516 * stelle * stelle +
      0.2843 * stelle * stelle * stelle -
      0.1036 * stelle * stelle * stelle * stelle)
  );
}

/**
 * Halbe Breite und halbe Höhe des umschließenden Rechtecks, Drehung
 * eingerechnet. Beim Profil ist das großzügig gerechnet — es füllt sein
 * umschließendes Rechteck nur an der dicksten Stelle aus.
 */
function halbeAbmessungen(form) {
  const [laengs, quer] = halbeEigenmasse(form);
  if (form.winkel === 0 || form.art === 'kreis') return [laengs, quer];

  const bogen = form.winkel * GRAD_IN_BOGENMASS;
  const cos = Math.abs(Math.cos(bogen));
  const sin = Math.abs(Math.sin(bogen));
  return [laengs * cos + quer * sin, laengs * sin + quer * cos];
}

/** Halbe Maße im Koordinatensystem der Form selbst, ungedreht. */
function halbeEigenmasse(form) {
  switch (form.art) {
    case 'kreis':
      return [form.durchmesser / 2, form.durchmesser / 2];
    case 'rechteck':
      return [form.breite / 2, form.hoehe / 2];
    case 'platte':
    case 'profil':
      return [form.laenge / 2, form.dicke / 2];
    default:
      throw new Error(`Unbekannte Hindernisform: ${form.art}`);
  }
}

/** Ein Maß in Zellen muss eine Zahl größer als null sein. */
function pruefeMass(wert, bezeichnung) {
  if (!Number.isFinite(wert) || wert <= 0) {
    throw new Error(`${bezeichnung} des Hindernisses muss eine Zahl größer als null sein (in Zellen).`);
  }
}
