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
        include: [/\.vue$/, /\.vue\?vue/, /\.[jt]sx$/],
        resolvers: [
          ElementPlusResolver({
            importStyle: configEnv.mode === 'development' ? false : 'css',
          }),
        ],
      }),
      Components({
        include: [/\.vue$/, /\.vue\?vue/, /\.[jt]sx$/],
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
      // 依赖预构建，防止启动后页面频繁重新加载
      include: ['element-plus', 'element-plus/es', 'consola', '@ybgnb/bili-api'],
      /**
       * 将本地 Monorepo 组件库排除在预构建之外
       *
       * 【为什么要加？】
       * 1. 解决双重实例化（Double Instantiation）问题：
       *    如果不排除，Vite 会把组件库当作第三方依赖单独预构建，导致组件库内部引用的 element-plus
       *    与项目自身引用的 element-plus 成为两个不同的实例。这会导致全局 ZIndexManager 无法共享，
       *    引发弹窗层级（z-index）错乱、被遮挡等严重 Bug。
       *
       * 2. 启用本地开发热更新（HMR）：
       *    排除后，Vite 会将组件库视为本地源码处理。修改组件库代码时，宿主项目能实时触发 HMR 刷新。
       */
      exclude: ['bilitoolkit-ui'],
    },
  })
})
