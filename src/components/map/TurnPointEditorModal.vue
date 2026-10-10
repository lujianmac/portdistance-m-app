<template>
  <div v-if="visible" class="turn-editor-mask" @click.self="onCancel">
    <section class="turn-editor-panel">
      <header class="turn-editor-header">
        <h3 class="turn-editor-title">{{ mode === 'create' ? t('map.core.turnPoint.createTitle') : t('map.core.turnPoint.editTitle') }}</h3>
        <button class="turn-editor-close" type="button" :aria-label="t('common.close')" @click="onCancel">×</button>
      </header>

      <div class="turn-editor-body">
        <label class="turn-editor-field">
          {{ t('map.core.turnPoint.longitude') }}
          <input v-model="localLongitude" type="number" inputmode="decimal" min="-180" max="180" step="0.000001" />
        </label>
        <label class="turn-editor-field">
          {{ t('map.core.turnPoint.latitude') }}
          <input v-model="localLatitude" type="number" inputmode="decimal" min="-90" max="90" step="0.000001" />
        </label>
        <p v-if="!canConfirm" class="turn-editor-error">{{ t('map.core.turnPoint.invalidCoordinate') }}</p>
      </div>

      <footer class="turn-editor-footer">
        <button
          v-if="mode === 'edit'"
          type="button"
          class="btn turn-editor-delete"
          :disabled="!canDelete"
          :title="canDelete ? t('common.delete') : t('map.core.turnPoint.deleteLockedHint')"
          @click="onDelete"
        >{{ t('common.delete') }}</button>
        <span class="turn-editor-spacer"></span>
        <button type="button" class="btn btn-secondary" @click="onCancel">{{ t('common.cancel') }}</button>
        <button type="button" class="btn btn-primary" :disabled="!canConfirm" @click="onConfirm">{{ t('common.confirm') }}</button>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  visible: boolean
  mode: 'create' | 'edit'
  canDelete: boolean
  longitude: number
  latitude: number
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'confirm', payload: { longitude: number; latitude: number }): void
  (e: 'delete'): void
}>()

/** Six decimals is the common maritime coordinate precision (~0.11 m). */
const COORDINATE_DECIMALS = 6

function roundCoordinate(value: number) {
  return Number(value.toFixed(COORDINATE_DECIMALS))
}

const localLongitude = ref(roundCoordinate(props.longitude))
const localLatitude = ref(roundCoordinate(props.latitude))

watch(
  () => [props.visible, props.longitude, props.latitude] as const,
  () => {
    localLongitude.value = roundCoordinate(props.longitude)
    localLatitude.value = roundCoordinate(props.latitude)
  }
)

const canConfirm = computed(() => {
  return Number.isFinite(localLongitude.value)
    && Number.isFinite(localLatitude.value)
    && localLongitude.value >= -180
    && localLongitude.value <= 180
    && localLatitude.value >= -90
    && localLatitude.value <= 90
})

function onCancel() {
  emit('cancel')
}

function onConfirm() {
  if (!canConfirm.value) return
  emit('confirm', { longitude: localLongitude.value, latitude: localLatitude.value })
}

function onDelete() {
  emit('delete')
}
</script>

<style scoped>
/*
 * The modal is rendered as a sibling of the map (`PortDistanceMap`), i.e. outside
 * the `.map-shell` element that defines the map theme's `--danger`, so the rule
 * in `styles/leaflet-map.css` (`.turn-editor-delete { color: #fff; background:
 * var(--danger) }`) resolved to `background: transparent` with white text and the
 * button showed up as a blank white block. Draw the danger outline here instead
 * of depending on a variable from a scope this component is not part of.
 *
 * A real 1px border is correct here: the button is a native `<button class="btn">`,
 * not an `ion-button`, so Ionic's md/ios `fill` handling (see the
 * `input-fill-outline:not(.md)` workaround in `styles/app.css`) does not apply.
 * `.btn-secondary` in the same footer already carries a 1px border, so the box
 * model stays consistent with the neighbouring buttons.
 */
.turn-editor-delete {
  border: 1px solid #b42318;
  background: #ffffff;
  color: #b42318;
}

.turn-editor-delete:hover:not(:disabled) {
  background: rgba(180, 35, 24, 0.08);
}

.turn-editor-delete:focus-visible {
  outline: 2px solid #b42318;
  outline-offset: 2px;
}

.turn-editor-delete:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}
</style>