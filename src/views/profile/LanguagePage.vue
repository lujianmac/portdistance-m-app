<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><AppBackButton default-href="/tabs/profile" /></ion-buttons>
        <ion-title>{{ t('language.title') }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="page-content">
      <ion-list>
        <ion-list-header>{{ t('language.sectionTitle') }}</ion-list-header>
        <ion-radio-group :value="localeStore.preference" @ion-change="onPreferenceChange">
          <ion-item button :detail="false" @click="select('system')">
            <ion-label>
              {{ t('language.system') }}
              <p>{{ t('language.systemHint') }}</p>
            </ion-label>
            <ion-note slot="end">{{ localeStore.option.nativeName }}</ion-note>
            <ion-radio slot="end" value="system" />
          </ion-item>
          <ion-item v-for="item in SUPPORTED_LOCALES" :key="item.code" button :detail="false" @click="select(item.code)">
            <ion-label>{{ item.nativeName }}</ion-label>
            <ion-radio slot="end" :value="item.code" />
          </ion-item>
        </ion-radio-group>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonHeader, IonItem, IonLabel, IonList, IonListHeader, IonNote, IonPage, IonRadio, IonRadioGroup, IonTitle, IonToolbar } from '@ionic/vue'
import { useI18n } from 'vue-i18n'
import AppBackButton from '@/components/AppBackButton.vue'
import { SUPPORTED_LOCALES, isAppLocale, type LocalePreference } from '@/i18n/locales/meta'
import { useLocaleStore } from '@/stores/locale'

const { t } = useI18n()
const localeStore = useLocaleStore()

function onPreferenceChange(event: CustomEvent) {
  const value = String(event.detail?.value ?? '')
  const next: LocalePreference = value === 'system' || isAppLocale(value) ? (value as LocalePreference) : 'system'
  localeStore.setPreference(next)
}

/**
 * 整行可点：点击行内任意位置与点最右侧 radio 等价，直接写 store。
 * ion-radio-group 的 value 绑定的是 localeStore.preference，store 更新后
 * 组的 value 变化会通过 ionValueChange 让各 radio 重新计算 aria-checked/选中态，
 * 所以 radio 视觉与无障碍状态都保持同步（radio 自身的点击路径仍走 onPreferenceChange，
 * 重复写同一个值是幂等的）。
 */
function select(value: LocalePreference) {
  localeStore.setPreference(value)
}
</script>

<style scoped>
/* 行左右起点与「联系我们」对齐：联系页用 .page-content 的 12px 内容内边距、列表没有 inset，
   卡片白底从 12px 开始（卡片自带 1px 边框，实测行 13px、行内文字 29px）；本页原来带 inset，
   Ionic 组件自带的 .list-ios.list-inset / .list-md.list-inset（优先级高于全局
   ion-list[inset] 的 margin-inline: 0）会再加 16px 的 margin-inline，实测行落在 28px
   （12 + 16）、文字 44px。这里去掉 inset 并显式清零列表外边距兜底：行回到 12px、文字 28px，
   与联系页同一基线，差异只剩卡片那 1px 边框。
   副带效果：inset 的 16px 上下外边距与 10px 圆角一并去掉，列表顶部从 72/84px（iOS/MD）
   变成 56/68px，正好与联系页卡片顶部一致；.list-md 自带的上下 8px padding 左右不影响。 */
ion-list {
  margin-inline: 0;
}

/* 语言行高度：Ionic 默认 iOS 44px / MD 48px，这里提到 64px，整行可点后点按目标更大
   （「跟随系统」那行还有第二行提示文案，64px 也放得下）。 */
ion-item {
  --min-height: 64px;
}
</style>
