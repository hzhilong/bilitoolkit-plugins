import type { User } from '@/core/types/execute'
import { type MaybeRefOrGetter, toValue } from 'vue'
import { CommonError } from '@ybgnb/utils'

export const assertUserLoggedIn = (user: MaybeRefOrGetter<User | null>) => {
  if (!toValue(user)) throw new CommonError(`用户未登录`)
  return true
}
