import type { UserInfoWithCookie } from '@ybgnb/bili-api'
import type { TargetUser } from '@/core/types/execute'
import { type MaybeRefOrGetter, toValue } from 'vue'

export const toTargetUser = (user: MaybeRefOrGetter<UserInfoWithCookie>): TargetUser => {
  const userData = toValue(user)
  return {
    uid: userData.mid,
    name: userData.name,
  }
}
