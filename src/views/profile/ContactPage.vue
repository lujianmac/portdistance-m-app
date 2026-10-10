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
/* 客服 / 技术支持标题：ion-card-title 的默认字号来自组件自身（iOS 1.75rem=28px、
   MD 1.25rem=20px），不是共享的 .page-card-title（16px，其他页面在用），
   所以这里只在本页各减 4px（上一轮减 2px 后仍偏大，本轮再减 2px）：iOS 24px、MD 16px。
   用 calc 保留 rem 基准，系统动态字号仍然生效；全局样式一律不动。 */
ion-card-title { font-size: calc(1.75rem - 4px); }
html.md ion-card-title { font-size: calc(1.25rem - 4px); }

ion-card p { margin: 0; color: #607486; line-height: 1.55; } ion-note { max-width: 58%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
