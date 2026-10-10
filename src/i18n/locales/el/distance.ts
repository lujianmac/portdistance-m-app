// Distance calculation page, distance store
export default {
  // Page
  page: {
    title: 'Απόσταση',
  },
  // Port search
  search: {
    portPlaceholder: 'Αναζήτηση λιμανιού',
    noSuggestions: 'Δεν υπάρχουν προτάσεις',
  },
  // Recently entered ports
  recentPorts: {
    title: 'Πρόσφατα λιμάνια',
    ariaLabel: 'Πρόσφατα καταχωρισμένα λιμάνια',
    clear: 'Καθαρισμός πρόσφατων λιμανιών',
    close: 'Κλείσιμο πρόσφατων λιμανιών',
    empty: 'Δεν υπάρχουν πρόσφατα λιμάνια',
  },
  // Speed and route actions
  route: {
    speedLabel: 'Ταχύτητα',
    calculating: 'Υπολογισμός…',
    getDistance: 'Υπολογισμός απόστασης',
    clearDistance: 'Καθαρισμός απόστασης',
    clearAll: 'Καθαρισμός όλων',
    emptyHint: 'Ξεκινήστε τον υπολογισμό ταξιδιού εισάγοντας όνομα λιμανιού στο πεδίο αναζήτησης παραπάνω',
    moveUp: 'Μετακίνηση λιμανιού πάνω',
    moveDown: 'Μετακίνηση λιμανιού κάτω',
    remove: 'Αφαίρεση λιμανιού',
    originPort: 'Αφετηρία',
  },
  // Recent calculations
  recentCalculations: {
    title: 'Πρόσφατοι υπολογισμοί',
    summary: 'Σύνολο (ECA) {distance} ({eca}) NM · Sea {days} ημέρες ({speed} kn)',
    // Display-only: the sea-time LABEL is dropped so the row stops wrapping; the time itself stays.
    summaryCompact: 'Σύνολο (ECA) {distance} ({eca}) NM · {days} ημέρες ({speed} kn)',
  },
  // Distance summary
  summary: {
    ariaLabel: 'Σύνοψη απόστασης',
    totalDistance: 'TTL Distance',
    eca: 'ECA',
    ecaRate: '(0.1%)',
    sailingTime: 'TTL Time',
    sailingTimeUnit: ' ημέρες ({speed} kn)',
  },
  // Voyage time
  schedule: {
    ariaLabel: 'Χρόνος ταξιδιού',
    departureTime: 'Ώρα αναχώρησης',
    arrivalTime: 'Ώρα άφιξης',
    editDeparture: 'Ορισμός ώρας αναχώρησης',
    timeZoneSettings: 'Ρυθμίσεις ζώνης ώρας',
    setTimeZone: 'Ορισμός ζώνης ώρας',
    modalTitle: 'Ρυθμίσεις χρόνου ταξιδιού',
    departureTimeZone: 'Ζώνη ώρας αναχώρησης',
    arrivalTimeZone: 'Ζώνη ώρας άφιξης',
  },
  // Copy / share / convert to estimation
  share: {
    copyResult: 'Αντιγραφή αποτελέσματος',
    copyImage: 'Αντιγραφή εικόνας',
    imageCopied: 'Η εικόνα αντιγράφηκε',
    viewMap: 'Προβολή χάρτη',
    budgetAction: 'Δημιουργία εκτίμησης ταξιδιού',
    copied: 'Το αποτέλεσμα υπολογισμού αντιγράφηκε',
    cardSketchNote: 'Σκίτσο διαδρομής, μόνο ενδεικτικό',
    cardTagline: 'Απόσταση ταξιδιού · Εκτίμηση ταξιδιού',
    title: 'PortDistance',
    routeLine: 'Διαδρομή: {route}',
    distanceLine: 'Απόσταση: {distance} NM',
    distanceLineWithEca: 'Απόσταση: {distance} NM (ECA: {eca})',
    recentDistanceLine: 'Απόσταση: {distance} (ECA: {eca}) NM',
    // Copy / share text only (never rendered): "Sea" is the label, so the value must not repeat it.
    timeLine: 'Sea: {days} ημέρες ({speed} kn)',
  },
  // Coordinate input
  coordinate: {
    title: 'Εισαγωγή συντεταγμένων',
    modeDecimal: 'Δεκαδικές μοίρες',
    modeDms: 'Μοίρες, λεπτά, δευτερόλεπτα',
    longitude: 'Γεωγραφικό μήκος',
    latitude: 'Γεωγραφικό πλάτος',
    longitudePlaceholder: '-180 έως 180',
    latitudePlaceholder: '-90 έως 90',
    degree: 'Μοίρες',
    minute: 'Λεπτά',
    second: 'Δευτ.',
    longitudeDegreePlaceholder: '0 ~ 180',
    latitudeDegreePlaceholder: '0 ~ 90',
    minutePlaceholder: '0 ~ 59',
    secondPlaceholder: '0 ~ 59',
    direction: 'Κατεύθ.',
    east: 'Ανατολή',
    west: 'Δύση',
    north: 'Βορράς',
    south: 'Νότος',
    invalid: 'Εισάγετε έγκυρο γεωγραφικό μήκος και πλάτος.',
  },
  // Error messages (distance store)
  errors: {
    legMismatch: 'Το αποτέλεσμα διαδρομής δεν αντιστοιχεί στη σειρά λιμανιών',
    noRoutePoints: 'Ο υπολογισμός απόστασης δεν επέστρεψε έγκυρη διαδρομή',
    calculateFailed: 'Ο υπολογισμός απόστασης απέτυχε',
  },
}
