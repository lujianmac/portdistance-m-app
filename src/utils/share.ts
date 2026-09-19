import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'
import { Clipboard } from '@capacitor/clipboard'

export async function shareText(title: string, text: string) {
  if (Capacitor.isNativePlatform()) {
    try {
      const capability = await Share.canShare()
      if (capability.value) {
        await Share.share({ title, text, dialogTitle: title })
        return true
      }
      await Clipboard.write({ string: text })
      return true
    } catch {
      await Clipboard.write({ string: text }).catch(() => undefined)
      return true
    }
  }
  if (navigator.share) {
    await navigator.share({ title, text })
    return true
  }
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text)
    return true
  }
  return false
}

export async function copyText(value: string) {
  if (Capacitor.isNativePlatform()) {
    await Clipboard.write({ string: value })
    return true
  }
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(value)
    return true
  }
  return false
}
