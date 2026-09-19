# PortDistance Mobile App

新的跨平台 App，基于 Vue 3、Pinia、Ionic 9 和 Capacitor 8。

## 运行

```bash
npm install
npm run dev
npm run build
```

本地浏览器开发地址为 `http://127.0.0.1:5179/`。浏览器开发请求经 Vite 的 `/app-api` 代理转发到 `http://127.0.0.1:48080`。

原生工程使用：

```bash
npm run cap:sync
npm run cap:android
npm run cap:ios
```

真机调试可通过 `VITE_NATIVE_API_BASE_URL` 配置可访问的 API 地址；Android debug manifest 已允许该地址使用 HTTP，发布包仍应使用 HTTPS。

## 结构

- `src/stores/distance.ts`: 港口搜索、航程请求、距离结果和最近记录。
- `src/stores/map.ts`: Leaflet 线路几何、ECA、路由点和转向点编辑状态。
- `src/modules/esti-deploy`: 新版可编辑航次预算，包含草稿、模板、航线和结果计算。
- `src/modules/legacy-estimation`: 旧版预算的只读历史和详情。
- `src/components/map`: 内嵌 Leaflet 地图，不含小程序桥接、WebSocket 或后端 map-state 会话。
- `src/platform`: Capacitor 启动、存储、网络、键盘、分享和原生生命周期接入。

不迁移旧 lite 的 Circular、Offer、Rotation 业务或 `@arcgis/core` SDK。地图使用 Leaflet，保留参考 H5 的公开瓦片和参考图层来源。
# portdistance-m-app
