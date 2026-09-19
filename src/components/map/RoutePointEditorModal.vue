<template>
  <div v-if="visible" class="route-editor-mask" @click.self="onCancel">
    <section class="route-editor-panel">
      <header class="route-editor-header">
        <h3 class="route-editor-title">{{ t('map.core.routePoint.title') }}</h3>
        <button class="route-editor-close" type="button" :aria-label="t('common.close')" @click="onCancel">✕</button>
      </header>

      <div class="route-editor-body">
        <p class="route-editor-name">{{ routePointName }}</p>

        <label class="route-editor-option">
          <input v-model="localState" type="radio" value="1" />
          {{ t('map.core.routePoint.optionRequired') }}
        </label>
        <label class="route-editor-option">
          <input v-model="localState" type="radio" value="0" />
          {{ t('map.core.routePoint.optionAllowed') }}
        </label>
        <label class="route-editor-option">
          <input v-model="localState" type="radio" value="-1" />
          {{ t('map.core.routePoint.optionForbidden') }}
        </label>

        <label v-if="localState === '1'" class="route-editor-select-label">
          {{ t('map.core.routePoint.prePortLabel') }}
          <select v-model="localPrePortCode" class="route-editor-select">
            <option value="">{{ t('map.core.routePoint.prePortPlaceholder') }}</option>
            <option v-for="port in availablePorts" :key="port.portId || port.portCode" :value="port.portId || port.portCode">
              {{ port.portName }}
            </option>
          </select>
        </label>
      </div>

      <footer class="route-editor-footer">
        <button type="button" class="btn btn-secondary" @click="onCancel">{{ t('common.cancel') }}</button>
        <button type="button" class="btn btn-primary" :disabled="!canConfirm" @click="onConfirm">{{ t('common.confirm') }}</button>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RouteState } from '@/types/map'
import type { Port } from '@/types/protocol'

const { t } = useI18n()

const props = defineProps<{
  visible: boolean
  routePointName: string
  state: RouteState
  prePortCode?: string
  availablePorts: Port[]
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'confirm', payload: { state: RouteState; prePortCode?: string }): void
}>()

const localState = ref<RouteState>(props.state)
const localPrePortCode = ref(props.prePortCode || '')

watch(
  () => [props.visible, props.state, props.prePortCode] as const,
  () => {
    localState.value = props.state
    localPrePortCode.value = props.prePortCode || ''
  }
)

const canConfirm = computed(() => {
  if (localState.value !== '1') return true
  return !!localPrePortCode.value
})

function onCancel() {
  emit('cancel')
}

function onConfirm() {
  emit('confirm', {
    state: localState.value,
    prePortCode: localState.value === '1' ? localPrePortCode.value : undefined
  })
}
</script>
