import type { Dynamic, RichTextNode } from '@ybgnb/bili-api'

export function isLotteryDynamic(dynamic: Dynamic) {
  const forwardDynamic = dynamic.orig
  if (!forwardDynamic) return false

  const nodes: RichTextNode[] = forwardDynamic.modules.module_dynamic.major?.opus?.summary.rich_text_nodes ?? []

  for (const node of nodes) {
    if (node.type === 'RICH_TEXT_NODE_TYPE_LOTTERY') {
      return true
    }
  }
  return false
}
