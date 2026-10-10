// Distance calculation page, distance store
export default {
  // Page
  page: {
    title: 'Mesafe',
  },
  // Port search
  search: {
    portPlaceholder: 'Liman ara',
    noSuggestions: 'Öneri yok',
  },
  // Recently entered ports
  recentPorts: {
    title: 'Son limanlar',
    ariaLabel: 'Son girilen limanlar',
    clear: 'Son limanları temizle',
    close: 'Son limanları kapat',
    empty: 'Son liman kaydı yok',
  },
  // Speed and route actions
  route: {
    speedLabel: 'Hız',
    calculating: 'Hesaplanıyor…',
    getDistance: 'Mesafeyi hesapla',
    clearDistance: 'Mesafeyi temizle',
    clearAll: 'Tümünü temizle',
    emptyHint: 'Seyir hesabına başlamak için yukarıdaki arama kutusuna liman adı girin',
    moveUp: 'Limanı yukarı taşı',
    moveDown: 'Limanı aşağı taşı',
    remove: 'Limanı kaldır',
    originPort: 'Başlangıç',
  },
  // Recent calculations
  recentCalculations: {
    title: 'Son hesaplamalar',
    summary: 'Toplam (ECA) {distance} ({eca}) NM · Seyir {days} gün ({speed} kn)',
    // Display-only: the sea-time LABEL is dropped so the row stops wrapping; the time itself stays.
    summaryCompact: 'Toplam (ECA) {distance} ({eca}) NM · {days} gün ({speed} kn)',
  },
  // Distance summary
  summary: {
    ariaLabel: 'Mesafe özeti',
    totalDistance: 'TTL Distance',
    eca: 'ECA',
    ecaRate: '(0.1%)',
    sailingTime: 'TTL Time',
    sailingTimeUnit: ' gün ({speed} kn)',
  },
  // Voyage time
  schedule: {
    ariaLabel: 'Seyir zamanı',
    departureTime: 'Kalkış saati',
    arrivalTime: 'Varış saati',
    editDeparture: 'Kalkış saatini ayarla',
    timeZoneSettings: 'Saat dilimi ayarları',
    setTimeZone: 'Saat dilimini ayarla',
    modalTitle: 'Seyir zamanı ayarları',
    departureTimeZone: 'Kalkış saat dilimi',
    arrivalTimeZone: 'Varış saat dilimi',
  },
  // Copy / share / convert to estimation
  share: {
    copyResult: 'Sonucu kopyala',
    copyImage: 'Görseli kopyala',
    imageCopied: 'Görsel kopyalandı',
    viewMap: 'Haritada gör',
    budgetAction: 'Sefer tahmini oluştur',
    copied: 'Hesaplama sonucu kopyalandı',
    cardSketchNote: 'Rota taslağı, yalnızca referans amaçlıdır',
    cardTagline: 'Seyir mesafesi · Sefer tahmini',
    title: 'PortDistance',
    routeLine: 'Rota: {route}',
    distanceLine: 'Mesafe: {distance} NM',
    distanceLineWithEca: 'Mesafe: {distance} NM (ECA: {eca})',
    recentDistanceLine: 'Mesafe: {distance} (ECA: {eca}) NM',
    // Copy / share text only (never rendered): "Sea" is the label, so the value must not repeat it.
    timeLine: 'Seyir: {days} gün ({speed} kn)',
  },
  // Coordinate input
  coordinate: {
    title: 'Koordinat girişi',
    modeDecimal: 'Ondalık derece',
    modeDms: 'Derece dakika saniye',
    longitude: 'Boylam',
    latitude: 'Enlem',
    longitudePlaceholder: '-180 ile 180 arası',
    latitudePlaceholder: '-90 ile 90 arası',
    degree: 'Derece',
    minute: 'Dakika',
    second: 'Saniye',
    longitudeDegreePlaceholder: '0 ~ 180',
    latitudeDegreePlaceholder: '0 ~ 90',
    minutePlaceholder: '0 ~ 59',
    secondPlaceholder: '0 ~ 59',
    direction: 'Yön',
    east: 'Doğu',
    west: 'Batı',
    north: 'Kuzey',
    south: 'Güney',
    invalid: 'Geçerli bir boylam ve enlem girin.',
  },
  // Error messages (distance store)
  errors: {
    legMismatch: 'Rota sonucu liman sırasıyla eşleşmiyor',
    noRoutePoints: 'Mesafe hesabı geçerli bir rota döndürmedi',
    calculateFailed: 'Mesafe hesabı başarısız oldu',
  },
}
