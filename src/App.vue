<template>
  <ion-app>
    <ion-router-outlet />
    <QuotaExhaustedDialog :is-open="quotaDialogOpen" :source="quotaDialogSource" @close="closeQuotaDialog" />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import QuotaExhaustedDialog from '@/components/common/QuotaExhaustedDialog.vue'
import { useQuotaExhaustedDialog } from '@/utils/quota'
import { useIonicTextTransformFix } from '@/utils/ionic-text-transform'

// 「当天次数已用完」弹窗只在这里挂一次：航程计算 / 航次预算 / 购买记录三处共用。
const { isOpen: quotaDialogOpen, source: quotaDialogSource, close: closeQuotaDialog } = useQuotaExhaustedDialog()

// Ion-datetime 内部的「取消/确定」按钮在它自己的 shadow 里，外部 CSS 改不到，见该文件注释。
useIonicTextTransformFix()
</script>
