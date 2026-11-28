// Währungsumrechnung für den Bikepark Atlas
//
// Die Preise im Datensatz stehen in der Landeswährung (meist €, dazu CHF, CZK,
// ISK, NOK, PLN, RON und SEK). Für die Anzeige wird alles auf die vom Nutzer
// gewählte Währung umgerechnet. Die Kurse sind fest hinterlegt und werden nicht
// live abgerufen – so fragt die Seite keinen weiteren Dienst an.

export const CURRENCY_KEY = 'bikepark-atlas:currency'
export const DEFAULT_CURRENCY = 'EUR'

export const CURRENCIES = ['EUR', 'CHF', 'CZK', 'GBP', 'ISK', 'NOK', 'PLN', 'RON', 'SEK', 'USD']

// Einheiten je 1 Euro, gerundete Mittelwerte (Stand November 2026).
const RATES = {
  EUR: 1,
  CHF: 0.94,
  CZK: 24.4,
  GBP: 0.84,
  ISK: 144,
  NOK: 11.7,
  PLN: 4.26,
  RON: 5.05,
  SEK: 11.1,
  USD: 1.09,
}

const SYMBOLS = {
  EUR: '€',
  CHF: 'CHF',
  CZK: 'Kč',
  GBP: '£',
  ISK: 'kr',
  NOK: 'kr',
  PLN: 'zł',
  RON: 'lei',
  SEK: 'kr',
  USD: '$',
}

const LOCALES = { de: 'de-DE', en: 'en-GB', it: 'it-IT' }

// Der Datensatz nutzt für Euro das Zeichen statt des ISO-Codes.
export function currencyCode(value) {
  if (!value) return null
  const raw = String(value).trim()
  if (raw === '€') return 'EUR'
  const code = raw.toUpperCase()
  return RATES[code] ? code : null
}

export function convertPrice(amount, from, to) {
  const source = currencyCode(from)
  const target = currencyCode(to)
  if (!Number.isFinite(amount) || !source || !target) return null
  return (amount / RATES[source]) * RATES[target]
}

// Preis in der gewählten Währung – ohne Umrechnung, wenn die Quelle schon passt.
export function formatPrice(amount, from, to, lang = 'de') {
  if (!Number.isFinite(amount)) return '–'
  const target = currencyCode(to) || DEFAULT_CURRENCY
  const value = convertPrice(amount, from, target) ?? amount
  const digits = value >= 100 || Math.abs(value - Math.round(value)) < 0.005 ? 0 : 2
  const text = new Intl.NumberFormat(LOCALES[lang] || LOCALES.de, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value)
  return `${text} ${SYMBOLS[target] || target}`
}

export function loadCurrency() {
  try {
    const saved = localStorage.getItem(CURRENCY_KEY)
    if (saved && CURRENCIES.includes(saved)) return saved
  } catch {
    // privater Modus o. Ä.
  }
  return DEFAULT_CURRENCY
}

export function saveCurrency(code) {
  if (!CURRENCIES.includes(code)) return
  try {
    localStorage.setItem(CURRENCY_KEY, code)
  } catch {
    // dann gilt die Auswahl nur für diesen Aufruf
  }
}
