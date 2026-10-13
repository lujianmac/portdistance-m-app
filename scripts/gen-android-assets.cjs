/**
 * 从 `resources/icon.png` 生成 Android 的桌面图标与启动图（App 自己的 logo）。
 *
 * 用法：`node scripts/gen-android-assets.cjs`（或 `npm run assets:android`）
 *
 * 换 logo 时只需要替换 `resources/icon.png`（1024×1024 PNG，建议四周留 ~10% 留白），
 * 然后重跑本脚本即可，**不需要改任何 XML**：
 *   - `AndroidManifest.xml` 用 `@mipmap/ic_launcher` / `@mipmap/ic_launcher_round`；
 *   - `mipmap-anydpi-v26/ic_launcher.xml`（自适应图标）用
 *     `@color/ic_launcher_background`（= `values/ic_launcher_background.xml`，白色）
 *     + `@mipmap/ic_launcher_foreground`。
 *
 * 生成物：
 *   1. `mipmap-{m,h,xh,xxh,xxxh}dpi/ic_launcher.png`（48/72/96/144/192，方形）
 *   2. 同目录 `ic_launcher_round.png`（同尺寸，圆形 alpha 蒙版）
 *   3. 同目录 `ic_launcher_foreground.png`（108dp 画布：108/162/216/324/432，
 *      logo 缩到画布 66%（自适应图标的 72dp 安全区）居中，四周透明）
 *   4. `drawable-port-<density>/splash.png`、`drawable-land-<density>/splash.png`、`drawable/splash.png`
 *      （白底 + logo 居中，logo 边长 = 屏幕短边的 30%）
 *
 * 为什么启动画面的图标也要一起换：Capacitor 的 SplashScreen 插件在 Android 上调用
 * `androidx.core.splashscreen.SplashScreen.installSplashScreen()`（见
 * `node_modules/@capacitor/splash-screen/android/.../SplashScreen.java`），
 * Android 12+ 的系统启动画面显示的是 `windowSplashScreenAnimatedIcon`，默认就是**应用启动图标**；
 * 旧系统（≤11）才用主题里的 `android:background="@drawable/splash"`（即上面的 splash.png）。
 * 所以两处都由这里的图标资源决定。
 *
 * 依赖：仓库里已有的 `fast-png`（纯 JS 解码/编码），不额外安装任何东西。
 */
const fs = require('node:fs')
const path = require('node:path')
const { decode, encode } = require('fast-png')

const REPO = path.resolve(__dirname, '..')
const RES = path.join(REPO, 'android/app/src/main/res')
const SRC = path.join(REPO, 'resources/icon.png')

/** 启动图底色，与 `values/ic_launcher_background.xml` 及 logo 自身底色一致（白），三者无缝。 */
const SPLASH_BG = [255, 255, 255, 255]
/** 启动图里 logo 的边长占屏幕短边的比例。 */
const SPLASH_LOGO_RATIO = 0.3
/** 自适应图标前景里 logo 占 108dp 画布的比例（安全区是 72/108 = 0.667）。 */
const FOREGROUND_RATIO = 0.66
const DENSITIES = [
  ['mdpi', 1],
  ['hdpi', 1.5],
  ['xhdpi', 2],
  ['xxhdpi', 3],
  ['xxxhdpi', 4],
]
const SPLASH_SIZES = [
  ['drawable-port-mdpi', 320, 480],
  ['drawable-port-hdpi', 480, 800],
  ['drawable-port-xhdpi', 720, 1280],
  ['drawable-port-xxhdpi', 960, 1600],
  ['drawable-port-xxxhdpi', 1280, 1920],
  ['drawable-land-mdpi', 480, 320],
  ['drawable-land-hdpi', 800, 480],
  ['drawable-land-xhdpi', 1280, 720],
  ['drawable-land-xxhdpi', 1600, 960],
  ['drawable-land-xxxhdpi', 1920, 1280],
  ['drawable', 480, 320],
]

/** fast-png 可能返回 3 通道（无 alpha）数据，先补成 RGBA，后面的 alpha 合成才成立。 */
function toRgba(img) {
  if (img.channels === 4) return { width: img.width, height: img.height, data: img.data }
  const out = new Uint8Array(img.width * img.height * 4)
  for (let i = 0, o = 0; i < img.width * img.height; i++, o += 4) {
    out[o] = img.data[i * img.channels]
    out[o + 1] = img.data[i * img.channels + 1]
    out[o + 2] = img.data[i * img.channels + 2]
    out[o + 3] = 255
  }
  return { width: img.width, height: img.height, data: out }
}

/** 面积平均缩放：先按 alpha 预乘累加，避免透明边缘出现黑边。 */
function resize(src, dw, dh) {
  const { width: sw, height: sh, data } = src
  const out = new Uint8Array(dw * dh * 4)
  const xRatio = sw / dw
  const yRatio = sh / dh
  for (let y = 0; y < dh; y++) {
    const y0 = Math.floor(y * yRatio)
    const y1 = Math.min(sh, Math.max(y0 + 1, Math.ceil((y + 1) * yRatio)))
    for (let x = 0; x < dw; x++) {
      const x0 = Math.floor(x * xRatio)
      const x1 = Math.min(sw, Math.max(x0 + 1, Math.ceil((x + 1) * xRatio)))
      let r = 0
      let g = 0
      let b = 0
      let a = 0
      let n = 0
      for (let sy = y0; sy < y1; sy++) {
        for (let sx = x0; sx < x1; sx++) {
          const i = (sy * sw + sx) * 4
          const alpha = data[i + 3] / 255
          r += data[i] * alpha
          g += data[i + 1] * alpha
          b += data[i + 2] * alpha
          a += data[i + 3]
          n++
        }
      }
      const o = (y * dw + x) * 4
      const alphaSum = a / 255
      out[o] = alphaSum ? Math.round(r / alphaSum) : 0
      out[o + 1] = alphaSum ? Math.round(g / alphaSum) : 0
      out[o + 2] = alphaSum ? Math.round(b / alphaSum) : 0
      out[o + 3] = Math.round(a / n)
    }
  }
  return { width: dw, height: dh, data: out }
}

function canvas(w, h, bg) {
  const data = new Uint8Array(w * h * 4)
  if (bg) {
    for (let i = 0; i < w * h; i++) {
      data[i * 4] = bg[0]
      data[i * 4 + 1] = bg[1]
      data[i * 4 + 2] = bg[2]
      data[i * 4 + 3] = bg[3]
    }
  }
  return { width: w, height: h, data }
}

function paste(cv, art, left, top) {
  for (let y = 0; y < art.height; y++) {
    for (let x = 0; x < art.width; x++) {
      const si = (y * art.width + x) * 4
      const a = art.data[si + 3] / 255
      if (!a) continue
      const di = ((top + y) * cv.width + (left + x)) * 4
      cv.data[di] = Math.round(art.data[si] * a + cv.data[di] * (1 - a))
      cv.data[di + 1] = Math.round(art.data[si + 1] * a + cv.data[di + 1] * (1 - a))
      cv.data[di + 2] = Math.round(art.data[si + 2] * a + cv.data[di + 2] * (1 - a))
      cv.data[di + 3] = Math.round((a + (cv.data[di + 3] / 255) * (1 - a)) * 255)
    }
  }
}

/** 圆形 alpha 蒙版（边缘 4× 超采样，避免锯齿），用于 ic_launcher_round。 */
function roundMask(cv) {
  const r = cv.width / 2
  const cy = cv.height / 2
  for (let y = 0; y < cv.height; y++) {
    for (let x = 0; x < cv.width; x++) {
      let hits = 0
      for (const dy of [0.25, 0.75]) {
        for (const dx of [0.25, 0.75]) {
          const px = x + dx - r
          const py = y + dy - cy
          if (px * px + py * py <= r * r) hits++
        }
      }
      const i = (y * cv.width + x) * 4
      cv.data[i + 3] = Math.round((cv.data[i + 3] * hits) / 4)
    }
  }
  return cv
}

function write(file, img) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, Buffer.from(encode({ width: img.width, height: img.height, data: img.data, channels: 4, depth: 8 })))
  console.log(`${path.relative(REPO, file)}  ${img.width}x${img.height}`)
}

const src = decode(fs.readFileSync(SRC))
console.log(`source ${path.relative(REPO, SRC)}  ${src.width}x${src.height}  channels=${src.channels}`)
const art = toRgba(src)

for (const [density, scale] of DENSITIES) {
  const legacy = Math.round(48 * scale)
  write(path.join(RES, `mipmap-${density}/ic_launcher.png`), resize(art, legacy, legacy))
  write(path.join(RES, `mipmap-${density}/ic_launcher_round.png`), roundMask(resize(art, legacy, legacy)))

  const fgSize = Math.round(108 * scale)
  const fgArt = Math.round(fgSize * FOREGROUND_RATIO)
  const fg = canvas(fgSize, fgSize, null)
  const offset = Math.round((fgSize - fgArt) / 2)
  paste(fg, resize(art, fgArt, fgArt), offset, offset)
  write(path.join(RES, `mipmap-${density}/ic_launcher_foreground.png`), fg)
}

for (const [dir, w, h] of SPLASH_SIZES) {
  const logo = Math.round(Math.min(w, h) * SPLASH_LOGO_RATIO)
  const cv = canvas(w, h, SPLASH_BG)
  paste(cv, resize(art, logo, logo), Math.round((w - logo) / 2), Math.round((h - logo) / 2))
  write(path.join(RES, `${dir}/splash.png`), cv)
}
