import 'leaflet/dist/leaflet.css'
import './style.css'

import L from 'leaflet'
import 'leaflet.markercluster'
import { PARKS } from './parks.js'

/* ------------------------------------------------------------------ data */

const DAY_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const DAY_LONG = [
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
  'Sonntag',
]

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

const CROWD_LABEL = {
  1: 'sehr ruhig',
  2: 'ruhig',
  3: 'mittel',
  4: 'voll',
  5: 'sehr voll',
}

// Länderchips kommen aus dem Datensatz – sortiert nach Anzahl der Parks.
const COUNTRIES = [
  'Alle',
  ...Array.from(new Set(PARKS.map((park) => park.country))).sort((a, b) => {
    const count = (name) => PARKS.filter((park) => park.country === name).length
    return count(b) - count(a) || a.localeCompare(b, 'de')
  }),
]

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
  if (h === 0) return `${m} Min.`
  return m === 0 ? `${h} Std.` : `${h} Std. ${m} Min.`
}

// Aufenthalte werden in Tagen angegeben (0,5 = halber Tag).
function fmtDays(days) {
  if (!days) return '0 Std.'
  const whole = Math.floor(days)
  const rest = Math.round((days - whole) * 24)
  if (whole === 0) return `${Math.round(days * 24)} Std.`
  const label = whole === 1 ? '1 Tag' : `${whole} Tage`
  return rest ? `${label} ${rest} Std.` : label
}

// Gesamtzeit in Stunden als Tage/Stunden ausgeben.
function fmtSpan(hours) {
  const days = Math.floor(hours / 24)
  const rest = Math.round(hours % 24)
  if (!days) return rest === 1 ? '1 Std.' : `${rest} Std.`
  const label = days === 1 ? '1 Tag' : `${days} Tage`
  return rest ? `${label} ${rest} Std.` : label
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
    return { open: false, text: `Saison startet am ${fmtDate(park.seasonFrom)}` }
  }
  if (park.seasonTo && iso > park.seasonTo) {
    return { open: false, text: `Saison endete am ${fmtDate(park.seasonTo)}` }
  }
  return { open: true, text: null }
}

function todayStatus(park) {
  const idx = todayIndex()
  const season = seasonStatus(park)
  if (!season.open) return season
  if (!park.openDays.includes(idx)) {
    return { open: false, text: `Heute (${DAY_LONG[idx]}) Ruhetag` }
  }
  return { open: true, text: `Heute geöffnet · ${park.hoursFrom}–${park.hoursTo} Uhr` }
}

function matches(park) {
  if (state.country !== 'Alle' && park.country !== state.country) return false
  if (!state.query) return true
  const hay = `${park.name} ${park.region} ${park.country} ${park.code}`.toLowerCase()
  return hay.includes(state.query)
}

/* ------------------------------------------------------------------ state */

const state = {
  query: '',
  country: 'Alle',
  activeId: null,
  view: 'park', // 'park' | 'list'
  // stops: Zwischenstopps zwischen Start und Park, days = Aufenthalt in Tagen
  // stopPick: Index des Stopps, der per Kartenklick auf einen Park gefüllt wird
  // startText: was im Startfeld steht (bleibt beim Neu-Rendern der Liste erhalten)
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

const map = L.map('map', {
  zoomControl: false,
  minZoom: 4,
  maxZoom: 16,
  scrollWheelZoom: true,
}).setView([50.4, 9.6], 5.5)

L.control.zoom({ position: 'bottomright' }).addTo(map)

// Esri Dark Gray Canvas – kein API-Key nötig
L.tileLayer(
  'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
  {
    attribution:
      'Kartengrundlage: &copy; Esri, HERE, Garmin, FAO, NOAA, USGS, <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende',
    maxZoom: 16,
  },
).addTo(map)

L.tileLayer(
  'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
  { maxZoom: 16, opacity: 0.9 },
).addTo(map)

const markers = new Map()
const routeLayer = L.layerGroup().addTo(map)

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
map.addLayer(clusterGroup)

function markerHtml(park) {
  const color = COUNTRY_COLOR[park.country] || '#a3e635'
  return `<span class="pin" style="--pin:${color}">${escapeHtml(park.code)}</span>`
}

PARKS.forEach((park) => {
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
})

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

// Nach Zoom/Clustering sind die Pin-DOMs neu – Zustände neu vergeben.
map.on('zoomend', () => syncMarkers())
clusterGroup.on('animationend', () => syncMarkers())

/* -------------------------------------------------------------- filtering */

function applyFilters() {
  syncMarkers()
  $('#result-count').textContent = String(PARKS.filter(matches).length)
  if (state.view === 'list') renderList()
  renderChips()
}

function renderChips() {
  const host = $('#chips')
  host.innerHTML = COUNTRIES.map((c) => {
    const count = c === 'Alle' ? PARKS.length : PARKS.filter((p) => p.country === c).length
    const dot =
      c === 'Alle' ? '' : `<span class="dot" style="background:${COUNTRY_COLOR[c]}"></span>`
    return `<button class="chip" type="button" role="tab" data-country="${c}" aria-selected="${
      state.country === c
    }">${dot}${c}<span class="count">${count}</span></button>`
  }).join('')
}

$('#chips').addEventListener('click', (e) => {
  const btn = e.target.closest('.chip')
  if (!btn) return
  state.country = btn.dataset.country
  applyFilters()
})

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
  map.fitBounds(allBounds(), {
    paddingTopLeft: [46, 96],
    paddingBottomRight: [46, 74],
    animate,
  })
}

function adjustForSidebar(park) {
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
  if (!marker || map.hasLayer(marker)) return done()

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
            <div class="crowd-bar-track" title="${DAY_LONG[i]}: Ruhetag"></div>
            <div class="crowd-day">${DAY_SHORT[i]}</div>
          </div>`
      }
      const h = 18 + level * 16
      return `<div class="crowd-col${i === today ? ' today' : ''}">
          <div class="crowd-bar-track" title="${DAY_LONG[i]}: ${CROWD_LABEL[level]}">
            <div class="crowd-bar" style="height:${h}%;background:${CROWD_COLOR[level]}"></div>
          </div>
          <div class="crowd-day">${DAY_SHORT[i]}</div>
        </div>`
    })
    .join('')

  const season =
    park.seasonFrom && park.seasonTo
      ? `${fmtDate(park.seasonFrom)} – ${fmtDate(park.seasonTo)}`
      : 'keine feste Angabe'

  const linesValue = park.lines == null ? '–' : String(park.lines)
  const daysNote = park.openDays.length === 7 ? 'täglich' : `${park.openDays.length} Tage / Woche`

  $('#sidebar-content').innerHTML = `
    <div class="sb-top">
      <span class="code-badge">
        <span class="dot" style="background:${COUNTRY_COLOR[park.country]}"></span>
        ${escapeHtml(park.code)} · ${escapeHtml(park.country)}
      </span>
      <button class="icon-btn" type="button" id="close-btn" aria-label="Sidebar schließen">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
      </button>
    </div>

    <h1 class="sb-title">${escapeHtml(park.name)}</h1>
    <p class="sb-region">${park.type === 'trailpark' ? 'Trailpark ohne Lift · ' : ''}${escapeHtml(park.region)} · ${escapeHtml(park.country)}</p>
    <p class="sb-lede">${escapeHtml(park.lede)}</p>

    <div class="status ${status.open ? 'open' : 'closed'}">
      <span class="dot"></span>${escapeHtml(status.text || 'Geschlossen')}
    </div>

    <div class="facts">
      <div class="fact">
        <div class="fact-label">Tageskarte</div>
        <div class="fact-value">${fmtPrice(park.price)}</div>
        <div class="fact-sub">${escapeHtml(park.price?.note || '')}</div>
      </div>
      <div class="fact">
        <div class="fact-label">Lines</div>
        <div class="fact-value">${linesValue}</div>
        <div class="fact-sub">${escapeHtml(park.linesNote || '')}</div>
      </div>
      <div class="fact">
        <div class="fact-label">Offen</div>
        <div class="fact-value">${escapeHtml(park.days)}</div>
        <div class="fact-sub">${daysNote}</div>
      </div>
    </div>

    <section class="section">
      <div class="section-head">
        <h2 class="section-title">Öffnungszeiten</h2>
        <span class="section-note">Saison ${escapeHtml(season)}</span>
      </div>
      <dl class="kv-list" style="margin:0">
        <div class="kv"><dt>Öffnungstage</dt><dd>${escapeHtml(park.days)}</dd></div>
        <div class="kv"><dt>Uhrzeit</dt><dd>${escapeHtml(park.hours)}${park.hoursNote ? ` <span style="color:var(--muted);font-weight:400">(${escapeHtml(park.hoursNote)})</span>` : ''}</dd></div>
        <div class="kv"><dt>Saison</dt><dd>${escapeHtml(season)}</dd></div>
      </dl>
    </section>

    <section class="section">
      <div class="section-head">
        <h2 class="section-title">Wie viel los ist</h2>
        <span class="section-note">Durchschnitt, Mo – So</span>
      </div>
      <div class="crowd">${crowdCols}</div>
      <div class="crowd-legend">
        ${[1, 2, 3, 4, 5].map((n) => `<span><i style="background:${CROWD_COLOR[n]}"></i>${CROWD_LABEL[n]}</span>`).join('')}
        <span><i style="background:#2a323c"></i>Ruhetag</span>
      </div>
      ${park.crowdNote ? `<p class="crowd-note">${escapeHtml(park.crowdNote)}</p>` : ''}
    </section>

    <section class="section">
      <div class="section-head">
        <h2 class="section-title">Routenplaner</h2>
        <span class="section-note">Autofahrt mit Stopps</span>
      </div>
              <div class="planner">
          <div class="stops" id="rp-stops"></div>
          <div class="planner-actions">
            <button class="btn" type="button" id="rp-add-stop">+ Zwischenstopp</button>
            <button class="btn btn-primary" type="button" id="rp-go">Route</button>
          </div>


        <div class="planner-status" id="rp-status">Gib einen Startpunkt ein oder lasse dich zu ${escapeHtml(park.name)} leiten.</div>
        <div class="route-result" id="rp-result">
          <div class="route-metrics">
            <div class="route-metric"><div class="big" id="rp-dist">–</div><div class="small">Entfernung</div></div>
            <div class="route-metric"><div class="big" id="rp-time">–</div><div class="small">Fahrzeit</div></div>
            <div class="route-metric"><div class="big" id="rp-all">–</div><div class="small">Gesamt</div></div>
          </div>
          <p class="route-total" id="rp-stay"></p>
          <p class="route-from" id="rp-from"></p>
          <div class="planner-actions">
            <a class="btn" id="rp-maps" href="#" target="_blank" rel="noopener">In Google Maps öffnen</a>
            <button class="btn" type="button" id="rp-reset">Zurücksetzen</button>
          </div>
        </div>
      </div>
    </section>

    <div class="actions">
      <a class="btn btn-primary btn-block" href="${escapeHtml(park.website)}" target="_blank" rel="noopener">
        Website von ${escapeHtml(park.name)} öffnen
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg>
      </a>
      <button class="btn btn-block" type="button" id="all-btn">Alle Parks anzeigen</button>
    </div>

    <p class="footnote">
      Daten ohne Gewähr, Stand November 2026 – Öffnungszeiten und Preise können kurzfristig
      abweichen, bitte auf der Website des Parks prüfen. Auslastung ist eine Schätzung für
      typische Tage, kein Live-Wert.
    </p>
  `

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
                <span class="nm">${escapeHtml(p.name)}</span>
                <span class="rg">${escapeHtml(p.region)} · ${escapeHtml(p.country)}</span>
              </span>
              <span class="meta"><b>${escapeHtml(price)}</b>${
                p.lines == null ? 'keine Lines' : p.lines === 1 ? '1 Line' : `${p.lines} Lines`
              }</span>
            </button>
          </li>`
        })
        .join('')}</ul>`
    : `<div class="empty">Kein Park gefunden.<br />Versuche einen anderen Suchbegriff.</div>`

  $('#sidebar-content').innerHTML = `
    <div class="sb-top">
      <div class="list-head" style="margin:0">
        <h2>Alle Bikeparks</h2>
        <p>${list.length} von ${PARKS.length} Parks${
          state.country !== 'Alle' ? ` · ${escapeHtml(state.country)}` : ''
        }${state.query ? ` · „${escapeHtml(state.query)}“` : ''}</p>
      </div>
      <button class="icon-btn" type="button" id="close-btn" aria-label="Sidebar schließen">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
      </button>
    </div>
    <div style="margin-top:14px">${body}</div>
    <p class="footnote">Klicke einen Park, um Details, Öffnungszeiten und den Routenplaner zu sehen.</p>
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
    : 'Ohne Zwischenstopp – reine Fahrt zum Park.'
  $('#rp-from').textContent = `Start: ${fromLabel}`

  const waypoints = stops.map((stop) => `${stop.lat},${stop.lng}`).join('|')
  let mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${state.route.from.lat},${state.route.from.lng}&destination=${park.lat},${park.lng}&travelmode=driving`
  if (waypoints) mapsUrl += `&waypoints=${encodeURIComponent(waypoints)}`
  $('#rp-maps').href = mapsUrl

  $('#rp-status').classList.remove('error')
  $('#rp-status').textContent = 'Route berechnet.'
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
          placeholder="Startadresse oder Ort …" autocomplete="off"
          value="${escapeHtml(startText)}" />
      </label>
      <button class="icon-btn" type="button" data-geo aria-label="Meinen Standort verwenden"
        title="Meinen Standort verwenden">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3.4M12 18.1v3.4M2.5 12h3.4M18.1 12h3.4"/></svg>
      </button>
      <button class="icon-btn" type="button" data-pick aria-pressed="${state.route.pickMode}"
        aria-label="Start auf der Karte wählen" title="Start auf der Karte wählen">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z"/><circle cx="12" cy="10" r="2.4"/></svg>
      </button>
    </div>`

  const stopRows = state.route.stops
    .map(
      (stop, i) => `
      <div class="stop-row" data-stop="${i}" draggable="true">
        <span class="drag-handle" aria-hidden="true">
          <svg viewBox="0 0 10 16" width="10" height="16" fill="currentColor"><circle cx="3" cy="3" r="1.3"/><circle cx="7" cy="3" r="1.3"/><circle cx="3" cy="8" r="1.3"/><circle cx="7" cy="8" r="1.3"/><circle cx="3" cy="13" r="1.3"/><circle cx="7" cy="13" r="1.3"/></svg>
        </span>
        <span class="stop-num">${i + 1}</span>
        <label class="field">
          <input class="stop-input" type="text" placeholder="Zwischenstopp, Ort oder Adresse …"
            value="${escapeHtml(stop.label)}" autocomplete="off" />
        </label>
        <label class="stay" title="Aufenthalt in Tagen">
          <input class="stop-days" type="number" min="0" step="0.5" value="${Number(stop.days) || 0}"
            aria-label="Aufenthalt in Tagen" />
          <span>Tage</span>
        </label>
        <button class="icon-btn" type="button" data-remove="${i}" aria-label="Zwischenstopp entfernen">
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
          <span class="stop-fixed-sub">${park.type === 'trailpark' ? 'Trailpark · ' : ''}${escapeHtml(park.region)} · ${escapeHtml(park.country)}</span>
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
      status.textContent = 'Bitte einen Startort eingeben.'
      return
    }

    state.route.startText = q
    const stops = state.route.stops.filter((stop) => stop.label.trim())
    status.classList.remove('error')
    status.textContent = 'Suche Startort …'

    try {
      const from = await geocode(q)

      // Zwischenstopps ohne Koordinaten nacheinander auflösen (Nominatim-Limit).
      for (const stop of stops) {
        if (stop.lat != null && stop.lng != null) continue
        status.textContent = `Suche Zwischenstopp „${stop.label}“ …`
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
      status.textContent = 'Dein Browser unterstützt keine Standortabfrage.'
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
        status.textContent = 'Standort konnte nicht ermittelt werden.'
      },
      { enableHighAccuracy: true, timeout: 12000 },
    )
  }

  const togglePick = () => {
    state.route.pickMode = !state.route.pickMode
    $('#map').style.cursor = state.route.pickMode ? 'crosshair' : ''
    renderStops()
    status.classList.remove('error')
    status.textContent = state.route.pickMode
      ? 'Klicke jetzt einen Startpunkt auf der Karte.'
      : 'Klickmodus beendet.'
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
    status.textContent = 'Zwischenstopp entfernt.'
  })

  stopsHost.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      run()
    }
  })

  stopsHost.addEventListener('dragstart', (e) => {
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
      status.textContent = 'Reihenfolge angepasst – Zwischenstopp verschoben.'
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
    status.textContent = 'Zurückgesetzt – wähle einen neuen Startpunkt.'
  })

  if (state.route.from) {
    computeRoute(park, state.route.from, state.route.fromLabel || 'Gespeicherter Start', resolvedStops())
  }
}

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
    if (state.route.stopPick != null) {
      cancelStopPick()
      const status = $('#rp-status')
      if (status) status.textContent = 'Auswahl abgebrochen – Zwischenstopp bleibt leer.'
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

window.addEventListener('resize', () => map.invalidateSize())

/* ------------------------------------------------------------------ init */

renderChips()
applyFilters()
map.whenReady(() =>
  window.setTimeout(() => {
    map.invalidateSize()
    fitAll()
  }, 120),
)

// Debug-Helfer (unschädlich, nur für die Entwicklungskonsole)
window.__atlas = { map, clusterGroup, markers, state, openPark, syncMarkers }
