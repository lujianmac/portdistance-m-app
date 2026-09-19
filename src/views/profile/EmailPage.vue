<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-buttons slot="start"><AppBackButton default-href="/tabs/profile" /></ion-buttons><ion-title>{{ t('profile.email.title') }}</ion-title></ion-toolbar></ion-header>
    <ion-content class="page-content">
      <ion-list inset>
        <ion-item><ion-input v-model.trim="form.email" :label="t('profile.email.newEmailLabel')" fill="outline" label-placement="floating" type="email" inputmode="email" :placeholder="t('profile.email.newEmailPlaceholder')" /></ion-item>
        <ion-item><ion-input v-model="form.code" :label="t('profile.email.codeLabel')" fill="outline" label-placement="floating" inputmode="numeric" :placeholder="t('profile.email.codePlaceholder')"><ion-button slot="end" fill="clear" :disabled="sending || cooldown > 0" @click="sendCode">{{ cooldown ? `${cooldown}s` : t('profile.email.sendCode') }}</ion-button></ion-input></ion-item>
      </ion-list>
      <p v-if="error" class="inline-error">{{ error }}</p>
      <ion-button expand="block" :disabled="!form.email || !form.code" :loading="saving" @click="save">{{ t('profile.email.save') }}</ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onBeforeUnmount, reactive, ref } from 'vue'
import { IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonList, IonPage, IonTitle, IonToolbar, toastController } from '@ionic/vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import AppBackButton from '@/components/AppBackButton.vue'
import { apiLanguage } from '@/i18n'
import { sendAccountEmailCode, updateAccountEmail } from '@/api/user'
import { useUserStore } from '@/stores/user'

const { t } = useI18n()
const router = useRouter()
const user = useUserStore()
const form = reactive({ email: '', code: '' })
const sending = ref(false)
const saving = ref(false)
const cooldown = ref(0)
const error = ref('')
let timer: number | null = null
onBeforeUnmount(() => { if (timer) window.clearInterval(timer) })
async function sendCode() { if (!form.email || sending.value || cooldown.value) return; sending.value = true; error.value = ''; try { await sendAccountEmailCode({ email: form.email, language: apiLanguage(), scene: 2 }); cooldown.value = 60; timer = window.setInterval(() => { cooldown.value -= 1; if (cooldown.value <= 0 && timer) { window.clearInterval(timer); timer = null } }, 1000); const toast = await toastController.create({ message: t('profile.email.codeSent'), duration: 1500, position: 'top' }); await toast.present() } catch (cause) { error.value = cause instanceof Error ? cause.message : t('profile.email.sendCodeFailed') } finally { sending.value = false } }
async function save() { if (!form.email || !form.code || saving.value) return; saving.value = true; error.value = ''; try { await updateAccountEmail(form); await user.refreshProfile(); const toast = await toastController.create({ message: t('profile.email.saved'), color: 'success', duration: 1500, position: 'top' }); await toast.present(); await router.back() } catch (cause) { error.value = cause instanceof Error ? cause.message : t('profile.email.saveFailed') } finally { saving.value = false } }
</script>
