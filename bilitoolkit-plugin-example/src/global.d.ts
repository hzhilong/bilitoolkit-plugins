import type { ToolkitApi } from 'bilitoolkit-types'

declare global {
  export interface Window {
    toolkitApi: ToolkitApi
  }
}

export {}
