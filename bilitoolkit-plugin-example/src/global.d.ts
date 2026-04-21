// 对vue进行类型补充说明
import type { ToolkitApi } from 'bilitoolkit-types'

declare module 'vue' {
  // interface ComponentCustomOptions {}

  interface ComponentCustomProperties {
    // 哔哩工具姬 API
    $toolkitApi: ToolkitApiWithCore
  }
}

// 全局类型
declare global {
  export interface Window {
    toolkitApi: ToolkitApi
  }
}

export {}
