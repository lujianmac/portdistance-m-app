<template>
  <ion-page>
    <ion-content :scroll-y="false" class="map-content"><MapWorkspace ref="mapWorkspace" /></ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { IonContent, IonPage, onIonViewDidEnter } from '@ionic/vue'
import MapWorkspace from '@/components/MapWorkspace.vue'

const mapWorkspace = ref<{ invalidateSize: () => void } | null>(null)

onIonViewDidEnter(async () => {
  await nextTick()
  requestAnimationFrame(() => mapWorkspace.value?.invalidateSize())
})
</script>

<style scoped>
.map-content { --background: #dfecef; --map-bottom-control-offset: calc(72px + env(safe-area-inset-bottom)); }
</style>
