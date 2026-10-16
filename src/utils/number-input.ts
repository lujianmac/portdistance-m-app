import type { Directive } from 'vue'

/**
 * `v-number-draft`：让「数字输入框可以真正被清空」。
 *
 * 背景：这些输入框的显示值都直接绑 store（`:value="numberText(x)"`），而 `@ion-input`
 * 处理函数是 `Math.max(0, Number(value || 0))`。用户把内容删空时，空串被当成 0 写进 store，
 * 显示值马上变回 "0"（航速那处是变回默认 12），表现就是"最后一位数字删不掉"。
 *
 * 做法：在元素上以 capture 方式、并且在 Vue 的事件监听之前（指令 `created` 早于 props 打补丁）
 * 先拿到 `ionInput`：
 *   - 文本为空或不是合法数字 —— 拦下来（stopImmediatePropagation），业务 handler 不会把 0 写进 store，
 *     绑定值不变，Vue 也不会回写 DOM，输入框就停在用户删出来的空态；
 *   - 文本合法 —— 放行，并记住它的规范形式（"07"/"1." → "7"/"1"）作为"最后一次有效值"。
 * 失焦时若框里仍是空/非法文本，就用记下的有效值恢复显示（等于取消这次清空），
 * 不会出现"框里空着、实际还在参与计算"的错位。
 *
 * 用法：给数字型 ion-input 加一个属性即可，处理函数不用改。
 *   <ion-input v-number-draft :value="numberText(x)" @ion-input="updateX('x', $event)" />
 */
/**
 * 用法：
 *   <ion-input v-number-draft       :value="numberText(x)" @ion-input="updateX('x', $event)" />
 *   <ion-input v-number-draft.raw   :value="..." @ion-input="..." @ion-blur="normalizeX('x', $event)" />
 *
 * `.raw` 修饰符：**不做**"清空后恢复上一次有效值"这一步，把空文本原样留给字段自己的失焦处理函数
 * 决定（航速这类字段要的是"删掉就按默认 12 处理"，而不是退回旧值——否则旧值是 1 时看起来就像
 * "删掉又变成了 1"）。
 */
interface NumberDraftState {
  last: string
}

const STATE_KEY = '__numberDraft'

type NumberInputElement = HTMLElement & { value?: unknown; [STATE_KEY]?: NumberDraftState }

function textOf(event: Event) {
  const detail = (event as CustomEvent<{ value?: unknown }>).detail?.value
  const raw = Array.isArray(detail) ? detail[0] : detail
  return String(raw ?? '')
}

function isUsableNumberText(text: string) {
  return text.trim() !== '' && Number.isFinite(Number(text))
}

export const vNumberDraft: Directive<NumberInputElement> = {
  created(el, binding) {
    el[STATE_KEY] = { last: String(el.value ?? '') }
    const keepEmptyForHost = Boolean(binding.modifiers.raw)

    el.addEventListener('ionInput', (event) => {
      const text = textOf(event)
      if (!isUsableNumberText(text)) {
        // 空 / 中间态（"."、"-"）：不写 store，也不让输入框被绑定的旧值覆盖回去
        event.stopImmediatePropagation()
        /*
         * 可选回调：把"被清空"这件事立刻告诉宿主（值由宿主决定，例如航速按默认 12 处理）。
         * 关键在 iOS：数字键盘没有"完成"键、侧滑返回也不一定触发 blur，只靠失焦兜底会漏，
         * 所以"清空"必须当场生效，而不是等失焦。
         */
        const notify = binding.value
        if (typeof notify === 'function') notify()
        return
      }
      const state = el[STATE_KEY]
      if (state) state.last = String(Number(text))
    }, true)

    el.addEventListener('ionBlur', () => {
      if (keepEmptyForHost) return
      const current = String(el.value ?? '')
      if (isUsableNumberText(current)) return
      const state = el[STATE_KEY]
      if (state) el.value = state.last
    }, true)
  },
  /**
   * 绑定值被外部改动时（模板应用、单位切换、以及失焦归一化把 0 改回 12 这类），
   * 同步刷新"最后一次有效值"。否则记的仍是旧文本，下次清空后失焦会恢复出一个过期数字
   * （Vue 因为绑定值没变不会回写 DOM，屏幕上的数字就会和 store 不一致）。
   */
  updated(el) {
    const current = String(el.value ?? '')
    if (!isUsableNumberText(current)) return
    const state = el[STATE_KEY]
    if (state) state.last = String(Number(current))
  },
}
