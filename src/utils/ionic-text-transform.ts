import { onBeforeUnmount, onMounted } from 'vue'

/**
 * Ionic 在 md（Material）下把按钮类文字强制 `text-transform: uppercase` 并加 0.06em 字距，
 * 涉及 ion-button / ion-segment-button / ion-back-button / ion-item-option / ion-datetime 标题，
 * 以及 ion-alert 的 .alert-button。本应用整体是 iOS 的扁平观感，英文全大写既不一致，
 * 也会让 "Create account" 这类文案变宽、在窄屏换行。
 *
 * 其中绝大多数由 `src/styles/app.css` 里的 `::part(native)` 规则覆盖（ion-alert 是 scoped
 * 组件，用普通选择器即可）。唯一够不到的是 **ion-datetime 内部的「取消/确定」按钮**：
 * 它们在 ion-datetime 自己的 shadow root 里、且没有暴露 part，外部样式表无法匹配，
 * 所以这里在 datetime 挂载后往它的 shadow root 补一条只改大小写与字距的样式。
 *
 * 影响面：只覆盖 text-transform / letter-spacing，不动颜色、尺寸、间距；
 * 仅在 md 平台生效（iOS 本来就不大写）。Ionic 升级后若给这些按钮暴露了 part，
 * 可以直接删掉本文件并在 app.css 里补选择器。
 */
const SHADOW_STYLE = 'ion-button::part(native) { text-transform: none; letter-spacing: normal; }'

let observer: MutationObserver | undefined

function patchDatetimeShadows(root: ParentNode = document) {
  root.querySelectorAll?.('ion-datetime').forEach((element) => {
    const shadow = (element as HTMLElement).shadowRoot
    if (!shadow || shadow.querySelector('style[data-app-text-transform]')) return
    const style = document.createElement('style')
    style.setAttribute('data-app-text-transform', '')
    style.textContent = SHADOW_STYLE
    shadow.appendChild(style)
  })
}

export function installIonicTextTransformFix() {
  if (document.documentElement.classList.contains('ios')) return
  patchDatetimeShadows()
  observer = new MutationObserver(() => patchDatetimeShadows())
  observer.observe(document.body, { childList: true, subtree: true })
}

export function removeIonicTextTransformFix() {
  observer?.disconnect()
  observer = undefined
}

/** 在 App.vue 里调用一次：整个应用生命周期只需要一个观察者。 */
export function useIonicTextTransformFix() {
  onMounted(installIonicTextTransformFix)
  onBeforeUnmount(removeIonicTextTransformFix)
}
