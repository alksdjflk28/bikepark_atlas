// Geheimer Editor für neue Bikeparks – erreichbar über Strg+M (bzw. Cmd+M).
//
// Die Seite ist statisch, es gibt keinen Server, der etwas speichern könnte.
// Deshalb zwei Wege:
//   1. Sofort sichtbar: neue Parks landen in localStorage und sind auf diesem
//      Gerät im Datensatz, bis sie in die Datei geschrieben sind.
//   2. Dauerhaft: „parks.json aktualisieren …“ schreibt die Parks direkt in die
//      gewählte Datei (dist/data/parks.json) – Chrome/Edge fragen einmal nach
//      der Datei und schreiben danach ohne Server. Ohne File-System-API gibt es
//      stattdessen einen Download.
//
// Bestehende Parks werden dabei nie überschrieben oder verändert, nur
// ergänzt bzw. lokal gelöschte wieder entfernt.

const STORAGE_KEY = 'bikepark-atlas:custom-parks'

const DAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const DAY_KEYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const DEFAULT_CROWD = [2, 2, 3, 3, 3, 4, 4]
const DEFAULT_HOURS = '09:00 – 17:00'

// Felder, die in der Seitenleiste angezeigt werden und übersetzt werden können.
const I18N_FIELDS = [
  ['name', 'Name'],
  ['region', 'Region'],
  ['lede', 'Kurzbeschreibung'],
  ['days', 'Öffnungstage'],
  ['hoursNote', 'Zeiten-Hinweis'],
  ['linesNote', 'Lines-Hinweis'],
  ['priceNote', 'Preis-Hinweis'],
  ['crowdNote', 'Auslastungs-Hinweis'],
]

const $ = (sel, root = document) => root.querySelector(sel)

const escapeHtml = (str) =>
  String(str).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  )

const todayIso = () => new Date().toISOString().slice(0, 10)

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

function uniqueId(name, taken) {
  const base = slugify(name) || 'park'
  if (!taken.has(base)) return base
  let i = 2
  while (taken.has(`${base}-${i}`)) i += 1
  return `${base}-${i}`
}

function parseHours(text) {
  const match = /(\d{1,2})[:.](\d{2})\D+(\d{1,2})[:.](\d{2})/.exec(String(text))
  const pad = (h, m) => `${String(Number(h)).padStart(2, '0')}:${m}`
  if (!match) return { from: '09:00', to: '17:00' }
  return { from: pad(match[1], match[2]), to: pad(match[3], match[4]) }
}

function daysLabel(openDays) {
  if (openDays.length === 7) return 'Täglich'
  if (!openDays.length) return ''
  const runs = []
  let start = openDays[0]
  let prev = openDays[0]
  for (const day of openDays.slice(1)) {
    if (day === prev + 1) {
      prev = day
      continue
    }
    runs.push([start, prev])
    start = day
    prev = day
  }
  runs.push([start, prev])
  return runs
    .map(([a, b]) => (a === b ? DAYS_SHORT[a] : `${DAYS_SHORT[a]} – ${DAYS_SHORT[b]}`))
    .join(', ')
}

function readStore() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return {
      parks: Array.isArray(raw.parks) ? raw.parks : [],
      removed: Array.isArray(raw.removed) ? raw.removed : [],
    }
  } catch {
    return { parks: [], removed: [] }
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // privater Modus: dann eben nicht
  }
}

function merge(baseParks, store) {
  const removed = new Set(store.removed)
  const result = baseParks.filter((park) => !removed.has(park.id)).map((park) => ({ ...park }))
  const ids = new Set(result.map((park) => park.id))
  for (const park of store.parks) {
    if (ids.has(park.id)) continue
    result.push({ ...park })
    ids.add(park.id)
  }
  return result
}

function fileJSON(parks, previousMeta) {
  return (
    JSON.stringify(
      {
        meta: { ...(previousMeta || {}), updatedAt: todayIso(), total: parks.length },
        parks,
      },
      null,
      2,
    ) + '\n'
  )
}

/* ------------------------------------------------------------------ Editor */

export function initEditor({ getParks, onAdd, onRemove, openPark, getMapCenter, pickLocation }) {
  let modal = null
  let statusEl = null
  let formEl = null
  let listEl = null

  const store = readStore()

  // Schon lokal gespeicherte Parks direkt in die Karte übernehmen.
  for (const park of store.parks) onAdd(park)

  function setStatus(text, kind = 'info') {
    if (!statusEl) return
    statusEl.hidden = !text
    statusEl.textContent = text || ''
    statusEl.dataset.kind = kind
  }

  function renderLocalList() {
    if (!listEl) return
    const { parks } = readStore()
    if (!parks.length) {
      listEl.innerHTML =
        '<li class="editor-empty">Noch keine lokal gespeicherten Parks.</li>'
      return
    }
    listEl.innerHTML = parks
      .map(
        (park) => `<li>
          <span>${escapeHtml(park.name)} <em>${escapeHtml(park.id)}</em></span>
          <button class="editor-mini" type="button" data-remove="${escapeHtml(park.id)}" title="Entfernen">Entfernen</button>
        </li>`,
      )
      .join('')
  }

  function buildModal() {
    const dayChips = DAYS_SHORT.map(
      (label, index) => `<label class="editor-chip">
        <input type="checkbox" name="openDays" value="${index}" ${index < 7 ? 'checked' : ''} />
        <span>${label}</span>
      </label>`,
    ).join('')

    const i18nRows = I18N_FIELDS.map(
      ([key, label]) => `<div class="editor-i18n-row">
        <span>${label}</span>
        <input name="i18n_en_${key}" type="text" placeholder="English" />
        <input name="i18n_it_${key}" type="text" placeholder="Italiano" />
      </div>`,
    ).join('')

    modal = document.createElement('div')
    modal.className = 'modal editor-modal'
    modal.hidden = true
    modal.innerHTML = `
      <div class="modal-backdrop" data-editor-close></div>
      <div class="modal-card editor-card" role="dialog" aria-modal="true" aria-labelledby="editor-title">
        <div class="modal-head">
          <h2 id="editor-title">Park hinzufügen</h2>
          <button class="icon-btn" type="button" data-editor-close aria-label="Schließen">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
          </button>
        </div>
        <div class="modal-body editor-body">
          <form id="editor-form" class="editor-form" novalidate autocomplete="off">
            <div class="editor-grid">
              <label class="editor-field wide">
                <span>Name *</span>
                <input name="name" type="text" required placeholder="Bikepark Musterhausen" />
              </label>
              <label class="editor-field">
                <span>Kürzel</span>
                <input name="code" type="text" maxlength="3" placeholder="MUS" />
              </label>
              <label class="editor-field">
                <span>Land *</span>
                <input name="country" type="text" list="editor-countries" required placeholder="Deutschland" />
              </label>
              <label class="editor-field wide">
                <span>Region</span>
                <input name="region" type="text" placeholder="Sauerland, NRW" />
              </label>
              <label class="editor-field wide">
                <span>Kurzbeschreibung</span>
                <textarea name="lede" rows="2" placeholder="Ein Satz, was den Park ausmacht."></textarea>
              </label>
              <label class="editor-field">
                <span>Breitengrad *</span>
                <input name="lat" type="text" inputmode="decimal" placeholder="51.1852" />
              </label>
              <label class="editor-field">
                <span>Längengrad *</span>
                <input name="lng" type="text" inputmode="decimal" placeholder="8.5046" />
              </label>
              <div class="editor-field wide editor-inline">
                <button class="btn editor-mini" type="button" id="editor-pick-map">Position auf Karte wählen</button>
                <button class="btn editor-mini" type="button" id="editor-pick-center">Kartenmitte übernehmen</button>
                <span class="editor-hint">oder Koordinaten von openstreetmap.org kopieren</span>
              </div>
              <label class="editor-field wide">
                <span>Website</span>
                <input name="website" type="url" placeholder="https://…" />
              </label>
              <label class="editor-field">
                <span>Typ</span>
                <select name="type">
                  <option value="">Bikepark mit Lift</option>
                  <option value="trailpark">Trailpark ohne Lift</option>
                </select>
              </label>
              <label class="editor-field">
                <span>Tageskarte</span>
                <input name="priceAmount" type="text" inputmode="decimal" placeholder="46" />
              </label>
              <label class="editor-field">
                <span>Preis-Hinweis</span>
                <input name="priceNote" type="text" placeholder="Erwachsene, Tageskarte" />
              </label>
              <label class="editor-field">
                <span>Lines</span>
                <input name="lines" type="number" min="0" step="1" placeholder="12" />
              </label>
              <label class="editor-field">
                <span>Lines-Hinweis</span>
                <input name="linesNote" type="text" placeholder="12 Strecken" />
              </label>
              <label class="editor-field">
                <span>Öffnungszeiten</span>
                <input name="hours" type="text" placeholder="${DEFAULT_HOURS}" />
              </label>
              <label class="editor-field">
                <span>Zeiten-Hinweis</span>
                <input name="hoursNote" type="text" placeholder="Liftbetrieb" />
              </label>
              <div class="editor-field wide">
                <span>Öffnungstage</span>
                <div class="editor-days">${dayChips}</div>
              </div>
              <label class="editor-field">
                <span>Saison von</span>
                <input name="seasonFrom" type="date" />
              </label>
              <label class="editor-field">
                <span>Saison bis</span>
                <input name="seasonTo" type="date" />
              </label>
              <label class="editor-field wide">
                <span>Auslastungs-Hinweis</span>
                <input name="crowdNote" type="text" placeholder="Samstags am vollsten." />
              </label>
            </div>

            <details class="editor-i18n">
              <summary>Übersetzungen (optional)</summary>
              <p class="editor-hint">Leere Felder zeigen den deutschen Text.</p>
              <div class="editor-i18n-head"><span></span><span>EN</span><span>IT</span></div>
              ${i18nRows}
            </details>

            <datalist id="editor-countries">
              ${[
                'Deutschland',
                'Österreich',
                'Schweiz',
                'Italien',
                'Frankreich',
                'Tschechien',
                'Slowakei',
                'Slowenien',
                'Polen',
                'Spanien',
                'Andorra',
                'Kroatien',
                'Serbien',
                'Bulgarien',
                'Rumänien',
                'Island',
                'Großbritannien',
                'Irland',
                'Norwegen',
                'Schweden',
                'Finnland',
                'Lettland',
                'Estland',
              ]
                .map((name) => `<option value="${name}"></option>`)
                .join('')}
            </datalist>

            <div class="editor-status" hidden></div>

            <div class="editor-saved">
              <h3>Lokal gespeichert</h3>
              <p class="editor-hint">
                Diese Parks sind nur in diesem Browser sichtbar. „parks.json aktualisieren“ schreibt
                sie in die Datei – danach <code>dist/</code> hochladen.
              </p>
              <ul class="editor-local-list"></ul>
              <div class="editor-actions">
                <button class="btn" type="button" id="editor-write">parks.json aktualisieren …</button>
                <button class="btn" type="button" id="editor-download">parks.json herunterladen</button>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-foot">
          <button class="btn" type="button" data-editor-close>Schließen</button>
          <button class="btn btn-primary" type="submit" form="editor-form">Park speichern</button>
        </div>
      </div>
    `

    document.body.appendChild(modal)

    formEl = $('#editor-form', modal)
    statusEl = $('.editor-status', modal)
    listEl = $('.editor-local-list', modal)

    formEl.addEventListener('submit', handleSubmit)

    modal.addEventListener('click', (event) => {
      if (event.target.closest('[data-editor-close]')) close()
    })

    $('#editor-pick-map', modal).addEventListener('click', async () => {
      if (!pickLocation) {
        setStatus('Kartenauswahl ist nicht verfügbar.', 'error')
        return
      }
      // Editor ausblenden, damit die Karte klickbar ist – Werte bleiben erhalten.
      close()
      try {
        const point = await pickLocation()
        open()
        if (!point) {
          setStatus('Auswahl abgebrochen.', 'error')
          return
        }
        formEl.elements.lat.value = point.lat.toFixed(5)
        formEl.elements.lng.value = point.lng.toFixed(5)
        setStatus('Position übernommen.', 'ok')
      } catch (err) {
        open()
        setStatus(err.message, 'error')
      }
    })

    $('#editor-pick-center', modal).addEventListener('click', () => {
      const center = getMapCenter?.()
      if (!center) {
        setStatus('Die Karte ist noch nicht geladen – bitte zuerst zustimmen.', 'error')
        return
      }
      formEl.elements.lat.value = center.lat.toFixed(5)
      formEl.elements.lng.value = center.lng.toFixed(5)
      setStatus('Kartenmitte übernommen.', 'ok')
    })

    $('#editor-write', modal).addEventListener('click', writeFile)
    $('#editor-download', modal).addEventListener('click', downloadFile)

    listEl.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-remove]')
      if (!btn) return
      const id = btn.dataset.remove
      const next = readStore()
      const has = next.parks.some((park) => park.id === id)
      next.parks = next.parks.filter((park) => park.id !== id)
      if (!has) next.removed = [...new Set([...next.removed, id])]
      writeStore(next)
      onRemove(id)
      renderLocalList()
      setStatus(`„${id}“ entfernt.`, 'ok')
    })

    renderLocalList()
  }

  function handleSubmit(event) {
    event.preventDefault()
    try {
      const park = buildPark()
      const ok = onAdd(park)
      if (!ok) throw new Error('Diesen Park gibt es schon.')

      const next = readStore()
      next.parks = [...next.parks.filter((p) => p.id !== park.id), park]
      next.removed = next.removed.filter((id) => id !== park.id)
      writeStore(next)

      renderLocalList()
      formEl.reset()
      close()
      openPark?.(park)
    } catch (err) {
      setStatus(err.message, 'error')
    }
  }

  function buildPark() {
    const fd = new FormData(formEl)
    const val = (key) => String(fd.get(key) ?? '').trim()

    const name = val('name')
    if (!name) throw new Error('Der Name fehlt.')

    const country = val('country')
    if (!country) throw new Error('Das Land fehlt.')

    const lat = Number(val('lat').replace(',', '.'))
    const lng = Number(val('lng').replace(',', '.'))
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new Error('Koordinaten fehlen oder sind keine Zahlen.')
    }
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      throw new Error('Die Koordinaten sind nicht plausibel.')
    }

    const openDays = [...formEl.querySelectorAll('[name="openDays"]')]
      .filter((box) => box.checked)
      .map((box) => Number(box.value))
      .sort((a, b) => a - b)
    if (!openDays.length) throw new Error('Bitte mindestens einen Öffnungstag wählen.')

    const plates = getParks().map((park) => park.id)
    const taken = new Set(plates)
    const code = (val('code') || name.replace(/[^A-Za-zÄÖÜäöü]/g, '').slice(0, 3))
      .toUpperCase()
      .slice(0, 3)

    const priceAmount = val('priceAmount').replace(',', '.')
    const amount = priceAmount === '' ? null : Number(priceAmount)
    if (priceAmount !== '' && !Number.isFinite(amount)) throw new Error('Der Preis ist keine Zahl.')

    const linesRaw = val('lines')
    const lines = linesRaw === '' ? null : Number(linesRaw)

    const hours = val('hours') || DEFAULT_HOURS
    const clock = parseHours(hours)

    const crowd = DEFAULT_CROWD.map((level, index) => (openDays.includes(index) ? level : null))

    const i18n = {}
    for (const lang of ['en', 'it']) {
      const entry = {}
      for (const [key] of I18N_FIELDS) {
        const value = val(`i18n_${lang}_${key}`)
        if (value) entry[key] = value
      }
      if (Object.keys(entry).length) i18n[lang] = entry
    }

    return {
      id: uniqueId(name, taken),
      name,
      code: code || 'BIK',
      country,
      region: val('region'),
      lede: val('lede'),
      lat,
      lng,
      website: val('website'),
      ...(val('type') === 'trailpark' ? { type: 'trailpark' } : {}),
      price: amount == null && !val('priceNote') ? null : {
        amount,
        currency: '€',
        note: val('priceNote') || 'Erwachsene, Tageskarte',
      },
      lines,
      linesNote: val('linesNote') || (lines == null ? '' : `${lines} Strecken`),
      hours,
      hoursNote: val('hoursNote'),
      days: daysLabel(openDays),
      openDays,
      hoursFrom: clock.from,
      hoursTo: clock.to,
      seasonFrom: val('seasonFrom') || null,
      seasonTo: val('seasonTo') || null,
      crowd,
      crowdNote: val('crowdNote'),
      ...(Object.keys(i18n).length ? { i18n } : {}),
      custom: true,
    }
  }

  /* ------------------------------------------------------------- Dateien */

  async function writeFile() {
    const next = readStore()
    if (!window.showOpenFilePicker) {
      setStatus('Dieser Browser kann Dateien nicht direkt schreiben – nutze den Download.', 'error')
      return
    }
    try {
      const [handle] = await window.showOpenFilePicker({
        multiple: false,
        types: [{ description: 'Parkdaten', accept: { 'application/json': ['.json'] } }],
      })
      const file = await handle.getFile()
      const base = JSON.parse(await file.text())
      const merged = merge(Array.isArray(base.parks) ? base.parks : [], next)

      const writable = await handle.createWritable()
      await writable.write(fileJSON(merged, base.meta))
      await writable.close()

      setStatus(
        `${merged.length} Parks in ${file.name} geschrieben – jetzt dist/ hochladen.`,
        'ok',
      )
    } catch (err) {
      if (err?.name === 'AbortError') return
      setStatus(`Datei nicht geschrieben: ${err.message}`, 'error')
    }
  }

  function downloadFile() {
    const next = readStore()
    const merged = merge(getParks(), next)
    const blob = new Blob([fileJSON(merged, null)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'parks.json'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 4000)
    setStatus(
      `${merged.length} Parks als parks.json geladen – ersetzt dist/data/parks.json.`,
      'ok',
    )
  }

  /* -------------------------------------------------------------- Öffnen */

  function open() {
    if (!modal) buildModal()
    modal.hidden = false
    document.body.classList.add('modal-open')
    setStatus('')
    window.setTimeout(() => formEl?.elements.name?.focus(), 30)
  }

  function close() {
    if (!modal || modal.hidden) return
    modal.hidden = true
    document.body.classList.remove('modal-open')
  }

  const toggle = () => (modal && !modal.hidden ? close() : open())

  window.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey) {
      if (event.key.toLowerCase() === 'm') {
        event.preventDefault()
        toggle()
        return
      }
    }
    if (event.key === 'Escape' && modal && !modal.hidden) {
      event.preventDefault()
      close()
    }
  })

  return { open, close }
}
