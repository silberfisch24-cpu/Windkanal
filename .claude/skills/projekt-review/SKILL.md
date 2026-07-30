---
name: projekt-review
description: Prüft ein Projekt gegen seine Spezifikation und bringt Dokumentation
  auf Stand. Anwenden bei "prüf mal", "review", "passt das alles noch", "ist das
  fertig", "sind die Tests gut", vor einem Release, oder wenn der letzte Abschnitt
  der Etappenliste abgearbeitet ist.
---

# Review und Abschluss

Zwei Teile: Prüfung gegen die Spezifikation, dann Dokumentation auf Stand bringen.
Der zweite Teil erst, wenn der erste abgeschlossen ist.

**Voraussetzung:** Ein Review gehört in eine Session mit leerem Kontext. Hast du den
Code in dieser Session selbst geschrieben, sage das und schlage eine neue Session
vor — du beurteilst sonst entlang deiner eigenen Begründung statt entlang der
Anforderung.

---

# Teil 1 — Prüfung

## Die drei Prüfrichtungen, getrennt abarbeiten

1. **Vollständigkeit** — steht alles aus `SPEC.md` tatsächlich zur Verfügung?
2. **Robustheit** — verhält es sich bei ungewöhnlichen, leeren oder falschen
   Eingaben vernünftig?
3. **Konsistenz** — entspricht die Umsetzung den Architekturentscheidungen in
   `SPEC.md` und den Konventionen in `CLAUDE.md`?

## Lückenprüfung in beide Richtungen

- **In `SPEC.md`, aber nicht umgesetzt** → Lücke oder bewusst verschoben. Beides
  schriftlich vermerken.
- **Umgesetzt, aber nicht in `SPEC.md`** → nachträglich gewollt (dann aufnehmen)
  oder ungeplanter Zuwachs (dann entfernen).

Die zweite Richtung wird fast immer übersehen und ist die Hauptquelle schleichender
Aufblähung. Führe sie ausdrücklich durch.

## Befunde melden

Einzeln, mit Fundstelle und Schweregrad. **Keine Gesamtbewertung** — ein
zusammenfassendes Urteil verdeckt Einzelbefunde, und "sieht insgesamt gut aus" ist
als Prüfergebnis nicht verwertbar.

Jeder Befund braucht am Ende einen Status: behoben, bewusst akzeptiert (mit
Begründung), oder als Etappe eingeplant. Ein offener Befund ohne Entscheidung ist
kein abgeschlossenes Review.

## Tests: der einzige belastbare Test des Tests

Eine bestehende Testsuite kann durchlaufen und trotzdem nichts prüfen. Führe die
Gegenprobe durch — sie ist ohne Codeverständnis nachvollziehbar:

1. Einen Wert in der Kernlogik absichtlich verfälschen
2. Tests laufen lassen
3. Ergebnis zeigen
4. Änderung zurücknehmen

- Tests schlagen fehl → sie prüfen tatsächlich etwas.
- Tests laufen durch → sie sind dekorativ. Sage das deutlich; die Absicherung
  existiert dann nicht.

Einmal pro Projekt und nach jeder größeren Erweiterung der Testabdeckung.

---

# Teil 2 — Dokumentation und Abschluss

## Drei Adressaten, drei Dokumente

| Adressat | Datei | Beantwortet |
|---|---|---|
| Ein fremder Mensch, oder der Nutzer in einem Jahr | `README.md` | Was ist das, was kann es, wie starte ich es? |
| Eine künftige Session | `CLAUDE.md` + Skills | Wie arbeite ich in diesem Projekt? |
| Beide, als verbindliche Referenz | `SPEC.md` | Was soll es können, was wurde warum entschieden? |

Jede Information hat genau einen Ort. Inhalte nicht duplizieren — die anderen
Dateien verweisen darauf.

## Schlussabgleich

`SPEC.md` gegen das tatsächlich Gebaute prüfen. Für jede Abweichung genau eine von
zwei Entscheidungen, vom Nutzer bestätigt:

- **Gewollt** → Spezifikation nachziehen, datierter Eintrag im Änderungsverlauf
- **Ungewollt** → als offener Punkt vermerken, nicht stillschweigend übernehmen

Was hier nicht bereinigt wird, wird zur Altlast: Die Spezifikation beschreibt dann
ein Projekt, das es nicht gibt, und verliert ihre Verbindlichkeit.

## Kaltstart-Test

Der belastbare Abschlusstest der Dokumentation. Schlage dem Nutzer vor: eine neue
Session, die ausschließlich Projektverzeichnis und Dokumente sieht, wird gebeten,
das Projekt zu starten und eine kleine Änderung vorzunehmen. Alles, was dabei
erfragt oder erraten werden muss, fehlt in der Dokumentation.

## Aufräumen

Was seinen Zweck erfüllt hat, wird entfernt, nicht archiviert:

- Annahmen in `SPEC.md`, die inzwischen geklärt sind → durch die geklärte Aussage ersetzen
- Erledigte Etappen → zu einem knappen Änderungsverlauf verdichten
- Einträge in `CLAUDE.md` oder Skills, die nie zum Tragen kamen → streichen
- Einträge, die einmal richtig waren und es nicht mehr sind → korrigieren. Sie
  richten mehr Schaden an als fehlende Einträge, weil sie glaubwürdig fehlleiten.
- Notizen zu verworfenen Ansätzen → nur behalten, wenn die Begründung künftige
  Fehlwege verhindert

## Abschluss

Commit mit dem bereinigten Stand. Bei erreichter Nutzbarkeitsstufe den
entsprechenden Tag setzen.
