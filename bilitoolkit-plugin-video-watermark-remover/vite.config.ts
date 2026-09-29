import { type ConfigEnv, defineConfig, mergeConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import vueDevTools from 'vite-plugin-vue-devtools'
import { loadEnvConfig } from '@ybgnb/vite-env'

export default defineConfig((configEnv: ConfigEnv) => {
  return mergeConfig(loadEnvConfig(configEnv), {
    base: './',
    plugins: [
      vue(),
      vueDevTools(),
      AutoImport({
        resolvers: [ElementPlusResolver({ importStyle: configEnv.mode === 'development' ? false : 'css' })],
      }),
      Components({
        resolvers: [ElementPlusResolver({ importStyle: configEnv.mode === 'development' ? false : 'css' })],
      }),
    ],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
      preserveSymlinks: true,
    },
    optimizeDeps: {
      include: ['element-plus', 'element-plus/es'],
      exclude: ['bilitoolkit-ui'],
    },
  })
})
