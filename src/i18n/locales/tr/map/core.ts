// Map workspace
export default {
  workspace: {
    distanceRequired: 'Lütfen önce seyir hesabını tamamlayın',
    routeEditHint: 'Düzenlemek için bir rota noktasına dokunun',
    routeLoadFailed: 'Rota noktaları yüklenemedi',
    turnEditHint: '1. Bir dönüş noktasına dokunup istediğiniz konuma sürükleyin\n2. Bir dönüş noktasına çift dokunarak düzenleyin veya silin\n3. Rota çizgisine dokunarak dönüş noktası ekleyin',
    recalcFailed: 'Mesafe yeniden hesaplanamadı',
    turnUpdateFailed: 'Dönüş noktası güncellenemedi',
    noEditableRoutePoint: 'Düzenlenebilir rota noktası bulunamadı',
    clearTitle: 'Rotayı temizle',
    clearMessage: 'Bu işlem limanları, rotayı ve mevcut hesaplama sonuçlarını siler.',
  },
  // Route point editor
  routePoint: {
    title: 'Rota noktası ayarları',
    optionRequired: 'Geçiş zorunlu',
    optionAllowed: 'Geçiş serbest',
    optionForbidden: 'Geçiş yasak',
    prePortLabel: 'Önceki limanı seçin',
    prePortPlaceholder: 'Bir liman seçin',
  },
  // Turn point editor
  turnPoint: {
    createTitle: 'Dönüş noktası ekle',
    editTitle: 'Dönüş noktasını düzenle',
    longitude: 'Boylam',
    latitude: 'Enlem',
    invalidCoordinate: 'Geçerli bir boylam ve enlem girin',
    deleteLockedHint: 'Yalnızca kendi eklediğiniz dönüş noktalarını silebilirsiniz',
  },
}
