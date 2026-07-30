# Windkanal

Ein interaktiver 2D-Windkanal für den Browser: Man setzt ein Hindernis in einen
durchströmten Kanal und sieht sofort, wie die Luft darum herumströmt — Staupunkt
vorn, Wirbel dahinter.

Läuft ohne Installation auf PC, Mac, iPad und iPhone. Es genügt, den Link zu öffnen:
<https://silberfisch24-cpu.github.io/Windkanal/> (sobald Etappe 2.3 erreicht ist).

**Stand:** im Aufbau. Was geplant ist und wie weit es ist, steht in [SPEC.md](SPEC.md).

## Lokal starten

```
python3 -m http.server 8000
```

Dann <http://localhost:8000> im Browser öffnen.

## Was es ist und was nicht

Die Simulation ist **anschaulich, nicht ingenieurstauglich**. Sie zeigt richtig,
*wie* Strömung sich verhält — sie liefert keine belastbaren Messwerte für
Widerstand oder Auftrieb.
