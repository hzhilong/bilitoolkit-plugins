/// <reference types="vite/client" />
// 导入语句会破坏类型增强 https://cn.vite.dev/guide/env-and-mode#intellisense
export interface ImportMetaEnv {
  readonly BASE_URL: string
  readonly PROD: boolean
  readonly DEV: boolean
  // 和其他环境变量
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
