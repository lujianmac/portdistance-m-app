<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ t('auth.login.title') }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="auth-content">
      <main class="auth-shell">
        <img class="brand-banner" :src="bannerLogo" alt="PortDistance" />
        <div class="auth-form">
          <ion-input v-model.trim="form.email" :label="t('auth.login.email')" label-placement="floating" type="email" inputmode="email" autocomplete="email" :placeholder="t('auth.login.emailPlaceholder')" />
          <ion-input v-model="form.password" :label="t('auth.login.password')" label-placement="floating" :type="passwordVisible ? 'text' : 'password'" autocomplete="current-password" :placeholder="t('auth.login.passwordPlaceholder')">
            <ion-button slot="end" fill="clear" color="medium" :aria-label="t('auth.login.togglePassword')" @click="passwordVisible = !passwordVisible">
              <Eye v-if="!passwordVisible" :size="19" />
              <EyeOff v-else :size="19" />
            </ion-button>
          </ion-input>
        </div>
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
import { IonButton, IonContent, IonHeader, IonInput, IonPage, IonTitle, IonToolbar, onIonViewWillEnter, toastController } from '@ionic/vue'
import { Eye, EyeOff } from 'lucide-vue-next'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/user'
import bannerLogoZh from '@/assets/banner_logo.png'
import bannerLogoEn from '@/assets/banner_logo_en.png'

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()
const user = useUserStore()
const form = reactive({ email: String(route.query.email || ''), password: '' })
const passwordVisible = ref(false)
const error = ref('')
const canSubmit = computed(() => Boolean(form.email && form.password))
/** Chinese banner for zh users, the English one otherwise (the images are transparent PNGs). */
const bannerLogo = computed(() => (locale.value.startsWith('zh') ? bannerLogoZh : bannerLogoEn))

/*
 * 找回密码成功后会带着 ?email=... 回到本页。Ionic 会复用页面栈里缓存的登录页实例
 * （setup 只执行一次），所以不能只在初始化时读一次 query：每次进入视图都按 query 回填，
 * 保证「重置密码时用的那个邮箱」一定出现在邮箱输入框里（没有 query 时不覆盖用户已输入的值）。
 */
onIonViewWillEnter(() => {
  const email = typeof route.query.email === 'string' ? route.query.email : ''
  if (email) form.email = email
})

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
/* 页面左右内边距 28px；表单区再 +4px（按钮是圆角，输入框要比按钮内缩一些） */
.auth-shell { width: min(100%, 460px); margin: 0 auto; padding: 32px 28px 28px; }
/*
 * Banner 居中显示，按语言切换图片（780x228，透明底）。
 * 用 width + height:auto 保持原始比例，max-width 保证窄屏不溢出。
 */
.brand-banner { display: block; width: 260px; max-width: 82%; height: auto; margin: 4px auto 32px; }
/*
 * 表单区不用 outline、也不套 ion-list inset / ion-item：
 * outline 框里的中文 label 不垂直居中，且套进 item 后 label 与输入值间距会被压掉。
 * ion-input 在 iOS 模式下本身不画边框，这里只给宿主底部加一条线，
 * 聚焦时用 :focus-within 变主题色（shadow 内的 input 聚焦同样会命中宿主）。
 */
/* 输入区到主按钮的距离与注册/找回密码页保持一致（26px） */
/* padding-inline 4px：让输入框比按钮再窄 4px */
.auth-form { display: grid; gap: 14px; margin-bottom: 26px; padding-inline: 4px; }
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

.auth-form ion-input:focus-within { border-bottom-color: #006c8c; }
/*
 * 两个文字按钮（找回密码 / 注册新账号）必须各自保持单行：
 * 之前只写了 justify-content: space-between，没有 nowrap，标签一长（英文 16px 下两个标签合计
 * 321px > 360 屏可用的 304px）flex 就会把它们各自压成两行，也就是用户看到的「换行」。
 * 这里 nowrap 锁死单行；万一将来某个语种又变长，flex-wrap 让它们整条换到第二行，
 * 而不是把一条标签从中间劈开。column-gap 保证两行/单行时都不会贴在一起。
 */
.auth-links { display: flex; flex-wrap: wrap; justify-content: space-between; column-gap: 16px; row-gap: 2px; margin-top: 20px; font-size: 16px; }
.auth-links a { color: #006c8c; text-decoration: none; white-space: nowrap; }
</style>
