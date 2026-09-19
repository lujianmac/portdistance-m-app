<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-title>{{ t('profile.tab.title') }}</ion-title></ion-toolbar></ion-header>
    <ion-content class="page-content">
      <ion-card class="page-card"><ion-card-content class="profile-summary"><div class="profile-avatar"><UserRound :size="27" /></div><div><strong>{{ user.profile.name || t('profile.tab.defaultName') }}</strong><p>{{ user.profile.email || t('profile.tab.emailFallback') }}</p></div></ion-card-content></ion-card>
      <ion-list inset><ion-item button detail @click="router.push('/profile/account')"><UserRound slot="start" :size="20" /><ion-label>{{ t('profile.tab.account') }}</ion-label></ion-item><ion-item button detail @click="router.push('/profile/email')"><Mail slot="start" :size="20" /><ion-label>{{ t('profile.tab.email') }}</ion-label></ion-item><ion-item button detail @click="router.push('/profile/password')"><KeyRound slot="start" :size="20" /><ion-label>{{ t('profile.tab.password') }}</ion-label></ion-item><ion-item button detail @click="router.push('/ships')"><ShipWheel slot="start" :size="20" /><ion-label>{{ t('profile.tab.ships') }}</ion-label></ion-item><ion-item button detail @click="router.push('/profile/language')"><Languages slot="start" :size="20" /><ion-label>{{ t('profile.tab.language') }}</ion-label><ion-note slot="end">{{ localeStore.option.nativeName }}</ion-note></ion-item></ion-list>
      <ion-list inset><ion-item button detail @click="router.push('/profile/purchases')"><ReceiptText slot="start" :size="20" /><ion-label>{{ t('profile.tab.purchases') }}</ion-label></ion-item><ion-item button detail @click="router.push('/profile/contact')"><MessageCircleMore slot="start" :size="20" /><ion-label>{{ t('profile.tab.contact') }}</ion-label></ion-item><ion-item button detail @click="share"><Share2 slot="start" :size="20" /><ion-label>{{ t('profile.tab.share') }}</ion-label></ion-item></ion-list>
      <ion-list inset><ion-item><ion-label>{{ t('profile.tab.version') }}</ion-label><ion-note slot="end">{{ version }}</ion-note></ion-item></ion-list>
      <ion-button expand="block" fill="outline" color="danger" @click="confirmLogout">{{ t('profile.tab.logout') }}</ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButton, IonCard, IonCardContent, IonContent, IonHeader, IonItem, IonLabel, IonList, IonNote, IonPage, IonTitle, IonToolbar, alertController } from '@ionic/vue'
import { KeyRound, Languages, Mail, MessageCircleMore, ReceiptText, Share2, ShipWheel, UserRound } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useLocaleStore } from '@/stores/locale'
import { useUserStore } from '@/stores/user'
import { shareText } from '@/utils/share'

const { t } = useI18n()
const router = useRouter()
const user = useUserStore()
const localeStore = useLocaleStore()
const version = import.meta.env.VITE_APP_VERSION || '1.0.0'
async function share() { await shareText('PortDistance', t('profile.tab.shareText')) }
async function confirmLogout() { const alert = await alertController.create({ header: t('profile.tab.logout'), message: t('profile.tab.logoutMessage'), buttons: [{ text: t('common.cancel'), role: 'cancel' }, { text: t('profile.tab.logoutConfirm'), role: 'destructive', handler: async () => { await user.logout(); await router.replace('/auth/login') } }] }); await alert.present() }
</script>

<style scoped>
.profile-summary { display: flex; align-items: center; gap: 14px; }.profile-summary strong { color: #173447; font-size: 17px; }.profile-summary p { margin: 4px 0 0; color: #65778a; font-size: 13px; }.profile-avatar { display: grid; flex: none; width: 52px; height: 52px; place-items: center; border-radius: 50%; background: #e5f2f4; color: #006c8c; }
</style>
