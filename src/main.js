import 'leaflet/dist/leaflet.css'
import './style.css'

import L from 'leaflet'
import 'leaflet.markercluster'
import { PARKS, META, loadParks } from './parks.js'
import { pt } from './park-translations.js'
import { initEditor } from './editor.js'
import {
  TR,
  LANG_KEY,
  currentLang,
  loadLang,
  setLang,
  t,
  dayShort as ds,
  dayLong as dl,
  countryName as cn,
} from './i18n.js'

/* ------------------------------------------------------------- park data */

// Der Datensatz kommt aus dist/data/parks.json (Quelle: public/data/parks.json).
// Er wird vor allem anderen geladen, damit ein wöchentlicher Datenlauf nur
// diese Datei ersetzen muss – ohne neuen JS-Build.
let parksError = null
try {
  await loadParks()
} catch (err) {
  parksError = err
  console.error('Parkdaten nicht geladen:', err)
}

/* ------------------------------------------------------------------ data */

const COUNTRY_COLOR = {
  Deutschland: '#a3e635',
  Österreich: '#38bdf8',
  Schweiz: '#f472b6',
  Italien: '#fb923c',
  Frankreich: '#c084fc',
  Tschechien: '#facc15',
  Slowakei: '#2dd4bf',
  Slowenien: '#f87171',
  Polen: '#e879f9',
  Spanien: '#fdba74',
  Andorra: '#a78bfa',
  Großbritannien: '#60a5fa',
  Irland: '#34d399',
  Norwegen: '#93c5fd',
  Schweden: '#fde047',
  Finnland: '#5eead4',
  Lettland: '#fca5a5',
  Estland: '#c4b5fd',
  Kroatien: '#fcd34d',
  Serbien: '#f9a8d4',
  Bulgarien: '#a5b4fc',
  Rumänien: '#fbbf24',
  Island: '#7dd3fc',
}

const CROWD_COLOR = {
  1: '#22c55e',
  2: '#84cc16',
  3: '#eab308',
  4: '#f97316',
  5: '#ef4444',
}

/* ---------------------------------------------------------------- helpers */

const $ = (sel) => document.querySelector(sel)

function todayIndex() {
  const d = new Date()
  return (d.getDay() + 6) % 7 // 0 = Montag
}

function fmtDate(iso) {
  if (!iso) return null
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

// Stand des Datensatzes für den Fußnoten-Text
function dataStand() {
  return META.updatedAt ? fmtDate(META.updatedAt) : 'November 2026'
}

function fmtPrice(price) {
  if (!price) return '–'
  const n = Number.isInteger(price.amount)
    ? String(price.amount)
    : price.amount.toFixed(2).replace('.', ',')
  return `${n} ${price.currency}`
}

function fmtKm(meters) {
  const km = meters / 1000
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`
}

// OSRM liefert die Fahrzeit in Sekunden
function fmtDuration(seconds) {
  const total = Math.round(seconds / 60)
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `${m} ${t('minAbbr')}`
  return m === 0 ? `${h} ${t('hourAbbr')}` : `${h} ${t('hourAbbr')} ${m} ${t('minAbbr')}`
}

// Aufenthalte werden in Tagen angegeben (0,5 = halber Tag).
function fmtDays(days) {
  if (!days) return `0 ${t('hourAbbr')}`
  const whole = Math.floor(days)
  const rest = Math.round((days - whole) * 24)
  if (whole === 0) return `${Math.round(days * 24)} ${t('hourAbbr')}`
  const label = whole === 1 ? t('daySingular') : `${whole} ${t('daysAbbr')}`
  return rest ? `${label} ${rest} ${t('hourAbbr')}` : label
}

// Gesamtzeit in Stunden als Tage/Stunden ausgeben.
function fmtSpan(hours) {
  const days = Math.floor(hours / 24)
  const rest = Math.round(hours % 24)
  if (!days) return rest === 1 ? `1 ${t('hourAbbr')}` : `${rest} ${t('hourAbbr')}`
  const label = days === 1 ? t('daySingular') : `${days} ${t('daysAbbr')}`
  return rest ? `${label} ${rest} ${t('hourAbbr')}` : label
}

// "08:30" → 8,5 – daraus lassen sich die Liftstunden eines Tages berechnen.
function clockHours(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || '').trim())
  return match ? Number(match[1]) + Number(match[2]) / 60 : null
}

// Empfehlung: wie viel Zeit der Park braucht, um alle Strecken in Ruhe zu fahren.
function stayAdvice(park) {
  const lines = Number(park.lines) || 0
  const from = clockHours(park.hoursFrom)
  const to = clockHours(park.hoursTo)
  const lift = from != null && to != null && to > from ? to - from : null
  const liftText = lift
    ? ` bei rund ${Number(lift.toFixed(1)).toLocaleString('de-DE')} ${t('hourAbbr')} Liftbetrieb`
    : ''

  const isTrail = park.type === 'trailpark'
  const days = isTrail
    ? lines >= 10
      ? 2
      : 1
    : lines >= 20
      ? 3
      : lines >= 12
        ? 2
        : 1

  const allLines =
    lines === 1 ? t('dieEinzigeLine') : lines > 1 ? `alle ${lines} Lines` : 'alle Strecken'
  const allRounds =
    lines === 1 ? t('dieEineRunde') : lines > 1 ? `die ${lines} Runden` : 'alle Runden'

  let note
  if (isTrail) {
    note =
      days === 1
        ? t('stayTrail1', { rounds: allRounds })
        : t('stayTrail2', { rounds: allRounds })
  } else if (days === 1) {
    note = t('stay1', { lift: liftText, lines: allLines })
  } else if (days === 2) {
    note = t('stay2', { lines: allLines })
  } else {
    note = t('stay3', { lines: allLines })
  }

  return { days, label: days === 1 ? t('daySingular') : `${days} ${t('daysAbbr')}`, note }
}

const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms))

function escapeHtml(str) {
  return String(str).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  )
}

function seasonStatus(park) {
  const now = new Date()
  const iso = now.toISOString().slice(0, 10)
  if (park.seasonFrom && iso < park.seasonFrom) {
    return { open: false, text: t('seasonStarts', { date: fmtDate(park.seasonFrom) }) }
  }
  if (park.seasonTo && iso > park.seasonTo) {
    return { open: false, text: t('seasonEnded', { date: fmtDate(park.seasonTo) }) }
  }
  return { open: true, text: null }
}

function todayStatus(park) {
  const idx = todayIndex()
  const season = seasonStatus(park)
  if (!season.open) return season
  if (!park.openDays.includes(idx)) {
    return { open: false, text: t('todayClosed', { day: dl(idx) }) }
  }
  return { open: true, text: t('todayOpen', { from: park.hoursFrom, to: park.hoursTo }) }
}

function matches(park) {
  if (!state.query) return true
  const hay = `${park.name} ${park.region} ${park.country} ${park.code}`.toLowerCase()
  return hay.includes(state.query)
}

/* ------------------------------------------------------------------ state */

const state = {
  query: '',
  activeId: null,
  view: 'park', // 'park' | 'list'
  route: {
    from: null,
    fromLabel: null,
    startText: '',
    pickMode: false,
    stops: [],
    stopPick: null,
  },
}

/* ------------------------------------------------------------------- map */

// 2-Klick-Lösung: Leaflet-Karte und OpenStreetMap-Kacheln entstehen erst nach ausdrücklicher
// Zustimmung – vorher gibt es keine Verbindung zu OpenStreetMap.
const OSM_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap-Mitwirkende</a>'

let map = null

const markers = new Map()
const routeLayer = L.layerGroup()

// Viele Parks in den Alpen überlappen sich – deshalb Clustering.
const clusterGroup = L.markerClusterGroup({
  chunkedLoading: true,
  showCoverageOnHover: false,
  spiderfyOnMaxZoom: true,
  disableClusteringAtZoom: 14,
  maxClusterRadius: 48,
  iconCreateFunction: (cluster) =>
    L.divIcon({
      className: 'cluster-wrap',
      html: `<span class="cluster"><b>${cluster.getChildCount()}</b></span>`,
      iconSize: [46, 46],
      iconAnchor: [23, 23],
    }),
})

function markerHtml(park) {
  const color = COUNTRY_COLOR[park.country] || '#a3e635'
  return `<span class="pin" style="--pin:${color}">${escapeHtml(park.code)}</span>`
}

function addMarker(park) {
  const icon = L.divIcon({
    className: 'pin-wrap',
    html: markerHtml(park),
    iconSize: [42, 42],
    iconAnchor: [21, 42],
    tooltipAnchor: [0, -40],
  })

  const marker = L.marker([park.lat, park.lng], { icon, riseOnHover: true, title: park.name })
    .bindTooltip(park.name, { direction: 'top', className: 'park-tip', opacity: 1 })
    .on('click', () => handleParkClick(park))

  markers.set(park.id, { marker, park })
  return marker
}

PARKS.forEach(addMarker)

// Vom Editor (Strg+M) genutzt: Park ergänzen bzw. wieder entfernen.
function addPark(park) {
  if (!park || !park.id) return false
  if (PARKS.some((p) => p.id === park.id)) return false
  PARKS.push(park)
  addMarker(park)
  syncMarkers()
  applyFilters()
  return true
}

function removePark(id) {
  const index = PARKS.findIndex((p) => p.id === id)
  if (index === -1) return false
  PARKS.splice(index, 1)
  const entry = markers.get(id)
  if (entry) {
    clusterGroup.removeLayer(entry.marker)
    markers.delete(id)
  }
  if (state.activeId === id) closeSidebar()
  applyFilters()
  return true
}

// Ohne Datensatz bleibt die Seite sonst leer und es gibt keinen Hinweis warum.
if (parksError) {
  document.body.insertAdjacentHTML(
    'afterbegin',
    `<div style="position:fixed;left:0;right:0;bottom:0;z-index:9999;padding:12px 16px;background:#7f1d1d;color:#fff;font:14px/1.4 system-ui,sans-serif;text-align:center">
      Die Parkdaten konnten nicht geladen werden (${escapeHtml(parksError.message)}). Bitte die Seite neu laden.
    </div>`,
  )
}

function syncMarkers() {
  markers.forEach(({ marker, park }, id) => {
    const visible = matches(park)
    const inGroup = clusterGroup.hasLayer(marker)
    if (visible && !inGroup) clusterGroup.addLayer(marker)
    if (!visible && inGroup) clusterGroup.removeLayer(marker)

    const el = marker.getElement()
    if (el) {
      const active = id === state.activeId
      el.classList.toggle('is-active', active)
      el.classList.toggle('is-dim', state.activeId !== null && !active)
      marker.setZIndexOffset(active ? 1000 : 0)
    }
  })
}

// Nach Clustering sind die Pin-DOMs neu – Zustände neu vergeben.
clusterGroup.on('animationend', () => syncMarkers())

// Baut die Karte erst auf, wenn die Zustimmung vorliegt oder gerade erteilt wurde.
function initMap() {
  if (map) return map

  map = L.map('map', {
    zoomControl: false,
    minZoom: 4,
    maxZoom: 16,
    scrollWheelZoom: true,
  }).setView([50.4, 9.6], 5.5)

  L.control.zoom({ position: 'bottomright' }).addTo(map)

  L.tileLayer(OSM_TILES, {
    attribution: OSM_ATTRIBUTION,
    subdomains: 'abcd',
    maxZoom: 16,
  }).addTo(map)

  map.addLayer(clusterGroup)
  routeLayer.addTo(map)

  map.on('zoomend', () => syncMarkers())

  // Klick auf die Karte setzt im Planer einen Startpunkt auf der Karte
  map.on('click', (e) => {
    if (!state.route.pickMode || !state.activeId) return
    const park = PARKS.find((p) => p.id === state.activeId)
    if (!park) return
    const from = { lat: e.latlng.lat, lng: e.latlng.lng }
    const label = `${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`
    state.route.pickMode = false
    state.route.startText = label
    $('#map').style.cursor = ''
    renderStops()
    computeRoute(park, from, label, resolvedStops())
  })

  document.body.classList.add('map-ready')
  window.setTimeout(() => {
    map.invalidateSize()
    fitAll()
  }, 80)

  return map
}

/* -------------------------------------------------------------- filtering */

function applyFilters() {
  syncMarkers()
  $('#result-count').textContent = String(PARKS.filter(matches).length)
  if (state.view === 'list') renderList()
}

$('#search').addEventListener('input', (e) => {
  state.query = e.target.value.trim().toLowerCase()
  if (state.query && state.view !== 'list') openList()
  applyFilters()
})

/* --------------------------------------------------------------- sidebar */

function openSidebar() {
  document.body.classList.add('sidebar-open')
  document.body.classList.add('has-selection')
  $('#sidebar').setAttribute('aria-hidden', 'false')
  $('#scrim').hidden = false
}

function closeSidebar() {
  document.body.classList.remove('sidebar-open')
  document.body.classList.remove('has-selection')
  $('#sidebar').setAttribute('aria-hidden', 'true')
  $('#scrim').hidden = true
  state.activeId = null
  state.route.pickMode = false
  state.route.stopPick = null
  document.body.classList.remove('picking-stop')
  state.view = 'park'
  $('#map').style.cursor = ''
  syncMarkers()
  routeLayer.clearLayers()
}

function allBounds() {
  return L.latLngBounds(PARKS.map((p) => [p.lat, p.lng])).pad(0.08)
}

function fitAll(animate = false) {
  if (!map) return
  map.fitBounds(allBounds(), {
    paddingTopLeft: [46, 96],
    paddingBottomRight: [46, 74],
    animate,
  })
}

function adjustForSidebar(park) {
  if (!map) return
  const size = map.getSize()
  if (window.innerWidth > 860) {
    const sidebarW = $('#sidebar').offsetWidth || 420
    if (size.x - sidebarW < 320) return
    // Pin soll in der Mitte der freien Fläche rechts von der Sidebar sitzen
    const desired = sidebarW + (size.x - sidebarW) / 2
    const pt = map.latLngToContainerPoint([park.lat, park.lng])
    if (pt.x < desired) map.panBy([-(desired - pt.x), 0], { animate: true, duration: 0.35 })
  } else {
    const pt = map.latLngToContainerPoint([park.lat, park.lng])
    const desired = size.y * 0.22
    if (pt.y > desired) map.panBy([0, pt.y - desired], { animate: true, duration: 0.35 })
  }
}

function centerOnPark(park) {
  if (!map) return
  const wanted = Math.max(map.getZoom(), 11)
  map.flyTo([park.lat, park.lng], wanted, { duration: 0.7 })

  window.setTimeout(() => {
    if (state.activeId !== park.id) return
    revealMarker(park, () => {
      if (state.activeId !== park.id) return
      syncMarkers() // Pin steht jetzt einzeln -> Aktiv-Zustand neu vergeben
      adjustForSidebar(park)
    })
  }, 780)
}

// Park hängt noch in einem Cluster -> so weit hineinzoomen, bis die Pin einzeln steht.
function revealMarker(park, done) {
  const marker = markers.get(park.id)?.marker
  if (!map || !marker || map.hasLayer(marker)) return done()

  let steps = 0
  const step = () => {
    if (state.activeId !== park.id) return // Sidebar wurde inzwischen geschlossen
    if (map.hasLayer(marker)) return done()
    if (++steps > 5) return done()
    map.setZoom(Math.min(map.getZoom() + 1, map.getMaxZoom()), { animate: false })
    window.setTimeout(step, 150)
  }
  step()
}

function openPark(park) {
  state.activeId = park.id
  state.view = 'park'
  state.route = {
    from: state.route.from,
    fromLabel: state.route.fromLabel,
    startText: state.route.startText,
    pickMode: false,
    stops: state.route.stops,
    stopPick: null,
  }
  renderPark(park)
  openSidebar()
  syncMarkers()
  centerOnPark(park)
}

function openList() {
  state.activeId = null
  state.view = 'list'
  renderList()
  openSidebar()
  syncMarkers()
}

/* ------------------------------------------- Parks als Zwischenstopp */

// Klick auf eine Markierung: Park öffnen – oder als Stopp übernehmen.
function handleParkClick(park) {
  if (state.route.stopPick != null) {
    addParkAsStop(park, state.route.stopPick)
    return
  }
  openPark(park)
}

function armStopPick(index) {
  state.route.stopPick = index
  document.body.classList.add('picking-stop')
  $('#map').style.cursor = 'crosshair'
  const status = $('#rp-status')
  if (status) {
    status.classList.remove('error')
    status.textContent =
      'Klicke einen Bikepark auf der Karte als Zwischenstopp – oder gib eine Adresse ein.'
  }
}

function cancelStopPick() {
  state.route.stopPick = null
  document.body.classList.remove('picking-stop')
  $('#map').style.cursor = state.route.pickMode ? 'crosshair' : ''
}

function addParkAsStop(park, index) {
  const stops = state.route.stops
  const base = stops[index] || { days: 1 }
  const stop = {
    ...base,
    label: park.name,
    lat: park.lat,
    lng: park.lng,
    days: Number(base.days) || 1,
  }
  if (stops[index]) stops[index] = stop
  else stops.push(stop)

  cancelStopPick()
  renderStops()

  const status = $('#rp-status')
  if (status) {
    status.classList.remove('error')
    status.textContent = `„${park.name}“ als Zwischenstopp übernommen – Aufenthalt ${fmtDays(stop.days)}.`
  }

  // Liegt schon eine berechnete Route vor, direkt neu rechnen.
  const target = PARKS.find((p) => p.id === state.activeId)
  if (target && state.route.from) {
    computeRoute(target, state.route.from, state.route.fromLabel || 'Start', resolvedStops())
  }
}

function renderPark(park) {
  const status = todayStatus(park)
  const crowd = park.crowd || []
  const today = todayIndex()

  const crowdCols = crowd
    .map((level, i) => {
      if (level == null) {
        return `<div class="crowd-col closed${i === today ? ' today' : ''}">
            <div class="crowd-bar-track" title="${dl(i)}: ${t('crowdClosed')}"></div>
            <div class="crowd-day">${ds(i)}</div>
          </div>`
      }
      const h = 18 + level * 16
      return `<div class="crowd-col${i === today ? ' today' : ''}">
          <div class="crowd-bar-track" title="${dl(i)}: ${t(`crowdL${level}`)}">
            <div class="crowd-bar" style="height:${h}%;background:${CROWD_COLOR[level]}"></div>
          </div>
          <div class="crowd-day">${ds(i)}</div>
        </div>`
    })
    .join('')

  const season =
    park.seasonFrom && park.seasonTo
      ? `${fmtDate(park.seasonFrom)} – ${fmtDate(park.seasonTo)}`
      : t('seasonNone')

  const linesValue = park.lines == null ? '–' : String(park.lines)
  const daysNote =
    park.openDays.length === 7 ? t('täglich') : `${park.openDays.length} ${t('tageProWoche')}`
  const stay = stayAdvice(park)

  try {
    $('#sidebar-content').innerHTML = `
    <div class="sb-top">
      <span class="code-badge">
        <span class="dot" style="background:${COUNTRY_COLOR[park.country] || '#a3e635'}"></span>
        ${escapeHtml(park.code)} · ${escapeHtml(cn(park.country))}
      </span>
      <button class="icon-btn" type="button" id="close-btn" aria-label="${t('closeSidebar')}">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
      </button>
    </div>

    <h1 class="sb-title">${escapeHtml(pt(park, 'name'))}</h1>
    <p class="sb-region">${park.type === 'trailpark' ? t('trailparkOhneLift') + ' · ' : ''}${escapeHtml(pt(park, 'region'))} · ${escapeHtml(cn(park.country))}</p>
    <p class="sb-lede">${escapeHtml(pt(park, 'lede'))}</p>

    <div class="status ${status.open ? 'open' : 'closed'}">
      <span class="dot"></span>${escapeHtml(status.text || t('geschlossen'))}
    </div>

    <div class="facts">
      <div class="fact">
        <div class="fact-label">${t('factTicket')}</div>
        <div class="fact-value">${fmtPrice(park.price)}</div>
        <div class="fact-sub">${escapeHtml(pt(park, 'priceNote') || park.price?.note || '')}</div>
      </div>
      <div class="fact">
        <div class="fact-label">${t('factLines')}</div>
        <div class="fact-value">${linesValue}</div>
        <div class="fact-sub">${escapeHtml(pt(park, 'linesNote') || park.linesNote || '')}</div>
      </div>
      <div class="fact">
        <div class="fact-label">${t('factOpen')}</div>
        <div class="fact-value">${pt(park, 'days')}</div>
        <div class="fact-sub">${daysNote}</div>
      </div>
    </div>

    <section class="section">
      <div class="section-head">
        <h2 class="section-title">${t('stayTitle')}</h2>
        <span class="section-note">${t('staySubtitle')}</span>
      </div>
      <div class="stay-card">
        <span class="stay-days">${stay.label}</span>
        <p class="stay-note">${escapeHtml(stay.note)}</p>
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <h2 class="section-title">${t('hoursTitle')}</h2>
        <span class="section-note">${t('hoursSubtitle')} ${escapeHtml(season)}</span>
      </div>
      <dl class="kv-list" style="margin:0">
        <div class="kv"><dt>${t('hoursDays')}</dt><dd>${pt(park, 'days')}</dd></div>
        <div class="kv"><dt>${t('hoursTime')}</dt><dd>${escapeHtml(park.hours)}${park.hoursNote ? ` <span style="color:var(--muted);font-weight:400">(${escapeHtml(pt(park, 'hoursNote') || park.hoursNote)})</span>` : ''}</dd></div>
        <div class="kv"><dt>${t('hoursSeason')}</dt><dd>${escapeHtml(season)}</dd></div>
      </dl>
    </section>

    <section class="section">
      <div class="section-head">
        <h2 class="section-title">${t('crowdTitle')}</h2>
        <span class="section-note">${t('crowdSubtitle')}</span>
      </div>
      <div class="crowd">${crowdCols}</div>
      <div class="crowd-legend">
        ${[1, 2, 3, 4, 5]
          .map((n) => `<span><i style="background:${CROWD_COLOR[n]}"></i>${t(`crowdL${n}`)}</span>`)
          .join('')}
        <span><i style="background:#2a323c"></i>${t('crowdClosed')}</span>
      </div>
      ${pt(park, 'crowdNote') ? `<p class="crowd-note">${escapeHtml(pt(park, 'crowdNote'))}</p>` : ''}
    </section>

    <section class="section">
      <div class="section-head">
        <h2 class="section-title">${t('plannerTitle')}</h2>
        <span class="section-note">${t('plannerSubtitle')}</span>
      </div>
      <div class="planner">
        <div class="stops" id="rp-stops"></div>
        <div class="planner-actions">
          <button class="btn" type="button" id="rp-add-stop">+ ${t('zwischenStopp')}</button>
          <button class="btn btn-primary" type="button" id="rp-go">${t('goBtn')}</button>
        </div>

        <div class="planner-status" id="rp-status">${t('statusEnterStart', { name: escapeHtml(park.name) })}</div>
        <div class="route-result" id="rp-result">
          <div class="route-metrics">
            <div class="route-metric"><div class="big" id="rp-dist">–</div><div class="small">${t('dist')}</div></div>
            <div class="route-metric"><div class="big" id="rp-time">–</div><div class="small">${t('time')}</div></div>
            <div class="route-metric"><div class="big" id="rp-all">–</div><div class="small">${t('total')}</div></div>
          </div>
          <p class="route-total" id="rp-stay"></p>
          <p class="route-from" id="rp-from"></p>
          <div class="planner-actions">
            <a class="btn" id="rp-maps" href="#" target="_blank" rel="noopener">${t('openMaps')}</a>
            <button class="btn" type="button" id="rp-reset">${t('resetBtn')}</button>
          </div>
        </div>
      </div>
    </section>

    <div class="actions">
      <a class="btn btn-primary btn-block" href="${escapeHtml(park.website)}" target="_blank" rel="noopener">
        ${t('openWebsite', { name: escapeHtml(pt(park, 'name')) })}
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg>
      </a>
      <button class="btn btn-block" type="button" id="all-btn">${t('showAll')}</button>
    </div>

    <p class="footnote">
      ${t('footnote', { date: dataStand() })}
    </p>
  `
  } catch (e) {
    $('#sidebar-content').innerHTML = '<div style="padding:20px;color:#fca5a5;">Fehler beim Rendern: ' + escapeHtml(e.message) + '</div>'
    console.error('renderPark error:', e)
  }

  wirePlanner(park)
  $('#close-btn').addEventListener('click', closeSidebar)
  $('#all-btn').addEventListener('click', openList)
}

function renderList() {
  const list = PARKS.filter(matches)
  const body = list.length
    ? `<ul class="park-list">${list
        .map((p) => {
          const color = COUNTRY_COLOR[p.country]
          const price = fmtPrice(p.price)
          return `<li>
            <button class="park-item" type="button" data-id="${p.id}">
              <span class="code" style="background:${color}">${escapeHtml(p.code)}</span>
              <span>
                <span class="nm">${escapeHtml(pt(p, 'name'))}</span>
                <span class="rg">${escapeHtml(pt(p, 'region'))} · ${escapeHtml(cn(p.country))}</span>
              </span>
              <span class="meta"><b>${escapeHtml(price)}</b>${
                p.lines == null ? t('keineLines') : p.lines === 1 ? '1 Line' : `${p.lines} Lines`
              }</span>
            </button>
          </li>`
        })
        .join('')}</ul>`
    : `<div class="empty">${t('keinPark')}<br />${t('andererSuchbegriff')}</div>`

  $('#sidebar-content').innerHTML = `
    <div class="sb-top">
      <div class="list-head" style="margin:0">
        <h2>${t('listTitle')}</h2>
        <p>${t('listCount', { count: list.length, total: PARKS.length })}${state.query ? ` · „${escapeHtml(state.query)}“` : ''}</p>
      </div>
      <button class="icon-btn" type="button" id="close-btn" aria-label="${t('closeSidebar')}">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
      </button>
    </div>
    <div style="margin-top:14px">${body}</div>
    <p class="footnote">${t('listFootnote')}</p>
  `

  $('#close-btn').addEventListener('click', closeSidebar)
  $('#sidebar-content').querySelectorAll('.park-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const park = PARKS.find((p) => p.id === btn.dataset.id)
      if (park) openPark(park)
    })
  })
}

/* -------------------------------------------------------- route planning */

async function geocode(query) {
  const url =
    'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=de&q=' +
    encodeURIComponent(query)
  const res = await fetch(url)
  if (!res.ok) throw new Error('Geocoding nicht erreichbar')
  const data = await res.json()
  if (!Array.isArray(data) || !data.length) throw new Error('Ort nicht gefunden')
  return { lat: Number(data[0].lat), lng: Number(data[0].lon), label: data[0].display_name }
}

async function osrmRoute(from, stops, to) {
  // OSRM nimmt beliebig viele Wegpunkte: Start ; Zwischenstopps ; Ziel
  const points = [from, ...stops, to].map((p) => `${p.lng},${p.lat}`).join(';')
  const url = `https://router.project-osrm.org/route/v1/driving/${points}?overview=full&geometries=geojson`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Routenberechnung nicht erreichbar')
  const data = await res.json()
  if (data.code !== 'Ok' || !data.routes?.length) throw new Error('Keine Route gefunden')
  return data.routes[0]
}

function drawRoute(park, route, stops = []) {
  routeLayer.clearLayers()
  const latlngs = route.geometry.coordinates.map(([lng, lat]) => [lat, lng])

  L.polyline(latlngs, {
    color: '#0b0d10',
    weight: 9,
    opacity: 0.55,
    lineJoin: 'round',
  }).addTo(routeLayer)

  L.polyline(latlngs, {
    color: '#a3e635',
    weight: 4.5,
    opacity: 0.95,
    lineJoin: 'round',
  }).addTo(routeLayer)

  const start = latlngs[0]
  L.circleMarker(start, {
    radius: 7,
    color: '#0b0d10',
    weight: 3,
    fillColor: '#38bdf8',
    fillOpacity: 1,
  })
    .bindTooltip('Start', { direction: 'top' })
    .addTo(routeLayer)

  stops.forEach((stop, i) => {
    L.circleMarker([stop.lat, stop.lng], {
      radius: 8,
      color: '#0b0d10',
      weight: 3,
      fillColor: '#a3e635',
      fillOpacity: 1,
    })
      .bindTooltip(`${i + 1}. ${stop.label}`, { direction: 'top' })
      .addTo(routeLayer)
      .bindPopup(
        `<b>${i + 1}. Zwischenstopp</b><br />${escapeHtml(stop.label)}<br />Aufenthalt: ${fmtDays(
          Number(stop.days) || 0,
        )}`,
      )
  })

  if (!map) return
  map.fitBounds(L.latLngBounds(latlngs).pad(0.12), {
    paddingTopLeft: window.innerWidth > 860 ? [($('#sidebar').offsetWidth || 420) + 20, 60] : [20, 90],
    paddingBottomRight: [60, 60],
    animate: true,
  })
}

function showRouteResult(park, route, fromLabel, stops = []) {
  const dwellDays = stops.reduce((sum, stop) => sum + (Number(stop.days) || 0), 0)
  const totalHours = route.duration / 3600 + dwellDays * 24

  $('#rp-result').classList.add('show')
  $('#rp-dist').textContent = fmtKm(route.distance)
  $('#rp-time').textContent = fmtDuration(route.duration)
  $('#rp-all').textContent = fmtSpan(totalHours)
  $('#rp-stay').textContent = stops.length
    ? `Aufenthalt: ${fmtDays(dwellDays)} an ${stops.length} Zwischenstopp${stops.length === 1 ? '' : 's'}`
    : t('withoutStop')
  $('#rp-from').textContent = `Start: ${fromLabel}`

  const waypoints = stops.map((stop) => `${stop.lat},${stop.lng}`).join('|')
  let mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${state.route.from.lat},${state.route.from.lng}&destination=${park.lat},${park.lng}&travelmode=driving`
  if (waypoints) mapsUrl += `&waypoints=${encodeURIComponent(waypoints)}`
  $('#rp-maps').href = mapsUrl

  $('#rp-status').classList.remove('error')
  $('#rp-status').textContent = t('statusRouteDone')
  drawRoute(park, route, stops)
}

async function computeRoute(park, from, fromLabel, stops = []) {
  cancelStopPick()
  const status = $('#rp-status')
  status.classList.remove('error')
  status.textContent = 'Berechne Route …'
  $('#rp-result').classList.remove('show')

  try {
    const route = await osrmRoute(from, stops, park)
    state.route.from = from
    state.route.fromLabel = fromLabel
    showRouteResult(park, route, fromLabel, stops)
  } catch (err) {
    routeLayer.clearLayers()
    status.classList.add('error')
    status.textContent = `${err.message} – bitte später erneut versuchen.`
  }
}

// Nur Stopps mit Text und Koordinaten dürfen in die Routenberechnung.
function resolvedStops() {
  return state.route.stops.filter((s) => s.label.trim() && s.lat != null && s.lng != null)
}

// Stopp von Position `from` an die Einfügeposition `insertAt` (vor Entfernen gezählt) schieben.
function moveStop(from, insertAt) {
  const stops = state.route.stops
  if (!Number.isInteger(from) || from < 0 || from >= stops.length) return false
  let target = insertAt > from ? insertAt - 1 : insertAt
  target = Math.max(0, Math.min(stops.length - 1, target))
  if (target === from) return false
  const [item] = stops.splice(from, 1)
  stops.splice(target, 0, item)
  renderStops()
  return true
}

// Die Liste zeigt Start, Zwischenstopps und Ziel als gleichartige Zeilen.
function renderStops() {
  const host = $('#rp-stops')
  if (!host) return

  const park = PARKS.find((p) => p.id === state.activeId)
  const startText = state.route.startText || state.route.fromLabel || ''

  const startRow = `
    <div class="stop-row is-start">
      <span class="stop-num start">S</span>
      <label class="field">
        <input id="rp-input" class="stop-input start-input" type="text"
          placeholder="${t('startadresse')}" autocomplete="off"
          value="${escapeHtml(startText)}" />
      </label>
      <button class="icon-btn" type="button" data-geo aria-label="${t('meinStandort')}" title="${t('meinStandort')}">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3.4M12 18.1v3.4M2.5 12h3.4M18.1 12h3.4"/></svg>
      </button>
      <button class="icon-btn" type="button" data-pick aria-pressed="${state.route.pickMode}"
        aria-label="${t('startAufKarte')}" title="${t('startAufKarte')}">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z"/><circle cx="12" cy="10" r="2.4"/></svg>
      </button>
    </div>`

  const stopRows = state.route.stops
    .map(
      (stop, i) => `
      <div class="stop-row" data-stop="${i}">
        <span class="drag-handle" draggable="true" title="${t('amGriffZiehen')}">
          <svg viewBox="0 0 10 16" width="10" height="16" fill="currentColor"><circle cx="3" cy="3" r="1.3"/><circle cx="7" cy="3" r="1.3"/><circle cx="3" cy="8" r="1.3"/><circle cx="7" cy="8" r="1.3"/><circle cx="3" cy="13" r="1.3"/><circle cx="7" cy="13" r="1.3"/></svg>
        </span>
        <span class="stop-num">${i + 1}</span>
        <label class="field">
          <input class="stop-input" type="text" placeholder="${t('zwischenStoppOrt')}" value="${escapeHtml(stop.label)}" autocomplete="off" />
        </label>
        <label class="stay" title="${t('aufenthaltTagen')}">
          <input class="stop-days" type="number" min="0" step="0.5" value="${Number(stop.days) || 0}" aria-label="${t('aufenthaltTagen')}" />
          <span>${t('tage')}</span>
        </label>
        <button class="icon-btn" type="button" data-remove="${i}" aria-label="${t('zwischenstoppEntfernen')}">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
        </button>
      </div>`,
    )
    .join('')

  const endRow = park
    ? `<div class="stop-row is-end">
        <span class="stop-num end">E</span>
        <span class="stop-fixed">
          <span class="stop-fixed-name">${escapeHtml(park.name)}</span>
          <span class="stop-fixed-sub">${park.type === 'trailpark' ? t('trailpark') + ' · ' : ''}${escapeHtml(pt(park, 'region'))} · ${escapeHtml(cn(park.country))}</span>
        </span>
        <span class="stop-tag">Ziel</span>
      </div>`
    : ''

  host.innerHTML = startRow + stopRows + endRow
}

function wirePlanner(park) {
  const status = $('#rp-status')
  const stopsHost = $('#rp-stops')
  const startValue = () => $('#rp-input')?.value.trim() || ''

  if (state.route.from && !state.route.startText) {
    state.route.startText = state.route.fromLabel || ''
  }
  renderStops()

  const refreshRoute = () => {
    if (!state.route.from) return
    computeRoute(park, state.route.from, state.route.fromLabel || 'Start', resolvedStops())
  }

  const run = async () => {
    const q = startValue()
    if (!q) {
      status.classList.add('error')
      status.textContent = t('bitteStartort')
      return
    }

    state.route.startText = q
    const stops = state.route.stops.filter((stop) => stop.label.trim())
    status.classList.remove('error')
    status.textContent = t('statusSearching')

    try {
      const from = await geocode(q)

      // Zwischenstopps ohne Koordinaten nacheinander auflösen (Nominatim-Limit).
      for (const stop of stops) {
        if (stop.lat != null && stop.lng != null) continue
        status.textContent = t('statusSearchingStop', { name: stop.label })
        try {
          const hit = await geocode(stop.label)
          stop.lat = hit.lat
          stop.lng = hit.lng
        } catch {
          throw new Error(`Zwischenstopp „${stop.label}“ nicht gefunden`)
        }
        await sleep(600)
      }

      await computeRoute(park, from, from.label, stops)
    } catch (err) {
      status.classList.add('error')
      status.textContent = err.message
    }
  }

  const useGeo = () => {
    if (!navigator.geolocation) {
      status.classList.add('error')
      status.textContent = t('statusGeoSupport')
      return
    }
    status.classList.remove('error')
    status.textContent = 'Standort wird ermittelt …'
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const from = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        state.route.startText = 'Mein Standort'
        state.route.fromLabel = 'Dein aktueller Standort'
        renderStops()
        computeRoute(park, from, 'Dein aktueller Standort', resolvedStops())
      },
      () => {
        status.classList.add('error')
        status.textContent = t('statusGeoErr')
      },
      { enableHighAccuracy: true, timeout: 12000 },
    )
  }

  const togglePick = () => {
    state.route.pickMode = !state.route.pickMode
    $('#map').style.cursor = state.route.pickMode ? 'crosshair' : ''
    renderStops()
    status.classList.remove('error')
    status.textContent = state.route.pickMode ? t('statusPick') : t('statusPickEnd')
  }

  // Drag & Drop: nur die Zwischenstopps lassen sich umsortieren, Start und Ziel sind fix.
  let dragIndex = null

  const clearDragMarks = () => {
    stopsHost
      .querySelectorAll('.dragging, .drop-before, .drop-after')
      .forEach((el) => el.classList.remove('dragging', 'drop-before', 'drop-after'))
  }

  const dropRow = (e) =>
    e.target instanceof Element ? e.target.closest('.stop-row[data-stop]') : null

  const dropIndex = (e) => {
    const row = dropRow(e)
    if (!row) return null
    const rect = row.getBoundingClientRect()
    return Number(row.dataset.stop) + (e.clientY > rect.top + rect.height / 2 ? 1 : 0)
  }

  stopsHost.addEventListener('input', (e) => {
    const row = e.target.closest('.stop-row')
    if (!row) return

    if (row.classList.contains('is-start')) {
      state.route.startText = e.target.value
      return
    }

    const stop = state.route.stops[Number(row.dataset.stop)]
    if (!stop) return

    if (e.target.classList.contains('stop-days')) {
      stop.days = Math.max(0, Number(e.target.value) || 0)
    } else if (e.target.classList.contains('stop-input')) {
      if (e.target.value !== stop.label) {
        stop.label = e.target.value
        stop.lat = null
        stop.lng = null
      }
    }
  })

  stopsHost.addEventListener('click', (e) => {
    if (e.target.closest('[data-geo]')) {
      useGeo()
      return
    }
    if (e.target.closest('[data-pick]')) {
      togglePick()
      return
    }

    const btn = e.target.closest('[data-remove]')
    if (!btn) return
    state.route.stops.splice(Number(btn.dataset.remove), 1)
    cancelStopPick()
    renderStops()
    routeLayer.clearLayers()
    $('#rp-result').classList.remove('show')
    status.classList.remove('error')
    status.textContent = t('zwischenstoppEntfernt')
  })

  stopsHost.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      run()
    }
  })

  stopsHost.addEventListener('dragstart', (e) => {
    if (!(e.target instanceof Element) || !e.target.closest('.drag-handle')) return
    const row = e.target.closest('.stop-row[data-stop]')
    if (!row) return
    dragIndex = Number(row.dataset.stop)
    row.classList.add('dragging')
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', String(dragIndex))
    }
  })

  stopsHost.addEventListener('dragover', (e) => {
    if (dragIndex == null) return
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'

    const row = dropRow(e)
    stopsHost
      .querySelectorAll('.drop-before, .drop-after')
      .forEach((el) => el.classList.remove('drop-before', 'drop-after'))
    if (!row) return
    const rect = row.getBoundingClientRect()
    row.classList.add(e.clientY > rect.top + rect.height / 2 ? 'drop-after' : 'drop-before')
  })

  stopsHost.addEventListener('drop', (e) => {
    if (dragIndex == null) return
    e.preventDefault()
    const insertAt = dropIndex(e)
    const from = dragIndex
    dragIndex = null
    clearDragMarks()
    if (insertAt == null) return
    if (moveStop(from, insertAt)) {
      refreshRoute()
      status.classList.remove('error')
      status.textContent = t('reihenfolgeAngepasst')
    }
  })

  stopsHost.addEventListener('dragend', () => {
    dragIndex = null
    clearDragMarks()
  })

  $('#rp-add-stop').addEventListener('click', () => {
    state.route.stops.push({ label: '', days: 1, lat: null, lng: null })
    renderStops()
    armStopPick(state.route.stops.length - 1)
    const fields = stopsHost.querySelectorAll('.stop-row[data-stop] .stop-input')
    fields[fields.length - 1]?.focus()
  })

  $('#rp-go').addEventListener('click', run)

  $('#rp-reset').addEventListener('click', () => {
    routeLayer.clearLayers()
    cancelStopPick()
    state.route.from = null
    state.route.fromLabel = null
    state.route.startText = ''
    state.route.stops = []
    renderStops()
    $('#rp-result').classList.remove('show')
    status.classList.remove('error')
    status.textContent = t('zurueckgesetzt')
  })

  if (state.route.from) {
    computeRoute(park, state.route.from, state.route.fromLabel || 'Gespeicherter Start', resolvedStops())
  }
}

/* ------------------------------------------------------------- chrome UI */

$('#list-btn').addEventListener('click', () => {
  if (state.view === 'list' && document.body.classList.contains('sidebar-open')) closeSidebar()
  else openList()
})

$('#brand').addEventListener('click', (e) => {
  e.preventDefault()
  closeSidebar()
  fitAll(true)
})

$('#scrim').addEventListener('click', closeSidebar)

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (document.body.classList.contains('modal-open')) {
      closePrivacy()
    } else if (state.route.stopPick != null) {
      cancelStopPick()
      const status = $('#rp-status')
      if (status) status.textContent = t('auswahlAbgebrochen')
    } else {
      closeSidebar()
    }
  }
  const tag = document.activeElement?.tagName
  if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
    e.preventDefault()
    $('#search').focus()
  }
})

window.addEventListener('resize', () => map?.invalidateSize())

/* ------------------------------------------------------------- Spracheinwahl */

function renderLangSwitch() {
  const host = $('#lang-switch')
  if (!host) return
  const langs = [
    { code: 'de', label: 'Deutsch' },
    { code: 'en', label: 'English' },
    { code: 'it', label: 'Italiano' },
  ]
  host.innerHTML = langs
    .map(
      (l) =>
        `<button type="button" data-lang="${l.code}" aria-pressed="${currentLang === l.code}" aria-label="${l.label}">${l.code.toUpperCase()}</button>`,
    )
    .join('')
}

function applyLang() {
  renderLangSwitch()
  // Alle data-i18n-Elemente im DOM aktualisieren (Text)
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n')
    el.textContent = t(key)
  })
  // Alle data-i18n-html-Elemente im DOM aktualisieren (innerHTML)
  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const key = el.getAttribute('data-i18n-html')
    el.innerHTML = t(key)
  })
  // Placeholder aktualisieren
  const search = $('#search')
  if (search) search.placeholder = t('searchPlaceholder')
  // Consent-Titel und -Text (sind über data-i18n / data-i18n-html abgedeckt, aber sicherheitshalber)
  // Wenn Sidebar offen, neu rendern
  if (state.activeId) {
    const park = PARKS.find((p) => p.id === state.activeId)
    if (park) renderPark(park)
  } else if (state.view === 'list') {
    renderList()
  }
}

$('#lang-switch').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-lang]')
  if (!btn) return
  setLang(btn.dataset.lang)
  applyLang()
})

/* ------------------------------------------------------------- chrome UI (weitere) */

window.addEventListener('langchange', () => applyLang())

/* ------------------------------------------------------------------ init */

loadLang()
applyLang()
applyFilters()

/* --------------------------------------------- Einwilligung + Datenschutz */

const CONSENT_KEY = 'bikepark-atlas:map-consent'
const consentOverlay = $('#map-consent')
const privacyModal = $('#privacy-modal')

function hasMapConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY) === 'granted'
  } catch {
    return false
  }
}

function grantMapConsent() {
  try {
    localStorage.setItem(CONSENT_KEY, 'granted')
  } catch {
    // Privater Modus o. Ä.: die Zustimmung gilt dann nur für diesen Aufruf.
  }
  consentOverlay.hidden = true
  initMap()
}

function revokeMapConsent() {
  try {
    localStorage.removeItem(CONSENT_KEY)
  } catch {
    // dann gibt es nichts zu löschen
  }
  // Neu laden, damit Karte und geladene Kacheln wirklich verschwinden.
  window.location.reload()
}

function openPrivacy() {
  privacyModal.hidden = false
  document.body.classList.add('modal-open')
  $('#privacy-close').focus()
}

function closePrivacy() {
  if (privacyModal.hidden) return
  privacyModal.hidden = true
  document.body.classList.remove('modal-open')
  $('#privacy-link').focus()
}

$('#consent-accept').addEventListener('click', grantMapConsent)
$('#consent-revoke').addEventListener('click', revokeMapConsent)
$('#privacy-link').addEventListener('click', openPrivacy)
$('#privacy-close').addEventListener('click', closePrivacy)
privacyModal.addEventListener('click', (e) => {
  if (e.target.closest('[data-close-privacy]')) closePrivacy()
})

if (hasMapConsent()) {
  consentOverlay.hidden = true
  initMap()
}

/* --------------------------------------------------- Position auf der Karte */

// Der Editor blendet sich aus und wartet auf einen Klick auf die Karte.
// Liefert { lat, lng } oder null, wenn abgebrochen wurde.
function pickLocation() {
  if (!map) return Promise.reject(new Error('Die Karte ist noch nicht geladen.'))

  return new Promise((resolve) => {
    const hint = document.createElement('div')
    hint.className = 'pick-hint'
    hint.innerHTML =
      '<span>Klicke auf die Karte, um die Position zu setzen</span>' +
      '<button class="btn btn-ghost" type="button">Abbrechen</button>'
    document.body.appendChild(hint)

    const mapEl = $('#map')
    const previousCursor = mapEl.style.cursor
    mapEl.style.cursor = 'crosshair'
    document.body.classList.add('picking-location')

    const finish = (value) => {
      map.off('click', onClick)
      document.removeEventListener('keydown', onKey, true)
      hint.remove()
      document.body.classList.remove('picking-location')
      mapEl.style.cursor = previousCursor
      resolve(value)
    }

    function onClick(event) {
      finish({ lat: event.latlng.lat, lng: event.latlng.lng })
    }

    function onKey(event) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      finish(null)
    }

    hint.querySelector('button').addEventListener('click', () => finish(null))
    map.on('click', onClick)
    document.addEventListener('keydown', onKey, true)
  })
}

/* ------------------------------------------------- geheimer Park-Editor */

// Strg+M öffnet den Editor – bewusst ohne sichtbaren Link.
initEditor({
  getParks: () => PARKS,
  onAdd: addPark,
  onRemove: removePark,
  openPark,
  getMapCenter: () => (map ? map.getCenter() : null),
  pickLocation,
})

// Debug-Helfer (unschädlich, nur für die Entwicklungskonsole)
window.__atlas = {
  get map() {
    return map
  },
  clusterGroup,
  markers,
  state,
  openPark,
  syncMarkers,
  setLang,
  t,
}

// Zusätzliche Übersetzungs-Keys, die im Code inline benötigt werden
const INLINE = {
  täglich: t('täglich'),
  tageProWoche: t('tageProWoche'),
  geschlossen: t('geschlossen'),
  dieEinzigeLine: t('dieEinzigeLine'),
  dieEineRunde: t('dieEineRunde'),
  zwischenStopp: t('zwischenStopp'),
  keinPark: t('keinPark'),
  andererSuchbegriff: t('andererSuchbegriff'),
  startadresse: t('startadresse'),
  meinStandort: t('meinStandort'),
  startAufKarte: t('startAufKarte'),
  amGriffZiehen: t('amGriffZiehen'),
  zwischenStoppOrt: t('zwischenStoppOrt'),
  aufenthaltTagen: t('aufenthaltTagen'),
  tage: t('tage'),
  zwischenstoppEntfernen: t('zwischenstoppEntfernen'),
  bitteStartort: t('bitteStartort'),
  zwischenstoppEntfernt: t('zwischenstoppEntfernt'),
  reihenfolgeAngepasst: t('reihenfolgeAngepasst'),
  zurueckgesetzt: t('zurueckgesetzt'),
  auswahlAbgebrochen: t('auswahlAbgebrochen'),
  trailpark: t('trailpark'),
  trailparkOhneLift: t('trailparkOhneLift'),
  ohneLift: t('ohneLift'),
}

// Die Inline-Vars werden bei Sprachwechsel neu gesetzt
window.__atlas.setLang = (lang) => {
  setLang(lang)
  applyLang()
}
