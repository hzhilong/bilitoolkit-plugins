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
      <ElTag color={bgColor} key={item.dataType} style={{ color: color, borderColor: borderColor }}>
        {DataTypeMap[item.dataType].name}
      </ElTag>,
    )
  }
  return <>{ul}</>
}
export default TaskGroupItemsTag
