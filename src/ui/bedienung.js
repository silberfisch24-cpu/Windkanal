/**
 * Bedienung: die Schaltflächen und Regler der Oberfläche.
 *
 * Diese Datei gehört zur Oberfläche und darf deshalb `document` anfassen. Sie
 * kennt aber weder den Kanal noch die Rechnung: sie meldet nur, was angeklickt
 * oder gezogen wurde, und zeigt an, was ihr gesagt wird. Was daraufhin
 * geschieht, entscheidet `start.js`. Damit bleibt die Bedienung prüfbar, ohne
 * dass eine Strömung läuft.
 *
 * Formschaltflächen, Ansichtsschaltflächen und Regler werden aus den übergebenen
 * Listen erzeugt, nicht in `index.html` hinterlegt. Sonst stünde beides an zwei
 * Stellen, und ein weiterer Eintrag später nur an einer davon.
 */

/**
 * Verkabelt die Bedienleiste.
 *
 * @param {object} teile
 * @param {HTMLElement} teile.auswahlfeld  nimmt die erzeugten Formschaltflächen auf
 * @param {HTMLElement} teile.ansichtfeld  nimmt die erzeugten Ansichtsschaltflächen auf
 * @param {HTMLButtonElement} teile.laufschalter  hält an und lässt weiterlaufen
 * @param {HTMLButtonElement} teile.ruecksetzer   setzt die Rechnung zurück
 * @param {HTMLButtonElement} teile.teilchenschalter  legt die Teilchen darüber
 * @param {HTMLElement} teile.reglerfeld  nimmt die erzeugten Regler auf
 * @param {Array<{schluessel: string, name: string}>} teile.formen  Auswahl in Reihenfolge
 * @param {Array<{schluessel: string, name: string}>} teile.ansichten  Auswahl in Reihenfolge
 * @param {Array<object>} teile.regler  je Regler Schlüssel, Name, Bereich und Anfangswert
 * @param {(schluessel: string) => void} teile.beiFormwahl
 * @param {(schluessel: string) => void} teile.beiAnsichtwahl
 * @param {() => void} teile.beiLaufwechsel
 * @param {() => void} teile.beiRuecksetzen
 * @param {() => void} teile.beiTeilchenwechsel
 * @param {(schluessel: string, wert: number) => void} teile.beiReglerwechsel
 */
export function erzeugeBedienung({
  auswahlfeld,
  ansichtfeld,
  laufschalter,
  ruecksetzer,
  teilchenschalter,
  reglerfeld,
  formen,
  ansichten,
  regler,
  beiFormwahl,
  beiAnsichtwahl,
  beiLaufwechsel,
  beiRuecksetzen,
  beiTeilchenwechsel,
  beiReglerwechsel,
}) {
  const reglerteile = new Map();

  const formknoepfe = baueKnopfreihe(auswahlfeld, formen, beiFormwahl);
  const ansichtknoepfe = baueKnopfreihe(ansichtfeld, ansichten, beiAnsichtwahl);

  for (const einstellung of regler) {
    const feld = document.createElement('div');
    feld.className = 'regler';

    const beschriftung = document.createElement('label');
    beschriftung.className = 'reglertitel';
    beschriftung.htmlFor = `regler-${einstellung.schluessel}`;
    beschriftung.textContent = einstellung.name;

    const schieber = document.createElement('input');
    schieber.type = 'range';
    schieber.className = 'schieber';
    schieber.id = `regler-${einstellung.schluessel}`;
    schieber.min = String(einstellung.mindestens);
    schieber.max = String(einstellung.hoechstens);
    schieber.step = String(einstellung.schritt);
    schieber.value = String(einstellung.wert);

    const wertfeld = document.createElement('span');
    wertfeld.className = 'reglerwert';

    // `input` statt `change`: die Wirkung soll schon beim Ziehen zu sehen sein,
    // nicht erst beim Loslassen — genau das meint „wirken sofort".
    schieber.addEventListener('input', () =>
      beiReglerwechsel(einstellung.schluessel, Number(schieber.value))
    );

    feld.append(beschriftung, schieber, wertfeld);
    reglerfeld.append(feld);
    reglerteile.set(einstellung.schluessel, { schieber, wertfeld });
  }

  laufschalter.addEventListener('click', beiLaufwechsel);
  ruecksetzer.addEventListener('click', beiRuecksetzen);
  teilchenschalter.addEventListener('click', beiTeilchenwechsel);

  return {
    /** Hebt die gewählte Form hervor und nimmt die Hervorhebung von den übrigen. */
    zeigeForm(schluessel) {
      hebeHervor(formknoepfe, schluessel);
    },

    /** Dasselbe für die gewählte Ansicht. */
    zeigeAnsicht(schluessel) {
      hebeHervor(ansichtknoepfe, schluessel);
    },

    /**
     * Zeigt am Teilchenschalter, ob die Teilchen gerade liegen.
     *
     * Anders als der Laufschalter behält er seine Beschriftung und wird
     * hervorgehoben oder nicht — er ist ein Schalter für eine Auflage, keine
     * Handlung. `aria-pressed` sagt einer Vorlesehilfe dasselbe, was die Farbe
     * zeigt.
     */
    zeigeTeilchen(an) {
      teilchenschalter.setAttribute('aria-pressed', String(an));
    },

    /**
     * Beschriftet den Laufschalter mit dem, was er als Nächstes tut — nicht mit
     * dem, was gerade ist. Eine Schaltfläche „Angehalten" ließe offen, ob sie
     * den Zustand meldet oder ihn herstellt.
     */
    zeigeLauf(laeuft) {
      laufschalter.textContent = laeuft ? 'Anhalten' : 'Weiter';
    },

    /**
     * Bringt einen Regler auf Stand: Wert, Obergrenze, Beschriftung, gesperrt
     * oder nicht.
     *
     * Die Obergrenze wird vor dem Wert gesetzt. Andersherum würde der Browser
     * einen Wert oberhalb der noch alten Grenze sofort zurückstutzen, und der
     * Regler stünde woanders als gemeint.
     *
     * @param {string} schluessel
     * @param {object} stand
     * @param {number} [stand.hoechstens]  neue Obergrenze, falls sie sich ändert
     * @param {number} stand.wert
     * @param {string} stand.text          was neben dem Regler steht
     * @param {boolean} [stand.gesperrt]
     */
    zeigeRegler(schluessel, { hoechstens, wert, text, gesperrt = false }) {
      const teil = reglerteile.get(schluessel);
      if (teil === undefined) {
        throw new Error(`Unbekannter Regler: ${schluessel}`);
      }
      if (hoechstens !== undefined) teil.schieber.max = String(hoechstens);
      teil.schieber.value = String(wert);
      teil.schieber.disabled = gesperrt;
      teil.wertfeld.textContent = text;
      // Ohne das liest eine Vorlesehilfe die nackte Zahl vor („100"), nicht ihre
      // Bedeutung („100 % der Voreinstellung").
      teil.schieber.setAttribute('aria-valuetext', text);
    },
  };
}

/**
 * Baut eine Reihe von Schaltflächen, von denen immer genau eine gilt — die
 * Formauswahl und die Ansichtsauswahl sind derselbe Fall.
 *
 * `aria-pressed` weist die gewählte aus, nicht nur die Farbe: Sonst erführe
 * eine Vorlesehilfe gar nicht, welche der Schaltflächen gerade gilt.
 *
 * @returns {Map<string, HTMLButtonElement>}
 */
function baueKnopfreihe(feld, eintraege, beiWahl) {
  const knoepfe = new Map();

  for (const eintrag of eintraege) {
    const knopf = document.createElement('button');
    knopf.type = 'button';
    knopf.className = 'schaltflaeche';
    knopf.textContent = eintrag.name;
    knopf.setAttribute('aria-pressed', 'false');
    knopf.addEventListener('click', () => beiWahl(eintrag.schluessel));
    feld.append(knopf);
    knoepfe.set(eintrag.schluessel, knopf);
  }

  return knoepfe;
}

/** Hebt eine Schaltfläche der Reihe hervor und nimmt es den übrigen. */
function hebeHervor(knoepfe, schluessel) {
  for (const [name, knopf] of knoepfe) {
    knopf.setAttribute('aria-pressed', String(name === schluessel));
  }
}
