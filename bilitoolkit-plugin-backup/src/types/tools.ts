import type { MaybeRefOrGetter } from 'vue'
import type { User } from '@/core/types/execute'

export interface ToolContext {
  user: MaybeRefOrGetter<User>
  signal?: AbortSignal
  log(msg: string): void
}
