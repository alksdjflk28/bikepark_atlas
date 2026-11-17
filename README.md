# Bikepark Atlas

Eine interaktive Karte mit den offiziellen Bikeparks in Europa – 202 Parks in
23 Ländern, von Island bis Spanien, mit Bergbahn und Trailparks ohne Lift.
Gebaut mit Vanilla-JS, Leaflet und Vite.

## Features

- **Karte** mit allen 202 Parks als Markierungen, farblich nach Land codiert und
  nach Zoomstufe geclustert
- **Sidebar** öffnet sich beim Klick auf eine Markierung mit:
  - Öffnungszeiten (Öffnungstage, Uhrzeit, Saison) und Status „heute geöffnet?"
  - Tageskartenpreis inkl. Hinweis
  - Anzahl der Lines
  - Auslastung pro Wochentag (1 = sehr ruhig … 5 = sehr voll, Ruhetage ausgegraut)
  - Link zur Website des Parks
- **Routenplaner**: Start, beliebig viele Zwischenstopps (per Adresse oder per Klick
  auf einen Park) und das Ziel stehen als Zeilen in einer Liste; Stopps lassen sich
  per Drag & Drop umsortieren und bekommen eine Aufenthaltsdauer in Tagen. Route
  kommt von OSRM, wird auf der Karte gezeichnet und als Google-Maps-Link angeboten
- **Suche** nach Park, Region oder Land und **Land-Filter** über die Chips
- **Alle Parks**-Liste mit Preis und Line-Anzahl als Übersicht
- Responsive: Sidebar als Seitenpanel am Desktop, als Bottom-Sheet auf dem Handy

## Daten

Der Datensatz liegt in `src/parks.js` (Kernländer) und `src/data/` (weitere
Regionen: `germany-austria.js`, `switzerland.js`, `italy.js`, `france.js`,
`east.js`, `south.js`, `north-west.js`, `trailparks.js`). Stand November 2026:

```js
{
  id, name, code, country, region, lede,
  lat, lng, website,
  price: { amount, currency, note },
  lines, linesNote,
  hours, hoursNote, days, openDays: [0 = Mo … 6 = So],
  hoursFrom, hoursTo, seasonFrom, seasonTo,
  crowd: [Mo … So],   // 1 … 5, null = Ruhetag
  crowdNote
}
```

Die Auslastung ist eine **Schätzung für typische Tage**, kein Live-Wert. Öffnungszeiten
und Preise können abweichen – bitte immer auf der Website des Parks prüfen.

## Externe Dienste (Browser, keine Keys nötig)

| Zweck | Dienst |
| --- | --- |
| Kartengrundlage | Esri Dark Gray Canvas |
| Geocoding | Nominatim (OpenStreetMap) |
| Routen | OSRM Public Demo Server |

## Run locally

```sh
bun install
bun run dev
```

Open the URL printed by Vite. The server binds to `0.0.0.0` so it also works
in a Freebuff Cloud preview.

## Build and publish

```sh
bun run build
bun run preview
```

The build produces `dist/`. When the user asks to publish on Freebuff Sites,
use `sites_deploy` with `deploy.json`. Its tiny `worker/index.js` serves the
built assets through the platform's `ASSETS` binding. No integrations or
secrets are required. Other static hosts can serve `dist/` directly.
