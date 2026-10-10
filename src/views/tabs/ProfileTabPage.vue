<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-title>{{ t('profile.tab.title') }}</ion-title></ion-toolbar></ion-header>
    <ion-content class="page-content">
      <ion-card class="page-card"><ion-card-content class="profile-summary"><div class="profile-avatar"><UserRound :size="27" /></div><div><strong>{{ user.profile.name || t('profile.tab.defaultName') }}</strong><p>{{ user.profile.email || t('profile.tab.emailFallback') }}</p></div></ion-card-content></ion-card>
      <ion-list><ion-item button detail @click="router.push('/profile/account')"><UserRound slot="start" :size="20" /><ion-label>{{ t('profile.tab.account') }}</ion-label></ion-item><ion-item button detail @click="router.push('/profile/email')"><Mail slot="start" :size="20" /><ion-label>{{ t('profile.tab.email') }}</ion-label></ion-item><ion-item button detail @click="router.push('/profile/password')"><KeyRound slot="start" :size="20" /><ion-label>{{ t('profile.tab.password') }}</ion-label></ion-item><ion-item button detail @click="router.push('/profile/language')"><Languages slot="start" :size="20" /><ion-label>{{ t('profile.tab.language') }}</ion-label><ion-note slot="end">{{ localeStore.option.nativeName }}</ion-note></ion-item></ion-list>
      <ion-list><ion-item button detail @click="router.push('/profile/purchases')"><ReceiptText slot="start" :size="20" /><ion-label>{{ t('profile.tab.purchases') }}</ion-label></ion-item><ion-item button detail @click="router.push('/profile/contact')"><MessageCircleMore slot="start" :size="20" /><ion-label>{{ t('profile.tab.contact') }}</ion-label></ion-item></ion-list>
      <ion-list><ion-item><ion-label>{{ t('profile.tab.version') }}</ion-label><ion-note slot="end">{{ version }}</ion-note></ion-item></ion-list>
      <ion-button expand="block" fill="outline" color="danger" @click="confirmLogout">{{ t('profile.tab.logout') }}</ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButton, IonCard, IonCardContent, IonContent, IonHeader, IonItem, IonLabel, IonList, IonNote, IonPage, IonTitle, IonToolbar, alertController } from '@ionic/vue'
import { KeyRound, Languages, Mail, MessageCircleMore, ReceiptText, UserRound } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useLocaleStore } from '@/stores/locale'
import { useUserStore } from '@/stores/user'

const { t } = useI18n()
const router = useRouter()
const user = useUserStore()
const localeStore = useLocaleStore()
const version = import.meta.env.VITE_APP_VERSION || '5.0.0'
async function confirmLogout() { const alert = await alertController.create({ header: t('profile.tab.logout'), message: t('profile.tab.logoutMessage'), buttons: [{ text: t('common.cancel'), role: 'cancel' }, { text: t('profile.tab.logoutConfirm'), role: 'destructive', handler: async () => { await user.logout(); await router.replace('/auth/login') } }] }); await alert.present() }
</script>

<style scoped>
.profile-summary { display: flex; align-items: center; gap: 14px; }.profile-summary strong { color: #173447; font-size: 17px; }.profile-summary p { margin: 4px 0 0; color: #65778a; font-size: 13px; }.profile-avatar { display: grid; flex: none; width: 52px; height: 52px; place-items: center; border-radius: 50%; background: #e5f2f4; color: #006c8c; }

/* 功能列表：去掉 inset 后行宽与下方「退出登录」按钮一致（都占满 ion-content 的
   左右内边距之间）；ion-list 自身没有外边距，补上与卡片一致的 12px 间距，
   否则三个列表会粘成一整块。 */
ion-list { margin: 0 0 12px; }
/* 行高：Ionic 默认 iOS 44px / MD 48px，这里统一提到 54px（原 56px，按要求各减 2px），点按目标依然够大。 */
ion-list ion-item { --min-height: 54px; }
/* 退出按钮自带 margin: 0 2px，会比列表行每侧窄 2px；清零后两者严格等宽。实测：都是 366px / left 12。 */
ion-content > ion-button { margin-inline: 0; }
</style>
