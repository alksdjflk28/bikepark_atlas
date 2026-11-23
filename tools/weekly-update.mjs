#!/usr/bin/env bun
// Wöchentlicher Datenlauf für Bikepark Atlas.
//
// Arbeitet ausschließlich in dist/ – genau der Ordner, der hochgeladen wird.
//
//   1. liest dist/data/parks.json
//   2. prüft jede Park-Website (Erreichbarkeit, Weiterleitungen)
//   3. übernimmt die neue Domain, wenn ein Park dauerhaft umgezogen ist
//   4. setzt meta.updatedAt auf heute und schreibt den Datensatz zurück
//   5. schreibt den Prüfbericht nach dist/data/audit.json
//
// Aufruf:
//   bun tools/weekly-update.mjs
//   bun tools/weekly-update.mjs --promote   // dist -> public (vor einem neuen Build)
//
// Preise, Öffnungszeiten und Lines lassen sich nicht zuverlässig maschinell aus
// 202 verschiedenen Park-Websites lesen. Der Lauf prüft daher Links und Saison-
// daten und meldet, was von Hand nachzuziehen ist.

import { readFile, writeFile, rename, copyFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dir, '..')
const DIST_DATA = path.join(ROOT, 'dist', 'data', 'parks.json')
const PUBLIC_DATA = path.join(ROOT, 'public', 'data', 'parks.json')
const AUDIT = path.join(ROOT, 'dist', 'data', 'audit.json')

const UA = 'BikeparkAtlasBot/1.0 (+https://bikepark-atlas.netlify.app/)'
const TIMEOUT_MS = 15000
const CONCURRENCY = 8
const SEASON_WARN_DAYS = 45

if (process.argv.includes('--promote')) {
  if (!existsSync(DIST_DATA)) {
    console.error('dist/data/parks.json fehlt – bitte zuerst den Wochenlauf ausführen.')
    process.exit(1)
  }
  await copyFile(DIST_DATA, PUBLIC_DATA)
  console.log('übernommen: dist/data/parks.json -> public/data/parks.json')
  process.exit(0)
}

if (!existsSync(DIST_DATA)) {
  console.error('dist/data/parks.json fehlt – bitte zuerst `bun run build` ausführen.')
  process.exit(1)
}

const today = new Date().toISOString().slice(0, 10)
const data = JSON.parse(await readFile(DIST_DATA, 'utf8'))
const parks = data.parks ?? []

/* ------------------------------------------------------------------ helpers */

const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

// Kanonische Adresse ohne Query/Fragment – nur für Domain-Umzüge gedacht.
const cleanUrl = (raw) => {
  try {
    const u = new URL(raw)
    return `${u.protocol}//${u.host}${u.pathname}`.replace(/\/+$/, '')
  } catch {
    return null
  }
}

const tldOf = (host) => {
  const parts = host.split('.')
  return parts.length > 1 ? parts[parts.length - 1] : ''
}

const GENERIC_TLDS = new Set(['com', 'org', 'net', 'info', 'biz', 'io', 'eu'])

// Nicht jede Weiterleitung ist ein Umzug: Domains werden auch von Squattern
// übernommen. Übernommen wird nur, was plausibel derselbe Betreiber ist.
function redirectAllowed(from, to) {
  try {
    const before = new URL(from)
    const after = new URL(to)
    if (after.protocol !== 'https:') return false // kein Downgrade auf http
    if (after.search) return false // keine Tracking-Parameter
    const tldBefore = tldOf(before.hostname.replace(/^www\./, ''))
    const tldAfter = tldOf(after.hostname.replace(/^www\./, ''))
    if (tldBefore === tldAfter) return true
    if (GENERIC_TLDS.has(tldBefore) && !GENERIC_TLDS.has(tldAfter)) return false // .com -> .com.br
    if (GENERIC_TLDS.has(tldAfter)) return true // .no -> .com (Rebrand)
    return false // zwei verschiedene Länder-TLDs
  } catch {
    return false
  }
}

const daysUntil = (iso) => {
  if (!iso) return null
  const target = Date.parse(`${iso}T12:00:00Z`)
  if (Number.isNaN(target)) return null
  return Math.round((target - Date.now()) / 86400000)
}

async function checkPark(park) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(park.website, {
      redirect: 'follow',
      signal: ctrl.signal,
      headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5' },
    })
    const finalUrl = res.url || park.website
    // Body wird nicht gebraucht – sofort abbrechen spart Traffic.
    try {
      await res.body?.cancel()
    } catch {}

    let kind = 'ok'
    // 403/429 heißt meist Bot-Schutz, 5xx ein kaputter Server – beides kein
    // toter Link. Nur echte 4xx (404, 410 …) zählen als tot.
    if (!res.ok) kind = res.status === 403 || res.status === 429 || res.status >= 500 ? 'blocked' : 'error'
    return { kind, status: res.status, finalUrl }
  } catch (err) {
    const message = String(err?.message ?? err)
    // Zertifikats-/TLS-Fehler heißen nicht, dass der Park weg ist – nur die Prüfung scheitert.
    const kind =
      err?.name === 'AbortError'
        ? 'timeout'
        : /certificate|CERT_|TLS|SSL|SNI/i.test(message)
          ? 'blocked'
          : 'network'
    return { kind, status: 0, finalUrl: park.website, error: message }
  } finally {
    clearTimeout(timer)
  }
}

async function pool(items, limit, worker) {
  const results = new Array(items.length)
  let next = 0
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++
      results[index] = await worker(items[index])
    }
  })
  await Promise.all(runners)
  return results
}

/* --------------------------------------------------------------- Datenlauf */

console.log(`Wochenlauf: ${parks.length} Parks`)
const started = Date.now()

const results = await pool(parks, CONCURRENCY, async (park) => ({ park, ...(await checkPark(park)) }))

// Ein einzelner Aussetzer ist noch kein toter Link: Fehlschläge einmal
// nachfassen, bevor sie im Bericht landen.
const flaky = results
  .map((result, index) => (result.kind === 'error' || result.kind === 'network' ? index : -1))
  .filter((index) => index >= 0)

if (flaky.length) {
  await new Promise((resolve) => setTimeout(resolve, 3000))
  for (const index of flaky) {
    results[index] = { park: results[index].park, ...(await checkPark(results[index].park)) }
  }
}

const ok = []
const moved = []
const blocked = []
const slow = []
const dead = []
const movedDomains = []

for (const { park, kind, status, finalUrl, error } of results) {
  if (kind === 'ok') {
    ok.push(park.id)
    const before = hostOf(park.website)
    const after = hostOf(finalUrl)
    if (before && after && before !== after) {
      const next = cleanUrl(finalUrl)
      moved.push({ id: park.id, name: park.name, from: park.website, to: finalUrl, status })
      // Nur umschreiben, wenn die Adresse sauber ist (kein Tracking-Rest).
      if (next && redirectAllowed(park.website, next)) {
        park.website = next
        movedDomains.push(`${park.name}: ${next}`)
      }
    }
    continue
  }
  if (kind === 'blocked') {
    blocked.push({ id: park.id, name: park.name, url: park.website, status })
    continue
  }
  if (kind === 'timeout') {
    slow.push({ id: park.id, name: park.name, url: park.website })
    continue
  }
  if (kind === 'network') {
    // Verbindungsabbruch von hier aus (Firewall, Rate-Limit, Routing) – kein Beweis für einen toten Link.
    blocked.push({ id: park.id, name: park.name, url: park.website, status: 0, error })
    continue
  }
  dead.push({ id: park.id, name: park.name, url: park.website, status, error })
}

/* ------------------------------------------------------- Saison + Preise */

const seasonEnded = []
const seasonEndsSoon = []
const missingPrice = []

for (const park of parks) {
  const days = daysUntil(park.seasonTo)
  if (days !== null && days < 0) seasonEnded.push({ id: park.id, name: park.name, seasonTo: park.seasonTo })
  else if (days !== null && days <= SEASON_WARN_DAYS) {
    seasonEndsSoon.push({ id: park.id, name: park.name, seasonTo: park.seasonTo, days })
  }
  if (park.price?.amount == null) missingPrice.push({ id: park.id, name: park.name })
}

/* ----------------------------------------------------------------- schreiben */

const nextData = {
  meta: {
    updatedAt: today,
    total: parks.length,
    checkedAt: new Date().toISOString(),
  },
  parks,
}

const tmp = `${DIST_DATA}.tmp`
await writeFile(tmp, JSON.stringify(nextData, null, 2) + '\n', 'utf8')
await rename(tmp, DIST_DATA)

await writeFile(
  AUDIT,
  JSON.stringify(
    {
      checkedAt: nextData.meta.checkedAt,
      total: parks.length,
      ok: ok.length,
      moved,
      blocked,
      slow,
      dead,
      seasonEnded,
      seasonEndsSoon,
      missingPrice,
    },
    null,
    2,
  ) + '\n',
  'utf8',
)

/* ------------------------------------------------------------------ Bericht */

const seconds = ((Date.now() - started) / 1000).toFixed(0)
console.log(`${ok.length}/${parks.length} erreichbar · ${seconds}s · Stand ${today}`)
if (movedDomains.length) {
  console.log('\nNeue Domain übernommen:')
  movedDomains.forEach((line) => console.log(`  · ${line}`))
}
const movedOnly = moved.filter((m) => !movedDomains.some((line) => line.startsWith(m.name)))
if (movedOnly.length) {
  console.log('\nWeiterleitung, Adresse unverändert gelassen:')
  movedOnly.forEach((m) => console.log(`  · ${m.name}: ${m.from} -> ${m.to}`))
}
if (blocked.length) {
  console.log(`\nBlockiert (Bot-Schutz, bitte prüfen): ${blocked.length}`)
  blocked.forEach((b) => console.log(`  · ${b.name} [${b.status}] ${b.url}`))
}
if (slow.length) {
  console.log(`\nZeitüberschreitung (Server antwortet nicht, URL bleibt): ${slow.length}`)
  slow.forEach((s) => console.log(`  · ${s.name} ${s.url}`))
}
if (dead.length) {
  console.log(`\nNicht erreichbar (bitte neue URL eintragen): ${dead.length}`)
  dead.forEach((d) => console.log(`  · ${d.name} [${d.status || d.error}] ${d.url}`))
}
if (seasonEnded.length) {
  // Die meisten Parks sind im November zu – interessant sind die frisch beendeten.
  const recent = [...seasonEnded].sort((a, b) => b.seasonTo.localeCompare(a.seasonTo)).slice(0, 10)
  console.log(`\nSaison vorbei: ${seasonEnded.length} Parks (Termine fürs nächste Jahr fehlen)`)
  recent.forEach((s) => console.log(`  · ${s.name} (bis ${s.seasonTo})`))
  if (seasonEnded.length > recent.length) console.log(`  … und ${seasonEnded.length - recent.length} weitere`)
}
if (seasonEndsSoon.length) {
  console.log(`\nSaison endet in <= ${SEASON_WARN_DAYS} Tagen: ${seasonEndsSoon.length}`)
  seasonEndsSoon.forEach((s) => console.log(`  · ${s.name} (bis ${s.seasonTo}, ${s.days} Tage)`))
}
if (missingPrice.length) {
  console.log(`\nOhne Preisangabe: ${missingPrice.length}`)
}
console.log('\nDatensatz: dist/data/parks.json · Bericht: dist/data/audit.json')
