<template>
  <ion-back-button :text="t('common.back')" :default-href="defaultHref" :icon="icon" />
</template>

<script setup lang="ts">
import { IonBackButton } from '@ionic/vue'
import { useI18n } from 'vue-i18n'

/**
 * Wrapper around `ion-back-button` so the label follows the active language.
 * Ionic only reads `backButtonText` once at start-up, hence the explicit binding.
 */
defineProps<{ defaultHref?: string; icon?: string }>()

const { t } = useI18n()
</script>
