<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-buttons slot="start"><AppBackButton default-href="/auth/login" /></ion-buttons><ion-title>{{ t('auth.register.title') }}</ion-title></ion-toolbar></ion-header>
    <ion-content class="page-content auth-page-content">
      <div class="auth-form">
        <ion-input v-model.trim="form.email" label-placement="floating" :label="t('auth.register.email')" type="email" inputmode="email" :placeholder="t('auth.register.emailPlaceholder')" />
        <ion-input v-model="form.code" label-placement="floating" :label="t('auth.register.code')" inputmode="numeric" :placeholder="t('auth.register.codePlaceholder')"><ion-button slot="end" fill="clear" :disabled="cooldown > 0 || sending" @click="sendCode">{{ cooldown ? `${cooldown}s` : t('auth.register.sendCode') }}</ion-button></ion-input>
        <ion-input v-model="form.password" label-placement="floating" :label="t('auth.register.password')" type="password" autocomplete="new-password" :placeholder="t('auth.register.passwordPlaceholder')" />
      </div>
      <p v-if="error" class="inline-error">{{ error }}</p>
      <p class="auth-terms">
        {{ t('auth.register.termsPrefix') }}
        <a :href="termsUrl" target="_blank" rel="noopener">{{ t('auth.register.termsLink') }}</a>
        {{ t('auth.register.termsConjunction') }}
        <a :href="privacyUrl" target="_blank" rel="noopener">{{ t('auth.register.privacyLink') }}</a>{{ t('auth.register.termsSuffix') }}
      </p>
      <ion-button expand="block" size="large" :disabled="!canSubmit" :loading="submitting" @click="submit">{{ t('auth.register.submit') }}</ion-button>
      <ion-button expand="block" fill="clear" class="auth-switch" @click="router.replace({ name: 'login' })">{{ t('auth.register.haveAccount') }}</ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { IonButton, IonButtons, IonContent, IonHeader, IonInput, IonPage, IonTitle, IonToolbar } from '@ionic/vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { register, sendEmailCode } from '@/api/auth'
import { useUserStore } from '@/stores/user'
import AppBackButton from '@/components/AppBackButton.vue'

const { t, locale } = useI18n()
const router = useRouter()
const user = useUserStore()
/** Terms / privacy pages live on the marketing site, per language (same links the old app used). */
const termsUrl = computed(() => `https://www.portdistance.com/pages/${locale.value.startsWith('zh') ? 'zh' : 'en'}/terms.html`)
const privacyUrl = computed(() => `https://www.portdistance.com/pages/${locale.value.startsWith('zh') ? 'zh' : 'en'}/privacy.html`)
const form = reactive({ email: '', code: '', password: '' })
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

<style scoped>
/* 页面左右内边距 28px；表单区再 +4px（按钮是圆角，输入框要比按钮内缩） */
.auth-page-content {
  --padding-top: 28px;
  --padding-start: 28px;
  --padding-end: 28px;
}

/*
 * 下划线输入：不用 outline（中文 label 在 outline 框里不垂直居中），也不套 ion-item。
 * ion-input 在 iOS 模式下本身不画边框，这里只给宿主底部加一条线，聚焦时变主题色。
 */
.auth-form {
  display: grid;
  gap: 14px;
  /* 让输入框比按钮再窄 4px */
  padding-inline: 4px;
  margin-bottom: 26px;
}

.auth-form ion-input {
  --border-radius: 0;
  --padding-start: 0;
  --padding-end: 0;
  --background: transparent;
  border-bottom: 1px solid #cfdded;
  transition: border-color 120ms ease;
  /* 全局把 ion-input 定死在 16px（防 iOS 聚焦缩放），这里要 !important 才能覆盖 */
  font-size: 18px !important;
  /*
   * label 浮起后数值在剩余空间里居中，所以「label ↔ 数值」的间距由控件高度决定：
   * 高度 +8px = 上下各多 4px。改 --padding-top 反而会把数值往上挤（它作用在列外面）。
   */
  min-height: 68px;
}

/* ion-input 在 @ionic/vue 里是 scoped(light DOM)，::part(native) 命中不了；
   内层原生 input 要直接用 :deep() 命中，否则 app.css 的 `input{font-size:16px!important}`
   会把它压回 16px——表现就是 label 变大了、输入值没变。 */
.auth-form ion-input :deep(input) { font-size: 18px !important; }

.auth-form ion-input:focus-within {
  border-bottom-color: #006c8c;
}

/* 服务条款提示：按钮上方，小字灰色，链接带下划线 */
.auth-terms {
  margin: 0 0 18px;
  color: #7b8b9a;
  font-size: 12px;
  line-height: 1.5;
  text-align: center;
}

.auth-terms a {
  color: #006c8c;
  text-decoration: underline;
}

.auth-switch {
  margin-top: 6px;
  --color: #006c8c;
  font-size: 15px;
}
</style>
