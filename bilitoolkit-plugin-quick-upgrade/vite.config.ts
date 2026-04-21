import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import path from 'node:path'

export default defineConfig(() => {
  return {
    base: './',
    resolve: {
      // 路径别名
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
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
        name: 'bilitoolkit-plugin-quick-upgrade',
        formats: ['es'],
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
