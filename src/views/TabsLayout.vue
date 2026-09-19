<template>
  <ion-page>
    <OfflineBanner />
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="distance" href="/tabs/distance">
          <Route :size="21" slot="icon" aria-hidden="true" />
          <ion-label>{{ t('tabs.tab.distance') }}</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="map" href="/tabs/map">
          <Map :size="21" slot="icon" aria-hidden="true" />
          <ion-label>{{ t('tabs.tab.map') }}</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="esti-deploy" href="/tabs/esti-deploy">
          <Calculator :size="21" slot="icon" aria-hidden="true" />
          <ion-label>{{ t('tabs.tab.budget') }}</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="profile" href="/tabs/profile">
          <UserRound :size="21" slot="icon" aria-hidden="true" />
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
/* 四个 tab 文案变长（航程计算 / 航次预算），禁止换行并统一字号 */
ion-tab-button ion-label { overflow: hidden; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
</style>
