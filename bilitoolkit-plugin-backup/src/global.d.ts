// 对vue进行类型补充说明

import type { ToolkitApi } from 'bilitoolkit-types'

declare module '@vue/runtime-core' {
  // interface ComponentCustomOptions {}

  interface ComponentCustomProperties {
    // 哔哩工具姬 API
    $toolkitApi: ToolkitApi
  }
}

// 全局类型
declare global {
  export interface Window {
    toolkitApi: ToolkitApi
  }
}

export {}
