<template>
  <ion-page><ion-header><ion-toolbar><ion-buttons slot="start"><AppBackButton default-href="/tabs/profile" /></ion-buttons><ion-title>{{ t('profile.contact.title') }}</ion-title></ion-toolbar></ion-header><ion-content class="page-content"><ion-card class="page-card"><ion-card-header><ion-card-title>{{ t('profile.contact.service') }}</ion-card-title></ion-card-header><ion-list lines="full"><ion-item v-for="item in serviceContacts" :key="item.label"><ion-label>{{ item.label }}</ion-label><ion-note slot="end">{{ item.value }}</ion-note><ion-button slot="end" fill="clear" :aria-label="t('common.copy')" @click="copy(item.value)"><Copy :size="18" /></ion-button></ion-item></ion-list></ion-card><ion-card class="page-card"><ion-card-header><ion-card-title>{{ t('profile.contact.support') }}</ion-card-title></ion-card-header><ion-card-content><p>{{ t('profile.contact.supportDescription') }}</p></ion-card-content><ion-list lines="full"><ion-item v-for="item in supportContacts" :key="item.label"><ion-label>{{ item.label }}</ion-label><ion-note slot="end">{{ item.value }}</ion-note><ion-button slot="end" fill="clear" :aria-label="t('common.copy')" @click="copy(item.value)"><Copy :size="18" /></ion-button></ion-item></ion-list></ion-card></ion-content></ion-page>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonItem, IonLabel, IonList, IonNote, IonPage, IonTitle, IonToolbar, toastController } from '@ionic/vue'
import { Copy } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import AppBackButton from '@/components/AppBackButton.vue'
import { copyText } from '@/utils/share'

const { t } = useI18n()

const serviceContacts = computed(() => [{ label: t('profile.contact.wechat'), value: 'haiyunxiaomei' }, { label: 'Skype', value: '2325647780' }, { label: t('profile.contact.email'), value: 'market@marinecircle.com' }])
const supportContacts = computed(() => [{ label: t('profile.contact.wechat'), value: 'lovef2046' }, { label: t('profile.contact.email'), value: 'lujianmac@163.com' }])
async function copy(value: string) { await copyText(value); const toast = await toastController.create({ message: t('common.copied'), duration: 1200, position: 'top' }); await toast.present() }
</script>

<style scoped>
ion-card p { margin: 0; color: #607486; line-height: 1.55; } ion-note { max-width: 58%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
