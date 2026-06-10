import type { MaybeRefOrGetter } from 'vue'
import type { User } from '@/core/types/execute'
import type { AppSettings } from '@/types/settings'

export interface ToolContext {
  user: MaybeRefOrGetter<User>
  signal?: AbortSignal
  appSettings: AppSettings
  log(msg: string): void
}
