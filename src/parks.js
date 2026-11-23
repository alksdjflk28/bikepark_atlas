// Parkdaten-Loader.
//
// Der Datensatz liegt als JSON in public/data/parks.json und wird beim Build
// nach dist/data/parks.json kopiert. Die Seite lädt ihn zur Laufzeit – so kann
// `tools/weekly-update.mjs` den Datensatz direkt in dist/ aktualisieren, ohne
// dass ein neuer JS-Build nötig ist.
//
// Format: { meta: { updatedAt, total, checkedAt }, parks: [ … ] }

export const DATA_URL = 'data/parks.json'

export let PARKS = []
export let META = {}

export async function loadParks() {
  const res = await fetch(DATA_URL, { cache: 'no-cache' })
  if (!res.ok) throw new Error(`Parkdaten nicht erreichbar (HTTP ${res.status})`)

  const data = await res.json()
  if (!Array.isArray(data?.parks)) throw new Error('Parkdaten haben ein unbekanntes Format')

  PARKS = data.parks
  META = data.meta ?? {}
  return PARKS
}
