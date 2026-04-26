import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import path from 'node:path'
import { taskSchedule, taskConfigSchema } from './src/config/config'
import pkg from './package.json'

export default defineConfig(() => {
  return {
    base: './',
    resolve: {
      // 路径别名
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    plugins: [
      {
        // 插件元信息
        name: 'plugin-meta',
        generateBundle() {
          const manifest = {
            taskSchedule,
            taskConfigSchema,
          }
          this.emitFile({
            type: 'asset',
            fileName: 'plugin-meta.json',
            source: JSON.stringify(manifest, null, 2),
          })
        },
      },
    ],
    build: {
      // 代码混淆和压缩
      minify: true,
      target: 'es2020',
      lib: {
        // 库的入口文件
        entry: {
          index: path.resolve(__dirname, 'src/index.ts'),
        },
        // 库的名称，会作为全局变量名使用
        name: pkg.name,
        formats: ['cjs'],
        fileName: (format, entryName) => {
          return `${entryName}.js`
        },
      },
      sourcemap: false,
      rolldownOptions: {
        output: {
          // 不保留目录结构
          preserveModules: false,
        },
      },
    },
  }
})
