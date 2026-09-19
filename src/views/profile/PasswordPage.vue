<template>
  <ion-page><ion-header><ion-toolbar><ion-buttons slot="start"><AppBackButton default-href="/tabs/profile" /></ion-buttons><ion-title>{{ t('profile.password.title') }}</ion-title></ion-toolbar></ion-header><ion-content class="page-content"><ion-list inset><ion-item><ion-input v-model="form.oldPassword" :label="t('profile.password.oldLabel')" fill="outline" label-placement="floating" type="password" autocomplete="current-password" :placeholder="t('profile.password.oldPlaceholder')" /></ion-item><ion-item><ion-input v-model="form.password" :label="t('profile.password.newLabel')" fill="outline" label-placement="floating" type="password" autocomplete="new-password" :placeholder="t('profile.password.newPlaceholder')" /></ion-item></ion-list><p v-if="error" class="inline-error">{{ error }}</p><ion-button expand="block" :disabled="!canSubmit" :loading="saving" @click="save">{{ t('profile.password.save') }}</ion-button></ion-content></ion-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonList, IonPage, IonTitle, IonToolbar, toastController } from '@ionic/vue'
import { useI18n } from 'vue-i18n'
import AppBackButton from '@/components/AppBackButton.vue'
import { updatePassword } from '@/api/user'

const { t } = useI18n()
const form = reactive({ oldPassword: '', password: '' })
const saving = ref(false)
const error = ref('')
const canSubmit = computed(() => form.oldPassword.length >= 6 && form.password.length >= 6 && form.password.length <= 16)
async function save() { if (!canSubmit.value || saving.value) return; saving.value = true; error.value = ''; try { await updatePassword(form); form.oldPassword = ''; form.password = ''; const toast = await toastController.create({ message: t('profile.password.updated'), color: 'success', duration: 1600, position: 'top' }); await toast.present() } catch (cause) { error.value = cause instanceof Error ? cause.message : t('common.saveFailed') } finally { saving.value = false } }
</script>
