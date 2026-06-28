import { type ConfigEnv, defineConfig, mergeConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { loadEnvConfig } from '@ybgnb/vite-env'
import httpProxy from 'http-proxy'
import { getDefaultClientConfig } from '@ybgnb/bili-api'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

const proxyInstance = httpProxy.createProxyServer({
  changeOrigin: true,
  secure: false,
  ws: true,
})

/**
 * 基础的 vite 配置
 */
export default defineConfig((configEnv: ConfigEnv) => {
  return mergeConfig(loadEnvConfig(configEnv), {
    server: {
      host: '0.0.0.0',
      port: 5174,
      cors: true,
    },
    // 开发或生产环境服务的公共基础路径
    base: './',
    plugins: [
      {
        name: 'manual-omni-proxy',
        configureServer(server) {
          const defaultBiliClientConfig = getDefaultClientConfig()

          // 使用 server.middlewares 直接拦截
          server.middlewares.use((req, res, next) => {
            // 只拦截 /proxy 开头的请求
            if (!req.url?.startsWith('/proxy')) {
              return next()
            }

            try {
              const urlObj = new URL(req.url, `http://${req.headers.host}`)
              const actualTarget = urlObj.searchParams.get('url')
              if (!actualTarget) {
                res.statusCode = 400
                return res.end('Missing url parameter')
              }

              const t = new URL(actualTarget)
              const targetBase = `${t.protocol}//${t.host}`

              // 修正请求路径：把 /proxy?url=... 换成目标真正的路径
              req.url = t.pathname + t.search

              // 身份伪装
              req.headers['host'] = t.host
              req.headers['user-agent'] = defaultBiliClientConfig.userAgent
              if (!req.headers['referer']?.includes('bili')) {
                req.headers['referer'] = defaultBiliClientConfig.referer
              }
              if (!req.headers['origin']?.includes('bili')) {
                req.headers['origin'] = defaultBiliClientConfig.referer
              }

              // 手动触发代理转发
              proxyInstance.web(
                req,
                res,
                {
                  target: targetBase,
                },
                (err) => {
                  if (!res.writableEnded) {
                    res.statusCode = 502
                    res.end(`Proxy failed: ${err.message}`)
                  }
                },
              )
            } catch {
              res.statusCode = 500
              res.end('Invalid URL format')
            }
          })
        },
      },
      vue(),
      AutoImport({
        dts: 'src/auto-imports.d.ts',
        resolvers: [
          ElementPlusResolver({
            importStyle: configEnv.mode === 'development' ? false : 'css',
          }),
        ],
      }),
      Components({
        dts: 'src/components.d.ts',
        resolvers: [
          ElementPlusResolver({
            importStyle: configEnv.mode === 'development' ? false : 'css',
          }),
        ],
      }),
    ],
    resolve: {
      // 路径别名
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
      // 保持 symlink，不要解析真实路径
      preserveSymlinks: true,
    },
    optimizeDeps: {
      include: ['element-plus', 'element-plus/es', '@ybgnb/bili-api'],
      exclude: ['bilitoolkit-ui'],
    },
  })
})
