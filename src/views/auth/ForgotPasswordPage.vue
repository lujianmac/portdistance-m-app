<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-buttons slot="start"><AppBackButton default-href="/auth/login" /></ion-buttons><ion-title>{{ t('auth.forgotPassword.title') }}</ion-title></ion-toolbar></ion-header>
    <ion-content class="page-content">
      <ion-list inset>
        <ion-item><ion-input v-model.trim="form.email" :label="t('auth.forgotPassword.email')" fill="outline" label-placement="floating" type="email" inputmode="email" :placeholder="t('auth.forgotPassword.emailPlaceholder')" /></ion-item>
        <ion-item><ion-input v-model="form.code" :label="t('auth.forgotPassword.code')" fill="outline" label-placement="floating" inputmode="numeric" :placeholder="t('auth.forgotPassword.codePlaceholder')"><ion-button slot="end" fill="clear" :disabled="cooldown > 0 || sending" @click="sendCode">{{ cooldown ? `${cooldown}s` : t('auth.forgotPassword.sendCode') }}</ion-button></ion-input></ion-item>
        <ion-item><ion-input v-model="form.password" :label="t('auth.forgotPassword.password')" fill="outline" label-placement="floating" type="password" autocomplete="new-password" :placeholder="t('auth.forgotPassword.passwordPlaceholder')" /></ion-item>
      </ion-list>
      <p v-if="error" class="inline-error">{{ error }}</p>
      <ion-button expand="block" size="large" :disabled="!canSubmit" :loading="submitting" @click="submit">{{ t('auth.forgotPassword.submit') }}</ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonList, IonPage, IonTitle, IonToolbar } from '@ionic/vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { resetPassword, sendResetPasswordCode } from '@/api/auth'
import AppBackButton from '@/components/AppBackButton.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const form = reactive({ email: String(route.query.email || ''), code: '', password: '' })
const cooldown = ref(0)
const sending = ref(false)
const submitting = ref(false)
const error = ref('')
let timer: number | null = null
const canSubmit = computed(() => Boolean(form.email && form.code && form.password.length >= 6 && form.password.length <= 16))
onBeforeUnmount(() => { if (timer) window.clearInterval(timer) })

async function sendCode() {
  if (!form.email || sending.value || cooldown.value) return
  sending.value = true
  try {
    await sendResetPasswordCode(form.email)
    cooldown.value = 60
    timer = window.setInterval(() => { cooldown.value -= 1; if (cooldown.value <= 0 && timer) { window.clearInterval(timer); timer = null } }, 1000)
  } catch (cause) { error.value = cause instanceof Error ? cause.message : t('auth.forgotPassword.sendCodeFailed') } finally { sending.value = false }
}

async function submit() {
  if (!canSubmit.value || submitting.value) return
  submitting.value = true
  error.value = ''
  try { await resetPassword(form); await router.replace({ name: 'login', query: { email: form.email } }) }
  catch (cause) { error.value = cause instanceof Error ? cause.message : t('auth.forgotPassword.failed') }
  finally { submitting.value = false }
}
</script>
