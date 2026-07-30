---
name: projekt-etappe
description: Setzt eine einzelne Etappe eines laufenden Projekts um — mit
  Standsbestimmung, Plan vor Änderung, Abnahme durch den Nutzer und Nachtragen in
  SPEC.md. Anwenden bei Arbeit an einem Projekt, in dem eine SPEC.md mit
  Etappenliste existiert — etwa "weiter", "nächste Etappe", "lass uns X einbauen",
  "kannst du Y ergänzen", Fehlerbehebungen und kleine Erweiterungen.
---

# Etappe umsetzen

Der Nutzer hält Verfahren nicht selbst nach. **Du führst, er entscheidet.** Frage nie,
ob ein Verfahrensschritt gemacht werden soll — mache ihn und zeige das Ergebnis.

---

## 1. Stand bestimmen — zuerst, ungefragt

Lies den Abschnitt **"Kern"** in `SPEC.md`. Nur diesen — die vollständige
Spezifikation gehört nicht in jede Session. Lies die Etappenliste nur, wenn du die
konkrete Etappe brauchst.

Nenne in zwei Sätzen, wo das Projekt steht und welche Etappe ansteht. Lass
bestätigen oder korrigieren, bevor du etwas änderst.

Passt der Wunsch des Nutzers nicht zur nächsten Etappe, ordne ihn zuerst ein:

| Art | Vorgehen |
|---|---|
| Fehlerbehebung | als eigene kleine Etappe, `SPEC.md` bleibt unverändert |
| Erweiterung im bestehenden Rahmen | Etappe anhängen (nächste freie Nummer im Abschnitt), `SPEC.md` ergänzen |
| Rahmenänderung — anderer Zweck, Zielgruppe, Umfang | **stoppen**, ansprechen, Entscheidung des Nutzers einholen |
| Architektur trägt nicht mehr | **stoppen**, Strukturproblem benennen |

Die letzten beiden Fälle nicht stillschweigend umsetzen.

---

## 2. Planen, dann umsetzen

Kurzer Plan vor jeder Änderung. Der Plan ist der günstigste Zeitpunkt für Korrekturen.

- **Eine Änderung zur Zeit.** Mehrere gleichzeitig, und die Ursache eines Problems
  ist nicht mehr zuzuordnen.
- **Früh abbrechen.** Erkennst du, dass die Richtung nicht stimmt, stoppe sofort.
  Ein zu Ende geführter falscher Ansatz kostet doppelt.
- **Nichts hinzufügen, worum nicht gebeten wurde.** Fällt dir etwas Sinnvolles auf,
  schlage es vor, statt es einzubauen.

---

## 3. Abnahme — harte Sperre

**Nichts gilt als fertig, bevor der Nutzer ausdrücklich bestätigt hat.** Seine
eigene Prüfung ist nicht ersetzbar — er beurteilt das Verhalten, nicht den Code.
Deine Einschätzung zählt hier nicht.

Lege ungefragt vor, in dieser Reihenfolge:

1. **Das Abnahmekriterium und wie er es selbst durchspielt.** Konkret: welche
   Eingabe, welches erwartete Ergebnis, welcher Aufruf.
2. **Was sich geändert hat, in einfachen Worten.** Fachlich, nicht technisch.
3. **Was du geändert hast, worum er nicht gebeten hat.** Auch wenn es nichts ist —
   dann sage das.
4. **Was daran kaputtgehen oder übersehen worden sein könnte.**

Frage nie *"ist das gut so?"* oder *"passt das?"* — solche Fragen bekommen
Zustimmung statt Prüfung.

Ohne ausdrückliche Bestätigung: keinen Tag setzen, nicht zur nächsten Etappe übergehen.

---

## 4. Abschließen — ungefragt, bevor die Session endet

1. **`SPEC.md` nachtragen:** getroffene Entscheidungen, geänderte oder bestätigte
   Annahmen, neue Etappen.
2. **Stand aktualisieren:** Etappenliste abhaken, Kern-Abschnitt auf die nächste
   Etappe setzen.
3. **Zwei-Mal-Regel prüfen:** Wurde in dieser Session etwas erklärt, das schon
   einmal erklärt wurde? Dann in `CLAUDE.md` (Fakt, immer gebraucht) oder in einen
   Skill (Vorgehensweise für einen Anlass) aufnehmen — und dem Nutzer sagen, was du
   aufgenommen hast.
4. **Commit setzen.** Bei bestätigter Etappe zusätzlich den Tag.

Was nur im Gesprächsverlauf steht, ist nach der Session verloren. Das Nachtragen
ist Voraussetzung, kein Abschlussritual.

---

## Commits und Tags

Commit nach jeder bestätigten Änderung, auch bei reinen Fehlerkorrekturen — sonst
entstehen Lücken in der Historie genau dort, wo Fehler behoben wurden.

Versionsnummern nach **Nutzbarkeitsgrad**, nicht nach Projektstruktur:

| Nummer | Bedeutung |
|---|---|
| `0.x` | noch nicht durchgängig nutzbar |
| `x.0` | neue durchgängig nutzbare Stufe erreicht |
| `x.y` | bestätigte Etappe innerhalb dieser Stufe |
| kein Tag | Fehlerkorrektur ohne Änderung an Funktion oder Darstellung |

Vergebene Tags werden nie umnummeriert oder umbenannt.

Commit-Nachricht **im Klartext**, fachlich statt technisch — die Historie muss sich
überfliegen lassen, ohne den Änderungssatz zu öffnen:

```
Günstigerprüfung ergänzt (Etappe 3.2)

- Beide Berechnungswege werden verglichen, das günstigere Ergebnis wird übernommen
- Betrifft nur Fälle mit Kapitaleinkünften
- Grund: Die Einzelberechnung lieferte bei niedrigen Einkommen zu hohe Werte
```

Erste Zeile: was sich geändert hat, plus Etappennummer. Stichpunkte: was das
Programm jetzt anders macht. Begründung nur, wo sie nicht auf der Hand liegt.
