<template>
  <ion-page>
    <OfflineBanner />
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="distance" href="/tabs/distance">
          <Route :size="22" aria-hidden="true" />
          <ion-label>{{ t('tabs.tab.distance') }}</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="map" href="/tabs/map">
          <Map :size="22" aria-hidden="true" />
          <ion-label>{{ t('tabs.tab.map') }}</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="esti-deploy" href="/tabs/esti-deploy">
          <Calculator :size="22" aria-hidden="true" />
          <ion-label>{{ t('tabs.tab.budget') }}</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="profile" href="/tabs/profile">
          <UserRound :size="22" aria-hidden="true" />
          <ion-label>{{ t('tabs.tab.profile') }}</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { IonLabel, IonPage, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/vue'
import { useI18n } from 'vue-i18n'
import { Calculator, Map, Route, UserRound } from 'lucide-vue-next'
import OfflineBanner from '@/components/OfflineBanner.vue'

const { t } = useI18n()
</script>

<style scoped>
/*
 * Ionic 判断 tab 是否带图标时只认 `ion-icon`，而且 `slot="icon"` 在
 * ion-tab-button 里没有对应的具名插槽（它的 shadow DOM 只有一个默认插槽），
 * 所以 lucide 的 svg 必须放进默认插槽，再由这里控制图标尺寸与文字排版。
 */
ion-tab-button svg {
  display: block;
  width: 22px;
  height: 22px;
  margin: 0 auto 3px;
}

ion-tab-button ion-label {
  overflow: hidden;
  color: inherit;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
