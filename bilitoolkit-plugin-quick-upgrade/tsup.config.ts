import { defineConfig } from 'tsup'
import { resolve } from 'path'
import { taskSchedule, taskConfigSchema } from './src/config/config.js'
import { writeFile } from 'node:fs/promises'

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
  minify: false,
  splitting: false,
  tsconfig: resolve(root, `tsconfig.dev.json`),
  outExtension({}) {
    return {
      js: '.js',
    }
  },
  onSuccess: async () => {
    const manifest = { taskSchedule, taskConfigSchema }
    await writeFile('dist/plugin-meta.json', JSON.stringify(manifest, null, 2))
  },
})
