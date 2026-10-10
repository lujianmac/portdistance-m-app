<template>
  <ion-page><ion-header><ion-toolbar><ion-buttons slot="start"><AppBackButton default-href="/tabs/profile" /></ion-buttons><ion-title>{{ t('profile.password.title') }}</ion-title></ion-toolbar></ion-header><ion-content class="page-content">
      <ion-list class="profile-form">
        <ion-item lines="full">
          <ion-input v-model="form.oldPassword" :label="t('profile.password.oldLabel')" label-placement="floating" :type="oldVisible ? 'text' : 'password'" autocomplete="current-password" :placeholder="t('profile.password.oldPlaceholder')">
            <ion-button slot="end" fill="clear" color="medium" :aria-label="t('auth.login.togglePassword')" @click="oldVisible = !oldVisible">
              <Eye v-if="!oldVisible" :size="19" />
              <EyeOff v-else :size="19" />
            </ion-button>
          </ion-input>
        </ion-item>
        <ion-item lines="full">
          <ion-input v-model="form.password" :label="t('profile.password.newLabel')" label-placement="floating" :type="newVisible ? 'text' : 'password'" autocomplete="new-password" :placeholder="t('profile.password.newPlaceholder')">
            <ion-button slot="end" fill="clear" color="medium" :aria-label="t('auth.login.togglePassword')" @click="newVisible = !newVisible">
              <Eye v-if="!newVisible" :size="19" />
              <EyeOff v-else :size="19" />
            </ion-button>
          </ion-input>
        </ion-item>
      </ion-list>
      <p v-if="error" class="inline-error">{{ error }}</p>
      <ion-button expand="block" :disabled="!canSubmit" :loading="saving" @click="save">{{ t('profile.password.save') }}</ion-button>
    </ion-content></ion-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonList, IonPage, IonTitle, IonToolbar, toastController } from '@ionic/vue'
import { Eye, EyeOff } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import AppBackButton from '@/components/AppBackButton.vue'
import { updatePassword } from '@/api/user'

const { t } = useI18n()
const form = reactive({ oldPassword: '', password: '' })
/** 两个密码框各自独立切换明文（与登录页同一套写法）。 */
const oldVisible = ref(false)
const newVisible = ref(false)
const saving = ref(false)
const error = ref('')
const canSubmit = computed(() => form.oldPassword.length >= 6 && form.password.length >= 6 && form.password.length <= 16)
async function save() { if (!canSubmit.value || saving.value) return; saving.value = true; error.value = ''; try { await updatePassword(form); form.oldPassword = ''; form.password = ''; const toast = await toastController.create({ message: t('profile.password.updated'), color: 'success', duration: 1600, position: 'top' }); await toast.present() } catch (cause) { error.value = cause instanceof Error ? cause.message : t('common.saveFailed') } finally { saving.value = false } }
</script>

<style scoped>
/* 页面级左右内边距：全局 .page-content 是 12px，密码表单页放宽到 18px
   （与账号/邮箱页同一取值，三页视觉一致）。只覆盖本页。 */
.page-content {
  --padding-start: 18px;
  --padding-end: 18px;
}

/* 「保存」按钮与表单之间再留大一点间距：ion-button 自带 margin-top 4px，
   这里提到 20px（+16px）。 */
.page-content > ion-button {
  margin-top: 20px;
}

/* 下划线表单：去掉 ion-list / ion-item 的白色卡片底与两侧内边距，只保留 item 的
   lines="full" 下划线；ion-input 去掉 outline 填充，--padding-start: 0 让输入值
   与下划线左对齐（下划线画在 .item-native 的整行宽度上）。 */
.profile-form {
  margin: 0;
  padding: 0;
  background: transparent;
  --background: transparent;
  --ion-item-background: transparent;
}
.profile-form ion-item {
  --background: transparent;
  --padding-start: 0;
  --padding-end: 0;
  --inner-padding-end: 0;
  --border-color: #cfdded;
}
.profile-form ion-item:focus-within { --border-color: #006c8c; }

/* 浮动标签度量：Ionic 把浮起的 label 与数值放在同一列里，数值在剩余空间里居中，
   所以「label ↔ 数值」间距由控件高度决定（高度 +2px = 上下各 +1px），
   --padding-bottom 只决定数值与下划线之间的余量。这里沿用航次预算编辑器实测过的
   knob（62px / --padding-top 6px / --padding-bottom 0 / 17px 字号 ≈ 8.2px 的
   label ↔ 数值），按字号 +1px 补 2px 高度 → 18px 字号取 64px / 6px / 0，估算 ≈8px。
   min-height 必须 !important：Ionic 自带的
   .input-label-placement-floating.sc-ion-input-md-h { min-height: 56px } 特异性高于
   ion-input.input-label-placement-floating（2 个 class 胜过 1 个 class + 元素）。
   字号同样要 !important：app.css 用 ion-input / input { font-size: 16px !important } 锁死 16px。 */
.profile-form ion-input {
  --background: transparent;
  --border-width: 0;
  --padding-start: 0;
  --padding-end: 0;
  --padding-top: 6px;
  --padding-bottom: 0;
  min-height: 64px !important;
  font-size: 18px !important;
}
/* Ionic 9 的 ion-input 内部是 light DOM（scoped）而非 shadow DOM，::part(native) 命中不了，
   数值文本必须用 :deep(input) 才能盖掉 app.css 的 16px。 */
.profile-form ion-input :deep(input) { font-size: 18px !important; }

/*
 * label 与输入值的间距：把「已浮起」的 label 再上移 4px。
 * 不能用加大控件高度来做——值在控件里居中，加高度会把值同时相对 label 和下边缘各推 4px，
 * 而下划线间距会跟着变大；这里只动 label 自身，控件与行高完全不变。
 * 只命中 .label-floating（有值/聚焦时才加），空值未聚焦时的静止 label 不受影响。
 */
.profile-form ion-input.input-label-placement-floating.label-floating :deep(.label-text-wrapper) {
  transform: translateY(calc(50% - 4px)) scale(0.75) !important;
}
</style>
