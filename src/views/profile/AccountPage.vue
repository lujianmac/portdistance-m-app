<template>
  <ion-page><ion-header><ion-toolbar><ion-buttons slot="start"><AppBackButton default-href="/tabs/profile" /></ion-buttons><ion-title>{{ t('profile.account.title') }}</ion-title></ion-toolbar></ion-header><ion-content class="page-content"><ion-list inset><ion-item><ion-input v-model.trim="name" :label="t('profile.account.nameLabel')" fill="outline" label-placement="floating" :maxlength="30" :placeholder="t('profile.account.namePlaceholder')" /></ion-item><ion-item><ion-label>{{ t('profile.account.emailLabel') }}</ion-label><ion-note slot="end">{{ user.profile.email || '-' }}</ion-note></ion-item></ion-list><p v-if="error" class="inline-error">{{ error }}</p><ion-button expand="block" :disabled="!name" :loading="saving" @click="save">{{ t('profile.account.save') }}</ion-button></ion-content></ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonNote, IonPage, IonTitle, IonToolbar, onIonViewWillEnter, toastController } from '@ionic/vue'
import { useI18n } from 'vue-i18n'
import AppBackButton from '@/components/AppBackButton.vue'
import { updateUsername } from '@/api/user'
import { useUserStore } from '@/stores/user'

const { t } = useI18n()
const user = useUserStore()
const name = ref('')
const saving = ref(false)
const error = ref('')
onIonViewWillEnter(() => { name.value = user.profile.name || '' })
watch(() => user.profile.name, (value) => { if (!name.value) name.value = value || '' })
async function save() { if (!name.value.trim() || saving.value) return; saving.value = true; error.value = ''; try { await updateUsername({ username: name.value.trim() }); await user.refreshProfile(); const toast = await toastController.create({ message: t('profile.account.saved'), color: 'success', duration: 1600, position: 'top' }); await toast.present() } catch (cause) { error.value = cause instanceof Error ? cause.message : t('common.saveFailed') } finally { saving.value = false } }
</script>
