(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const app = document.querySelector('#app').__vue_app__
  const s = app.config.globalProperties.$pinia._s.get('distance')
  const out = {}
  const fs = (sel) => { const el = document.querySelector(sel); return el ? getComputedStyle(el).fontSize : null }
  out.suggest = { port: fs('.suggest-label'), country: fs('.suggest-label small') }
  s.portPoints = [
    { port: { portId: 'CNSHA', portName: 'Shanghai', fullName: 'Shanghai, China', countryCode: 'CN', longitude: '121.5', latitude: '31.2' }, distance: 0, ecaDistance: 0 },
    { port: { portId: 'SGSIN', portName: 'Singapore', fullName: 'Singapore, Singapore', countryCode: 'SG', longitude: '103.8', latitude: '1.29' }, distance: 2288.5, ecaDistance: 120 },
  ]
  s.hasDistanceResult = true
  s.totalDistanceNm = 2288.5
  s.totalEcaDistanceNm = 120
  await sleep(600)
  out.portName = { port: fs('.port-name'), country: fs('.port-name small') }
  out.shareButtons = [...document.querySelectorAll('.share-toolbar ion-button')].map((b) => {
    const native = b.shadowRoot && b.shadowRoot.querySelector('.button-native')
    return {
      text: b.innerText.trim(),
      fontSize: getComputedStyle(b).fontSize,
      colorVar: getComputedStyle(b).getPropertyValue('--color').trim(),
      renderedColor: native ? getComputedStyle(native).color : null,
      classes: b.className,
    }
  })
  s.addCoordinatePort(24.5, 118.1)
  await sleep(500)
  out.portRows = [...document.querySelectorAll('.port-name')].map((e) => e.innerText.trim())
  return out
})()
