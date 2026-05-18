import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSelectedUserStore } from 'bilitoolkit-ui'
import type { TargetUser } from '@/core/types/execute'

export const useUser = () => {
  const { user } = storeToRefs(useSelectedUserStore())
  const targetUser = computed<TargetUser | undefined>(() => {
    if (!user.value) return undefined
    return {
      uid: user.value.mid,
      name: user.value.name,
    }
  })
  return {
    user,
    targetUser,
  }
}
