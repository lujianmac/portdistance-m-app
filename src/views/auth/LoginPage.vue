<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ t('auth.login.title') }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="auth-content">
      <main class="auth-shell">
        <div class="brand-mark" aria-hidden="true"><Navigation :size="32" /></div>
        <h1>PortDistance</h1>
        <p>{{ t('auth.login.subtitle') }}</p>
        <ion-list inset>
          <ion-item>
            <ion-input v-model.trim="form.email" :label="t('auth.login.email')" fill="outline" label-placement="floating" type="email" inputmode="email" autocomplete="email" :placeholder="t('auth.login.emailPlaceholder')" />
          </ion-item>
          <ion-item>
            <ion-input v-model="form.password" :label="t('auth.login.password')" fill="outline" label-placement="floating" :type="passwordVisible ? 'text' : 'password'" autocomplete="current-password" :placeholder="t('auth.login.passwordPlaceholder')">
              <ion-button slot="end" fill="clear" color="medium" :aria-label="t('auth.login.togglePassword')" @click="passwordVisible = !passwordVisible">
                <Eye v-if="!passwordVisible" :size="19" />
                <EyeOff v-else :size="19" />
              </ion-button>
            </ion-input>
          </ion-item>
        </ion-list>
        <p v-if="error" class="inline-error">{{ error }}</p>
        <ion-button expand="block" size="large" :disabled="!canSubmit" :loading="user.loading" @click="submit">{{ t('auth.login.submit') }}</ion-button>
        <div class="auth-links">
          <router-link :to="{ name: 'forgot-password', query: { email: form.email } }">{{ t('auth.login.forgotPassword') }}</router-link>
          <router-link :to="{ name: 'register' }">{{ t('auth.login.register') }}</router-link>
        </div>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { IonButton, IonContent, IonHeader, IonInput, IonItem, IonList, IonPage, IonTitle, IonToolbar, toastController } from '@ionic/vue'
import { Eye, EyeOff, Navigation } from 'lucide-vue-next'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/user'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const user = useUserStore()
const form = reactive({ email: String(route.query.email || ''), password: '' })
const passwordVisible = ref(false)
const error = ref('')
const canSubmit = computed(() => Boolean(form.email && form.password))

async function submit() {
  if (!canSubmit.value || user.loading) return
  error.value = ''
  try {
    await user.login(form)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/tabs/distance'
    await router.replace(redirect)
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('auth.login.failed')
    const toast = await toastController.create({ message: error.value, duration: 2200, color: 'danger', position: 'top' })
    await toast.present()
  }
}
</script>

<style scoped>
.auth-content { --background: linear-gradient(155deg, #e7f3f4 0%, #f7f8f5 55%, #fff1e9 100%); }
.auth-shell { width: min(100%, 460px); margin: 0 auto; padding: 40px 14px 28px; }
.brand-mark { display: grid; width: 58px; height: 58px; place-items: center; border-radius: 8px; background: #006c8c; color: #fff; box-shadow: 0 12px 24px rgba(0, 108, 140, .22); }
h1 { margin: 22px 0 6px; color: #173447; font-size: 30px; line-height: 1.2; }
p { margin: 0 0 24px; color: #607486; font-size: 15px; line-height: 1.55; }
ion-list { margin: 0 0 14px; }
.auth-links { display: flex; justify-content: space-between; margin-top: 20px; font-size: 14px; }
.auth-links a { color: #006c8c; text-decoration: none; }
</style>
