import { defineConfig } from 'tsup'
import { resolve } from 'path'
import { taskSchedule, taskConfigSchema } from './src/config/config.js'
import { writeFile } from 'node:fs/promises'
import type { TaskPluginMeta } from 'bilitoolkit-types'

const root = resolve(import.meta.dirname, './')

export default defineConfig({
  platform: 'node',
  noExternal: [/.*/],
  publicDir: resolve(root, './public'),
  entry: {
    index: resolve(root, './src/index.ts'),
  },
  outDir: 'dist',
  format: ['cjs'],
  clean: true,
  minify: true,
  splitting: false,
  tsconfig: resolve(root, `tsconfig.dev.json`),
  outExtension({}) {
    return {
      js: '.js',
    }
  },
  onSuccess: async () => {
    const manifest = {
      taskSchedule,
      taskConfigSchema,
      alert: '工具姬 0.1.1 以下版本的，创建该插件任务后建议手动执行一次',
    } as TaskPluginMeta
    await writeFile('dist/plugin-meta.json', JSON.stringify(manifest, null, 2))
  },
})
