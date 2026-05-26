import { storeToRefs } from 'pinia'
import { useSelectedUserStore } from 'bilitoolkit-ui'

export const useUser = () => {
  const { user } = storeToRefs(useSelectedUserStore())

  return {
    user,
  }
}
