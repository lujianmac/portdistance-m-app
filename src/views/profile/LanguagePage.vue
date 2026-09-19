<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><AppBackButton default-href="/tabs/profile" /></ion-buttons>
        <ion-title>{{ t('language.title') }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="page-content">
      <ion-list inset>
        <ion-list-header>{{ t('language.sectionTitle') }}</ion-list-header>
        <ion-radio-group :value="localeStore.preference" @ion-change="onPreferenceChange">
          <ion-item>
            <ion-label>
              {{ t('language.system') }}
              <p>{{ t('language.systemHint') }}</p>
            </ion-label>
            <ion-note slot="end">{{ localeStore.option.nativeName }}</ion-note>
            <ion-radio slot="end" value="system" />
          </ion-item>
          <ion-item v-for="item in SUPPORTED_LOCALES" :key="item.code">
            <ion-label>{{ item.nativeName }}</ion-label>
            <ion-radio slot="end" :value="item.code" />
          </ion-item>
        </ion-radio-group>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonHeader, IonItem, IonLabel, IonList, IonListHeader, IonNote, IonPage, IonRadio, IonRadioGroup, IonTitle, IonToolbar } from '@ionic/vue'
import { useI18n } from 'vue-i18n'
import AppBackButton from '@/components/AppBackButton.vue'
import { SUPPORTED_LOCALES, isAppLocale, type LocalePreference } from '@/i18n/locales/meta'
import { useLocaleStore } from '@/stores/locale'

const { t } = useI18n()
const localeStore = useLocaleStore()

function onPreferenceChange(event: CustomEvent) {
  const value = String(event.detail?.value ?? '')
  const next: LocalePreference = value === 'system' || isAppLocale(value) ? (value as LocalePreference) : 'system'
  localeStore.setPreference(next)
}
</script>
