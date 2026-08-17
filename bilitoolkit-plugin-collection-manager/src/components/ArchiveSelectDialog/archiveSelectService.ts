import { createVNode, render } from 'vue'
import type { MyArchive } from '@/types'
import ArchiveSelectDialog from '@/components/ArchiveSelectDialog/ArchiveSelectDialog.vue'

export const showArchiveSelectDialog = (options: { archives: MyArchive[]; maxCount: number }) => {
  return new Promise<MyArchive[] | undefined>((resolve) => {
    let container: HTMLDivElement | null = document.createElement('div')
    const close = (result?: MyArchive[]) => {
      resolve(result)
      if (container) {
        render(null, container)
        container.remove()
        container = null
      }
    }
    const instance = createVNode(ArchiveSelectDialog, {
      ...options,
      modelValue: true,
      'onUpdate:modelValue': (visible: boolean) => {
        if (!visible) close()
      },
      onConfirm: (list: MyArchive[]) => {
        close(list)
      },
    })
    document.body.appendChild(container)
    render(instance, container)
  })
}
