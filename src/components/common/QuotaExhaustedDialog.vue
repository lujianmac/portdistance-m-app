<template>
  <ion-modal class="quota-dialog" :is-open="isOpen" @did-dismiss="close">
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ t('common.quota.title') }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <div class="quota-body">
      <p class="quota-message"><span>{{ t(leadKey) }}</span> <span class="quota-url">{{ QUOTA_PURCHASE_URL }}</span> <ion-button class="quota-copy" size="small" fill="outline" :color="copyState === 'failed' ? 'danger' : 'primary'" @click="copyUrl">{{ copyLabel }}</ion-button> <span>{{ t(trailingKey) }}</span></p>
    </div>
    <ion-footer>
      <ion-toolbar class="quota-footer">
        <ion-button class="quota-done" expand="block" @click="close">{{ t('common.close') }}</ion-button>
      </ion-toolbar>
    </ion-footer>
  </ion-modal>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { IonButton, IonFooter, IonHeader, IonModal, IonTitle, IonToolbar } from '@ionic/vue'
import { QUOTA_PURCHASE_URL, type QuotaDialogSource } from '@/utils/quota'
import { copyText } from '@/utils/share'

const props = withDefaults(defineProps<{ isOpen: boolean; source?: QuotaDialogSource }>(), { source: 'exhausted' })
const emit = defineEmits<{ (e: 'close'): void }>()

const { t } = useI18n()
const copyState = ref<'idle' | 'copied' | 'failed'>('idle')
let resetTimer: number | undefined

/**
 * 正文只有「前缀 + 官网地址 + 复制 + 后缀」四个片段，两个入口共用同一套排版，
 * 只有首尾两句换 key：
 *   exhausted → 「当天次数已用完，请登录 … 了解更多」
 *   purchase  → 「请前往 … 购买」（用户只是点购买，不能说他次数用完了）
 */
const leadKey = computed(() => (props.source === 'purchase' ? 'common.quota.purchaseLead' : 'common.quota.lead'))
const trailingKey = computed(() => (props.source === 'purchase' ? 'common.quota.purchaseTrailing' : 'common.quota.trailing'))

const copyLabel = computed(() => {
  if (copyState.value === 'copied') return t('common.copied')
  if (copyState.value === 'failed') return t('common.copyFailed')
  return t('common.copy')
})

function close() {
  emit('close')
}

/** 只复制官网地址，不做任何跳转（应用内不提供外部购买入口）。 */
async function copyUrl() {
  let copied = false
  try {
    copied = await copyText(QUOTA_PURCHASE_URL)
  } catch {
    copied = false
  }
  copyState.value = copied ? 'copied' : 'failed'
  window.clearTimeout(resetTimer)
  resetTimer = window.setTimeout(() => { copyState.value = 'idle' }, 1800)
}

onBeforeUnmount(() => window.clearTimeout(resetTimer))
</script>

<style scoped>
/* --height: auto 让弹窗只占内容高度（和分享弹窗一样，不用整屏）；正文用普通 div，
   不用 ion-content：后者是 contain: size + height: 100%，在自动高度下会塌成 0。 */
.quota-dialog {
  --width: calc(100% - 40px);
  --max-width: 400px;
  --height: auto;
  --max-height: 78%;
  --border-radius: 14px;
  --backdrop-opacity: 0.42;
}
.quota-body { padding: 16px 18px 18px; }
.quota-message { margin: 0; color: #173447; font-size: 15px; line-height: 1.9; }
/* 网址整段不折行：宽度不够时整体换到下一行，不会把 https://www.portdist / ance.com 拆开。 */
.quota-url { color: #006c8c; font-weight: 600; white-space: nowrap; user-select: all; }
.quota-copy {
  --padding-start: 8px;
  --padding-end: 8px;
  --border-radius: 6px;
  height: 26px;
  min-height: 26px;
  margin: 0 4px;
  vertical-align: middle;
  font-size: 12px;
}
/* 底部按钮：文字改成「关闭」，并给容器左右各留 16px 内边距（expand="block" 的按钮原本顶满整行） */
.quota-footer { --padding-start: 16px; --padding-end: 16px; }
.quota-done { margin-inline: 0; }
</style>
