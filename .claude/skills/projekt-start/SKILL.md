---
name: projekt-start
description: Führt ein neues Programmierprojekt von der Grobidee bis zum fertigen
  Grundgerüst mit Etappenplan. Anwenden, sobald der Nutzer ein neues Projekt oder
  Vorhaben beschreibt — App, Werkzeug, Skript, Website, Spiel, Auswertung — und noch
  keine SPEC.md existiert. Auch anwenden bei vagen Formulierungen wie "ich hätte
  gern etwas, das ...", "kann man sowas bauen", "ich möchte ein Tool für ...".
---

# Projektstart

Vier Schritte. **Kein Code vor Schritt 4.** Der Nutzer hat wenig Programmiererfahrung: Er beschreibt fachlich, du entscheidest technisch und begründest verständlich.

Führe den Ablauf selbst. Frage nicht, ob der nächste Schritt gemacht werden soll — mache ihn und zeige das Ergebnis.

---

## Schritt 1 — Grobidee klären (Konzeptebene)

Ziel: Ein-Satz-Kern, den ihr beide gleich formuliert. Nicht mehr.

**Spiegeln statt abfragen.** Fasse die Idee in eigenen Worten zusammen und lass bestätigen oder korrigieren. Keine Fragenliste an dieser Stelle.

Nur wenn der Kern unklar bleibt, gezielt nachfragen — in die Tiefe, nicht in die Breite:
- Zweck in einem Satz?
- Wer schaut sich das Ergebnis an?
- Ein konkretes Beispiel, an dem sich zeigt, was es leisten soll?

Noch **nicht** klären: Umfangsgrenzen, Datenquellen, Erfolgskriterien, Sonderfälle.

**Fertig, wenn:** ihr beide denselben Ein-Satz-Kern formulieren könnt.

---

## Schritt 2 — Anforderungen klären

Zweck und Zielgruppe sind aus Schritt 1 geklärt. **Nicht erneut fragen**, nur präzisieren, falls nötig.

Ordne zuerst den Projekttyp ein (Website, Werkzeug, Spiel, App, Auswertung, Dienst). Der Typ entscheidet, welche Dimension viele Fragen braucht und welche trivial ist.

Sechs Dimensionen, jede braucht am Ende eine belastbare Aussage:

| Dimension | Inhalt |
|---|---|
| Kernfunktionen | priorisiert nach Muss und Kann |
| Zielgruppe | aus Schritt 1, ggf. präzisieren |
| Daten | Quelle, Format, Speicherung, Schutzbedarf |
| Umgebung | wo und wie es läuft |
| Abgrenzung | was ausdrücklich nicht dazugehört |
| Erfolgskriterium | woran die erste Version gemessen wird |

**Fragen bündeln:** zwei bis drei Runden, nicht fünfzehn Einzelfragen. Etwa: Kernfunktionen + Abgrenzung, dann Daten + Umgebung, zuletzt Erfolgskriterium.

**Bei "weiß ich nicht":** plausiblen Standardwert vorschlagen und ausdrücklich als Annahme kennzeichnen ("Ich gehe zunächst von X aus"). Nicht blockieren. Annahme später in SPEC.md als solche markieren.

**Fertig, wenn:** du in einem Absatz beschreiben könntest, was Schritt 3 berücksichtigen muss, ohne irgendwo zu raten. Fehlt genau eine Dimension, frage nur nach dieser.

---

## Schritt 3 — Architektur festlegen

Der Tech-Stack ist ein **Ergebnis**, keine Vorannahme. Leite ihn aus Schritt 2 ab, nicht aus Gewohnheit.

| Aus Schritt 2 | bestimmt |
|---|---|
| Umgebung | Ausführungsform |
| Zielgruppe | Oberfläche ja/nein, Komfortgrad |
| Daten | Speicherform, Verarbeitungsweise |
| Kernfunktionen | spezialisierte Bibliotheken |
| Abgrenzung | gerechtfertigter Strukturaufwand |
| Erfolgskriterium | Prüf- und Testbarkeit |

**Angemessenheitsfilter — vor jedem Vorschlag anwenden:** Was ist die einfachste Lösung, die das Erfolgskriterium erfüllt? Zusätzliche Struktur muss sich dagegen rechtfertigen. Ein einmalig genutztes Skript braucht kein Framework. Umgekehrt gilt derselbe Test: Soll es wachsen oder von mehreren genutzt werden, ist eine zu simple Struktur ebenso falsch.

**Immer trennen:** Fachlogik von Darstellung und Bedienung. Der einzige ausnahmslos empfehlenswerte Schnitt — er ermöglicht die Etappenreihenfolge in Schritt 4.

Lege fest und begründe je in einem Satz: Ausführungsform, Sprache/Framework, grobe Dateistruktur, Abhängigkeiten (so wenig wie möglich).

**Begründungen müssen verständlich sein.** Wenn der Nutzer nachfragt, formuliere neu statt zu vereinfachen — eine Begründung, die nicht überzeugt, ist ein Warnsignal für unnötige Komplexität, nicht für fehlendes Vorwissen.

---

## Schritt 4 — Grundgerüst anlegen

Lege jetzt tatsächlich an, ohne weitere Rückfrage:

1. **Projektverzeichnis** in der festgelegten Struktur
2. **`SPEC.md`** aus `vorlage-SPEC.md` in diesem Skill-Verzeichnis, befüllt mit den Ergebnissen aus Schritt 1–3
3. **`CLAUDE.md`** aus `vorlage-CLAUDE.md` in diesem Skill-Verzeichnis, befüllt mit Projektname, Befehlen und Struktur
4. **Versionsverwaltung** initialisieren, erster Commit des Gerüsts
5. **Etappenliste** in SPEC.md (siehe unten)

### Etappenplan

Fünf Abschnitte, in dieser Reihenfolge — sie sortiert nach Risiko, nicht nach Sichtbarkeit:

| Nr. | Abschnitt | Abnahme durch den Nutzer |
|---|---|---|
| 1 | Kernlogik ohne Oberfläche | Kommt bei bekannter Eingabe das erwartete Ergebnis? |
| 2 | Minimale Bedienbarkeit | Einmal von Anfang bis Ende benutzbar? |
| 3 | Erweiterungen, Sonderfälle | Auch bei ungewöhnlichen Eingaben vernünftig? |
| 4 | Darstellung, Politur | Sieht es aus wie gewünscht? |
| 5 | Absicherung durch Tests | Deckt die Prüfung die wichtigsten Fälle? |

Abschnitt 1 **ohne** Oberfläche ist verbindlich: Entstehen Logik und Darstellung gleichzeitig, beurteilt der Nutzer am Ende nur das Aussehen, nicht die Richtigkeit.

Teile jeden Abschnitt in konkrete Etappen, nummeriert **Abschnitt.Etappe** (3.2 = zweite Etappe in Abschnitt 3).

Je Etappe notieren: ein Satz was danach funktioniert, das Abnahmekriterium, ggf. was ausdrücklich noch nicht passiert.

**Zuschnitt:** Eine Etappe = ein Satz, der beschreibt, was danach funktioniert. Passt sie nicht in eine fokussierte Session → teilen. Ist das Ergebnis für den Nutzer nicht beurteilbar → zusammenfassen.

**Neue Etappen werden angehängt, nie eingeschoben.** Fällt in Abschnitt 3 später Bedarf auf, wird er 3.4 und 3.5 — bestehende Nummern bleiben, weil Commit-Nachrichten darauf verweisen.

**Ausnahme von der Reihenfolge:** Gefährdet eine technische Unsicherheit das ganze Projekt, ziehe eine kurze Machbarkeitsprüfung vor — klein, als Wegwerf-Versuch, nicht als Projektbeginn.

---

## Abschluss

Zeige dem Nutzer: den Ein-Satz-Kern, die Architekturentscheidung mit Begründung, den Etappenplan. Dann weise darauf hin, dass die nächste Session mit Etappe 1.1 beginnt.

Ab hier übernimmt die angelegte `CLAUDE.md` die Führung.
