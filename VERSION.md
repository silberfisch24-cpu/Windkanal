v0.2
Die Strömungsrechnung läuft — im leeren Kanal, noch ohne Bild.

Etappe 1.1 (abgenommen):
- Luft strömt von links nach rechts durch den Kanal, haftet am Boden und gleitet
  reibungsfrei an der Decke entlang
- Über dem Boden bildet sich die Grenzschicht: unmittelbar an der Wand nur noch
  7 % der Windgeschwindigkeit, ab etwa 15 Zellen Höhe die volle Strömung
- Die Rechnung bleibt über tausende Schritte stabil; die Luftmenge im Kanal
  pendelt sich ein, statt weiter anzuwachsen
- Prüfbar über `node werkzeug/pruefe-kern.js`: neun Prüfpunkte und ein
  Textdiagramm des Geschwindigkeitsprofils über die Kanalhöhe

Unterwegs festgelegt:
- Randbedingungen: der Einlass gibt die Geschwindigkeit vor, der Auslass den
  Druck. Beides vorne vorzugeben war ein Fehler — der Druck hatte dann keinen
  Anker, und die Reibung staute über tausende Schritte immer mehr Luft auf
- Voreinstellungen des Kanals: 200 × 60 Zellen, Windgeschwindigkeit 0,1 und
  Zähigkeit 0,01 in Gittereinheiten; einstellbar werden sie in Etappe 1.5
- package.json angelegt, ausschließlich mit "type": "module" — ohne sie lädt
  Node die Dateien nicht. Keine Pakete, kein Build-Schritt

Noch keine Bildschirmausgabe. Als Nächstes Etappe 1.2: ein Hindernis in den
Kanal setzen, an dem die Strömung abprallt statt hindurchzuströmen.
