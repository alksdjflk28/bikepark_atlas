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
- **Suche** nach Park, Region oder Land
- **Alle Parks**-Liste mit Preis und Line-Anzahl als Übersicht
- **Datenschutz**: Karte lädt erst nach Klick (2-Klick-Lösung, Zustimmung in
  `localStorage`, jederzeit widerrufbar); Link „Datenschutz / Privacy“ unten links
  öffnet die Datenschutzerklärung als Modal
- Responsive: Sidebar als Seitenpanel am Desktop, als Bottom-Sheet auf dem Handy

## Daten

Alle 202 Parks stehen in `public/data/parks.json`:

```json
{
  "meta": { "updatedAt": "2026-11-23", "total": 202, "checkedAt": null },
  "parks": [ { "id": "winterberg", "name": "Bikepark Winterberg", … } ]
}
```

Beim Build wird die Datei nach `dist/data/parks.json` kopiert und von der Seite
zur Laufzeit geladen (`src/parks.js`). Deshalb braucht ein Datenupdate keinen
neuen JS-Build: `dist/data/parks.json` ersetzen, `dist/` hochladen – fertig.

Felder pro Park:

```js
{
  id, name, code, country, region, lede,
  lat, lng, website,
  price: { amount, currency, note },
  lines, linesNote,
  hours, hoursNote, days, openDays: [0 = Mo … 6 = So],
  hoursFrom, hoursTo, seasonFrom, seasonTo,
  crowd: [Mo … So],   // 1 … 5, null = Ruhetag
  crowdNote,
  i18n: { en: { name, lede, region, days, … }, it: { … } }  // optional
}
```

`i18n` ist optional und hat Vorrang vor `src/park-translations.js`: fehlt ein
Feld, wird die dortige Übersetzung genommen, fehlt auch die, der deutsche Text.

Die Auslastung ist eine **Schätzung für typische Tage**, kein Live-Wert. Öffnungszeiten
und Preise können abweichen – bitte immer auf der Website des Parks prüfen.

## Externe Dienste (Browser, keine Keys nötig)

| Zweck | Dienst |
| --- | --- |
| Kartengrundlage | CARTO Dark Matter (Daten: OpenStreetMap) |
| Geocoding | Nominatim (OpenStreetMap) |
| Routen | OSRM Public Demo Server |

## Versteckter Park-Editor (Strg+M)

`Strg+M` (Mac: `Cmd+M`) öffnet einen Editor, um einen Bikepark von Hand
hinzuzufügen – ohne sichtbaren Link in der Oberfläche. Daten werden nie
überschrieben, nur ergänzt.

1. Felder ausfüllen (Name, Land, Koordinaten und mindestens ein Öffnungstag
   sind Pflicht; Kürzel, ID, Tageslabel und Auslastung werden abgeleitet).
   „Position auf Karte wählen“ blendet den Editor aus; ein Klick auf die Karte
   setzt die Koordinaten (Esc bricht ab). „Kartenmitte übernehmen“ nimmt die
   aktuelle Kartenmitte, alternativ lassen sich die Zahlen direkt eintragen.
2. „Park speichern“ → der Park ist sofort auf der Karte und in der Liste, aber
   nur in diesem Browser (`localStorage`, Schlüssel `bikepark-atlas:custom-parks`).
3. „parks.json aktualisieren …“ → Datei `dist/data/parks.json` auswählen, die
   Seite schreibt die neuen Parks direkt hinein (Chrome/Edge, File System Access
   API). Ohne diese API gibt es „parks.json herunterladen“ als Ersatz.
4. Danach `dist/` hochladen.

Übersetzungen für neue Parks kommen direkt in den Datensatz: im Editor unter
„Übersetzungen (optional)“ EN und IT ausfüllen – die Werte landen als
`i18n.en` / `i18n.it` am Park und werden von `pt()` bevorzugt gelesen. Leere
Felder zeigen weiterhin den deutschen Text.

## Wöchentliches Datenupdate

`tools/weekly-update.mjs` prüft jede Park-Website und schreibt ausschließlich in
`dist/`:

- `dist/data/parks.json` – Datensatz mit frischem `meta.updatedAt` (das Datum
  erscheint in der Fußnote der Sidebar); bei einem dauerhaften Domainwechsel
  wird `website` aktualisiert
- `dist/data/audit.json` – Prüfbericht: tote Links (echte 4xx wie 404/410),
  `blocked` (Bot-Schutz, Zertifikatsfehler, Serverfehler ab 500, abgebrochene
  Verbindungen), Zeitüberschreitungen (`slow`), abgelaufene und bald endende
  Saisons, Parks ohne Preis. Fehlschläge werden vor der Einstufung einmal
  wiederholt, damit einzelne Aussetzer keinen Fehlalarm auslösen.

```sh
bun run update        # identisch: tools/weekly-update.cmd
```

Preise, Öffnungszeiten und Lines werden **nicht** automatisch geändert: 202 Parks
heißen 202 verschiedene Websites mit eigenen Shops und Formaten, ein
zuverlässiges Auslesen gibt es dafür nicht. Der Lauf sagt dir, wo etwas
nachzuziehen ist.

### Automatisch in GitHub Actions (empfohlen)

`.github/workflows/weekly-update.yml` startet montags 03:00 UTC (04:00
Winter-, 05:00 Sommerzeit) und auf Knopfdruck unter *Actions → Wöchentlicher
Link-Check → Run workflow*:

1. `bun run build` (Stand aus `public/data/parks.json`)
2. `bun run update` – prüft alle Park-Websites, schreibt `dist/data/parks.json`
   und `dist/data/audit.json` (der Bericht liegt zusätzlich als Artefakt am Lauf)
3. `--promote` übernimmt den neuen Datensatz nach `public/data/parks.json` und
   der Workflow committet ihn
4. zuletzt wird `dist/` direkt zu Netlify hochgeladen

Schritt 4 braucht zwei Repository-Secrets (Settings → Secrets and variables →
Actions). Fehlen sie, läuft alles andere trotzdem und der Deploy wird nur
übersprungen.

- `NETLIFY_AUTH_TOKEN` – Netlify → User settings → Applications → *New access
  token*
- `NETLIFY_SITE_ID` – Netlify → Site configuration → Site information → *Site ID*

Ist die Netlify-Seite mit dem Repository verbunden statt per Drag & Drop
befüllt, sind keine Secrets nötig: dann baut Netlify selbst nach dem Push
(Publish directory `dist`, Build command `bun run build`).

### Alternative: lokal über die Windows-Aufgabenplanung

Montags 04:00 Uhr auf dem eigenen Rechner (der Rechner muss an sein, verpasste
Läufe holt Windows nach):

```sh
schtasks /Create /SC WEEKLY /D MON /ST 04:00 /TN "Bikepark Atlas Update" /TR "\"%USERPROFILE%\Documents\bikepark-atlas\tools\weekly-update.cmd\""
```

Danach `dist/` hochladen. Wichtig: `bun run build` erzeugt `dist/` neu und nimmt
dabei `public/data/parks.json` als Stand – vor einem neuen Build also
`bun tools/weekly-update.mjs --promote` ausführen, damit die aktuellen Daten
erhalten bleiben.

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

The build produces `dist/` – genau der Ordner, der auf Netlify hochgeladen wird.
When the user asks to publish on Freebuff Sites,
use `sites_deploy` with `deploy.json`. Its tiny `worker/index.js` serves the
built assets through the platform's `ASSETS` binding. No integrations or
secrets are required. Other static hosts can serve `dist/` directly.
