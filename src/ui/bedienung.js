/**
 * Bedienung: die Schaltflächen und Regler der Oberfläche.
 *
 * Diese Datei gehört zur Oberfläche und darf deshalb `document` anfassen. Sie
 * kennt aber weder den Kanal noch die Rechnung: sie meldet nur, was angeklickt
 * oder gezogen wurde, und zeigt an, was ihr gesagt wird. Was daraufhin
 * geschieht, entscheidet `start.js`. Damit bleibt die Bedienung prüfbar, ohne
 * dass eine Strömung läuft.
 *
 * Formschaltflächen wie Regler werden aus den übergebenen Listen erzeugt, nicht
 * in `index.html` hinterlegt. Sonst stünde beides an zwei Stellen, und ein
 * fünfter Eintrag später nur an einer davon.
 */

/**
 * Verkabelt die Bedienleiste.
 *
 * @param {object} teile
 * @param {HTMLElement} teile.auswahlfeld  nimmt die erzeugten Formschaltflächen auf
 * @param {HTMLButtonElement} teile.laufschalter  hält an und lässt weiterlaufen
 * @param {HTMLButtonElement} teile.ruecksetzer   setzt die Rechnung zurück
 * @param {HTMLElement} teile.reglerfeld  nimmt die erzeugten Regler auf
 * @param {Array<{schluessel: string, name: string}>} teile.formen  Auswahl in Reihenfolge
 * @param {Array<object>} teile.regler  je Regler Schlüssel, Name, Bereich und Anfangswert
 * @param {(schluessel: string) => void} teile.beiFormwahl
 * @param {() => void} teile.beiLaufwechsel
 * @param {() => void} teile.beiRuecksetzen
 * @param {(schluessel: string, wert: number) => void} teile.beiReglerwechsel
 */
export function erzeugeBedienung({
  auswahlfeld,
  laufschalter,
  ruecksetzer,
  reglerfeld,
  formen,
  regler,
  beiFormwahl,
  beiLaufwechsel,
  beiRuecksetzen,
  beiReglerwechsel,
}) {
  const formknoepfe = new Map();
  const reglerteile = new Map();

  for (const form of formen) {
    const knopf = document.createElement('button');
    knopf.type = 'button';
    knopf.className = 'schaltflaeche';
    knopf.textContent = form.name;
    // Die Formauswahl ist ein Entweder-oder. `aria-pressed` sagt einer
    // Vorlesehilfe, welche der vier gerade gilt — sichtbar ist es an der Farbe.
    knopf.setAttribute('aria-pressed', 'false');
    knopf.addEventListener('click', () => beiFormwahl(form.schluessel));
    auswahlfeld.append(knopf);
    formknoepfe.set(form.schluessel, knopf);
  }

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

  return {
    /** Hebt die gewählte Form hervor und nimmt die Hervorhebung von den übrigen. */
    zeigeForm(schluessel) {
      for (const [name, knopf] of formknoepfe) {
        knopf.setAttribute('aria-pressed', String(name === schluessel));
      }
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
