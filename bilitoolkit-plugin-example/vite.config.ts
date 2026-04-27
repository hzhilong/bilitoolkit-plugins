import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { defaultClientConfig } from '@ybgnb/bili-api'
import httpProxy from 'http-proxy'
import AutoImport from 'unplugin-auto-import/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'

const proxyInstance = httpProxy.createProxyServer({
  changeOrigin: true,
  secure: false,
  ws: true,
})

export default defineConfig(() => {
  return {
    server: {
      host: '0.0.0.0',
      port: 5174,
      cors: true,
    },
    base: './',
    plugins: [
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
      {
        name: 'manual-omni-proxy',
        configureServer(server) {
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
              req.headers['user-agent'] = defaultClientConfig.userAgent
              req.headers['referer'] = defaultClientConfig.referer
              req.headers['origin'] = defaultClientConfig.referer

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
    ],
    resolve: {
      // 路径别名
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      // 代码混淆和压缩
      minify: true,
    },
  }
})
