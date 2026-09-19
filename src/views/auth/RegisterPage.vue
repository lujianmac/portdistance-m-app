<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-buttons slot="start"><AppBackButton default-href="/auth/login" /></ion-buttons><ion-title>{{ t('auth.register.title') }}</ion-title></ion-toolbar></ion-header>
    <ion-content class="page-content">
      <ion-list inset>
        <ion-item><ion-input v-model.trim="form.email" :label="t('auth.register.email')" fill="outline" label-placement="floating" type="email" inputmode="email" :placeholder="t('auth.register.emailPlaceholder')" /></ion-item>
        <ion-item><ion-input v-model.trim="form.nickname" :label="t('auth.register.nickname')" fill="outline" label-placement="floating" :placeholder="t('auth.register.nicknamePlaceholder')" /></ion-item>
        <ion-item><ion-input v-model="form.code" :label="t('auth.register.code')" fill="outline" label-placement="floating" inputmode="numeric" :placeholder="t('auth.register.codePlaceholder')"><ion-button slot="end" fill="clear" :disabled="cooldown > 0 || sending" @click="sendCode">{{ cooldown ? `${cooldown}s` : t('auth.register.sendCode') }}</ion-button></ion-input></ion-item>
        <ion-item><ion-input v-model="form.password" :label="t('auth.register.password')" fill="outline" label-placement="floating" type="password" autocomplete="new-password" :placeholder="t('auth.register.passwordPlaceholder')" /></ion-item>
      </ion-list>
      <p v-if="error" class="inline-error">{{ error }}</p>
      <ion-button expand="block" size="large" :disabled="!canSubmit" :loading="submitting" @click="submit">{{ t('auth.register.submit') }}</ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonList, IonPage, IonTitle, IonToolbar } from '@ionic/vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { register, sendEmailCode } from '@/api/auth'
import { useUserStore } from '@/stores/user'
import AppBackButton from '@/components/AppBackButton.vue'

const { t } = useI18n()
const router = useRouter()
const user = useUserStore()
const form = reactive({ email: '', nickname: '', code: '', password: '' })
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
  error.value = ''
  try {
    await sendEmailCode(form.email)
    cooldown.value = 60
    timer = window.setInterval(() => {
      cooldown.value -= 1
      if (cooldown.value <= 0 && timer) { window.clearInterval(timer); timer = null }
    }, 1000)
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('auth.register.sendCodeFailed')
  } finally {
    sending.value = false
  }
}

async function submit() {
  if (!canSubmit.value || submitting.value) return
  submitting.value = true
  error.value = ''
  try {
    const token = await register(form)
    await user.completeAuthentication(token)
    await router.replace('/tabs/distance')
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('auth.register.failed')
  } finally {
    submitting.value = false
  }
}
</script>
