<template>
  <transition name="offline-banner">
    <div v-if="network.isOffline" class="offline-banner" role="status">
      <WifiOff :size="16" aria-hidden="true" />
      {{ t('tabs.offline.banner') }}
    </div>
  </transition>
</template>

<script setup lang="ts">
import { WifiOff } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { useNetworkStore } from '@/stores/network'

const { t } = useI18n()
const network = useNetworkStore()
</script>
