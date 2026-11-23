// Übersetzungen für Bikepark Atlas
// Schlüssel werden in main.js über t('schlüssel', { vars }) aufgelöst.

export const TR = {
  de: {
    // ---------- Header ----------
    brand: 'Bikepark Atlas',
    searchPlaceholder: 'Park, Region oder Land suchen …',
    searchAria: 'Bikeparks durchsuchen',
    listBtn: 'Alle Parks',
    langLabel: 'Sprache',

    // ---------- Karten-Zustimmung ----------
    consentTitle: 'Karte laden?',
    consentText: 'Die Karte wird von <strong>OpenStreetMap</strong> mit Daten von <strong>OpenStreetMap</strong> geliefert. Beim Laden ruft dein Browser die Kartenkacheln von deren Servern ab – dabei wird deine <strong>IP-Adresse</strong> an diese Anbieter übertragen. Ohne deinen Klick passiert das nicht.',
    consentBtn: 'Karte laden &amp; zustimmen',
    consentNote: 'Die Zustimmung wird nur lokal in deinem Browser gespeichert. Widerrufen kannst du sie jederzeit über „Datenschutz / Privacy“ unten links.',

    // ---------- Hinweis ----------
    hint: 'Klicke eine Markierung, um Öffnungszeiten, Preise und den Routenplaner zu öffnen',

    // ---------- Sidebar ----------
    closeSidebar: 'Sidebar schließen',
    showAll: 'Alle Parks anzeigen',
    listTitle: 'Alle Bikeparks',
    listCount: '{count} von {total} Parks',
    listEmpty: 'Kein Park gefunden.<br />Versuche einen anderen Suchbegriff.',
    listFootnote: 'Klicke einen Park, um Details, Öffnungszeiten und den Routenplaner zu sehen.',

    factTicket: 'Tageskarte',
    factLines: 'Lines',
    factOpen: 'Offen',

    stayTitle: 'Empfehlung',
    staySubtitle: 'Zeit für den ganzen Park',

    hoursTitle: 'Öffnungszeiten',
    hoursSubtitle: 'Saison',
    hoursDays: 'Öffnungstage',
    hoursTime: 'Uhrzeit',
    hoursSeason: 'Saison',

    crowdTitle: 'Wie viel los ist',
    crowdSubtitle: 'Durchschnitt, Mo – So',
    crowdL1: 'sehr ruhig',
    crowdL2: 'ruhig',
    crowdL3: 'mittel',
    crowdL4: 'voll',
    crowdL5: 'sehr voll',
    crowdClosed: 'Ruhetag',

    plannerTitle: 'Routenplaner',
    plannerSubtitle: 'Autofahrt mit Stopps',
    addStop: '+ Zwischenstopp',
    goBtn: 'Route',
    statusEnterStart: 'Gib einen Startpunkt ein oder lasse dich zu {name} leiten.',
    statusSearching: 'Suche Startort …',
    statusSearchingStop: 'Suche Zwischenstopp „{name}“ …',
    statusRouteDone: 'Route berechnet.',
    statusEnterStartErr: 'Bitte einen Startort eingeben.',
    statusGeoSupport: 'Dein Browser unterstützt keine Standortabfrage.',
    statusGeoErr: 'Standort konnte nicht ermittelt werden.',
    statusPick: 'Klicke jetzt einen Startpunkt auf der Karte.',
    statusPickEnd: 'Klickmodus beendet.',
    statusReset: 'Zurückgesetzt – wähle einen neuen Startpunkt.',
    statusStopAdded: '„{name}“ als Zwischenstopp übernommen – Aufenthalt {days}.',
    statusStopRemoved: 'Zwischenstopp entfernt.',
    statusStopMoved: 'Reihenfolge angepasst – Zwischenstopp verschoben.',
    statusStopCancelled: 'Auswahl abgebrochen – Zwischenstopp bleibt leer.',

    dist: 'Entfernung',
    time: 'Fahrzeit',
    total: 'Gesamt',
    stay: 'Aufenthalt',
    withoutStop: 'Ohne Zwischenstopp – reine Fahrt zum Park.',
    openMaps: 'In Google Maps öffnen',
    resetBtn: 'Zurücksetzen',

    footnote: 'Daten ohne Gewähr, Stand {date} – Öffnungszeiten und Preise können kurzfristig abweichen, bitte auf der Website des Parks prüfen. Auslastung ist eine Schätzung für typische Tage, kein Live-Wert.',
    openWebsite: 'Website von {name} öffnen',

    // ---------- Wochentage ----------
    mon: 'Mo', tue: 'Di', wed: 'Mi', thu: 'Do', fri: 'Fr', sat: 'Sa', sun: 'So',
    monLong: 'Montag', tueLong: 'Dienstag', wedLong: 'Mittwoch', thuLong: 'Donnerstag', friLong: 'Freitag', satLong: 'Samstag', sunLong: 'Sonntag',

    // ---------- Status ----------
    todayOpen: 'Heute geöffnet · {from}–{to} Uhr',
    todayClosed: 'Heute ({day}) Ruhetag',
    seasonStarts: 'Saison startet am {date}',
    seasonEnded: 'Saison endete am {date}',
    seasonNone: 'keine feste Angabe',

    // ---------- Einheiten ----------
    minAbbr: 'Min.',
    hourAbbr: 'Std.',
    dayAbbr: 'Tag',
    daysAbbr: 'Tage',
    daySingular: '1 Tag',

    // ---------- Zusätzliche Inline-Keys ----------
    täglich: 'täglich',
    tageProWoche: 'Tage / Woche',
    geschlossen: 'Geschlossen',
    dieEinzigeLine: 'die einzige Line',
    dieEineRunde: 'die eine Runde',
    zwischenStopp: 'Zwischenstopp',
    keinPark: 'Kein Park gefunden.',
    andererSuchbegriff: 'Versuche einen anderen Suchbegriff.',
    startadresse: 'Startadresse oder Ort …',
    meinStandort: 'Meinen Standort verwenden',
    startAufKarte: 'Start auf der Karte wählen',
    amGriffZiehen: 'Am Griff ziehen, um den Stopp zu verschieben',
    zwischenStoppOrt: 'Zwischenstopp, Ort oder Adresse …',
    aufenthaltTagen: 'Aufenthalt in Tagen',
    tage: 'Tage',
    zwischenstoppEntfernen: 'Zwischenstopp entfernen',
    bitteStartort: 'Bitte einen Startort eingeben.',
    zwischenstoppEntfernt: 'Zwischenstopp entfernt.',
    reihenfolgeAngepasst: 'Reihenfolge angepasst – Zwischenstopp verschoben.',
    zurueckgesetzt: 'Zurückgesetzt – wähle einen neuen Startpunkt.',
    auswahlAbgebrochen: 'Auswahl abgebrochen – Zwischenstopp bleibt leer.',
    trailpark: 'Trailpark',
    trailparkOhneLift: 'Trailpark ohne Lift',
    ohneLift: ' ohne Lift',

    // ---------- Länder (für Anzeige) ----------
    countryDeutschland: 'Deutschland',
    countryOesterreich: 'Österreich',
    countrySchweiz: 'Schweiz',
    countryItalien: 'Italien',
    countryFrankreich: 'Frankreich',
    countryTschechien: 'Tschechien',
    countrySlowakei: 'Slowakei',
    countrySlowenien: 'Slowenien',
    countryPolen: 'Polen',
    countrySpanien: 'Spanien',
    countryAndorra: 'Andorra',
    countryGrossbritannien: 'Großbritannien',
    countryIrland: 'Irland',
    countryNorwegen: 'Norwegen',
    countrySchweden: 'Schweden',
    countryFinnland: 'Finnland',
    countryLettland: 'Lettland',
    countryEstland: 'Estland',
    countryKroatien: 'Kroatien',
    countrySerbien: 'Serbien',
    countryBulgarien: 'Bulgarien',
    countryRumaenien: 'Rumänien',
    countryIsland: 'Island',

    // ---------- Datenschutz ----------
    privacyLink: 'Datenschutz / Privacy',
    privacyTitle: 'Datenschutz / Privacy',
    privacyShort: 'Kurz gesagt',
    privacyShortText: 'Der Bikepark Atlas ist ein privates Hobbyprojekt ohne kommerzielle Absicht: keine Werbung, kein Tracking, keine Analyse-Tools, keine Nutzerkonten, kein Verkauf von Daten. Personenbezogene Daten fallen nur an, wenn du die Karte lädst (IP-Adresse an OpenStreetMap), wenn du den Routenplaner benutzt und wenn der Hosting-Anbieter technisch notwendige Server-Logs schreibt.',
    privacyResponsible: 'Verantwortlich für die Verarbeitung',
    privacyResponsibleText: 'Tim Dichristin<br />E-Mail: timdichristin@outlook.com<br />Italien',
    privacyMapTitle: 'Karte: OpenStreetMap',
    privacyMapText: 'Die Karte ist beim ersten Besuch standardmäßig aus. Erst wenn du auf „Karte laden &amp; zustimmen“ klickst, lädt dein Browser das dunkle Kartendesign von OpenStreetMap. Dabei wird deine IP-Adresse an diese Anbieter übertragen, außerdem technische Angaben wie Browser-Typ und Uhrzeit der Anfrage. Ohne deinen Klick entstehen keine Verbindungen zu OpenStreetMap.',
    privacyRouteTitle: 'Routenplaner und Adresssuche',
    privacyRouteText: 'Wenn du den Routenplaner benutzt, werden die von dir eingegebenen Adressen an den Geocoding-Dienst Nominatim und den Routing-Dienst OSRM übermittelt, die von der OpenStreetMap-Community bzw. dem FOSSGIS e. V. betrieben werden. Auch dabei wird deine IP-Adresse übertragen. Rechtsgrundlage ist unser berechtigtes Interesse an der Bereitstellung dieser Funktion (Art. 6 Abs. 1 lit. f DSGVO). Die Anfrage wird erst durch deine Eingabe ausgelöst.',
    privacyStorageTitle: 'Lokale Speicherung (localStorage)',
    privacyStorageText: 'Deine Karten-Zustimmung merken wir uns lokal in deinem Browser unter dem Schlüssel <code>bikepark-atlas:map-consent</code>. Das ist kein Cookie, und es werden dabei keine Daten an uns oder an Dritte gesendet. Gespeichert wird nur der Wert „granted“, damit du beim nächsten Besuch nicht erneut gefragt wirst – bis du die Zustimmung widerrufst oder die Websitedaten in deinem Browser löschst. Der Widerruf über den Button unten löscht den Eintrag und lädt die Seite neu; die Karte bleibt dann aus, bis du erneut zustimmst.',
    privacyLogsTitle: 'Server-Logfiles beim Hosting',
    privacyLogsText: 'Beim Aufruf der Seite verarbeitet der Hosting-Anbieter technisch notwendige Verbindungsdaten (IP-Adresse, Datum und Uhrzeit, aufgerufene Datei, Browsertyp), um die Seite auszuliefern und Angriffe abzuwehren. Rechtsgrundlage ist unser berechtigtes Interesse an einem sicheren Betrieb (Art. 6 Abs. 1 lit. f DSGVO). Diese Logs führen wir nicht mit anderen Daten zusammen und löschen sie nach kurzer Zeit.',
    privacyNoSharingTitle: 'Keine Weitergabe, kein Profiling',
    privacyNoSharingText: 'Es gibt keine Werbenetzwerke, keine Social-Media-Plugins, keine Reichweitenmessung und keine automatisierte Entscheidungsfindung. Deine Daten werden nicht verkauft und nicht zu Werbezwecken weitergegeben.',
    privacyRightsTitle: 'Deine Rechte',
    privacyRightsText: 'Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch (Art. 15–21 DSGVO) sowie das Recht, eine Einwilligung jederzeit zu widerrufen (Art. 7 Abs. 3 DSGVO). Eine kurze Nachricht an timdichristin@outlook.com genügt. Außerdem kannst du dich bei der italienischen Datenschutzaufsicht beschweren: Garante per la protezione dei dati personali, Piazza Venezia 11, 00187 Roma, <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer">garanteprivacy.it</a>.',
    privacyStandTitle: 'Stand',
    privacyStandText: 'November 2026. Dieser Text ist ein Muster für eine private, nicht kommerzielle Website und ersetzt keine Rechtsberatung.',
    privacyRevoke: 'Karten-Zustimmung widerrufen',
    privacyClose: 'Schließen',

    // ---------- Stay advice ----------
    stayTrail1: 'Ein Tag im Sattel reicht für {rounds}: ohne Lift zählt die eigene Kondition, plane den Anstieg mit ein.',
    stayTrail2: 'Zwei Tage für das ganze Netz – {rounds} ohne Lift schaffst du nur mit Übernachtung entspannt.',
    stay1: 'Ein voller Tag{lift} reicht, um {lines} mehrmals zu fahren – früh starten, dann bleiben Reserven für die Lieblingsabfahrt.',
    stay2: 'Zwei Tage sind realistisch: Tag eins für {lines}, Tag zwei für die Favoriten und die schnellen Runden.',
    stay3: 'Drei Tage, wenn du {lines} ohne Hetze fahren willst – mit Pausen, Reifenwechsel und Zeit für die besten Abfahrten.',
  },

  en: {
    // ---------- Header ----------
    brand: 'Bikepark Atlas',
    searchPlaceholder: 'Search park, region or country …',
    searchAria: 'Search bikeparks',
    listBtn: 'All parks',
    langLabel: 'Language',

    // ---------- Karten-Zustimmung ----------
    consentTitle: 'Load map?',
    consentText: 'The map is provided by <strong>OpenStreetMap</strong> with data from <strong>OpenStreetMap</strong>. When loading, your browser retrieves map tiles from their servers – your <strong>IP address</strong> is transmitted to these providers. Nothing happens without your click.',
    consentBtn: 'Load map &amp; agree',
    consentNote: 'Your consent is stored locally in your browser. You can revoke it anytime via “Datenschutz / Privacy” at the bottom left.',

    // ---------- Hinweis ----------
    hint: 'Click a marker to open opening hours, prices and the route planner',

    // ---------- Sidebar ----------
    closeSidebar: 'Close sidebar',
    showAll: 'Show all parks',
    listTitle: 'All bikeparks',
    listCount: '{count} of {total} parks',
    listEmpty: 'No park found.<br />Try a different search term.',
    listFootnote: 'Click a park to see details, opening hours and the route planner.',

    factTicket: 'Day ticket',
    factLines: 'Lines',
    factOpen: 'Open',

    stayTitle: 'Recommendation',
    staySubtitle: 'Time for the whole park',

    hoursTitle: 'Opening hours',
    hoursSubtitle: 'Season',
    hoursDays: 'Opening days',
    hoursTime: 'Time',
    hoursSeason: 'Season',

    crowdTitle: 'How busy is it?',
    crowdSubtitle: 'Average, Mo – Su',
    crowdL1: 'very quiet',
    crowdL2: 'quiet',
    crowdL3: 'moderate',
    crowdL4: 'busy',
    crowdL5: 'very busy',
    crowdClosed: 'Closed',

    plannerTitle: 'Route planner',
    plannerSubtitle: 'Drive with stops',
    addStop: '+ Intermediate stop',
    goBtn: 'Route',
    statusEnterStart: 'Enter a starting point or let yourself be guided to {name}.',
    statusSearching: 'Searching for start location …',
    statusSearchingStop: 'Searching for intermediate stop “{name}” …',
    statusRouteDone: 'Route calculated.',
    statusEnterStartErr: 'Please enter a start location.',
    statusGeoSupport: 'Your browser does not support geolocation.',
    statusGeoErr: 'Location could not be determined.',
    statusPick: 'Click a starting point on the map now.',
    statusPickEnd: 'Pick mode ended.',
    statusReset: 'Reset – choose a new starting point.',
    statusStopAdded: '“{name}” added as intermediate stop – stay {days}.',
    statusStopRemoved: 'Intermediate stop removed.',
    statusStopMoved: 'Order adjusted – intermediate stop moved.',
    statusStopCancelled: 'Selection cancelled – intermediate stop remains empty.',

    dist: 'Distance',
    time: 'Driving time',
    total: 'Total',
    stay: 'Stay',
    withoutStop: 'No intermediate stop – pure drive to the park.',
    openMaps: 'Open in Google Maps',
    resetBtn: 'Reset',

    footnote: 'Data without guarantee, status {date} – opening hours and prices may change at short notice, please check the park’s website. Occupancy is an estimate for typical days, no live value.',
    openWebsite: 'Open website of {name}',

    // ---------- Wochentage ----------
    mon: 'Mo', tue: 'Tu', wed: 'We', thu: 'Th', fri: 'Fr', sat: 'Sa', sun: 'Su',
    monLong: 'Monday', tueLong: 'Tuesday', wedLong: 'Wednesday', thuLong: 'Thursday', friLong: 'Friday', satLong: 'Saturday', sunLong: 'Sunday',

    // ---------- Status ----------
    todayOpen: 'Open today · {from}–{to}',
    todayClosed: 'Closed today ({day})',
    seasonStarts: 'Season starts on {date}',
    seasonEnded: 'Season ended on {date}',
    seasonNone: 'no fixed dates',

    // ---------- Einheiten ----------
    minAbbr: 'min.',
    hourAbbr: 'hrs.',
    dayAbbr: 'day',
    daysAbbr: 'days',
    daySingular: '1 day',

    // ---------- Zusätzliche Inline-Keys ----------
    täglich: 'daily',
    tageProWoche: 'days / week',
    geschlossen: 'Closed',
    dieEinzigeLine: 'the only line',
    dieEineRunde: 'the one round',
    zwischenStopp: 'Intermediate stop',
    keinPark: 'No park found.',
    andererSuchbegriff: 'Try a different search term.',
    startadresse: 'Start address or place …',
    meinStandort: 'Use my location',
    startAufKarte: 'Choose start on map',
    amGriffZiehen: 'Drag by the handle to move the stop',
    zwischenStoppOrt: 'Intermediate stop, place or address …',
    aufenthaltTagen: 'Stay in days',
    tage: 'days',
    zwischenstoppEntfernen: 'Remove intermediate stop',
    bitteStartort: 'Please enter a start location.',
    zwischenstoppEntfernt: 'Intermediate stop removed.',
    reihenfolgeAngepasst: 'Order adjusted – intermediate stop moved.',
    zurueckgesetzt: 'Reset – choose a new starting point.',
    auswahlAbgebrochen: 'Selection cancelled – intermediate stop remains empty.',
    trailpark: 'Trail park',
    trailparkOhneLift: 'Trail park without lift',
    ohneLift: ' without lift',

    // ---------- Länder ----------
    countryDeutschland: 'Germany',
    countryOesterreich: 'Austria',
    countrySchweiz: 'Switzerland',
    countryItalien: 'Italy',
    countryFrankreich: 'France',
    countryTschechien: 'Czech Republic',
    countrySlowakei: 'Slovakia',
    countrySlowenien: 'Slovenia',
    countryPolen: 'Poland',
    countrySpanien: 'Spain',
    countryAndorra: 'Andorra',
    countryGrossbritannien: 'United Kingdom',
    countryIrland: 'Ireland',
    countryNorwegen: 'Norway',
    countrySchweden: 'Sweden',
    countryFinnland: 'Finland',
    countryLettland: 'Latvia',
    countryEstland: 'Estonia',
    countryKroatien: 'Croatia',
    countrySerbien: 'Serbia',
    countryBulgarien: 'Bulgaria',
    countryRumaenien: 'Romania',
    countryIsland: 'Iceland',

    // ---------- Datenschutz ----------
    privacyLink: 'Privacy / Datenschutz',
    privacyTitle: 'Privacy / Datenschutz',
    privacyShort: 'In short',
    privacyShortText: 'The Bikepark Atlas is a private hobby project without commercial intent: no advertising, no tracking, no analytics, no user accounts, no sale of data. Personal data is only collected when you load the map (IP address to OpenStreetMap), when you use the route planner and when the hosting provider writes technically necessary server logs.',
    privacyResponsible: 'Controller',
    privacyResponsibleText: 'Tim Dichristin<br />E-Mail: timdichristin@outlook.com<br />Italy',
    privacyMapTitle: 'Map: OpenStreetMap',
    privacyMapText: 'The map is disabled by default on first visit. Only when you click “Load map &amp; agree” does your browser load the dark map design from OpenStreetMap. Your IP address is transmitted to these providers, plus technical details such as browser type and time of request. Without your click, no connections to OpenStreetMap are established.',
    privacyRouteTitle: 'Route planner and address search',
    privacyRouteText: 'When you use the route planner, the addresses you enter are transmitted to the geocoding service Nominatim and the routing service OSRM, operated by the OpenStreetMap community and FOSSGIS e. V. Your IP address is also transmitted. Legal basis is our legitimate interest in providing this function (Art. 6(1)(f) GDPR). The request is only triggered by your input.',
    privacyStorageTitle: 'Local storage (localStorage)',
    privacyStorageText: 'Your map consent is stored locally in your browser under the key <code>bikepark-atlas:map-consent</code>. This is not a cookie, and no data is sent to us or third parties while doing so. Only the value “granted” is saved so you are not asked again on your next visit – until you revoke consent or clear website data in your browser. Revoking via the button below deletes the entry and reloads the page; the map stays off until you consent again.',
    privacyLogsTitle: 'Server logfiles at hosting',
    privacyLogsText: 'When you access the page, the hosting provider processes technically necessary connection data (IP address, date and time, requested file, browser type) to serve the page and fend off attacks. Legal basis is our legitimate interest in secure operation (Art. 6(1)(f) GDPR). These logs are not combined with other data and are deleted after a short time.',
    privacyNoSharingTitle: 'No sharing, no profiling',
    privacyNoSharingText: 'There are no advertising networks, no social media plugins, no audience measurement and no automated decision-making. Your data is not sold and not passed on for advertising purposes.',
    privacyRightsTitle: 'Your rights',
    privacyRightsText: 'You have the right to access, rectification, erasure, restriction of processing, data portability and objection (Art. 15–21 GDPR) as well as the right to withdraw consent at any time (Art. 7(3) GDPR). A short message to timdichristin@outlook.com is sufficient. You can also complain to the Italian data protection authority: Garante per la protezione dei dati personali, Piazza Venezia 11, 00187 Roma, <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer">garanteprivacy.it</a>.',
    privacyStandTitle: 'Status',
    privacyStandText: 'November 2026. This text is a template for a private, non-commercial website and does not replace legal advice.',
    privacyRevoke: 'Revoke map consent',
    privacyClose: 'Close',

    // ---------- Stay advice ----------
    stayTrail1: 'One day in the saddle is enough for {rounds}: without a lift, your own fitness counts, plan the ascent accordingly.',
    stayTrail2: 'Two days for the whole network – {rounds} without a lift you only manage relaxed with overnight stay.',
    stay1: 'A full day{lift} is enough to ride {lines} several times – start early, then reserves remain for your favorite descent.',
    stay2: 'Two days are realistic: day one for {lines}, day two for favorites and the quick laps.',
    stay3: 'Three days if you want to ride {lines} without rushing – with breaks, tire changes and time for the best descents.',
  },

  it: {
    // ---------- Header ----------
    brand: 'Bikepark Atlas',
    searchPlaceholder: 'Cerca parco, regione o paese …',
    searchAria: 'Cerca bike park',
    listBtn: 'Tutti i parchi',
    langLabel: 'Lingua',

    // ---------- Karten-Zustimmung ----------
    consentTitle: 'Caricare la mappa?',
    consentText: 'La mappa è fornita da <strong>OpenStreetMap</strong> con dati di <strong>OpenStreetMap</strong>. Al caricamento, il browser recupera le tessere della mappa dai loro server – il tuo <strong>indirizzo IP</strong> viene trasmesso a questi fornitori. Niente succede senza il tuo clic.',
    consentBtn: 'Carica mappa e accetta',
    consentNote: 'Il consenso è memorizzato localmente nel tuo browser. Puoi revocarlo in qualsiasi momento tramite “Datenschutz / Privacy” in basso a sinistra.',

    // ---------- Hinweis ----------
    hint: 'Fai clic su un marcatore per aprire orari, prezzi e pianificatore percorsi',

    // ---------- Sidebar ----------
    closeSidebar: 'Chiudi barra laterale',
    showAll: 'Mostra tutti i parchi',
    listTitle: 'Tutti i bike park',
    listCount: '{count} di {total} parchi',
    listEmpty: 'Nessun parco trovato.<br />Prova un termine di ricerca diverso.',
    listFootnote: 'Fai clic su un parco per vedere dettagli, orari e pianificatore percorsi.',

    factTicket: 'Biglietto giornaliero',
    factLines: 'Linee',
    factOpen: 'Aperto',

    stayTitle: 'Consiglio',
    staySubtitle: 'Tempo per l’intero parco',

    hoursTitle: 'Orari di apertura',
    hoursSubtitle: 'Stagione',
    hoursDays: 'Giorni di apertura',
    hoursTime: 'Orario',
    hoursSeason: 'Stagione',

    crowdTitle: 'Quanto è affollato?',
    crowdSubtitle: 'Media, lun – dom',
    crowdL1: 'molto tranquillo',
    crowdL2: 'tranquillo',
    crowdL3: 'moderato',
    crowdL4: 'affollato',
    crowdL5: 'molto affollato',
    crowdClosed: 'Chiuso',

    plannerTitle: 'Pianificatore percorsi',
    plannerSubtitle: 'Auto con fermate intermedie',
    addStop: '+ Fermata intermedia',
    goBtn: 'Percorso',
    statusEnterStart: 'Inserisci un punto di partenza o fatti guidare fino a {name}.',
    statusSearching: 'Ricerca punto di partenza …',
    statusSearchingStop: 'Ricerca fermata intermedia “{name}” …',
    statusRouteDone: 'Percorso calcolato.',
    statusEnterStartErr: 'Per favore inserisci un punto di partenza.',
    statusGeoSupport: 'Il tuo browser non supporta la geolocalizzazione.',
    statusGeoErr: 'Posizione non determinabile.',
    statusPick: 'Fai clic ora su un punto di partenza sulla mappa.',
    statusPickEnd: 'Modalità selezione terminata.',
    statusReset: 'Reimposta – scegli un nuovo punto di partenza.',
    statusStopAdded: '“{name}" aggiunto come fermata intermedia – sosta {days}.',
    statusStopRemoved: 'Fermata intermedia rimossa.',
    statusStopMoved: 'Ordine aggiornato – fermata intermedia spostata.',
    statusStopCancelled: 'Selezione annullata – fermata intermedia rimane vuota.',

    dist: 'Distanza',
    time: 'Tempo di guida',
    total: 'Totale',
    stay: 'Sosta',
    withoutStop: 'Nessuna fermata intermedia – solo guida verso il parco.',
    openMaps: 'Apri in Google Maps',
    resetBtn: 'Reimposta',

    footnote: 'Dati senza garanzia, aggiornamento {date} – orari e prezzi possono variare in breve tempo, controlla il sito del parco. Affollamento è una stima per giorni tipici, nessun valore in tempo reale.',
    openWebsite: 'Apri sito web di {name}',

    // ---------- Wochentage ----------
    mon: 'Lun', tue: 'Mar', wed: 'Mer', thu: 'Gio', fri: 'Ven', sat: 'Sab', sun: 'Dom',
    monLong: 'Lunedì', tueLong: 'Martedì', wedLong: 'Mercoledì', thuLong: 'Giovedì', friLong: 'Venerdì', satLong: 'Sabato', sunLong: 'Domenica',

    // ---------- Status ----------
    todayOpen: 'Aperto oggi · {from}–{to}',
    todayClosed: 'Chiuso oggi ({day})',
    seasonStarts: 'La stagione inizia il {date}',
    seasonEnded: 'La stagione è finita il {date}',
    seasonNone: 'nessuna data fissa',

    // ---------- Einheiten ----------
    minAbbr: 'min.',
    hourAbbr: 'ore',
    dayAbbr: 'giorno',
    daysAbbr: 'giorni',
    daySingular: '1 giorno',

    // ---------- Zusätzliche Inline-Keys ----------
    täglich: 'giornaliero',
    tageProWoche: 'giorni / settimana',
    geschlossen: 'Chiuso',
    dieEinzigeLine: 'l\'unica linea',
    dieEineRunde: 'l\'unico giro',
    zwischenStopp: 'Fermata intermedia',
    keinPark: 'Nessun parco trovato.',
    andererSuchbegriff: 'Prova un termine di ricerca diverso.',
    startadresse: 'Indirizzo di partenza o luogo …',
    meinStandort: 'Usa la mia posizione',
    startAufKarte: 'Scegli partenza sulla mappa',
    amGriffZiehen: 'Trascina per la maniglia per spostare la fermata',
    zwischenStoppOrt: 'Fermata intermedia, luogo o indirizzo …',
    aufenthaltTagen: 'Sosta in giorni',
    tage: 'giorni',
    zwischenstoppEntfernen: 'Rimuovi fermata intermedia',
    bitteStartort: 'Per favore inserisci un punto di partenza.',
    zwischenstoppEntfernt: 'Fermata intermedia rimossa.',
    reihenfolgeAngepasst: 'Ordine aggiornato – fermata intermedia spostata.',
    zurueckgesetzt: 'Reimposta – scegli un nuovo punto di partenza.',
    auswahlAbgebrochen: 'Selezione annullata – fermata intermedia rimane vuota.',
    trailpark: 'Trail park',
    trailparkOhneLift: 'Trail park senza impianto',
    ohneLift: ' senza impianto',

    // ---------- Länder ----------
    countryDeutschland: 'Germania',
    countryOesterreich: 'Austria',
    countrySchweiz: 'Svizzera',
    countryItalien: 'Italia',
    countryFrankreich: 'Francia',
    countryTschechien: 'Repubblica Ceca',
    countrySlowakei: 'Slovacchia',
    countrySlowenien: 'Slovenia',
    countryPolen: 'Polonia',
    countrySpanien: 'Spagna',
    countryAndorra: 'Andorra',
    countryGrossbritannien: 'Regno Unito',
    countryIrland: 'Irlanda',
    countryNorwegen: 'Norvegia',
    countrySchweden: 'Svezia',
    countryFinnland: 'Finlandia',
    countryLettland: 'Lettonia',
    countryEstland: 'Estonia',
    countryKroatien: 'Croazia',
    countrySerbien: 'Serbia',
    countryBulgarien: 'Bulgaria',
    countryRumaenien: 'Romania',
    countryIsland: 'Islanda',

    // ---------- Datenschutz ----------
    privacyLink: 'Privacy / Datenschutz',
    privacyTitle: 'Privacy / Datenschutz',
    privacyShort: 'In breve',
    privacyShortText: 'Il Bikepark Atlas è un progetto privato di hobbistica senza scopo commerciale: nessuna pubblicità, nessun tracciamento, nessun tool di analisi, nessun account utente, nessuna vendita di dati. I dati personali vengono raccolti solo quando carichi la mappa (indirizzo IP a OpenStreetMap), quando usi il pianificatore percorsi e quando il provider di hosting scrive log tecnici necessari.',
    privacyResponsible: 'Responsabile del trattamento',
    privacyResponsibleText: 'Tim Dichristin<br />E-Mail: timdichristin@outlook.com<br />Italia',
    privacyMapTitle: 'Mappa: OpenStreetMap',
    privacyMapText: 'La mappa è disattivata per impostazione predefinita alla prima visita. Solo quando clicchi su “Carica mappa e accetta”, il browser carica il design scuro della mappa da OpenStreetMap. Il tuo indirizzo IP viene trasmesso a questi fornitori, oltre a dettagli tecnici come tipo di browser e ora della richiesta. Senza il tuo clic non vengono stabilite connessioni a OpenStreetMap.',
    privacyRouteTitle: 'Pianificatore percorsi e ricerca indirizzi',
    privacyRouteText: 'Quando usi il pianificatore percorsi, gli indirizzi inseriti vengono trasmessi al servizio di geocodifica Nominatim e al servizio di routing OSRM, gestiti dalla community di OpenStreetMap e da FOSSGIS e. V. Anche in questo caso viene trasmesso il tuo indirizzo IP. Base giuridica è il nostro interesse legittimo a fornire questa funzione (Art. 6 par. 1 lett. f GDPR). La richiesta viene attivata solo dal tuo inserimento.',
    privacyStorageTitle: 'Memorizzazione locale (localStorage)',
    privacyStorageText: 'Il tuo consenso per la mappa viene memorizzato localmente nel tuo browser sotto la chiave <code>bikepark-atlas:map-consent</code>. Non è un cookie e durante questa operazione non vengono inviati dati a noi o a terzi. Viene salvato solo il valore „granted“ così che tu non venga più chiesto alla prossima visita – finché non revochi il consenso o cancelli i dati del sito nel tuo browser. La revoca tramite il pulsante sottostante elimina l’ingresso e ricarica la pagina; la mappa rimane disattivata finché non acconsenti di nuovo.',
    privacyLogsTitle: 'Log del server presso l’hosting',
    privacyLogsText: 'Quando accedi alla pagina, il provider di hosting elabora dati di connessione tecnicamente necessari (indirizzo IP, data e ora, file richiesto, tipo di browser) per erogare la pagina e difendersi da attacchi. Base giuridica è il nostro interesse legittimo a un funzionamento sicuro (Art. 6 par. 1 lett. f GDPR). Questi log non vengono combinati con altri dati e vengono cancellati dopo breve tempo.',
    privacyNoSharingTitle: 'Nessuna condivisione, nessuna profilazione',
    privacyNoSharingText: 'Non ci sono network pubblicitari, plugin social, misurazione dell’audience o decisioni automatizzate. I tuoi dati non vengono venduti né trasmessi per scopi pubblicitari.',
    privacyRightsTitle: 'I tuoi diritti',
    privacyRightsText: 'Hai diritto ad accesso, rettifica, cancellazione, limitazione del trattamento, portabilità dei dati e opposizione (Art. 15–21 GDPR) nonché il diritto di revocare il consenso in qualsiasi momento (Art. 7 par. 3 GDPR). Un breve messaggio a timdichristin@outlook.com è sufficiente. Puoi anche presentare reclamo all’autorità italiana per la protezione dei dati: Garante per la protezione dei dati personali, Piazza Venezia 11, 00187 Roma, <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer">garanteprivacy.it</a>.',
    privacyStandTitle: 'Stato',
    privacyStandText: 'Novembre 2026. Questo testo è un modello per un sito web privato e non commerciale e non sostituisce una consulenza legale.',
    privacyRevoke: 'Revoca consenso mappa',
    privacyClose: 'Chiudi',

    // ---------- Stay advice ----------
    stayTrail1: 'Un giorno in sella basta per {rounds}: senza impianto conta la tua preparazione fisica, pianifica la salita di conseguenza.',
    stayTrail2: 'Due giorni per l’intera rete – {rounds} senza impianto li fai solo con pernottamento in modo rilassato.',
    stay1: 'Una giornata piena{lift} basta per percorrere {lines} più volte – parti presto, poi restano riserve per la discesa preferita.',
    stay2: 'Due giorni sono realistici: primo giorno per {lines}, secondo giorno per i preferiti e i giri veloci.',
    stay3: 'Tre giorni se vuoi percorrere {lines} senza fretta – con pause, cambio gomme e tempo per le migliori discese.',
  },
}

/* ------------------------------------------------------------------ helpers */

export const LANG_KEY = 'bikepark-atlas:lang'

export let currentLang = 'de'

export function loadLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY)
    if (saved && TR[saved]) currentLang = saved
  } catch {
    // ignore
  }
  return currentLang
}

export function setLang(lang) {
  if (!TR[lang]) return
  currentLang = lang
  try {
    localStorage.setItem(LANG_KEY, lang)
  } catch {
    // ignore
  }
  document.documentElement.lang = lang
}

export function t(key, vars = {}) {
  const dict = TR[currentLang] || TR.de
  let text = dict[key] || key
  // einfache Variablenersetzung {name} → Wert
  for (const [k, v] of Object.entries(vars)) {
    text = text.replace(new RegExp('{' + k + '}', 'g'), String(v))
  }
  return text
}

export function dayShort(i) {
  return t(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][i])
}

export function dayLong(i) {
  return t(['monLong', 'tueLong', 'wedLong', 'thuLong', 'friLong', 'satLong', 'sunLong'][i])
}

export function countryName(name) {
  const map = {
    Deutschland: 'countryDeutschland',
    Österreich: 'countryOesterreich',
    Schweiz: 'countrySchweiz',
    Italien: 'countryItalien',
    Frankreich: 'countryFrankreich',
    Tschechien: 'countryTschechien',
    Slowakei: 'countrySlowakei',
    Slowenien: 'countrySlowenien',
    Polen: 'countryPolen',
    Spanien: 'countrySpanien',
    Andorra: 'countryAndorra',
    Großbritannien: 'countryGrossbritannien',
    Irland: 'countryIrland',
    Norwegen: 'countryNorwegen',
    Schweden: 'countrySchweden',
    Finnland: 'countryFinnland',
    Lettland: 'countryLettland',
    Estland: 'countryEstland',
    Kroatien: 'countryKroatien',
    Serbien: 'countrySerbien',
    Bulgarien: 'countryBulgarien',
    Rumänien: 'countryRumaenien',
    Island: 'countryIsland',
  }
  const key = map[name]
  return key ? t(key) : name
}
