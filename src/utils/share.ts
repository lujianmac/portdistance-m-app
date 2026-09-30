import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'
import { Clipboard } from '@capacitor/clipboard'

/**
 * WeChat's iOS share extension rejects a plain-text-only item ("不支持的分享类型"),
 * but it does accept a link. Every share therefore carries the site URL as well:
 * on Android Capacitor appends it to the text, on iOS it is shared as an NSURL.
 */
export const SHARE_APP_URL = 'https://www.portdistance.com'

export async function shareText(title: string, text: string, url: string = SHARE_APP_URL) {
  if (Capacitor.isNativePlatform()) {
    try {
      const capability = await Share.canShare()
      if (capability.value) {
        await Share.share({ title, text, url, dialogTitle: title })
        return true
      }
      await Clipboard.write({ string: text })
      return true
    } catch {
      // Cancelled, or a target that rejects the payload: keep the content on the
      // clipboard so the user can still paste it somewhere.
      await Clipboard.write({ string: text }).catch(() => undefined)
      return true
    }
  }

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url })
      return true
    } catch {
      // Cancelled or unsupported -> fall through to the clipboard below.
    }
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
