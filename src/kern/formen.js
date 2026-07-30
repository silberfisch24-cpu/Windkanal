/**
 * Hindernisformen — welche Gitterzellen zu einer Form gehören.
 *
 * Reine Zahlenrechnung ohne Browser-Bezug (siehe „Trennung Fachlogik /
 * Darstellung" in SPEC.md). Diese Datei weiß nichts über Strömung; sie
 * beantwortet nur die Frage „liegt Zelle (x, y) in dieser Form?". Der Löser
 * macht daraus Wandzellen, die Oberfläche später einen Umriss.
 *
 * Eine Form wird als schlichtes Objekt beschrieben, Maße in Zellen, (x, y)
 * immer der Mittelpunkt:
 *   { art: 'kreis',    x, y, durchmesser }
 *   { art: 'rechteck', x, y, breite, hoehe }
 *
 * Stumpfe Platte und Tragflächenprofil kommen in Etappe 1.3 dazu, ebenso der
 * Anstellwinkel.
 */

/** Liegt die Gitterzelle (x, y) innerhalb der Form? */
export function liegtInForm(form, x, y) {
  switch (form.art) {
    case 'kreis': {
      const radius = form.durchmesser / 2;
      const abstandX = x - form.x;
      const abstandY = y - form.y;
      return abstandX * abstandX + abstandY * abstandY <= radius * radius;
    }
    case 'rechteck':
      return (
        Math.abs(x - form.x) <= form.breite / 2 && Math.abs(y - form.y) <= form.hoehe / 2
      );
    default:
      throw new Error(`Unbekannte Hindernisform: ${form.art}`);
  }
}

/**
 * Äußere Abmessungen der Form in Zellen: die Zellen `links` bis `rechts` und
 * `unten` bis `oben` können von ihr berührt sein, alle anderen nicht.
 */
export function ausdehnung(form) {
  const [halbeBreite, halbeHoehe] = halbeAbmessungen(form);
  return {
    links: Math.ceil(form.x - halbeBreite),
    rechts: Math.floor(form.x + halbeBreite),
    unten: Math.ceil(form.y - halbeHoehe),
    oben: Math.floor(form.y + halbeHoehe),
  };
}

/** Prüft die Beschreibung und meldet, was fehlt oder unsinnig ist. */
export function pruefeForm(form) {
  if (!Number.isFinite(form.x) || !Number.isFinite(form.y)) {
    throw new Error('Das Hindernis braucht einen Mittelpunkt (x, y) in Zellen.');
  }
  const [halbeBreite, halbeHoehe] = halbeAbmessungen(form);
  if (!(halbeBreite > 0) || !(halbeHoehe > 0)) {
    throw new Error('Die Maße des Hindernisses müssen größer als null sein.');
  }
}

/** Halbe Breite und halbe Höhe der Form — wirft bei unbekannter Art. */
function halbeAbmessungen(form) {
  switch (form.art) {
    case 'kreis':
      return [form.durchmesser / 2, form.durchmesser / 2];
    case 'rechteck':
      return [form.breite / 2, form.hoehe / 2];
    default:
      throw new Error(`Unbekannte Hindernisform: ${form.art}`);
  }
}
