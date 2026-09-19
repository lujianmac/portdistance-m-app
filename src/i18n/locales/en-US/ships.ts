// Vessel particulars
export default {
  // List page
  list: {
    title: 'Vessel Particulars',
    emptyTitle: 'No vessel particulars yet',
    emptyHint: 'Add basic vessel information to link the vessel to a voyage estimation.',
    meta: '{flag} · {type} · Built {year}',
    dimensions: 'DWT {dwt} t · {length} m × {breadth} m',
  },
  // Create / edit
  addTitle: 'Add Vessel',
  editTitle: 'Edit Vessel Particular',
  basicInfo: 'Basic Information',
  shipName: 'Ship name',
  shipNamePlaceholder: 'Enter ship name',
  flag: 'Flag',
  flagPlaceholder: 'e.g. CN',
  shipType: 'Ship type',
  shipTypePlaceholder: 'Enter ship type',
  buildYear: 'Build year',
  tonnage: 'Tonnage & Dimensions',
  dwt: 'DWT (MT)',
  dwcc: 'DWCC (MT)',
  grt: 'GRT',
  nrt: 'NRT',
  length: 'Length (m)',
  breadth: 'Breadth (m)',
  depth: 'Depth (m)',
  draft: 'Draft (m)',
  // Validation & feedback
  nameRequired: 'Enter ship name',
  flagRequired: 'Enter flag',
  typeRequired: 'Enter ship type',
  buildYearInvalid: 'Enter a valid build year',
  dimensionsRequired: 'Complete the tonnage and dimension fields',
  loadFailed: 'Failed to load vessel particulars',
  saved: 'Vessel particulars saved',
}
