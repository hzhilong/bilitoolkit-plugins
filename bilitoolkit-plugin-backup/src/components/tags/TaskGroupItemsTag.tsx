import type { TaskGroup } from '@/core/types/task-group'
import { DataTypeMap } from '@/core/types/data-type'
import { DATA_TYPE_COLORS } from '@/common/config'

const TaskGroupItemsTag = (props: Pick<TaskGroup, 'items'>) => {
  const ul = []
  if (!props.items) return <></>
  for (const item of props.items) {
    const color = DATA_TYPE_COLORS[item.dataType]
    const bgColor = `color-mix(in srgb, ${color}, transparent 90%)`
    const borderColor = `color-mix(in srgb, ${color}, transparent 40%)`
    ul.push(
      <ElTag disable-transitions color={bgColor} key={item.dataType} style={{ color: color, borderColor: borderColor }}>
        {DataTypeMap[item.dataType].name}
      </ElTag>,
    )
  }
  return <div style="width:200px; display:grid;gap:6px;grid-template-columns: repeat(3, 60px);">{ul}</div>
}
export { TaskGroupItemsTag }
