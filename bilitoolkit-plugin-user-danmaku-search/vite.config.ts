import { type ConfigEnv, defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig((configEnv: ConfigEnv) => ({
  server: { host: '0.0.0.0', port: 5174, cors: true },
  base: './',
  plugins: [
    vue(),
    AutoImport({
      dts: 'src/auto-imports.d.ts',
      resolvers: [ElementPlusResolver({ importStyle: configEnv.mode === 'development' ? false : 'css' })],
    }),
    Components({
      dts: 'src/components.d.ts',
      resolvers: [ElementPlusResolver({ importStyle: configEnv.mode === 'development' ? false : 'css' })],
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  optimizeDeps: { include: ['element-plus', 'element-plus/es'], exclude: ['bilitoolkit-ui'] },
}))
