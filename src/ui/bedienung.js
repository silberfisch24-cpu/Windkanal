/**
 * Bedienung: die Schaltflächen der Oberfläche.
 *
 * Diese Datei gehört zur Oberfläche und darf deshalb `document` anfassen. Sie
 * kennt aber weder den Kanal noch die Rechnung: sie meldet nur, was angeklickt
 * wurde, und zeigt an, was ihr gesagt wird. Was daraufhin geschieht, entscheidet
 * `start.js`. Damit bleibt die Bedienung prüfbar, ohne dass eine Strömung läuft.
 *
 * Die Formschaltflächen werden aus der übergebenen Liste erzeugt, nicht in
 * `index.html` hinterlegt. Sonst stünden die Formen an zwei Stellen und eine
 * fünfte Form später nur an einer davon.
 */

/**
 * Verkabelt die Bedienleiste.
 *
 * @param {object} teile
 * @param {HTMLElement} teile.auswahlfeld  nimmt die erzeugten Formschaltflächen auf
 * @param {HTMLButtonElement} teile.laufschalter  hält an und lässt weiterlaufen
 * @param {HTMLButtonElement} teile.ruecksetzer   setzt die Rechnung zurück
 * @param {Array<{schluessel: string, name: string}>} teile.formen  Auswahl in Reihenfolge
 * @param {(schluessel: string) => void} teile.beiFormwahl
 * @param {() => void} teile.beiLaufwechsel
 * @param {() => void} teile.beiRuecksetzen
 */
export function erzeugeBedienung({
  auswahlfeld,
  laufschalter,
  ruecksetzer,
  formen,
  beiFormwahl,
  beiLaufwechsel,
  beiRuecksetzen,
}) {
  const formknoepfe = new Map();

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
  };
}
