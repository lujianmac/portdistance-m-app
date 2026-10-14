<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-buttons slot="start"><AppBackButton default-href="/auth/login" /></ion-buttons><ion-title>{{ t('auth.register.title') }}</ion-title></ion-toolbar></ion-header>
    <ion-content class="page-content auth-page-content">
      <div class="auth-form">
        <ion-input v-model.trim="form.email" label-placement="floating" :label="t('auth.register.email')" type="email" inputmode="email" :placeholder="t('auth.register.emailPlaceholder')" />
        <ion-input v-model="form.code" label-placement="floating" :label="t('auth.register.code')" inputmode="numeric" :placeholder="t('auth.register.codePlaceholder')"><ion-button slot="end" fill="clear" class="code-send" :disabled="cooldown > 0 || sending" @click="sendCode">{{ cooldown ? `${cooldown}s` : t('auth.register.sendCode') }}</ion-button></ion-input>
        <ion-input v-model="form.password" label-placement="floating" :label="t('auth.register.password')" :type="passwordVisible ? 'text' : 'password'" autocomplete="new-password" :placeholder="t('auth.register.passwordPlaceholder')">
          <ion-button slot="end" fill="clear" color="medium" :aria-label="t('auth.login.togglePassword')" @click="passwordVisible = !passwordVisible">
            <Eye v-if="!passwordVisible" :size="19" />
            <EyeOff v-else :size="19" />
          </ion-button>
        </ion-input>
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
import { Eye, EyeOff } from 'lucide-vue-next'
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
/*
 * 验证码重发节流（秒）。后端的验证码本身 5 分钟内有效，这个倒计时只限制「重新发送」的频率，
 * 并不决定验证码的安全强度（真正起作用的是 5 分钟有效期 + 后端的次数/频率限制）；
 * 改成 120s 只是省短信费 / 防刷，安全收益很小，要改只改这一处。
 */
const CODE_RESEND_SECONDS = 60
const form = reactive({ email: '', code: '', password: '' })
const passwordVisible = ref(false)
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
    cooldown.value = CODE_RESEND_SECONDS
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
  /*
   * grid 子项默认 min-width:auto：一旦「label + 右侧按钮」的 min-content 超过输入框宽度，
   * 整个 ion-input 就会被撑宽并溢出表单（西/希/土语实测溢出到屏幕外、按钮被裁掉）。允许收缩。
   */
  min-width: 0;
}

/* ion-input 内部的行容器同样要能收缩，否则 label 不会给右侧按钮让位 */
.auth-form ion-input :deep(.input-wrapper) { min-width: 0; }

/*
 * 验证码输入框右侧的「获取验证码」按钮：Ionic 默认左右各 16px 内边距，
 * 标签较长的语种下会把 label 挤到只剩很小宽度而被省略号截断。
 * 收紧内边距，把宽度让给 label；按钮文字仍贴齐输入框右边缘（与密码框的眼睛图标一致）。
 */
.auth-form ion-input ion-button.code-send { --padding-start: 2px; --padding-end: 0; }

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
