import { type ConfigEnv, defineConfig, mergeConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { fileURLToPath, URL } from 'node:url'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import vueDevTools from 'vite-plugin-vue-devtools'
import { loadEnvConfig } from '@ybgnb/vite-env'

/**
 * 基础的 vite 配置
 */
export default defineConfig((configEnv: ConfigEnv) => {
  return mergeConfig(loadEnvConfig(configEnv), {
    // 开发或生产环境服务的公共基础路径
    base: './',
    plugins: [
      vue(),
      vueJsx(),
      vueDevTools(),
      AutoImport({
        include: [/\.vue$/, /\.vue\?vue$/, /\.[jt]sx$/],
        resolvers: [
          ElementPlusResolver({
            importStyle: configEnv.mode === 'development' ? false : 'css',
          }),
        ],
      }),
      Components({
        include: [/\.vue$/, /\.vue\?vue$/, /\.[jt]sx$/],
        resolvers: [
          ElementPlusResolver({
            importStyle: configEnv.mode === 'development' ? false : 'css',
          }),
        ],
      }),
      // bundle-stats 插件
      //      bundleStats({
      //        html: true,
      //      }),
    ],
    resolve: {
      // 路径别名
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
      // 保持 symlink，不要解析真实路径
      preserveSymlinks: true,
    },
    build: {
      // 生成 Source Map => 开发环境日志打印时输出源码路径和行号
      // sourcemap: mode !== 'production',
    },
    optimizeDeps: {
      include: ['element-plus', 'element-plus/es', 'consola', '@ybgnb/bili-api'],
    },
  })
})
