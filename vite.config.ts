import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // vue-i18n feature flags: use the Composition API only and drop legacy/global
  // install bits we do not need, which also silences the esm-bundler warning.
  define: {
    __VUE_I18N_FULL_INSTALL__: 'true',
    __VUE_I18N_LEGACY_API__: 'false',
    __INTLIFY_PROD_DEVTOOLS__: 'false',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5179,
    strictPort: true,
    proxy: {
      '/app-api': {
        target: 'http://127.0.0.1:48080',
        changeOrigin: true,
      },
    },
  },
})
