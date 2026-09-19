# Tailwind 迁移评估与建议（暂不修改代码）

> 结论先行：**不建议整体迁移到 Tailwind。**
> 推荐 **A 方案：保留原生 CSS，继续以 Ionic 设计令牌 + 少量共享语义类为核心**；
> 如果团队有"统一技术栈"的诉求，可用 **B 方案：增量引入 Tailwind（仅新页面 / 布局层）**；
> **C 方案：把现有 CSS 全量重写为 Tailwind 工具类 —— 不推荐。**

本文只做评估，未改动任何样式代码。

---

## 1. 现状盘点（实测数据）

统计口径：`src/**/*.vue` 的 `<style>` 块 + `src/styles`、`src/theme` 全局样式。

| 项目 | 数值 |
| --- | --- |
| Vue 组件总数 | 35 |
| 含 `<style>` 的组件 | 18（全部 `scoped`） |
| 组件内 CSS 体量 | ≈ 31,200 字符 / ≈ 353 条规则 |
| 全局 CSS | `leaflet-map.css` 19,425 字符 / 129 规则；`app.css` 4,002 / 35；`theme/variables.css` 854 / 1 |
| Ionic 专属钩子 | `--ion-*` 变量引用 32 处、`::part(...)` 9 处、`env(safe-area-inset-*)` 多处 |
| 重复选择器 | 25 个选择器在多个组件 style 块中重复（如 `.section-heading` 3 次、`.page-card ion-item` 3 次、`.map-error/.map-notice` 2 次） |

CSS 高度集中在 4 个页面，占组件内 CSS 的 **76%**：

| 组件 | 字符 | 规则 |
| --- | --- | --- |
| `modules/esti-deploy/components/VoyageBudgetEditor.vue` | 8,369 | 93 |
| `modules/esti-deploy/pages/EstiDeployDetailPage.vue` | 7,040 | 79 |
| `views/tabs/DistanceTabPage.vue` | 6,799 | 70 |
| `modules/esti-deploy/pages/EstiDeployListPage.vue` | 3,849 | 46 |

其余 14 个组件平均只有 4～9 条规则，多为 1～2 行的小样式块。

**关键事实：这些 CSS 里真正"能用 Tailwind 工具类等价替换"的部分并不占多数**，大致构成：

- Ionic 组件主题化（`--ion-color-*`、`--background`、`--padding-*`、`--border-radius`、`::part(native)`）：**Tailwind 无法表达**，必须继续写 CSS 变量；
- Leaflet 第三方 DOM 覆盖（19.4k 字符，`.leaflet-*`、自定义 pane、marker、popup）：**属于库适配层，与业务样式无关**；
- iOS/Capacitor 平台补丁（16px 输入防缩放、`safe-area-inset`、`overscroll-behavior`、`position: fixed` 键盘处理）：**属命令式补丁，工具类不适用**；
- 响应式栅格与信息面板（`.metric-grid`、`.route-total-grid`、`.result-grid`、`.three-column-grid` 等）：**这部分才是 Tailwind 的强项**；
- 共享语义类（`.page-card`、`.page-content`、`.empty-state`、`.inline-error`、`.section-heading` 等）：**已经是一套小型设计系统**，是资产而非负债。

## 2. 为什么"从旧项目 / 小程序搬过来有大量原生 CSS"不是迁移理由

- **小程序侧是 WXSS + rpx**，与 Tailwind 的工具类/rem 体系不通用；小程序迁过来的其实是"页面结构"，APP 的样式是围绕 Ionic 组件重建的。
- **旧项目 `portdistance-mobile-lite` 已经装了 Tailwind v3**（`tailwind.config.js` + `postcss.config.js`，且必须 `important: true`），实测结果：
  - 仍有 **1,756 行**组件内 CSS、**72 / 108** 个组件带 `<style>`；
  - Tailwind 只是"另一套并存写法"，并没有消灭原生 CSS。
  - `important: true` 是为了压过 Ionic 样式而被迫加的全局 `!important`，这本身就是 **Tailwind 与 Ionic 特异性冲突**的证据；沿用它会让我们所有工具类都带 `!important`，后续覆盖第三方样式（Leaflet、Ionic part）会更难排查。
- 也就是说：**旧项目已经替我们做过一次这个实验，结论是"共存但不替代、且引入全局 important 代价"。**

## 3. 三种方案的取舍

| 维度 | A 保留原生 CSS（推荐） | B 增量 Tailwind（可选） | C 全量迁移 |
| --- | --- | --- | --- |
| 一次性成本 | 0 | 0.5～1 天搭建 + 新页面成本 | 1～2 周（4 个核心页面 + 全量回归） |
| 能否覆盖现有 CSS | — | 仅新页面 | 最多覆盖 ~50%，`--ion-*`/`::part`/Leaflet 必须保留 |
| 与 Ionic 9 冲突 | 无 | 需精细控制层叠顺序 | 冲突面最大，容易退回 `!important` |
| 包体 | 不变 | 新增按需生成的工具类（gzip 约 5～15 KB） | 新增同上，但旧 CSS 短期不会减少 |
| 维护心智 | 单一写法 | 两种写法并存 | 单一写法（但 Ionic 变量仍要写 CSS） |
| 回归风险 | 无 | 低（不影响存量） | 高（地图/预算/航程三大核心页） |
| 适配全球用户（RTL/多语言） | 已用 `padding-inline` 等逻辑属性，可继续加强 | Tailwind v4 的 `ps-*`/`pe-*` 逻辑属性有帮助 | 同 B |

### A 方案建议动作（成本低、收益直接）

1. **补齐设计令牌**：把 `app.css` 里散落的品牌色（`#006c8c`、`#173447`、`#6b7c8d`、`#dce5eb`…）收敛成 `--pd-color-*`，与 `theme/variables.css` 的 `--ion-color-*` 对齐；间距/圆角同样令牌化。
2. **消除重复块**：把 25 个跨组件重复选择器上提到 `app.css`（`.section-heading`、`.page-card ion-list/ion-item`、`.map-error`/`.map-notice`、`.result-grid*`、`.template-save-row*`、`.cargo-row`…），或抽成共享组件（`SectionCard`、`MetricGrid`）。这一步比换 Tailwind 的收益更大。
3. **补一份 `docs/styling.md`**：约定"组件样式一律 `scoped`"、"跨组件复用先上提全局语义类"、"禁止 `!important`（平台补丁除外，需注释说明）"、"颜色/间距必须用令牌"。
4. **可选**：加 stylelint（禁 `!important`、禁裸色值）+ 一个 CSS 体积预算脚本。

### B 方案落地要点（若决定引入）

- 用 **Tailwind v4 + `@tailwindcss/vite`**（CSS-first，无需 postcss/config），而不是照搬旧项目的 v3；在 `main.ts` 的 CSS 引入顺序里把 `@import "tailwindcss"` 放在 Ionic CSS **之前**，并显式声明 layer 顺序，避免覆盖 Ionic。
- **不要开 `preflight`**（会与 Ionic 的 `normalize/structure` 打架）：v4 中通过 `@layer` 控制，v3 中设 `corePlugins: { preflight: false }`。
- **优先用低特异性方案代替 `important: true`**：把工具类包进 `@layer utilities`（v4 默认即是），必要时 `:where()` 降权。
- **加前缀或作用域**避免与 Ionic/Leaflet 类名撞车（如 `prefix(tw)`）。
- `content` 只扫 `./index.html`、`./src/**/*.{vue,ts}`；**不要**像旧项目那样扫 `node_modules/@ionic/vue/dist/**/*.js`（无意义地扩大扫描面，容易生成无用类）。
- 只在新页面 / 布局层用工具类；**Ionic 变量、`::part`、Leaflet 覆盖、平台补丁继续写 CSS**，并在 `docs/styling.md` 里写明这条边界。
- 迁移节奏：**不动存量**，用 2～3 个新页面验证收益后再决定是否扩大。

### C 方案为什么不做

- 收益上限约一半（另外一半 CSS 是 Ionic 变量 / shadow DOM `::part` / Leaflet / 平台补丁，工具类天然无法表达）；
- 需要回归地图、航程、预算三大核心页（当前正在做国际化改造，同时动样式会放大风险）；
- 极可能被迫回到旧项目的 `important: true`，把技术债从"两套写法"升级为"全局 `!important`"。

## 4. 一句话建议

先把现有 CSS 当作**已有的设计系统**去治理（令牌化 + 去重 + 规范），而不是替换它；
把 Tailwind 作为**可选的增量工具**留给新页面，等出现"新的大面积 UI 且团队已熟练 Tailwind"时再评估，
并优先参考旧项目 `portdistance-mobile-lite` 踩过的坑（preflight 冲突、`important: true`、扫描 node_modules）。
