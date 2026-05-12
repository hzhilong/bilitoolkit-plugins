import { createAbortError } from '@ybgnb/utils'

/**
 * 检查取消信号
 */
export function checkAbortSignal(abortSignal?: AbortSignal) {
  if (abortSignal?.aborted) {
    throw createAbortError()
  }
}
